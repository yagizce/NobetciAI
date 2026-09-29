// AI_ROADMAP.md → "Toplu veri içe aktarma" maddesinin karşılığı. utils/exportCsv.js'in
// TERSİ: aynı formatı (noktalı virgül ayırıcı — Türkçe Excel uyumluluğu, tırnak içinde
// kaçırma, UTF-8 BOM) okur. Bilinçli tasarım: kullanıcı bir listeyi export edip Excel'de
// düzenleyip GERİ yükleyebilsin diye tam round-trip uyumlu.

/**
 * Basit ama sağlam bir CSV ayrıştırıcı — tırnak içinde noktalı virgül/satır sonu
 * içeren hücreleri doğru işler (RFC 4180'in noktalı virgül ayırıcılı hâli).
 * @param {string} text - CSV dosya içeriği (BOM'lu veya BOM'suz)
 * @returns {string[][]} satır dizisi (ilk satır genelde başlıktır, çağıran taraf ayırır)
 */
export function parseCsv(text) {
  const clean = String(text || "").replace(/^\uFEFF/, ""); // BOM varsa kaldır
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const next = clean[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') { field += '"'; i++; }
      else if (char === '"') { inQuotes = false; }
      else { field += char; }
      continue;
    }

    if (char === '"') { inQuotes = true; }
    else if (char === ";") { row.push(field); field = ""; }
    else if (char === "\r") { /* \r\n'in \r kısmı görmezden gelinir, \n satırı bitirir */ }
    else if (char === "\n") { row.push(field); field = ""; rows.push(row); row = []; }
    else { field += char; }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }

  // Tamamen boş satırları (örn. dosya sonundaki fazladan boş satır) at.
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

/**
 * parseCsv çıktısını (ilk satır başlık) nesne dizisine çevirir — anahtar olarak
 * başlık metnini kullanır, böylece sütun SIRASI değil başlık ADI eşleştirilir
 * (kullanıcı sütunları yeniden sıralasa bile çalışır).
 * @param {string[][]} rows
 * @returns {Array<Record<string,string>>}
 */
export function rowsToObjects(rows) {
  if (rows.length === 0) return [];
  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map((h) => h.trim());
  return dataRows.map((row) => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (row[i] ?? "").trim(); });
    return obj;
  });
}
