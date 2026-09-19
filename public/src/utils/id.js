// Yeni kayıtlar için tek ID üretim noktası.
// Mevcut numeric/string id'ler migration ile değiştirilmez; IndexedDB ve eski yedeklerle
// geriye dönük uyumluluk korunur. Yeni kayıtlar UUID v4 biçiminde string id kullanır.

function randomHex(byteCount) {
  const bytes = new Uint8Array(byteCount);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

export function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();

  const bytes = randomHex(16);
  // RFC 4122 UUID v4 bitleri.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Mevcut id'yi korur; yalnızca yeni/eksik kayıt için UUID üretir.
 * @param {object} record
 * @returns {string|number}
 */
export function ensureId(record) {
  return record?.id ?? createId();
}
