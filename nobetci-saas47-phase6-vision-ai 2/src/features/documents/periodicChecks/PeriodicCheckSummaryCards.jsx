import { AlertTriangle, Clock, Calendar, CheckCircle2 } from "../../../components/icons/index.jsx";

/**
 * Sprint 7.2.3 — Periyodik Kontrol Merkezi'nin üst özet kartları. Her zaman TÜM kayıtlar
 * üzerinden hesaplanır (bkz. usePeriodicChecks.js → stats), filtrelerden etkilenmez —
 * aksi halde "Geciken Kontroller" sayısı bir filtre uygulandığında yanıltıcı görünürdü.
 *
 * @param {{ theme: object, stats: ReturnType<typeof import("../../../constants/periodicCheck.js").computePeriodicCheckStats> }} props
 */
export default function PeriodicCheckSummaryCards({ theme, stats }) {
  const cards = [
    { label: "Geciken Kontroller", value: stats.overdueCount, icon: AlertTriangle, bg: theme.highRiskBg, text: theme.highRiskText },
    { label: "Bugünkü Kontroller", value: stats.dueTodayCount, icon: Clock, bg: theme.warnBg, text: theme.warnText },
    { label: "Bu Hafta Yaklaşanlar", value: stats.dueThisWeekCount, icon: Calendar, bg: theme.surfaceAlt, text: theme.textPrimary },
    { label: "Bu Ay Tamamlananlar", value: stats.completedThisMonthCount, icon: CheckCircle2, bg: theme.successBg, text: theme.successText },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border px-3 py-2.5" style={{ borderColor: theme.border, background: theme.surface }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-1.5" style={{ background: c.bg }}>
            <c.icon style={{ fontSize: "14px", color: c.text }} />
          </div>
          <p className="text-lg font-bold leading-none" style={{ color: theme.textPrimary }}>{c.value}</p>
          <p className="text-[10px] mt-1" style={{ color: theme.textFaint }}>{c.label}</p>
        </div>
      ))}
    </div>
  );
}
