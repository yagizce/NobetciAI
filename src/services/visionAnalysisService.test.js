import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseVisionFindings, VISION_ADAPTER_NAME } from "./visionAnalysisService.js";

const good = {
  hazard: "KKD eksikliği",
  description: "Çalışan baret takmıyor.",
  category: "ppe",
  recommendedAction: "Baret zorunlu hale getirilmeli.",
  affected: "Saha çalışanları",
  legislationRef: "",
  confidenceScore: 72,
};

describe("visionAnalysisService — parseVisionFindings", () => {
  test("adapter adı gerçek modele işaret ediyor (mock değil)", () => {
    assert.equal(VISION_ADAPTER_NAME, "nvidia-vision-v1");
  });

  test("geçerli JSON dizisini bulgulara çevirir ve id atar", () => {
    const out = parseVisionFindings(JSON.stringify([good]));
    assert.equal(out.length, 1);
    assert.ok(out[0].id);
    assert.equal(out[0].category, "ppe");
    assert.equal(out[0].confidenceScore, 72);
    assert.equal(out[0].legislationRef, "");
  });

  test("markdown çiti ve <think> bloğu içeren yanıtı ayrıştırır", () => {
    const text = `<think>önce düşünelim [1]</think>\n\`\`\`json\n${JSON.stringify([good])}\n\`\`\``;
    assert.equal(parseVisionFindings(text).length, 1);
  });

  test("boş dizi geçerlidir (tehlike görülmedi)", () => {
    assert.deepEqual(parseVisionFindings("[]"), []);
  });

  test("bilinmeyen kategori ve eksik açıklamalı bulgular elenir", () => {
    const out = parseVisionFindings(JSON.stringify([
      good,
      { ...good, category: "uydurma" },
      { ...good, description: "", hazard: "" },
      null,
    ]));
    assert.equal(out.length, 1);
  });

  test("güven skoru 0-100'e sıkıştırılır, sayı değilse 50 olur", () => {
    const out = parseVisionFindings(JSON.stringify([
      { ...good, confidenceScore: 250 },
      { ...good, confidenceScore: -5 },
      { ...good, confidenceScore: "yüksek" },
    ]));
    assert.deepEqual(out.map((f) => f.confidenceScore), [100, 0, 50]);
  });

  test("en fazla 4 bulgu döner ve id'ler benzersizdir", () => {
    const out = parseVisionFindings(JSON.stringify(Array(9).fill(good)));
    assert.equal(out.length, 4);
    assert.equal(new Set(out.map((f) => f.id)).size, 4);
  });

  test("JSON içermeyen veya bozuk yanıt hata fırlatır", () => {
    assert.throws(() => parseVisionFindings(""), /boş/);
    assert.throws(() => parseVisionFindings("Üzgünüm, analiz edemedim."), /bulgu listesi/);
    assert.throws(() => parseVisionFindings("[ {bozuk json ]"), /ayrıştırılamadı/);
  });
});
