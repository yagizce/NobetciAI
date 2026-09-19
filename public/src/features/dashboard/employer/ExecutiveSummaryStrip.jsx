import { Link } from "react-router-dom";
import { computePeriodicCheckStats } from "../../../constants/periodicCheck.js";
import { BookOpen, Clock, ChevronRight, Flame } from "../../../components/icons/index.jsx";

/**
 * Eskiden ayrı bir "Patron Modu" SEKMESİ olan 5 kartlık hızlı özetin yerini alır —
 * o sekme kaldırıldı, buradaki 3 kart artık doğrudan Genel Bakış'ın en üstünde.
 * İki kart taşınmadı çünkü zaten başka yerde birebir karşılıkları var:
 *   - "Son 30 Günde Kapanan Risk" → Last30DaysChangeCard'da zaten var.
 *   - "Son Kaza" → hemen altındaki StreakCounterCard'da zaten var (ve orada daha
 *     olumlu/okunabilir bir çerçevede: "kazasız X gün").
 * Detaya inmeden aksiyon alınması gereken yerleri gösterir; hiçbir yeni hesaplama
 * yapmaz, useEmployerDashboardData()'nın zaten ürettiği veriyi yeniden kullanır.
 *
 * @param {{ theme: object, data: ReturnType<typeof import("./useEmployerDashboardData.js").useEmployerDashboardData> }} props
 */
export default function ExecutiveSummaryStrip({ theme, data }) {
  const { metrics, periodicChecks } = data;
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
    },
    {
      key: "overdueChecks",
      label: "Geciken Kontrol",
      value: periodicStats.overdueCount,
      unit: "kalem",
      icon: Clock,
      tone: periodicStats.overdueCount > 0 ? "danger" : "success",
      link: "/documents?tab=periodicChecks",
    },
    {
      key: "trainingCompletion",
      label: "Eğitim Tamamlama",
      value: metrics.trainingCompletionRate,
      unit: "%",
      icon: BookOpen,
      tone: metrics.trainingCompletionRate >= 80 ? "success" : metrics.trainingCompletionRate >= 50 ? "warning" : "danger",
      link: "/documents?tab=education",
    },
  ];

  const toneColors = {
    danger: { bg: theme.highRiskBg, text: theme.highRiskText },
    warning: { bg: theme.warnBg, text: theme.warnText },
    success: { bg: theme.successBg, text: theme.successText },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {cards.map((card) => {
        const colors = toneColors[card.tone];
        const Icon = card.icon;
        return (
          <Link key={card.key} to={card.link} className="rounded-xl border px-4 py-3.5 block" style={{ borderColor: theme.border, background: theme.surface }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: theme.textMuted }}>{card.label}</span>
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: colors.bg }}>
                <Icon style={{ fontSize: "14px", color: colors.text }} />
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-1.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold leading-none" style={{ color: colors.text }}>{card.value}</span>
                {card.unit && <span className="text-xs" style={{ color: theme.textFaint }}>{card.unit}</span>}
              </div>
              <ChevronRight style={{ fontSize: "13px", color: theme.textFaint }} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
