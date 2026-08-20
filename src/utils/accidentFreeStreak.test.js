import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { computeAccidentFreeStreak } from "./accidentFreeStreak.js";

// dateUtils.toComparableDate DD.MM.YYYY bekliyor; test verisi bu formatta.
function daysAgoTr(days) {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

describe("computeAccidentFreeStreak", () => {
  test("kaza bildirimi yoksa hasRecord: false, gün sayısı UYDURULMAZ (null)", () => {
    const result = computeAccidentFreeStreak([{ type: "egitim", date: daysAgoTr(5) }]);
    assert.deepEqual(result, { hasRecord: false, days: null, lastAccidentDate: null });
  });

  test("notifications boş/null/undefined ise çökmez, hasRecord: false döner", () => {
    assert.equal(computeAccidentFreeStreak([]).hasRecord, false);
    assert.equal(computeAccidentFreeStreak(null).hasRecord, false);
    assert.equal(computeAccidentFreeStreak(undefined).hasRecord, false);
  });

  test("tek kaza kaydında gün sayısını doğru hesaplar", () => {
    const dateStr = daysAgoTr(10);
    const result = computeAccidentFreeStreak([{ type: "kaza", date: dateStr }]);
    assert.equal(result.hasRecord, true);
    // Gün sınırındaki saat farkları yüzünden ±1 gün toleranslı kontrol.
    assert.ok(Math.abs(result.days - 10) <= 1, `beklenen ~10, gelen ${result.days}`);
  });

  test("birden fazla kaza kaydı varsa EN SON tarihi baz alır (en küçük gün sayısı)", () => {
    const result = computeAccidentFreeStreak([
      { type: "kaza", date: daysAgoTr(30) },
      { type: "kaza", date: daysAgoTr(3) },
      { type: "kaza", date: daysAgoTr(60) },
    ]);
    assert.ok(Math.abs(result.days - 3) <= 1, `beklenen ~3, gelen ${result.days}`);
  });

  test("yalnızca type: 'kaza' olan kayıtları dikkate alır, diğerlerini yok sayar", () => {
    const result = computeAccidentFreeStreak([
      { type: "egitim", date: daysAgoTr(1) },
      { type: "periyodikKontrol", date: daysAgoTr(2) },
      { type: "kaza", date: daysAgoTr(20) },
    ]);
    assert.ok(Math.abs(result.days - 20) <= 1);
  });

  test("geçersiz tarih formatlı kayıtlar filtrelenir, çökmez", () => {
    const result = computeAccidentFreeStreak([
      { type: "kaza", date: "geçersiz-tarih" },
      { type: "kaza", date: "" },
      { type: "kaza", date: daysAgoTr(5) },
    ]);
    assert.equal(result.hasRecord, true);
    assert.ok(Math.abs(result.days - 5) <= 1);
  });

  test("tüm kaza kayıtları geçersiz tarihliyse hasRecord: false döner", () => {
    const result = computeAccidentFreeStreak([{ type: "kaza", date: "geçersiz" }]);
    assert.equal(result.hasRecord, false);
  });
});
