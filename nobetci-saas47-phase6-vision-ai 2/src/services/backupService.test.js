import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { validateBackup } from "./backupService.js";

describe("validateBackup", () => {
  test("geçerli bir yedek nesnesi için valid: true döner", () => {
    const backup = { formatVersion: 1, exportedAt: "2026-01-01T00:00:00.000Z", data: { companies: [], employees: [{ id: 1, fullName: "Ahmet" }] } };
    assert.deepEqual(validateBackup(backup), { valid: true });
  });

  test("null/undefined/nesne olmayan veri için hata döner", () => {
    assert.equal(validateBackup(null).valid, false);
    assert.equal(validateBackup(undefined).valid, false);
    assert.equal(validateBackup("bir metin").valid, false);
    assert.equal(validateBackup(42).valid, false);
  });

  test("formatVersion eksik veya farklıysa hata döner", () => {
    assert.equal(validateBackup({ data: {} }).valid, false);
    assert.equal(validateBackup({ formatVersion: 999, data: {} }).valid, false);
  });

  test("data alanı eksikse hata döner", () => {
    assert.equal(validateBackup({ formatVersion: 1 }).valid, false);
    assert.equal(validateBackup({ formatVersion: 1, data: "yanlış tip" }).valid, false);
  });

  test("bir store'un verisi dizi değilse hata döner", () => {
    const result = validateBackup({ formatVersion: 1, data: { employees: "dizi değil" } });
    assert.equal(result.valid, false);
    assert.ok(result.error.includes("employees"));
  });

  test("data içinde hiç store olmaması (boş yedek) geçerli sayılır", () => {
    assert.deepEqual(validateBackup({ formatVersion: 1, data: {} }), { valid: true });
  });

  test("bilinmeyen (STORES listesinde olmayan) fazladan bir alan görmezden gelinir", () => {
    // İleride eski bir yedek dosyasında artık var olmayan bir store adı kalmış olabilir —
    // bu durumun restore'u BOZMAMASI gerekir, yalnızca o alan kullanılmaz.
    const result = validateBackup({ formatVersion: 1, data: { bilinmeyenStore: [1, 2, 3] } });
    assert.equal(result.valid, true);
  });

  // HARDENING (Stabilite Sprinti): IndexedDB store'ları `keyPath: "id"` ile tanımlı —
  // id'si olmayan bir kayıt restore sırasında DataError fırlatıp işlemi yarıda
  // bırakabilirdi. Bu artık restore BAŞLAMADAN önce reddediliyor.
  test("id alanı eksik bir kayıt içeren yedek geçersiz sayılır", () => {
    const result = validateBackup({ formatVersion: 1, data: { employees: [{ fullName: "Ahmet" }] } });
    assert.equal(result.valid, false);
    assert.match(result.error, /id/i);
  });

  test("id değeri null olan bir kayıt da geçersiz sayılır", () => {
    const result = validateBackup({ formatVersion: 1, data: { branches: [{ id: null, name: "Merkez" }] } });
    assert.equal(result.valid, false);
  });

  test("aynı store içinde yinelenen id varsa geçersiz sayılır", () => {
    const result = validateBackup({ formatVersion: 1, data: { employees: [{ id: 7 }, { id: 7 }] } });
    assert.equal(result.valid, false);
    assert.match(result.error, /yinelenen id/i);
  });

  test("varsa exportedAt alanı geçerli tarih olmalıdır", () => {
    const result = validateBackup({ formatVersion: 1, exportedAt: "geçersiz-tarih", data: {} });
    assert.equal(result.valid, false);
    assert.match(result.error, /tarih/i);
  });

  test("dizi içinde geçersiz (obje olmayan) bir eleman varsa geçersiz sayılır", () => {
    const result = validateBackup({ formatVersion: 1, data: { departments: [null, "metin"] } });
    assert.equal(result.valid, false);
  });
});
