import Sparkline from "../../../components/Sparkline.jsx";
import { computeRiskClosureTrend } from "../../../utils/dashboardTrends.js";

function ProgressBar({ percent, theme, tone }) {
  const color = tone === "danger" ? theme.highRiskText : tone === "warning" ? theme.warnText : theme.successText;
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: theme.surfaceAlt }}>
      <div className="h-full rounded-full" style={{ width: `${Math.min(percent, 100)}%`, background: color }} />
    </div>
  );
}

/**
 * @param {{ theme: object, data: ReturnType<typeof import("./useEmployerDashboardData.js").useEmployerDashboardData> }} props
 */
export default function PerformancePanel({ theme, data }) {
  const { metrics } = data;

  // Sprint: artık gerçek veriden — her ay sonu için o ana kadar oluşturulan risklerin
  // kaçının kapatıldığı hesaplanıyor (bkz. utils/dashboardTrends.js → computeRiskClosureTrend).
  // Önceden burada mevcut orandan ofsetlerle üretilen sentetik ("temsili") bir dizi vardı.
  const trendData = computeRiskClosureTrend(data.fineKinneyEntries);

  const KPI_ROWS = [
    { label: "Risk Kapanma Oranı", percent: metrics.riskClosureRate, tone: metrics.riskClosureRate < 40 ? "danger" : metrics.riskClosureRate < 70 ? "warning" : "success" },
    { label: "Eğitim Tamamlama Oranı", percent: metrics.trainingCompletionRate, tone: metrics.trainingCompletionRate < 40 ? "danger" : metrics.trainingCompletionRate < 70 ? "warning" : "success" },
    { label: "Periyodik Kontrol Tamamlanma Oranı", percent: metrics.periodicCompletionRate, tone: metrics.periodicCompletionRate < 40 ? "danger" : metrics.periodicCompletionRate < 70 ? "warning" : "success" },
  ];

  return (
    <div>
      <p className="text-xs mb-4" style={{ color: theme.textFaint }}>
        Bu bölümdeki tüm oranlar ve trend grafiği gerçek servis verilerinden hesaplanıyor
        (Fine-Kinney, periyodik kontrol ve eğitim tamamlama kayıtları).
      </p>

      <div className="grid gap-3 mb-5">
        {KPI_ROWS.map((row) => (
          <div key={row.label} className="rounded-xl border px-4 py-3" style={{ borderColor: theme.border, background: theme.surface }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm" style={{ color: theme.textPrimary }}>{row.label}</span>
              <span className="text-sm font-bold" style={{ color: theme.textPrimary }}>%{row.percent}</span>
            </div>
            <ProgressBar percent={row.percent} theme={theme} tone={row.tone} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl p-4" style={{ background: theme.highRiskBg }}>
          <p className="text-xs" style={{ color: theme.textFaint }}>Kritik Risk Sayısı</p>
          <p className="text-2xl font-bold" style={{ color: theme.highRiskText }}>{metrics.criticalRisks}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: theme.surfaceAlt }}>
          <p className="text-xs" style={{ color: theme.textFaint }}>Toplam Risk Kaydı</p>
          <p className="text-2xl font-bold" style={{ color: theme.textPrimary }}>{data.fineKinneyEntries.length}</p>
        </div>
      </div>

      <div className="rounded-xl border px-4 py-3" style={{ borderColor: theme.border, background: theme.surface }}>
        <p className="text-sm font-semibold mb-1" style={{ color: theme.textPrimary }}>Güvenlik Performans Trendi</p>
        <p className="text-[10.5px] mb-2" style={{ color: theme.textFaint }}>Risk kapanma oranı — son 6 ay (gerçek veri)</p>
        <Sparkline data={trendData} theme={theme} />
      </div>
    </div>
  );
}
