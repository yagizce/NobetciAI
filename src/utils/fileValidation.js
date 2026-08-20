// fileValidation — Güvenlik Sprinti: `accept="image/*"` yalnızca tarayıcı DOSYA SEÇİCİSİNE
// bir ipucudur, gerçek bir güvenlik kontrolü DEĞİLDİR — kullanıcı "Tüm Dosyalar"a geçip
// istediği herhangi bir dosyayı seçebilir, veya dosya uzantısı değiştirilmiş olabilir.
// Bu dosya iki gerçek kontrol sağlar: (1) boyut sınırı, (2) dosyanın ilk birkaç baytına
// bakıp GERÇEKTEN bilinen bir görsel formatı olup olmadığını doğrulama (magic bytes).
//
// BİLİNÇLİ SINIRLAMA: Bu, kötü niyetli/bozuk dosya içeriğini (örn. görselin içine
// gömülü exploit) TESPİT ETMEZ — yalnızca dosyanın gerçekten iddia ettiği formatta
// olduğunu doğrular. Uygulama zaten `dangerouslySetInnerHTML` kullanmıyor (SVG XSS
// riski bu yüzden düşük) ve görseller yalnızca `<img src="data:...">` ile render
// ediliyor, hiçbir yerde ham markup olarak basılmıyor.

export const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

// Bilinen görsel formatlarının dosya başındaki imza (magic number) baytları.
const IMAGE_SIGNATURES = [
  { format: "JPEG", bytes: [0xff, 0xd8, 0xff] },
  { format: "PNG", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { format: "GIF", bytes: [0x47, 0x49, 0x46, 0x38] },
  { format: "WEBP", bytes: [0x52, 0x49, 0x46, 0x46] }, // "RIFF" — WebP RIFF konteynerinin başı
];

// PDF, AI proxy'ye base64 + JSON gövdesiyle gönderilir. 5 MiB ham dosya yaklaşık
// 6.67 MiB base64 olur; istem ve JSON zarfı için API'nin 8 MiB sınırında güvenli pay bırakır.
export const MAX_PDF_SIZE_MB = 5;
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46]; // "%PDF"

function readFirstBytes(file, count) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result));
    reader.onerror = () => reject(new Error("Dosya okunamadı"));
    reader.readAsArrayBuffer(file.slice(0, count));
  });
}

function matchesSignature(bytes, signature) {
  return signature.every((b, i) => bytes[i] === b);
}

/**
 * Bir görsel dosyasını boyut + gerçek format imzası açısından doğrular.
 * @param {File} file
 * @param {{ maxSizeMB?: number }} [options]
 * @returns {Promise<{ valid: boolean, error: string|null }>}
 */
export async function validateImageFile(file, { maxSizeMB = MAX_IMAGE_SIZE_MB } = {}) {
  if (!file) return { valid: false, error: "Dosya seçilmedi." };

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: `Dosya çok büyük (${(file.size / 1024 / 1024).toFixed(1)}MB). Maksimum ${maxSizeMB}MB olmalı.` };
  }
  if (file.size === 0) {
    return { valid: false, error: "Dosya boş görünüyor." };
  }

  let header;
  try {
    header = await readFirstBytes(file, 12);
  } catch {
    return { valid: false, error: "Dosya okunamadı, tekrar deneyin." };
  }

  const isKnownImage = IMAGE_SIGNATURES.some((sig) => matchesSignature(header, sig.bytes));
  if (!isKnownImage) {
    return { valid: false, error: "Bu dosya geçerli bir görsel formatında değil (JPEG/PNG/GIF/WEBP olmalı)." };
  }

  return { valid: true, error: null };
}

/**
 * Bir PDF dosyasını boyut + gerçek format imzası açısından doğrular. Mevzuat/yönetmelik
 * yükleme özelliği (AI'dan çoklu önlem önerisi) için kullanılır.
 * @param {File} file
 * @param {{ maxSizeMB?: number }} [options]
 * @returns {Promise<{ valid: boolean, error: string|null }>}
 */
export async function validatePdfFile(file, { maxSizeMB = MAX_PDF_SIZE_MB } = {}) {
  if (!file) return { valid: false, error: "Dosya seçilmedi." };

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: `Dosya çok büyük (${(file.size / 1024 / 1024).toFixed(1)}MB). Maksimum ${maxSizeMB}MB olmalı.` };
  }
  if (file.size === 0) {
    return { valid: false, error: "Dosya boş görünüyor." };
  }

  let header;
  try {
    header = await readFirstBytes(file, 8);
  } catch {
    return { valid: false, error: "Dosya okunamadı, tekrar deneyin." };
  }

  if (!matchesSignature(header, PDF_SIGNATURE)) {
    return { valid: false, error: "Bu dosya geçerli bir PDF değil." };
  }

  return { valid: true, error: null };
}
