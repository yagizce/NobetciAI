import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { analyzePhotoForHazards, VISION_ADAPTER_NAME } from "./visionAnalysisService.js";
import { RISK_DETECTION_CATEGORIES } from "../constants/riskDetection.js";

const VALID_CATEGORIES = new Set(RISK_DETECTION_CATEGORIES.map((c) => c.value));

function fakeFile(name, size, lastModified = 1) {
  // node:test ortamında gerçek File/Blob yok — servisin yalnızca kullandığı
  // {name, size, lastModified} alanlarına sahip minimal bir stub yeterli.
  return { name, size, lastModified };
}

describe("visionAnalysisService", () => {
  test("bugün mock adapter aktif (gerçek Vision API'ye bağlı değil)", () => {
    assert.equal(VISION_ADAPTER_NAME, "mock-v1");
  });

  test("1-3 arası bulgu döner", async () => {
    const findings = await analyzePhotoForHazards(fakeFile("saha1.jpg", 12345));
    assert.ok(findings.length >= 1 && findings.length <= 3, `beklenmeyen bulgu sayısı: ${findings.length}`);
  });

  test("her bulgu gerekli tüm alanlara sahip ve kategori RISK_DETECTION_CATEGORIES içinde", async () => {
    const findings = await analyzePhotoForHazards(fakeFile("saha2.jpg", 54321));
    for (const f of findings) {
      assert.ok(f.id, "id eksik");
      assert.ok(f.hazard, "hazard eksik");
      assert.ok(f.description, "description eksik");
      assert.ok(VALID_CATEGORIES.has(f.category), `geçersiz kategori: ${f.category}`);
      assert.ok(f.recommendedAction, "recommendedAction eksik");
      assert.ok(f.affected, "affected eksik");
      assert.ok(f.legislationRef, "legislationRef eksik");
      assert.ok(typeof f.confidenceScore === "number" && f.confidenceScore >= 0 && f.confidenceScore <= 100, `geçersiz confidenceScore: ${f.confidenceScore}`);
    }
  });

  test("bulgular arasında tekrar eden id yok", async () => {
    const findings = await analyzePhotoForHazards(fakeFile("saha3.jpg", 99999));
    const ids = new Set(findings.map((f) => f.id));
    assert.equal(ids.size, findings.length);
  });

  test("aynı dosya (isim+boyut+lastModified) için tutarlı (deterministik) sonuç üretir", async () => {
    const a = await analyzePhotoForHazards(fakeFile("ayni-dosya.jpg", 777, 42));
    const b = await analyzePhotoForHazards(fakeFile("ayni-dosya.jpg", 777, 42));
    assert.deepEqual(a.map((f) => f.hazard), b.map((f) => f.hazard));
    assert.deepEqual(a.map((f) => f.category), b.map((f) => f.category));
  });

  test("farklı dosyalar genellikle farklı bulgu setleri üretebilir (determinizm dosya bazlı, sabit değil)", async () => {
    const a = await analyzePhotoForHazards(fakeFile("x.jpg", 111, 1));
    const b = await analyzePhotoForHazards(fakeFile("y.jpg", 222, 2));
    // Kesin farklılık garanti edilemez (havuz küçük) ama fonksiyonun girdiye duyarlı
    // olduğunu (her zaman aynı sabit diziyi döndürmediğini) doğrular.
    const c = await analyzePhotoForHazards(fakeFile("z.jpg", 333, 3));
    const allSame = JSON.stringify(a.map((f) => f.hazard)) === JSON.stringify(b.map((f) => f.hazard))
      && JSON.stringify(b.map((f) => f.hazard)) === JSON.stringify(c.map((f) => f.hazard));
    assert.equal(allSame, false);
  });
});
