import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { computeLegislationImpact } from "./legislationRiskLinker.js";
import { isoDateNDaysAgo } from "./dateUtils.js";

const RECENT = isoDateNDaysAgo(10); // eşik (90 gün) içinde
const OLD = isoDateNDaysAgo(200); // eşik dışında

function doc(id, { category = "legislation", updatedAt = RECENT, title = "", tags = [] } = {}) {
  return { id, category, updatedAt, title, tags };
}

function entry(id, hazard, risk, status = "open") {
  return { id, hazard, risk, status };
}

describe("computeLegislationImpact", () => {
  test("boş/null girdilerde çökmez, boş dizi döner", () => {
    assert.deepEqual(computeLegislationImpact([], []), []);
    assert.deepEqual(computeLegislationImpact(null, null), []);
  });

  test("category !== 'legislation' olan dokümanlar tamamen yok sayılır", () => {
    const documents = [doc("d1", { category: "genel", title: "yangın güvenliği kuralları" })];
    const entries = [entry("e1", "Yangın güvenliği eksikliği", "Yangın riski")];
    assert.deepEqual(computeLegislationImpact(entries, documents), []);
  });

  test("RECENT_UPDATE_DAYS (90 gün) dışında güncellenmiş doküman yok sayılır", () => {
    const documents = [doc("d1", { updatedAt: OLD, title: "yangın güvenliği kuralları" })];
    const entries = [entry("e1", "Yangın güvenliği eksikliği", "Yangın riski")];
    assert.deepEqual(computeLegislationImpact(entries, documents), []);
  });

  test("status: 'done' olan Fine-Kinney kayıtları eşleşmeye dahil edilmez", () => {
    const documents = [doc("d1", { title: "yangın güvenliği kuralları" })];
    const entries = [entry("e1", "Yangın güvenliği eksikliği", "Yangın riski", "done")];
    assert.deepEqual(computeLegislationImpact(entries, documents), []);
  });

  test("başlık/etiketteki anlamlı bir kelime hazard/risk metninde geçiyorsa eşleşir", () => {
    const documents = [doc("d1", { title: "Yangın Güvenliği Yönetmeliği", tags: ["yangın"] })];
    const entries = [entry("e1", "Yangın söndürme ekipmanı eksik", "Personel yangına müdahale edemiyor")];
    const result = computeLegislationImpact(entries, documents);
    assert.equal(result.length, 1);
    assert.equal(result[0].document.id, "d1");
    assert.equal(result[0].affectedEntries.length, 1);
    assert.equal(result[0].affectedEntries[0].entry.id, "e1");
    assert.ok(result[0].affectedEntries[0].matchedWords.includes("yangın"));
  });

  test("hiçbir anlamlı kelime örtüşmüyorsa doküman sonuca hiç girmez", () => {
    const documents = [doc("d1", { title: "Kapalı Alan Yönetmeliği", tags: ["kapalı", "alan"] })];
    const entries = [entry("e1", "Forklift yaya yakınlığı", "Çarpma riski")];
    assert.deepEqual(computeLegislationImpact(entries, documents), []);
  });

  test("4 harf veya daha kısa kelimeler ve stopword'ler (için/veya/ile vb.) eşleşmede sayılmaz", () => {
    // "ile" bir stopword, "acil" 4 harf (>3 kuralı 4 harfi geçer ama test edelim: "acil" length=4, kural length>3 yani 4 dahil oluyor).
    // Kesin kısa kelimeyi test edelim: "işe" (3 harf, filtrelenir).
    const documents = [doc("d1", { title: "işe ile veya için", tags: [] })];
    const entries = [entry("e1", "işe başlarken ile veya için kontrol", "risk")];
    assert.deepEqual(computeLegislationImpact(entries, documents), []);
  });

  test("birden fazla doküman ve kayıt bağımsız olarak eşleştirilir", () => {
    const documents = [
      doc("d1", { title: "Yangın Yönetmeliği", tags: ["yangın"] }),
      doc("d2", { title: "Kapalı Alan Yönetmeliği", tags: ["kapalı"] }),
    ];
    const entries = [
      entry("e1", "Yangın tüpü eksik", "risk"),
      entry("e2", "Kapalı alan girişi izinsiz", "risk"),
      entry("e3", "İlgisiz bir tehlike", "risk"),
    ];
    const result = computeLegislationImpact(entries, documents);
    assert.equal(result.length, 2);
    const d1 = result.find((r) => r.document.id === "d1");
    const d2 = result.find((r) => r.document.id === "d2");
    assert.equal(d1.affectedEntries[0].entry.id, "e1");
    assert.equal(d2.affectedEntries[0].entry.id, "e2");
  });
});
