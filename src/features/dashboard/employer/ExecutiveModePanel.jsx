import { Link } from "react-router-dom";
import { computePeriodicCheckStats } from "../../../constants/periodicCheck.js";
import { AlertTriangle, CheckCircle2, BookOpen, Clock, Flame, ChevronRight } from "../../../components/icons/index.jsx";

/**
 * Sprint: Yönetici Modu ("Patron Ekranı") — İSG ekranının detaylarını değil,
 * 5 kartlık, 30 saniyede taranabilir bir özet gösterir. Hiçbir yeni veri
 * hesaplaması yapmaz; useEmployerDashboardData() içinde zaten hesaplanmış
 * (metrics, last30DayChange, accidentFreeStreak) veriyi yeniden kullanır.
 * Kart sırası kasıtlı: "aksiyon gerektiren" en üstte, "iyi giden" en altta.
 *
 * @param {{ theme: object, data: ReturnType<typeof import("./useEmployerDashboardData.js").useEmployerDashboardData> }} props
 */
export default function ExecutiveModePanel({ theme, data }) {
  const { metrics, last30DayChange, accidentFreeStreak, periodicChecks } = data;

  const periodicStats = computePeriodicCheckStats(periodicChecks);

  const cards = [
    {
      key: "criticalRisks",
      label: "Açık Kritik Risk",
      value: metrics.criticalRisks,
      unit: "kayıt",
      icon: Flame,
      tone: metrics.criticalRisks > 0 ? "danger" : "success",
      link: "/risk-analysis",
      linkLabel: "Risk Analizi'ne git",
    },
    {
      key: "overdueChecks",
      label: "Geciken Kontrol",
      value: periodicStats.overdueCount,
      unit: "kalem",
      icon: Clock,
      tone: periodicStats.overdueCount > 0 ? "danger" : "success",
      link: "/documents?tab=periodicChecks",
      linkLabel: "Periyodik Kontroller'e git",
    },
    {
      key: "closedRisks",
      label: "Son 30 Günde Kapanan Risk",
      value: last30DayChange.closedRisks.current,
      unit: "kayıt",
      delta: last30DayChange.closedRisks.delta,
      icon: CheckCircle2,
      tone: "neutral",
      link: "/risk-analysis",
      linkLabel: "Risk Analizi'ne git",
    },
    {
      key: "trainingCompletion",
      label: "Eğitim Tamamlama",
      value: metrics.trainingCompletionRate,
      unit: "%",
      icon: BookOpen,
      tone: metrics.trainingCompletionRate >= 80 ? "success" : metrics.trainingCompletionRate >= 50 ? "warning" : "danger",
      link: "/education",
      linkLabel: "Eğitim modülüne git",
    },
    {
      key: "lastAccident",
      label: "Son Kaza",
      value: accidentFreeStreak.hasRecord ? accidentFreeStreak.days : null,
      unit: accidentFreeStreak.hasRecord ? "gün önce" : "",
      icon: AlertTriangle,
      tone: accidentFreeStreak.hasRecord ? (accidentFreeStreak.days < 30 ? "danger" : "success") : "neutral",
      emptyLabel: "Kayıtlı kaza yok",
      link: null,
    },
  ];

  const toneColors = {
    danger: { bg: theme.highRiskBg, text: theme.highRiskText },
    warning: { bg: theme.warnBg, text: theme.warnText },
    success: { bg: theme.successBg, text: theme.successText },
    neutral: { bg: theme.surfaceAlt, text: theme.textPrimary },
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px]" style={{ color: theme.textFaint }}>
        Detaya inmeden, aksiyon alınması gereken yerleri gösterir. Detay için "Genel Bakış" sekmesine geçin.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map((card) => {
          const colors = toneColors[card.tone];
          const Icon = card.icon;
          const hasValue = card.value !== null && card.value !== undefined;
          return (
            <div key={card.key} className="rounded-xl border px-4 py-4" style={{ borderColor: theme.border, background: theme.surface }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: theme.textMuted }}>{card.label}</span>
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: colors.bg }}>
                  <Icon style={{ fontSize: "14px", color: colors.text }} />
                </div>
              </div>
              {hasValue ? (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold leading-none" style={{ color: colors.text }}>{card.value}</span>
                  {card.unit && <span className="text-xs" style={{ color: theme.textFaint }}>{card.unit}</span>}
                  {typeof card.delta === "number" && card.delta !== 0 && (
                    <span className="text-[10.5px] font-semibold" style={{ color: card.delta > 0 ? theme.successText : theme.highRiskText }}>
                      {card.delta > 0 ? "+" : ""}{card.delta} (önceki 30 gün)
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-sm font-medium" style={{ color: theme.textFaint }}>{card.emptyLabel}</span>
              )}
              {card.link && (
                <Link to={card.link} className="flex items-center gap-1 text-[11px] font-semibold mt-2" style={{ color: theme.accent }}>
                  {card.linkLabel} <ChevronRight style={{ fontSize: "12px" }} />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
