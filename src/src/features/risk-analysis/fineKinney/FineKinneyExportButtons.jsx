import { useState } from "react";
import { FileText, AlertTriangle } from "../../../components/icons/index.jsx";
import { useCompanyOrgLists } from "./useCompanyOrgLists.js";
import { buildFineKinneyPdfRows } from "./fineKinneyExport.js";
import { getFineKinneyRiskLevel } from "../../../constants/fineKinney.js";
import { openPrintWindow, escapeHtml } from "../../../utils/printWindow.js";
import { todayLabel } from "../../../utils/dateUtils.js";
import { getPrimaryCompany } from "../../../services/companyService.js";

// PDF'e ÖZEL, daha DOYGUN renk paleti — uygulama genelindeki (rozet/form) açık tonlu
// palet küçük UI elemanları için uygun ama basılı/taranan bir belgede yeterince
// göze çarpmıyordu (müşteri geri bildirimi). Paylaşılan RISK_LEVEL_PALETTE'e
// dokunulmadı (rozetler/heat map hâlâ o paleti kullanıyor) — bu, yalnızca PDF
// hücrelerinde kullanılan bağımsız, daha güçlü bir renk seti.
const PDF_RISK_COLORS = {
  low: { bg: "#3FA84C", text: "#FFFFFF" },
  possible: { bg: "#2E86D6", text: "#FFFFFF" },
  important: { bg: "#E0B400", text: "#3A2E00" },
  high: { bg: "#E8791A", text: "#FFFFFF" },
  veryHigh: { bg: "#D33036", text: "#FFFFFF" },
};

/**
 * AI_ROADMAP.md → Export/Raporlama. `entries`, o an ekranda görünen (filtrelenmiş)
 * listedir — kullanıcı bir filtre uyguladıysa yalnızca o alt küme export edilir, bu
 * bilinçli bir davranıştır (ne görüyorsa onu indirir). "Excel" export'u artık GERÇEK
 * bir .xlsx dosyası (ExcelJS ile, gerçek renkli hücreler — bkz. fineKinneyExcelWorkbook.js);
 * "PDF" tarayıcının yazdırma diyaloğunu kullanır (bkz. utils/printWindow.js).
 *
 * Sprint: PDF, Excel'in 15 sütunlu tablosundan BİLİNÇLİ olarak AYRILDI — müşteri
 * talebiyle PDF artık sade, 5 sütunlu (No/Tehlike/Risk/Puan/Alınacak Önlem), her
 * kayıt TEK SATIRDA. "Alınacak Önlemler" metni AI'dan gelen uzun önerilerle
 * büyüyebildiği için geniş bir sütuna ihtiyaç duyuyor — çok sütunlu tablo bu
 * metinle birlikte dağınık görünüyordu. Excel'in kendi 15 sütunlu detaylı tablosu
 * ayrı kaldı, orada tüm alanlar duruyor.
 *
 * @param {{ theme: object, entries: object[] }} props
 */
export default function FineKinneyExportButtons({ theme, entries }) {
  const { departments } = useCompanyOrgLists();
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [excelLoading, setExcelLoading] = useState(false);
  const [excelError, setExcelError] = useState(null);
  const [pdfPopupBlocked, setPdfPopupBlocked] = useState(false);

  async function handleExcelExport() {
    setExcelError(null);
    setExcelLoading(true);
    let company = null;
    try {
      company = await getPrimaryCompany();
    } catch {
      setExcelError("Firma bilgileri alınamadı, dosya firma bilgisi olmadan oluşturuldu.");
    }

    try {
      // PERF: ExcelJS büyük bir kütüphane (~500KB+) ve yalnızca bu buton tıklanınca
      // gerekiyor — PDF export'u hiç kullanmıyor. Statik import olsaydı, ExcelJS Risk
      // Analizi sayfasının ana chunk'ına gömülür, sayfa AÇILIR AÇILMAZ indirilirdi
      // (kullanıcı Excel'e hiç tıklamasa bile). Dinamik import ile Vite bunu ayrı bir
      // chunk'a böler, yalnızca "Excel" butonuna basıldığında indirilir.
      const { buildFineKinneyWorkbookBuffer } = await import("./fineKinneyExcelWorkbook.js");
      const buffer = await buildFineKinneyWorkbookBuffer({ company, entries, departments });
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fine-kinney-${todayLabel().replace(/\./g, "-")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      // UX FIX (hata yönetimi cilası): önceden ham `err.message` (ExcelJS/tarayıcı
      // kaynaklı, teknik/İngilizce olabilir — örn. "out of memory") doğrudan kullanıcıya
      // gösteriliyordu. Teknik detay konsola taşındı, kullanıcıya sabit ve anlaşılır bir
      // Türkçe mesaj gösteriliyor.
      console.error("Excel dosyası oluşturulamadı:", err);
      setExcelError("Excel dosyası oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setExcelLoading(false);
    }
  }

  async function handlePdfExport() {
    setPdfError(null);
    setPdfPopupBlocked(false);
    setPdfLoading(true);
    let company = null;
    try {
      company = await getPrimaryCompany();
    } catch {
      setPdfError("Firma bilgileri alınamadı, rapor firma bilgisi olmadan oluşturuldu.");
    }
    setPdfLoading(false);

    const pdfRows = buildFineKinneyPdfRows(entries);
    const style = `<style>
      @page { size: A4 portrait; margin: 14mm; }
      body { font-family: Arial, sans-serif; color: #2b2822; }
      h1 { font-size: 18px; margin: 0 0 4px; }
      .meta { font-size: 11px; color: #666; margin-bottom: 8px; }
      .top-row { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 14px; }
      .company-box { flex: 1; border: 1px solid #ccc; border-radius: 6px; padding: 8px 12px; font-size: 11px; background: #faf9f5; }
      .company-box b { font-size: 13px; }
      .legend-box { border: 1px solid #ccc; border-radius: 6px; padding: 6px 8px; font-size: 9.5px; }
      .legend-box b { font-size: 10.5px; display: block; margin-bottom: 3px; }
      .legend-row { display: flex; align-items: center; gap: 5px; white-space: nowrap; padding: 1px 0; }
      .legend-swatch { width: 10px; height: 10px; border-radius: 2px; display: inline-block; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed; }
      th, td { border: 1px solid #ccc; padding: 6px 7px; text-align: left; vertical-align: top; word-wrap: break-word; }
      th { background: #f3f1ea; }
      col.no { width: 6%; }
      col.hazard { width: 20%; }
      col.risk { width: 18%; }
      col.score { width: 10%; }
      col.action { width: 46%; }
      td.score-cell { font-weight: 700; text-align: center; }
    </style>`;

    const companyBlock = company
      ? `<div class="company-box">
          <b>${escapeHtml(company.name || "Firma")}</b><br/>
          ${company.sector ? escapeHtml(company.sector) + " • " : ""}${company.taxNumber ? "VKN: " + escapeHtml(company.taxNumber) + " • " : ""}${company.address ? escapeHtml(company.address) : ""}
        </div>`
      : "";

    // Sprint: "puanlar neyi gösteriyor" sorusu kalmasın diye — sağ üstte kompakt bir
    // renk lejandı. Referans doküman (TCDD Alsancak Gar örneği) ile aynı yerleşim:
    // firma bilgisi solda, risk renk açıklaması sağda, yan yana.
    const legendItems = [
      { level: "low", label: "Düşük (<20)" },
      { level: "possible", label: "Olası (20-70)" },
      { level: "important", label: "Önemli (70-200)" },
      { level: "high", label: "Yüksek (200-400)" },
      { level: "veryHigh", label: "Çok Yüksek (≥400)" },
    ];
    const legendBlock = `<div class="legend-box">
      <b>Puan Renk Açıklaması</b>
      ${legendItems.map((item) => `<div class="legend-row"><span class="legend-swatch" style="background:${PDF_RISK_COLORS[item.level].bg};"></span>${escapeHtml(item.label)}</div>`).join("")}
    </div>`;

    const body = `
      <h1>Fine-Kinney Risk Değerlendirmesi</h1>
      <div class="top-row">${companyBlock}${legendBlock}</div>
      <p class="meta">Oluşturulma: ${escapeHtml(todayLabel())} — ${entries.length} kayıt</p>
      <table>
        <colgroup>
          <col class="no" /><col class="hazard" /><col class="risk" /><col class="score" /><col class="action" />
        </colgroup>
        <thead><tr><th>No</th><th>Tehlike</th><th>Risk</th><th>Puan</th><th>Alınacak Önlem</th></tr></thead>
        <tbody>${pdfRows.map((r) => {
          const level = getFineKinneyRiskLevel(r.score);
          const colors = PDF_RISK_COLORS[level.key];
          return `<tr>
            <td>${r.no}</td>
            <td>${escapeHtml(r.hazard)}</td>
            <td>${escapeHtml(r.risk)}</td>
            <td class="score-cell" style="background:${colors.bg};color:${colors.text};">${r.score}</td>
            <td>${escapeHtml(r.action)}</td>
          </tr>`;
        }).join("")}</tbody>
      </table>`;
    // UX FIX (hata yönetimi cilası): openPrintWindow popup engellendiğinde `false`
    // döner ama bu değer önceden hiç okunmuyordu — kullanıcı butona basıyor, hiçbir şey
    // olmuyor, hiçbir geri bildirim yok (Eğitim modülündeki aynı desenle — bkz.
    // CoursePlayer.jsx handlePrintCertificate — tutarlı hale getirildi).
    const opened = openPrintWindow("Fine-Kinney Risk Değerlendirmesi", body, style);
    setPdfPopupBlocked(!opened);
  }

  const disabled = entries.length === 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <button
          onClick={handleExcelExport}
          disabled={disabled || excelLoading}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full disabled:opacity-40"
          style={{ background: theme.surfaceAlt, color: theme.accent, border: `1px solid ${theme.accent}` }}
        >
          <FileText style={{ fontSize: "13px" }} /> {excelLoading ? "Hazırlanıyor..." : "Excel"}
        </button>
        <button
          onClick={handlePdfExport}
          disabled={disabled || pdfLoading}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full disabled:opacity-40"
          style={{ background: theme.surfaceAlt, color: theme.accent, border: `1px solid ${theme.accent}` }}
        >
          <FileText style={{ fontSize: "13px" }} /> {pdfLoading ? "Hazırlanıyor..." : "PDF"}
        </button>
      </div>
      {pdfError && (
        <div className="flex items-center gap-1.5 text-[10.5px]" style={{ color: theme.warnText }}>
          <AlertTriangle style={{ fontSize: "11px" }} /> {pdfError}
        </div>
      )}
      {pdfPopupBlocked && (
        <div className="flex items-center gap-1.5 text-[10.5px]" style={{ color: theme.warnText }}>
          <AlertTriangle style={{ fontSize: "11px" }} /> Tarayıcınız yeni pencereyi engelledi. Lütfen bu site için pop-up izni verip tekrar deneyin.
        </div>
      )}
      {excelError && (
        <div className="flex items-center gap-1.5 text-[10.5px]" style={{ color: theme.warnText }}>
          <AlertTriangle style={{ fontSize: "11px" }} /> {excelError}
        </div>
      )}
    </div>
  );
}
