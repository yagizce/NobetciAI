import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { buildGlobalSearchResults } from "./globalSearch.js";

const sampleData = {
  fineKinney: [{ id: 1, hazard: "Forklift çarpması riski", risk: "Yaralanma" }],
  riskDetections: [{ id: 2, category: "forkliftProximity", location: "Depo B" }],
  periodicChecks: [{ id: 3, itemName: "Forklift periyodik muayenesi", nextDueDate: "2026-03-01" }],
  documents: [{ id: 4, title: "Forklift Kullanım Talimatı", type: "instruction" }],
  knowledgeDocs: [{ id: 5, title: "Forklift Güvenlik Kılavuzu", summary: "Forklift kullanımında dikkat edilmesi gerekenler" }],
};

describe("buildGlobalSearchResults", () => {
  test("1 karakterlik sorgu için boş dizi döner (çok kısa)", () => {
    assert.deepEqual(buildGlobalSearchResults("f", sampleData), []);
  });

  test("boş/whitespace sorgu için boş dizi döner", () => {
    assert.deepEqual(buildGlobalSearchResults("   ", sampleData), []);
  });

  test("5 modülün tamamında eşleşen bir terim, 5 grubun hepsini döner", () => {
    const results = buildGlobalSearchResults("forklift", sampleData);
    const keys = results.map((r) => r.key);
    assert.deepEqual(keys.sort(), ["documents", "fineKinney", "knowledge", "periodicChecks", "riskDetection"].sort());
  });

  test("yalnızca bir modülde eşleşen terim, yalnızca o grubu döner", () => {
    const results = buildGlobalSearchResults("yaralanma", sampleData); // yalnızca fineKinney.risk'te var
    assert.equal(results.length, 1);
    assert.equal(results[0].key, "fineKinney");
  });

  test("hiçbir modülde eşleşmeyen terim için boş dizi döner", () => {
    assert.deepEqual(buildGlobalSearchResults("alakasız terim", sampleData), []);
  });

  test("Türkçe büyük İ ile arama da doğru çalışır (turkishLower entegrasyonu)", () => {
    const results = buildGlobalSearchResults("FORKLİFT", sampleData);
    assert.ok(results.length > 0);
  });

  test("Fine-Kinney sonucu doğru hedef rotayı ve prefillSearch'ü taşır", () => {
    const results = buildGlobalSearchResults("forklift", sampleData);
    const fk = results.find((r) => r.key === "fineKinney");
    assert.equal(fk.target.path, "/risk-analysis");
    assert.equal(fk.target.state.targetTab, "fineKinney");
    assert.equal(fk.target.state.prefillSearch, "forklift");
  });

  test("Bilgi Kütüphanesi sonucu query param olarak URL'e kodlanmış arama taşır", () => {
    const results = buildGlobalSearchResults("forklift güvenlik", sampleData);
    const kc = results.find((r) => r.key === "knowledge");
    assert.equal(kc.target.search, `?q=${encodeURIComponent("forklift güvenlik")}`);
  });

  test("BUG FIX: Dokümanlar sonucu da (Bilgi Kütüphanesi/Periyodik Kontrol gibi) arama sorgusunu URL'e taşır — önceden yalnızca '?tab=generator' idi ve DocumentGenerator.jsx'e sorgu hiç ulaşmıyordu", () => {
    const results = buildGlobalSearchResults("forklift", sampleData);
    const docs = results.find((r) => r.key === "documents");
    assert.equal(docs.target.path, "/documents");
    assert.equal(docs.target.search, `?tab=generator&q=${encodeURIComponent("forklift")}`);
  });

  test("eksik veri kaynakları (undefined) için çökmez, o kategoriler boş kalır", () => {
    const results = buildGlobalSearchResults("forklift", {});
    assert.deepEqual(results, []);
  });

  test("bir kategoride MAX_RESULTS_PER_CATEGORY'den (3) fazla eşleşme varsa kırpar", () => {
    const manyEntries = { fineKinney: Array.from({ length: 5 }, (_, i) => ({ id: i, hazard: `Forklift ${i}`, risk: "" })) };
    const results = buildGlobalSearchResults("forklift", manyEntries);
    assert.equal(results[0].items.length, 3);
  });
});
