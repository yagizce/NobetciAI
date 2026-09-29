import { FileText } from "../../../components/icons/index.jsx";
import { downloadCsv } from "../../../utils/exportCsv.js";
import { openPrintWindow, escapeHtml } from "../../../utils/printWindow.js";
import { todayLabel } from "../../../utils/dateUtils.js";

/**
 * AI_ROADMAP.md → Export/Raporlama. `cards`, EmployerOverviewTab.jsx'te zaten
 * hesaplanmış özet metrik kartlarıdır ({label, value}[]) — burada tekrar hesaplama
 * yapılmaz, olduğu gibi dışa aktarılır. "Excel" export'u CSV (sıfır yeni bağımlılık),
 * "PDF" tarayıcının yazdırma diyaloğu — bkz. utils/exportCsv.js, utils/printWindow.js.
 *
 * FineKinneyExportButtons.jsx ile bilinçli olarak AYRI tutuldu (bkz. dosya başındaki
 * eski not) — ikisi farklı veri şekilleriyle çalışıyor (liste/tablo vs. özet
 * kartları); paylaşılan kısım (CSV/print altyapısı) zaten utils/'e çıkarılmış durumda.
 *
 * @param {{ theme: object, cards: Array<{label: string, value: string|number}> }} props
 */
export default function DashboardExportButtons({ theme, cards }) {
  function handleExcelExport() {
    const rows = cards.map((c) => [c.label, c.value]);
    downloadCsv(`dashboard-ozet-${todayLabel().replace(/\./g, "-")}.csv`, ["Metrik", "Değer"], rows);
  }

  function handlePdfExport() {
    const style = `<style>
      @page { size: A4 portrait; margin: 16mm; }
      body { font-family: Arial, sans-serif; color: #2b2822; }
      h1 { font-size: 18px; margin: 0 0 4px; }
      .meta { font-size: 11px; color: #666; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th, td { border: 1px solid #ccc; padding: 8px 10px; text-align: left; }
      th { background: #f3f1ea; width: 60%; }
    </style>`;
    const body = `
      <h1>Yönetici Özeti</h1>
      <p class="meta">Oluşturulma: ${escapeHtml(todayLabel())}</p>
      <table>
        <tbody>${cards.map((c) => `<tr><th>${escapeHtml(c.label)}</th><td>${escapeHtml(c.value)}</td></tr>`).join("")}</tbody>
      </table>`;
    openPrintWindow("Yönetici Özeti", body, style);
  }

  const disabled = !cards || cards.length === 0;

  return (
    <div className="flex gap-2">
      <button
        onClick={handlePdfExport}
        disabled={disabled}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full disabled:opacity-40"
        style={{ background: theme.surfaceAlt, color: theme.accent, border: `1px solid ${theme.accent}` }}
      >
        <FileText style={{ fontSize: "13px" }} /> PDF
      </button>
      <button
        onClick={handleExcelExport}
        disabled={disabled}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full disabled:opacity-40"
        style={{ background: theme.surfaceAlt, color: theme.accent, border: `1px solid ${theme.accent}` }}
      >
        <FileText style={{ fontSize: "13px" }} /> Excel
      </button>
    </div>
  );
}
