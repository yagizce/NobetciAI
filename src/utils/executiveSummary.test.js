import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { computeWeeklySummary } from "./executiveSummary.js";

function isoDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

describe("computeWeeklySummary", () => {
  test("hiç veri yoksa tüm sayılar 0 ve cümle 'sakin görünüyor'a düşer", () => {
    const result = computeWeeklySummary([], []);
    assert.deepEqual(result, {
      newRisksThisWeek: 0,
      closedRisksThisWeek: 0,
      ongoingCriticalRisks: 0,
      upcomingChecks: 0,
      sentence: "Bu hafta yeni risk oluşturulmadı. Genel durum sakin görünüyor.",
    });
  });

  test("son 7 gün içindeki kayıtlar 'yeni risk' sayılır, daha eskiler sayılmaz", () => {
    const entries = [
      { date: isoDaysAgo(2), status: "open" },
      { date: isoDaysAgo(6), status: "open" },
      { date: isoDaysAgo(10), status: "open" }, // pencere dışı
    ];
    const result = computeWeeklySummary(entries, []);
    assert.equal(result.newRisksThisWeek, 2);
    assert.match(result.sentence, /Bu hafta 2 yeni risk oluşturuldu\./);
  });

  test("closedAt son 7 gün içindeyse 'kapatılan risk' sayısına eklenir", () => {
    const entries = [
      { date: isoDaysAgo(20), closedAt: isoDaysAgo(1), status: "done" },
      { date: isoDaysAgo(20), closedAt: null, status: "done" },
    ];
    const result = computeWeeklySummary(entries, []);
    assert.equal(result.closedRisksThisWeek, 1);
    assert.match(result.sentence, /1 risk kapatıldı\./);
  });

  test("status !== 'done' VE priority high/urgent olan kayıtlar 'devam eden kritik risk' sayılır", () => {
    const entries = [
      { date: isoDaysAgo(20), status: "open", priority: "high" },
      { date: isoDaysAgo(20), status: "open", priority: "urgent" },
      { date: isoDaysAgo(20), status: "open", priority: "low" }, // düşük öncelik, sayılmaz
      { date: isoDaysAgo(20), status: "done", priority: "urgent" }, // kapalı, sayılmaz
    ];
    const result = computeWeeklySummary(entries, []);
    assert.equal(result.ongoingCriticalRisks, 2);
    assert.match(result.sentence, /2 yüksek öncelikli risk devam ediyor\./);
  });

  test("status: upcoming/overdue periyodik kontroller 'yaklaşan kontrol' sayılır", () => {
    const checks = [
      { status: "upcoming" },
      { status: "overdue" },
      { status: "completed" }, // sayılmaz
    ];
    const result = computeWeeklySummary([], checks);
    assert.equal(result.upcomingChecks, 2);
    assert.match(result.sentence, /2 periyodik kontrol yaklaşmaktadır\./);
  });

  test("birden fazla durum aynı anda doğruysa cümle hepsini art arda birleştirir", () => {
    const entries = [
      { date: isoDaysAgo(1), status: "open", priority: "urgent" },
      { date: isoDaysAgo(20), closedAt: isoDaysAgo(1), status: "done" },
    ];
    const checks = [{ status: "upcoming" }];
    const result = computeWeeklySummary(entries, checks);
    assert.equal(
      result.sentence,
      "Bu hafta 1 yeni risk oluşturuldu. 1 risk kapatıldı. 1 yüksek öncelikli risk devam ediyor. 1 periyodik kontrol yaklaşmaktadır."
    );
  });
});
