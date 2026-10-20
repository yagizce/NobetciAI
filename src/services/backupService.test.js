import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { validateBackup, estimateBackupSizeBytes, getMissingBackupStoreCount } from "./backupService.js";
import { STORES } from "./db.js";

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

  test("uygulama verisi içermeyen yedek reddedilir", () => {
    assert.match(validateBackup({ formatVersion: 1, data: {} }).error, /uygulama verisi/i);
    assert.equal(validateBackup({ formatVersion: 1, data: { bilinmeyenStore: [] } }).valid, false);
  });

  test("bilinmeyen (STORES listesinde olmayan) fazladan bir alan görmezden gelinir", () => {
    // İleride eski bir yedek dosyasında artık var olmayan bir store adı kalmış olabilir —
    // bu durumun restore'u BOZMAMASI gerekir, yalnızca o alan kullanılmaz.
    const result = validateBackup({ formatVersion: 1, data: { employees: [], bilinmeyenStore: [1, 2, 3] } });
    assert.equal(result.valid, true);
  });

  test("eski kısmi yedek kabul edilir ve eksik veri bölümleri sayılır", () => {
    const backup = { formatVersion: 1, data: { employees: [{ id: 1 }] } };
    assert.equal(validateBackup(backup).valid, true);
    assert.equal(getMissingBackupStoreCount(backup), STORES.length - 1);
    assert.equal(getMissingBackupStoreCount({ data: Object.fromEntries(STORES.map((store) => [store, []])) }), 0);
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

describe("estimateBackupSizeBytes", () => {
  test("boş bir yedek için küçük ama sıfır olmayan bir boyut döner", () => {
    const size = estimateBackupSizeBytes({ formatVersion: 1, exportedAt: "2026-01-01T00:00:00.000Z", data: {} });
    assert.ok(size > 0 && size < 200, `beklenmeyen boyut: ${size}`);
  });

  test("daha fazla veri, daha büyük boyut üretir (monoton artış)", () => {
    const small = estimateBackupSizeBytes({ formatVersion: 1, data: { employees: [{ id: 1 }] } });
    const large = estimateBackupSizeBytes({ formatVersion: 1, data: { employees: Array.from({ length: 100 }, (_, i) => ({ id: i, fullName: "Test Kişi " + i })) } });
    assert.ok(large > small);
  });

  test("gerçekçi bir base64 fotoğraf alanı boyutu doğru şekilde yansıtır (bkz. MAX_BACKUP_SIZE_BYTES kontrolü)", () => {
    // ~300KB'lık sahte bir base64 fotoğraf — BackupSection.jsx'teki oversized akışının
    // dayandığı varsayımı doğrular: fotoğraflar toplam boyutu belirgin şekilde artırır.
    const fakePhotoDataUrl = "data:image/jpeg;base64," + "A".repeat(300 * 1024);
    const withoutPhoto = estimateBackupSizeBytes({ formatVersion: 1, data: { riskDetectionPhotos: [] } });
    const withPhoto = estimateBackupSizeBytes({ formatVersion: 1, data: { riskDetectionPhotos: [{ id: "p1", dataUrl: fakePhotoDataUrl }] } });
    assert.ok(withPhoto - withoutPhoto >= 300 * 1024);
  });
});
