import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getOverdueOrDueSoonChecks, normalizeIntervalDays, computeNextDueDate } from "./periodicCheck.js";

function daysFromToday(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

describe("periodic check guards", () => {
  test("interval gününü pozitif ve makul bir aralıkta normalize eder", () => {
    assert.equal(normalizeIntervalDays(-10), 1);
    assert.equal(normalizeIntervalDays("bozuk"), 30);
    assert.equal(normalizeIntervalDays(99999), 3650);
    assert.equal(normalizeIntervalDays(30.6), 31);
  });

  test("geçersiz tarih girdisiyle NaN tarih üretmez", () => {
    assert.match(computeNextDueDate("geçersiz-tarih", 30), /^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("getOverdueOrDueSoonChecks", () => {
  test("süresi geçmiş bir kontrolü 'overdue' olarak döner", () => {
    const checks = [{ id: 1, itemName: "Yangın Tüpü A", nextDueDate: daysFromToday(-5), status: "ok" }];
    const result = getOverdueOrDueSoonChecks(checks);
    assert.equal(result.length, 1);
    assert.equal(result[0].status, "overdue");
  });

  test("3 gün veya daha az kalan kontrolü 'upcoming' olarak döner", () => {
    const checks = [{ id: 2, itemName: "İskele B", nextDueDate: daysFromToday(2), status: "ok" }];
    const result = getOverdueOrDueSoonChecks(checks);
    assert.equal(result.length, 1);
    assert.equal(result[0].status, "upcoming");
  });

  test("4+ gün kalan kontrolü (henüz yakın değil) LİSTEYE DAHİL ETMEZ", () => {
    const checks = [{ id: 3, itemName: "Elektrik C", nextDueDate: daysFromToday(10), status: "ok" }];
    assert.equal(getOverdueOrDueSoonChecks(checks).length, 0);
  });

  test("kaydın BAYAT status alanına değil, nextDueDate'den canlı hesaplamaya güvenir", () => {
    // status alanı yanlışlıkla \"ok\" kalmış olsa bile (kayıt uzun süre düzenlenmemiş),
    // nextDueDate geçmişteyse yine de hatırlatma listesine girmeli.
    const checks = [{ id: 4, itemName: "Bayat Kayıt", nextDueDate: daysFromToday(-1), status: "ok" }];
    const result = getOverdueOrDueSoonChecks(checks);
    assert.equal(result.length, 1);
    assert.equal(result[0].status, "overdue");
  });

  test("boş liste için boş dizi döner", () => {
    assert.deepEqual(getOverdueOrDueSoonChecks([]), []);
  });
});
