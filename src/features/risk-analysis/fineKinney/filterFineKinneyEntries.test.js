import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { filterFineKinneyEntries } from "./filterFineKinneyEntries.js";

const baseFilters = {
  search: "",
  levelFilter: "all",
  departmentFilter: "all",
  branchFilter: "all",
  statusFilter: "all",
  priorityFilter: "all",
  dateFrom: "",
  dateTo: "",
};

const sampleEntries = [
  { id: 1, hazard: "Kaygan zemin", risk: "Düşme", score: 15, departmentId: 1, branchId: 1, status: "open", priority: "medium", date: "10.01.2026" },
  { id: 2, hazard: "Forklift çarpması", risk: "Yaralanma", score: 250, departmentId: 2, branchId: 1, status: "inProgress", priority: "high", date: "15.02.2026" },
  { id: 3, hazard: "Elektrik kaçağı", risk: "Yangın", score: 500, departmentId: 1, branchId: 2, status: "done", priority: "high", date: "01.03.2026" },
];

describe("filterFineKinneyEntries", () => {
  test("filtre uygulanmazsa tüm kayıtları döner", () => {
    const result = filterFineKinneyEntries(sampleEntries, baseFilters);
    assert.equal(result.length, 3);
  });

  test("arama metni hazard veya risk alanında büyük/küçük harf duyarsız eşleşir (Türkçe İ dahil)", () => {
    // Ham metin doğrudan gönderiliyor — gerçek kullanımda arama kutusundan böyle gelir.
    // Testin kendisi burada .toLowerCase() çağırırsa (örn. Caps Lock ile yazılan "FORKLİFT"),
    // JS'in varsayılan (locale'siz) dönüşümü "İ"yi "i" değil "i̇"ye çevirip filterFineKinneyEntries'in
    // KENDİ turkishLower() düzeltmesini test etmeden önce veriyi bozar — bkz. utils/text.js.
    const result = filterFineKinneyEntries(sampleEntries, { ...baseFilters, search: "FORKLİFT" });
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 2);
  });

  test("risk seviyesine göre filtreler (score -> level eşiği)", () => {
    const result = filterFineKinneyEntries(sampleEntries, { ...baseFilters, levelFilter: "veryHigh" });
    assert.deepEqual(result.map((e) => e.id), [3]);
  });

  test("departman filtresi string/number karışık id'lerde çalışır", () => {
    const result = filterFineKinneyEntries(sampleEntries, { ...baseFilters, departmentFilter: "1" });
    assert.deepEqual(result.map((e) => e.id), [1, 3]);
  });

  test("şube filtresi çalışır", () => {
    const result = filterFineKinneyEntries(sampleEntries, { ...baseFilters, branchFilter: "2" });
    assert.deepEqual(result.map((e) => e.id), [3]);
  });

  test("durum filtresi çalışır", () => {
    const result = filterFineKinneyEntries(sampleEntries, { ...baseFilters, statusFilter: "done" });
    assert.deepEqual(result.map((e) => e.id), [3]);
  });

  test("öncelik filtresi çalışır", () => {
    const result = filterFineKinneyEntries(sampleEntries, { ...baseFilters, priorityFilter: "high" });
    assert.deepEqual(result.map((e) => e.id).sort(), [2, 3]);
  });

  test("tarih aralığı (dateFrom/dateTo) TR formatını (DD.MM.YYYY) doğru karşılaştırır", () => {
    const result = filterFineKinneyEntries(sampleEntries, { ...baseFilters, dateFrom: "2026-02-01", dateTo: "2026-02-28" });
    assert.deepEqual(result.map((e) => e.id), [2]);
  });

  test("birden fazla filtre birlikte (AND mantığıyla) uygulanır", () => {
    const result = filterFineKinneyEntries(sampleEntries, { ...baseFilters, branchFilter: "1", priorityFilter: "high" });
    assert.deepEqual(result.map((e) => e.id), [2]);
  });

  test("hiçbir kayıt eşleşmezse boş dizi döner", () => {
    const result = filterFineKinneyEntries(sampleEntries, { ...baseFilters, search: "olmayan bir tehlike" });
    assert.equal(result.length, 0);
  });
});
