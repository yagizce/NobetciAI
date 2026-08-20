import { getCheckStatusStyle } from "../../../constants/periodicCheck.js";

const STATUS_ORDER = [
  { id: "overdue", label: "Süresi Geçti" },
  { id: "upcoming", label: "Yaklaşıyor" },
  { id: "ok", label: "Güncel" },
];

/**
 * Dashboard kartı — Periyodik Kontrol durumu özeti. `WorkflowPipelinePanel.jsx`
 * (Risk Workflow) ile AYNI görsel dili kullanır — yatay kaydırmalı sayaç şeridi.
 * İtemize liste değil (o zaten Dikkat Gerektirenler widget'ında var), yalnızca
 * makro düzey sayaç.
 *
 * @param {{ theme: object, periodicChecks: object[] }} props
 */
export default function PeriodicCheckOverviewPanel({ theme, periodicChecks }) {
  const counts = STATUS_ORDER.map((s) => ({
    ...s,
    count: periodicChecks.filter((c) => c.status === s.id).length,
    style: getCheckStatusStyle(s.id, theme),
  }));

  if (periodicChecks.length === 0) {
    return <p className="text-xs" style={{ color: theme.textFaint }}>Henüz periyodik kontrol kaydı yok.</p>;
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {counts.map((s) => (
        <div key={s.id} className="rounded-lg px-3 py-2.5 shrink-0" style={{ background: s.style.bg, minWidth: "100px" }}>
          <p className="text-xl font-bold leading-none" style={{ color: s.style.text }}>{s.count}</p>
          <p className="text-[10.5px] mt-1 whitespace-nowrap" style={{ color: s.style.text }}>{s.label}</p>
        </div>
      ))}
    </div>
  );
}
