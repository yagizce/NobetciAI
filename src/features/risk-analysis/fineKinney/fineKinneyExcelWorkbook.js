import ExcelJS from "exceljs";
import { getFineKinneyRiskLevel, STATUS_OPTIONS, getPriorityMeta, PROBABILITY_SCALE, FREQUENCY_SCALE, SEVERITY_SCALE } from "../../../constants/fineKinney.js";
import { todayLabel } from "../../../utils/dateUtils.js";

// Sprint: Gerçek renkli .xlsx üretimi. BİLİNÇLİ KÜTÜPHANE SEÇİMİ: SheetJS'in (xlsx)
// ücretsiz/community sürümü hücre renklendirme (fill/font stilini YAZMA) YAPAMIYOR —
// bu, ücretli Pro sürüme özel bir özellik. ExcelJS bunu ücretsiz ve MIT lisansıyla
// destekliyor, tamamen tarayıcıda çalışıyor (backend/sunucu gerekmiyor). Kullanıcı
// onayıyla eklendi (package.json → "exceljs").
const XLSX_RISK_COLORS = {
  low: { argb: "FF3FA84C", text: "FFFFFFFF" },
  possible: { argb: "FF2E86D6", text: "FFFFFFFF" },
  important: { argb: "FFE0B400", text: "FF3A2E00" },
  high: { argb: "FFE8791A", text: "FFFFFFFF" },
  veryHigh: { argb: "FFD33036", text: "FFFFFFFF" },
};

const HEADER_FILL_ARGB = "FFF3F1EA";
const BORDER_THIN = { style: "thin", color: { argb: "FFCCCCCC" } };
const BORDER_MEDIUM = { style: "medium", color: { argb: "FF2B2822" } };
const ALL_THIN_BORDERS = { top: BORDER_THIN, left: BORDER_THIN, bottom: BORDER_THIN, right: BORDER_THIN };
const SMALL_FONT_SIZE = 8; // Sprint: "sağ üstte topla, küçültebiliyorsan küçült" — 9'dan 8'e düşürüldü

function scaleLabel(entry) {
  return entry.label.replace(/^[\d.]+\s*—\s*/, ""); // "0.1 — Neredeyse imkansız" → "Neredeyse imkansız"
}

function setCell(sheet, ref, value, { bold = false, fillArgb = null, textArgb = null, wrap = false, size = null } = {}) {
  const cell = sheet.getCell(ref);
  cell.value = value;
  cell.border = ALL_THIN_BORDERS;
  if (bold || textArgb || size) cell.font = { bold, size: size || undefined, color: textArgb ? { argb: textArgb } : undefined };
  if (fillArgb) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillArgb } };
  if (wrap) cell.alignment = { wrapText: true, vertical: "top" };
  return cell;
}

/**
 * Bir hücre dikdörtgeninin (startRow:endRow, startCol:endCol) DIŞ ÇERÇEVESİNE kalın
 * kenarlık uygular — "kalın tablo, belirgin dursun" talebi için. İç hücre kenarlıkları
 * (ALL_THIN_BORDERS, setCell'den) korunur, yalnızca dış sınır kalınlaştırılır.
 */
function applyOuterBorder(sheet, startRow, endRow, startCol, endCol) {
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const cell = sheet.getCell(row, col);
      const existing = cell.border || {};
      cell.border = {
        top: row === startRow ? BORDER_MEDIUM : existing.top,
        bottom: row === endRow ? BORDER_MEDIUM : existing.bottom,
        left: col === startCol ? BORDER_MEDIUM : existing.left,
        right: col === endCol ? BORDER_MEDIUM : existing.right,
      };
    }
  }
}

/**
 * Sprint: Gerçek, renkli .xlsx workbook'u oluşturur (ExcelJS). Yerleşim: firma bilgisi
 * solda (A-B), risk renk lejandı + O/F/Ş skala tabloları SAĞ ÜSTTE, firma bilgisiyle
 * AYNI SATIR ARALIĞINDA yan yana, küçük fontla. Her skala tablosu + lejand, "kalın
 * tablo, belirgin dursun" talebiyle DIŞ ÇERÇEVESİ kalınlaştırılmış ayrı bir kutu
 * olarak görünüyor (applyOuterBorder).
 *
 * BİLİNÇLİ SINIRLAMA: Excel'de tek bir sütun genişliği tüm satırlarda geçerlidir
 * (satır bazlı değişmez) — üstteki bilgi bloğu ile alttaki veri tablosu AYNI sütun
 * genişliklerini paylaşır. Üst bloklardaki uzun tanım metinleri, o satırlardaki
 * komşu hücreler BOŞ olduğu için (ana tablo verisi daha aşağıda başlıyor) görsel
 * olarak sorunsuz taşıyor.
 *
 * @param {{ company: object|null, entries: object[], departments: object[] }} args
 * @returns {Promise<ArrayBuffer>}
 */
export async function buildFineKinneyWorkbookBuffer({ company, entries, departments }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Nöbetçi İSG";
  workbook.created = new Date();

  const TABLE_HEADER_ROW = 16;
  const sheet = workbook.addWorksheet("Fine-Kinney", { views: [{ state: "frozen", ySplit: TABLE_HEADER_ROW }] });

  const COLUMN_WIDTHS = [10, 26, 20, 20, 16, 9, 11, 9, 8, 14, 9, 10, 11, 45, 12];
  COLUMN_WIDTHS.forEach((w, i) => { sheet.getColumn(i + 1).width = w; });

  // ── Başlık ──────────────────────────────────────────────────────────────
  sheet.mergeCells("A1:O1");
  sheet.getCell("A1").value = "Fine-Kinney Risk Değerlendirmesi";
  sheet.getCell("A1").font = { bold: true, size: 16 };

  // ── Firma bilgisi (sol, A-B) ───────────────────────────────────────────
  const companyRows = [
    ["İşyerinin Unvanı/Bölge Adı/İl", company?.name || ""],
    ["İşyeri Adresi", company?.address || ""],
    ["Risk Değerlendirme Tarihi", todayLabel()],
    ["Risk Değerlendirme Yenileme Tarihi", ""],
    ["Risk Değerlendirme Metodu", "FINE-KINNEY"],
    ["SGK Sicil/Destis No", ""],
    ["İşveren/İşveren Vekili", ""],
    ["İş Güvenliği Uzmanı/Belge No", ""],
    ["İşyeri Hekimi/Belge No", ""],
    ["Çalışan Temsilcisi/leri", ""],
    ["Destek Elemanları", ""],
    ["Diğer Ekip Üyeleri", ""],
  ];
  companyRows.forEach(([label, value], i) => {
    const row = 3 + i;
    setCell(sheet, `A${row}`, label, { bold: true, size: SMALL_FONT_SIZE });
    setCell(sheet, `B${row}`, value, { size: SMALL_FONT_SIZE });
  });

  // ── Sağ üstte kompakt küme: Risk lejandı + O/F/Ş skalaları, yan yana ────
  // Her biri "kalın tablo, belirgin dursun" talebiyle dış çerçevesi kalınlaştırılmış
  // ayrı bir kutu (applyOuterBorder). Hepsi firma bilgisiyle aynı satır aralığında.
  setCell(sheet, "D3", "RİSK DERECESİ", { bold: true, size: SMALL_FONT_SIZE, fillArgb: HEADER_FILL_ARGB });
  setCell(sheet, "E3", "", { fillArgb: HEADER_FILL_ARGB });
  setCell(sheet, "D4", "Aralık", { bold: true, fillArgb: HEADER_FILL_ARGB, size: SMALL_FONT_SIZE });
  setCell(sheet, "E4", "Seviye", { bold: true, fillArgb: HEADER_FILL_ARGB, size: SMALL_FONT_SIZE });
  const legendRows = [
    ["Risk < 20", "Düşük Risk", XLSX_RISK_COLORS.low],
    ["20 ≤ Risk < 70", "Olası Risk", XLSX_RISK_COLORS.possible],
    ["70 ≤ Risk < 200", "Önemli Risk", XLSX_RISK_COLORS.important],
    ["200 ≤ Risk < 400", "Yüksek Risk", XLSX_RISK_COLORS.high],
    ["Risk ≥ 400", "Çok Yüksek Risk", XLSX_RISK_COLORS.veryHigh],
  ];
  legendRows.forEach(([range, label, colors], i) => {
    const row = 5 + i;
    setCell(sheet, `D${row}`, range, { fillArgb: colors.argb, textArgb: colors.text, bold: true, size: SMALL_FONT_SIZE });
    setCell(sheet, `E${row}`, label, { fillArgb: colors.argb, textArgb: colors.text, bold: true, size: SMALL_FONT_SIZE });
  });
  applyOuterBorder(sheet, 3, 9, 4, 5); // D3:E9

  // O/F/Ş skala tabloları — BİLİNÇLİ TERCİH: değerler görselden kopyalanmadı,
  // uygulamanın kendi sabitlerinden (PROBABILITY_SCALE vb.) üretildi — form ile
  // export'un sapması imkansız, tek kaynak.
  function writeCompactScale(colValue, colDef, title, scale) {
    setCell(sheet, `${colValue}3`, title, { bold: true, size: SMALL_FONT_SIZE, fillArgb: HEADER_FILL_ARGB });
    setCell(sheet, `${colDef}3`, "", { fillArgb: HEADER_FILL_ARGB });
    setCell(sheet, `${colValue}4`, "Değer", { bold: true, fillArgb: HEADER_FILL_ARGB, size: SMALL_FONT_SIZE });
    setCell(sheet, `${colDef}4`, "Tanım", { bold: true, fillArgb: HEADER_FILL_ARGB, size: SMALL_FONT_SIZE });
    scale.forEach((entry, i) => {
      const row = 5 + i;
      setCell(sheet, `${colValue}${row}`, entry.value, { size: SMALL_FONT_SIZE });
      setCell(sheet, `${colDef}${row}`, scaleLabel(entry), { size: SMALL_FONT_SIZE });
    });
    const colValueIdx = sheet.getColumn(colValue).number;
    const colDefIdx = sheet.getColumn(colDef).number;
    applyOuterBorder(sheet, 3, 4 + scale.length, colValueIdx, colDefIdx);
  }
  writeCompactScale("G", "H", "OLASILIK (O)", PROBABILITY_SCALE);
  writeCompactScale("J", "K", "SIKLIK (F)", FREQUENCY_SCALE);
  writeCompactScale("M", "N", "ŞİDDET (Ş)", SEVERITY_SCALE);

  // ── Asıl Fine-Kinney tablosu (kompakt üst kümenin hemen altında) ────────
  const headers = [
    "Sıra No", "Tehlike", "Risk", "Etkilenenler", "Departman", "Olasılık", "Maruziyet", "Şiddet", "Skor",
    "Risk Seviyesi", "Öncelik", "Durum", "Tarih", "Alınacak Önlemler", "Termin",
  ];
  headers.forEach((h, i) => {
    setCell(sheet, sheet.getCell(TABLE_HEADER_ROW, i + 1).address, h, { bold: true, fillArgb: HEADER_FILL_ARGB });
  });

  const deptName = (id) => departments.find((d) => String(d.id) === String(id))?.name || "";
  const statusLabel = (value) => STATUS_OPTIONS.find((s) => s.value === value)?.label || value;

  entries.forEach((e, index) => {
    const rowNum = TABLE_HEADER_ROW + 1 + index;
    const level = getFineKinneyRiskLevel(e.score);
    const colors = XLSX_RISK_COLORS[level.key];
    const values = [
      index + 1, e.hazard, e.risk, e.affected || "", e.departmentId ? deptName(e.departmentId) : "",
      e.probability, e.frequency, e.severity, e.score, level.label,
      getPriorityMeta(e.priority).label, statusLabel(e.status), e.date || "", e.action || "", e.dueDate || "",
    ];
    values.forEach((val, colIndex) => {
      const isScoreCell = colIndex === 8 || colIndex === 9; // Skor, Risk Seviyesi
      setCell(sheet, sheet.getCell(rowNum, colIndex + 1).address, val, {
        fillArgb: isScoreCell ? colors.argb : null,
        textArgb: isScoreCell ? colors.text : null,
        bold: isScoreCell,
        wrap: colIndex === 13, // Alınacak Önlemler
      });
    });
    sheet.getRow(rowNum).height = 30;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}
