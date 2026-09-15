import { HISTORY_EVENT_LABELS } from "../../../../../constants/fineKinney.js";
import EmptyState from "../../../../../components/EmptyState.jsx";
import { History } from "../../../../../components/icons/index.jsx";

/**
 * @param {{ entry: object, theme: object }} props
 */
export default function HistoryTab({ entry, theme }) {
  const history = [...(entry.history || [])].sort((a, b) => new Date(a.at) - new Date(b.at));

  if (history.length === 0) {
    return <EmptyState icon={History} title="Henüz geçmiş kaydı yok" description="Bu risk üzerinde yapılan işlemler burada listelenecek." />;
  }

  return (
    <div className="relative pl-4">
      <div className="absolute left-[5px] top-1 bottom-1 w-px" style={{ background: theme.border }} />
      <div className="space-y-4">
        {history.map((h) => (
          <div key={h.id} className="relative">
            <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full" style={{ background: theme.accent }} />
            <p className="text-sm font-semibold" style={{ color: theme.textPrimary }}>{HISTORY_EVENT_LABELS[h.event] || h.event}</p>
            {h.detail && <p className="text-[11.5px]" style={{ color: theme.textMuted }}>{h.detail}</p>}
            <p className="text-[10.5px] mt-0.5" style={{ color: theme.textFaint }}>
              {h.actor ? `${h.actor} • ` : ""}{new Date(h.at).toLocaleString("tr-TR")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
