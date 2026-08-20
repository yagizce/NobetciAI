import { test, describe, before } from "node:test";
import assert from "node:assert/strict";

// Node'da native File/Blob var ama FileReader yok (tarayıcıya özgü). validateImageFile/
// validatePdfFile yalnızca readAsArrayBuffer kullanıyor — Blob'un native .arrayBuffer()
// metoduna sarılmış minimal bir polyfill, testler için yeterli. Üretim kodunda DEĞİŞİKLİK
// yok, yalnızca test ortamı için global bir shim.
before(() => {
  if (typeof globalThis.FileReader === "undefined") {
    globalThis.FileReader = class FileReaderPolyfill {
      readAsArrayBuffer(blob) {
        blob.arrayBuffer()
          .then((buf) => { this.result = buf; this.onload?.(); })
          .catch((err) => { this.onerror?.(err); });
      }
    };
  }
});

const { validateImageFile, validatePdfFile, MAX_IMAGE_SIZE_MB, MAX_PDF_SIZE_MB } = await import("./fileValidation.js");

function fileFromBytes(bytes, name = "test", type = "application/octet-stream") {
  return new File([new Uint8Array(bytes)], name, { type });
}

const JPEG_HEADER = [0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0];
const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const GIF_HEADER = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61];
const WEBP_HEADER = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0];
const PDF_HEADER = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34];
const NOT_AN_IMAGE = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05];

describe("validateImageFile", () => {
  test("dosya verilmezse geçersiz sayılır", async () => {
    const { valid, error } = await validateImageFile(null);
    assert.equal(valid, false);
    assert.ok(error);
  });

  test("boş dosya geçersiz sayılır", async () => {
    const { valid, error } = await validateImageFile(fileFromBytes([]));
    assert.equal(valid, false);
    assert.match(error, /boş/);
  });

  test("MAX_IMAGE_SIZE_MB'ı aşan dosya reddedilir", async () => {
    const tooBig = { name: "x.jpg", size: (MAX_IMAGE_SIZE_MB + 1) * 1024 * 1024, slice: () => fileFromBytes(JPEG_HEADER) };
    const { valid, error } = await validateImageFile(tooBig);
    assert.equal(valid, false);
    assert.match(error, /büyük/);
  });

  test("gerçek JPEG imzasına sahip dosya kabul edilir", async () => {
    const { valid, error } = await validateImageFile(fileFromBytes(JPEG_HEADER));
    assert.equal(valid, true);
    assert.equal(error, null);
  });

  test("gerçek PNG imzasına sahip dosya kabul edilir", async () => {
    const { valid } = await validateImageFile(fileFromBytes(PNG_HEADER));
    assert.equal(valid, true);
  });

  test("gerçek GIF imzasına sahip dosya kabul edilir", async () => {
    const { valid } = await validateImageFile(fileFromBytes(GIF_HEADER));
    assert.equal(valid, true);
  });

  test("gerçek WEBP (RIFF) imzasına sahip dosya kabul edilir", async () => {
    const { valid } = await validateImageFile(fileFromBytes(WEBP_HEADER));
    assert.equal(valid, true);
  });

  test("uzantısı .jpg olsa da gerçek imza görsel değilse reddedilir (asıl güvenlik kontrolü)", async () => {
    const disguised = fileFromBytes(NOT_AN_IMAGE, "kesinlikle-resim.jpg", "image/jpeg");
    const { valid, error } = await validateImageFile(disguised);
    assert.equal(valid, false);
    assert.match(error, /geçerli bir görsel/);
  });

  test("PDF dosyası (yanlış uzantı ile de olsa) görsel doğrulamasından geçmez", async () => {
    const { valid } = await validateImageFile(fileFromBytes(PDF_HEADER, "aslinda.jpg"));
    assert.equal(valid, false);
  });

  test("özel maxSizeMB parametresi kullanılır", async () => {
    const file = { name: "x.jpg", size: 2 * 1024 * 1024, slice: () => fileFromBytes(JPEG_HEADER) };
    const { valid, error } = await validateImageFile(file, { maxSizeMB: 1 });
    assert.equal(valid, false);
    assert.match(error, /Maksimum 1MB/);
  });
});

describe("validatePdfFile", () => {
  test("dosya verilmezse geçersiz sayılır", async () => {
    const { valid } = await validatePdfFile(null);
    assert.equal(valid, false);
  });

  test("gerçek PDF imzasına sahip dosya kabul edilir", async () => {
    const { valid, error } = await validatePdfFile(fileFromBytes(PDF_HEADER));
    assert.equal(valid, true);
    assert.equal(error, null);
  });

  test("PDF olmayan bir dosya (ör. JPEG) reddedilir", async () => {
    const { valid, error } = await validatePdfFile(fileFromBytes(JPEG_HEADER, "sahte.pdf"));
    assert.equal(valid, false);
    assert.match(error, /geçerli bir PDF/);
  });

  test("MAX_PDF_SIZE_MB'ı aşan dosya reddedilir", async () => {
    const tooBig = { name: "x.pdf", size: (MAX_PDF_SIZE_MB + 1) * 1024 * 1024, slice: () => fileFromBytes(PDF_HEADER) };
    const { valid, error } = await validatePdfFile(tooBig);
    assert.equal(valid, false);
    assert.match(error, /büyük/);
  });
});
