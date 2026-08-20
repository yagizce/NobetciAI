import Sparkline from "../../../components/Sparkline.jsx";
import MiniBarChart from "../../../components/MiniBarChart.jsx";

/**
 * @param {{ theme: object, metrics: object }} props
 */
export default function TrendsPanel({ theme, metrics }) {
  // Mock — gerçek zaman-serisi kaydı yok (uygulama yeni, geçmiş ay verisi birikmedi).
  // Mevcut oranlar etrafında temsili bir 6 dönemlik seyir üretiliyor. Gerçek backend/tarih
  // bazlı sorgulama eklenince bu diziler gerçek geçmiş verisiyle değiştirilecek.
  const monthlyRiskCounts = [
    { label: "Oca", value: Math.max(0, metrics.totalRisks - 5) },
    { label: "Şub", value: Math.max(0, metrics.totalRisks - 4) },
    { label: "Mar", value: Math.max(0, metrics.totalRisks - 3) },
    { label: "Nis", value: Math.max(0, metrics.totalRisks - 2) },
    { label: "May", value: Math.max(0, metrics.totalRisks - 1) },
    { label: "Haz", value: metrics.totalRisks },
  ];

  const trendSeries = (current) => [
    Math.max(0, current - 18), Math.max(0, current - 12), Math.max(0, current - 14),
    Math.max(0, current - 6), Math.max(0, current - 3), current,
  ];

  const TREND_ROWS = [
    { label: "Risk Kapanma Oranı", value: metrics.riskClosureRate },
    { label: "Eğitim Tamamlama Oranı", value: metrics.trainingCompletionRate },
    { label: "Periyodik Kontrol Tamamlanma Oranı", value: metrics.periodicCompletionRate },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border px-4 py-3" style={{ borderColor: theme.border, background: theme.surface }}>
        <p className="text-xs font-semibold mb-1" style={{ color: theme.textPrimary }}>Aylık Risk Sayısı</p>
        <p className="text-[10.5px] mb-2" style={{ color: theme.textFaint }}>Temsili — gerçek geçmiş veri birikince güncellenecek</p>
        <MiniBarChart data={monthlyRiskCounts} theme={theme} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {TREND_ROWS.map((row) => (
          <div key={row.label} className="rounded-xl border px-4 py-3" style={{ borderColor: theme.border, background: theme.surface }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: theme.textPrimary }}>{row.label}</span>
              <span className="text-sm font-bold" style={{ color: theme.textPrimary }}>%{row.value}</span>
            </div>
            <Sparkline data={trendSeries(row.value)} theme={theme} height={40} />
          </div>
        ))}
      </div>
    </div>
  );
}
