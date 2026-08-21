import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { isBackupStale, daysSinceLastBackup, STALE_BACKUP_DAYS } from "./backup.js";

const NOW = new Date("2026-06-15T12:00:00.000Z").getTime();

function daysAgoIso(days) {
  return new Date(NOW - days * 24 * 60 * 60 * 1000).toISOString();
}

describe("isBackupStale", () => {
  test("hiç yedek yoksa (null) bayat sayılır", () => {
    assert.equal(isBackupStale(null, NOW), true);
    assert.equal(isBackupStale(undefined, NOW), true);
  });

  test("STALE_BACKUP_DAYS gün önce alınmışsa bayat sayılır (sınır dahil)", () => {
    assert.equal(isBackupStale(daysAgoIso(STALE_BACKUP_DAYS), NOW), true);
  });

  test("STALE_BACKUP_DAYS'ten 1 gün daha az önce alınmışsa bayat SAYILMAZ", () => {
    assert.equal(isBackupStale(daysAgoIso(STALE_BACKUP_DAYS - 1), NOW), false);
  });

  test("bugün alınmış bir yedek bayat sayılmaz", () => {
    assert.equal(isBackupStale(daysAgoIso(0), NOW), false);
  });

  test("geçersiz tarih string'i bayat sayılır, çökmez", () => {
    assert.equal(isBackupStale("geçersiz-tarih", NOW), true);
  });
});

describe("daysSinceLastBackup", () => {
  test("lastBackupAt yoksa null döner", () => {
    assert.equal(daysSinceLastBackup(null, NOW), null);
  });

  test("doğru gün sayısını hesaplar", () => {
    assert.equal(daysSinceLastBackup(daysAgoIso(5), NOW), 5);
  });

  test("geçersiz tarihte null döner, çökmez", () => {
    assert.equal(daysSinceLastBackup("geçersiz", NOW), null);
  });
});
