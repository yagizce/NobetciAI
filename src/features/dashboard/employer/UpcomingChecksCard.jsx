import { Link } from "react-router-dom";
import EmptyState from "../../../components/EmptyState.jsx";
import { getCategoryLabel, getCheckStatusStyle } from "../../../constants/periodicCheck.js";
import { CheckCircle2, ChevronRight } from "../../../components/icons/index.jsx";

/**
 * Karar destek dashboard'unun "Yaklaşan Periyodik Kontroller" kartı. Mevcut
 * `PeriodicCheckOverviewPanel` yalnızca makro sayaç veriyordu (kaç tanesi
 * yaklaşıyor/gecikti/güncel) — bu kart, HANGİ kontrollerin yaklaştığını somut
 * olarak (kalem adı, kategori, tarih) listeler; ikisi birbirini tamamlar, biri
 * diğerinin yerine geçmez.
 *
 * @param {{ theme: object, periodicChecks: import("../../../types/index.js").PeriodicCheck[] }} props
 */
export default function UpcomingChecksCard({ theme, periodicChecks }) {
  const upcoming = periodicChecks
    .filter((c) => c.status === "upcoming" || c.status === "overdue")
    .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate))
    .slice(0, 5);

  if (periodicChecks.length === 0) {
    return <EmptyState icon={CheckCircle2} title="Henüz periyodik kontrol kaydı yok" description="Dokümanlar → Periyodik Kontroller sekmesinden ekleyin." />;
  }

  if (upcoming.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg px-3 py-3" style={{ background: theme.successBg }}>
        <CheckCircle2 style={{ fontSize: "16px", color: theme.successText }} />
        <p className="text-xs font-medium" style={{ color: theme.successText }}>Yaklaşan veya geciken kontrol yok — her şey güncel.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {upcoming.map((c) => {
        const style = getCheckStatusStyle(c.status, theme);
        return (
          <div key={c.id} className="rounded-lg border px-3 py-2 flex items-center justify-between gap-2" style={{ borderColor: theme.border, background: theme.surface }}>
            <div className="min-w-0">
              <p className="text-sm truncate" style={{ color: theme.textPrimary }}>{c.itemName}</p>
              <p className="text-[10.5px]" style={{ color: theme.textFaint }}>
                {getCategoryLabel(c.category)} • {new Date(c.nextDueDate).toLocaleDateString("tr-TR")}
              </p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: style.bg, color: style.text }}>{style.label}</span>
          </div>
        );
      })}
      <Link to="/documents?tab=periodicChecks" className="flex items-center justify-center gap-1 text-[11px] font-semibold mt-1 py-1.5" style={{ color: theme.accent }}>
        Tümünü Gör <ChevronRight style={{ fontSize: "12px" }} />
      </Link>
    </div>
  );
}
