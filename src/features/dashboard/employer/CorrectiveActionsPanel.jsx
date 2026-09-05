import { getPriorityMeta, STATUS_OPTIONS } from "../../../constants/fineKinney.js";
import Badge from "../../../components/ui/Badge.jsx";
import EmptyState from "../../../components/EmptyState.jsx";
import { ListChecks } from "../../../components/icons/index.jsx";
import { clampPercent } from "../../../utils/numberGuards.js";

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

/**
 * @param {{ theme: object, fineKinneyEntries: object[] }} props
 */
export default function CorrectiveActionsPanel({ theme, fineKinneyEntries }) {
  const active = fineKinneyEntries
    .filter((e) => e.status !== "done")
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2));

  if (active.length === 0) {
    return <EmptyState icon={ListChecks} title="Aktif düzeltici faaliyet yok" description="Tüm riskler kapatılmış görünüyor." />;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {active.slice(0, 6).map((entry) => {
        const priorityMeta = getPriorityMeta(entry.priority);
        const statusLabel = STATUS_OPTIONS.find((s) => s.value === entry.status)?.label || entry.status;
        return (
          <div key={entry.id} className="rounded-lg border px-3 py-2.5" style={{ borderColor: theme.border, background: theme.surface }}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-sm font-medium leading-snug min-w-0 break-words" style={{ color: theme.textPrimary }}>{entry.hazard}</p>
              <span className="shrink-0"><Badge tone={priorityMeta.tone}>{priorityMeta.label}</Badge></span>
            </div>
            <p className="text-[11px] mb-1.5" style={{ color: theme.textFaint }}>
              {entry.responsible || "Sorumlu atanmadı"} {entry.dueDate && `• Termin: ${entry.dueDate}`}
            </p>
            <div className="flex items-center justify-between gap-2">
              <Badge tone="neutral">{statusLabel}</Badge>
              <span className="text-[10.5px] font-semibold" style={{ color: theme.textMuted }}>%{clampPercent(entry.completionPercent)} tamamlandı</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
