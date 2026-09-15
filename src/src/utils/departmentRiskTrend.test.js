import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { computeDepartmentRiskTrends } from "./departmentRiskTrend.js";

// entry.date, toComparableDate ile ayrıştırılıyor -> "DD.MM.YYYY" bekliyor.
function daysAgoTr(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

const DEPARTMENTS = [
  { id: "dep-1", name: "Depo" },
  { id: "dep-2", name: "Üretim" },
];

function entry(departmentId, daysAgo) {
  return { departmentId, date: daysAgoTr(daysAgo) };
}

describe("computeDepartmentRiskTrends", () => {
  test("boş/null girdilerde çökmez, boş dizi döner", () => {
    assert.deepEqual(computeDepartmentRiskTrends([], []), []);
    assert.deepEqual(computeDepartmentRiskTrends(null, []), []);
  });

  test("GÜRÜLTÜ FİLTRESİ: current < MIN_CURRENT_FOR_ALERT (3) olan departman artıyor sayılmaz", () => {
    // dep-1: son 30 günde 2 kayıt (1 -> 2, delta pozitif ama eşiğin altında)
    const entries = [entry("dep-1", 1), entry("dep-1", 2), entry("dep-1", 45)];
    assert.deepEqual(computeDepartmentRiskTrends(entries, DEPARTMENTS), []);
  });

  test("current >= 3 VE previous'tan fazlaysa 'artıyor' sayılır, doğru alanlarla döner", () => {
    // dep-1: son 30 günde 3, önceki 30 günde 1 -> artıyor
    const entries = [
      entry("dep-1", 1), entry("dep-1", 5), entry("dep-1", 10), // current (son 30 gün)
      entry("dep-1", 45), // previous (31-60 gün arası)
    ];
    const result = computeDepartmentRiskTrends(entries, DEPARTMENTS);
    assert.equal(result.length, 1);
    assert.deepEqual(result[0], {
      departmentId: "dep-1", label: "Depo", current: 3, previous: 1, delta: 2, increasing: true,
    });
  });

  test("current >= 3 ama previous >= current ise (artış yok/azalış) listelenmez", () => {
    const entries = [
      entry("dep-1", 1), entry("dep-1", 5), entry("dep-1", 10), // current: 3
      entry("dep-1", 35), entry("dep-1", 40), entry("dep-1", 50), // previous: 3 (eşit, artış değil)
    ];
    assert.deepEqual(computeDepartmentRiskTrends(entries, DEPARTMENTS), []);
  });

  test("departmentId olmayan kayıtlar sayıma dahil edilmez", () => {
    const entries = [entry(null, 1), entry(undefined, 2), { date: entry("x", 1).date }];
    assert.deepEqual(computeDepartmentRiskTrends(entries, DEPARTMENTS), []);
  });

  test("60 günden eski kayıtlar hiçbir pencereye dahil edilmez", () => {
    const entries = [entry("dep-1", 1), entry("dep-1", 5), entry("dep-1", 90)];
    const result = computeDepartmentRiskTrends(entries, DEPARTMENTS);
    // current=2 (eşik altı) zaten listelenmez, ama previous'a da 90 günlük kayıt girmemeli
    assert.deepEqual(result, []);
  });

  test("departments listesinde bulunamayan departmentId 'Bilinmeyen departman' etiketiyle döner", () => {
    const entries = [entry("dep-yok", 1), entry("dep-yok", 2), entry("dep-yok", 3)];
    const result = computeDepartmentRiskTrends(entries, DEPARTMENTS);
    assert.equal(result[0].label, "Bilinmeyen departman");
  });

  test("birden fazla artan departman en çok artandan aza sıralanır", () => {
    const entries = [
      // dep-1: current 3, previous 0 -> delta 3
      entry("dep-1", 1), entry("dep-1", 2), entry("dep-1", 3),
      // dep-2: current 5, previous 1 -> delta 4
      entry("dep-2", 1), entry("dep-2", 2), entry("dep-2", 3), entry("dep-2", 4), entry("dep-2", 5),
      entry("dep-2", 45),
    ];
    const result = computeDepartmentRiskTrends(entries, DEPARTMENTS);
    assert.equal(result.length, 2);
    assert.equal(result[0].departmentId, "dep-2"); // delta 4 önce
    assert.equal(result[1].departmentId, "dep-1"); // delta 3 sonra
  });

  test("geçersiz tarih formatlı kayıtlar sessizce atlanır", () => {
    const entries = [{ departmentId: "dep-1", date: "geçersiz" }];
    assert.deepEqual(computeDepartmentRiskTrends(entries, DEPARTMENTS), []);
  });
});
