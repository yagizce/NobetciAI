import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { computeRiskClosureTrend } from "./dashboardTrends.js";

function monthsAgoTrLabel(monthsAgo, day = 15) {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  return `${String(day).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

function monthsAgoIso(monthsAgo, day = 20) {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  return new Date(d.getFullYear(), d.getMonth(), day).toISOString();
}

describe("computeRiskClosureTrend", () => {
  test("hiç kayıt yoksa tüm aylar için 0 döner", () => {
    const trend = computeRiskClosureTrend([], 6);
    assert.deepEqual(trend, [0, 0, 0, 0, 0, 0]);
  });

  test("dizi uzunluğu istenen ay sayısıyla eşleşir", () => {
    assert.equal(computeRiskClosureTrend([], 3).length, 3);
    assert.equal(computeRiskClosureTrend([], 12).length, 12);
  });

  test("bugün oluşturulup kapatılmış bir kayıt, son ay için %100 gösterir", () => {
    const entries = [{ date: monthsAgoTrLabel(0), closedAt: monthsAgoIso(0) }];
    const trend = computeRiskClosureTrend(entries, 6);
    assert.equal(trend[trend.length - 1], 100);
  });

  test("henüz kapatılmamış bir kayıt son ay için %0 gösterir", () => {
    const entries = [{ date: monthsAgoTrLabel(0), closedAt: null }];
    const trend = computeRiskClosureTrend(entries, 6);
    assert.equal(trend[trend.length - 1], 0);
  });

  test("bir kaydın oluşturulmadan ÖNCEki aylarda sayılmaz (0 kalır)", () => {
    const entries = [{ date: monthsAgoTrLabel(0), closedAt: null }];
    const trend = computeRiskClosureTrend(entries, 6);
    // İlk 5 ay bu kayıt henüz yokken 0 olmalı (existingByThen boş → 0).
    assert.deepEqual(trend.slice(0, 5), [0, 0, 0, 0, 0]);
  });

  test("tarihsiz/bozuk kayıtlar trend'i etkilemez", () => {
    const entries = [{ date: null, closedAt: null }, { date: "geçersiz", closedAt: null }];
    const trend = computeRiskClosureTrend(entries, 6);
    assert.deepEqual(trend, [0, 0, 0, 0, 0, 0]);
  });

  test("3 ay önce oluşturulup bugün kapatılan bir kayıt, geçmiş aylarda açık, son ayda kapalı görünür", () => {
    const entries = [{ date: monthsAgoTrLabel(3), closedAt: monthsAgoIso(0) }];
    const trend = computeRiskClosureTrend(entries, 6);
    // Kayıt 3 ay önce oluştu: index 2 (6-3=3 önceki ay) itibariyle "var" ama henüz kapanmamış.
    assert.equal(trend[2], 0); // 3 ay önce: var ama açık
    assert.equal(trend[5], 100); // bugün: kapandı
  });
});
