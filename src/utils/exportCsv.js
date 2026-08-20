// AI_ROADMAP.md → Export/Raporlama: "Excel" export'u aslında CSV — sıfır yeni bağımlılık
// (xlsx kütüphanesi gerektirmez), Excel dosyayı doğrudan açabilir.
//
// İKİ TÜRKÇE'YE ÖZGÜ DETAY (yoksayılırsa Excel'de dosya bozuk/tek sütun görünür):
// 1. Ayırıcı olarak VİRGÜL değil NOKTALI VİRGÜL (;) kullanılıyor — Türkçe Windows/Excel
//    kurulumlarında ondalık ayıracı virgül olduğu için varsayılan CSV ayracı da noktalı
//    virgüldir; virgülle ayrılmış bir CSV, Türkçe Excel'de tek sütun halinde açılır.
// 2. UTF-8 BOM (\uFEFF) ekleniyor — BOM olmadan Excel, ş/ğ/ı/ç/ö/ü gibi karakterleri
//    bozuk gösterir (dosyayı ANSI sanır).
//
// GÜVENLİK: CSV/Formula Injection koruması (OWASP standart mitigasyonu). Bir hücre
// `=`, `+`, `-`, `@`, TAB veya CR ile BAŞLIYORSA, Excel/Google Sheets bunu bir FORMÜL
// olarak yorumlayabilir (örn. birisi "Ad Soyad" alanına `=CMD(...)` yazıp dosyayı Excel'de
// açan birinin makinesinde kod çalıştırmaya çalışabilir). Bu yüzden bu tür hücrelerin
// başına bir tek tırnak (') eklenir — Excel/Sheets bunu görünce hücreyi DÜZ METİN olarak
// gösterir, formül olarak ÇALIŞTIRMAZ. Yalnızca export ederken uygulanır (kullanıcının
// kendi ekranda gördüğü veri değişmez, yalnızca CSV dosyasındaki temsili).
const FORMULA_INJECTION_PREFIX = /^[=+\-@\t\r]/;

function sanitizeFormulaInjection(str) {
  return FORMULA_INJECTION_PREFIX.test(str) ? `'${str}` : str;
}

function escapeCsvCell(value) {
  const str = sanitizeFormulaInjection(String(value ?? ""));
  // Hücre ayırıcı (;), tırnak veya satır sonu içeriyorsa tırnak içine al ve
  // içindeki tırnakları ikiye katla (standart CSV kaçırma kuralı).
  if (/[";\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

/** @param {Array<Array<string|number>>} rows */
function joinCsvRows(rows) {
  return rows.map((row) => row.map(escapeCsvCell).join(";")).join("\r\n");
}

/**
 * @param {string[]} headers
 * @param {Array<Array<string|number>>} rows
 * @returns {string} CSV içeriği (BOM içermez — bkz. downloadCsv)
 */
export function buildCsv(headers, rows) {
  return joinCsvRows([headers, ...rows]);
}

/**
 * Sprint: Fine-Kinney export'unun başına sabit bir "firma bilgileri" alanı eklemek için —
 * AYRI BİR DOSYA DEĞİL, aynı CSV'nin en üstüne eklenen ek satırlar. Standart `buildCsv`'yi
 * (ve onu kullanan diğer tüm export'ları: CsvImportButton şablonu, Denetim Dosyası vb.)
 * DEĞİŞTİRMEZ — o fonksiyon aynen çalışmaya devam ediyor, bu YENİ, ayrı bir fonksiyon.
 * @param {Array<[string, string]>} headerBlockRows - [etiket, değer] çiftleri
 * @param {string[]} tableHeaders
 * @param {Array<Array<string|number>>} tableRows
 * @returns {string}
 */
export function buildCsvWithHeaderBlock(headerBlockRows, tableHeaders, tableRows) {
  const separatorRow = headerBlockRows.length > 0 ? [[""]] : [];
  return joinCsvRows([...headerBlockRows, ...separatorRow, tableHeaders, ...tableRows]);
}

function triggerCsvDownload(filename, content) {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Tarayıcıda bir CSV dosyası indirme işlemini tetikler. DOM'a bağımlı olduğu için
 * (Blob/URL.createObjectURL/document.createElement) doğrudan birim testi yazılmadı —
 * yalnızca saf `buildCsv` test edildi (diğer DOM-bağımlı dosyalarla tutarlı bir sınır).
 * @param {string} filename
 * @param {string[]} headers
 * @param {Array<Array<string|number>>} rows
 */
export function downloadCsv(filename, headers, rows) {
  triggerCsvDownload(filename, buildCsv(headers, rows));
}

/**
 * @param {string} filename
 * @param {Array<[string, string]>} headerBlockRows
 * @param {string[]} tableHeaders
 * @param {Array<Array<string|number>>} tableRows
 */
export function downloadCsvWithHeaderBlock(filename, headerBlockRows, tableHeaders, tableRows) {
  triggerCsvDownload(filename, buildCsvWithHeaderBlock(headerBlockRows, tableHeaders, tableRows));
}
