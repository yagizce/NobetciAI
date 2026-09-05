import { memo } from "react";
import { STATUS_OPTIONS, getPriorityMeta } from "../../../constants/fineKinney.js";
import Badge from "../../../components/ui/Badge.jsx";
import { Trash2 } from "../../../components/icons/index.jsx";
import RiskLevelChip from "./RiskLevelChip.jsx";
import { clampPercent } from "../../../utils/numberGuards.js";

/**
 * @param {{ entry: object, theme: object, mode: "light"|"dark", onEdit: (entry: object) => void, onDelete: (id: number) => void, onOpenDetail?: (entry: object) => void }} props
 */
function FineKinneyCard({ entry, theme, mode, onEdit, onDelete, onOpenDetail }) {
  const statusLabel = STATUS_OPTIONS.find((s) => s.value === entry.status)?.label || entry.status;
  const priorityMeta = getPriorityMeta(entry.priority);

  return (
    <div
      className="rounded-xl border px-3.5 py-3"
      style={{ borderColor: theme.border, background: theme.surface, cursor: onOpenDetail ? "pointer" : "default" }}
      onClick={() => onOpenDetail?.(entry)}
      role={onOpenDetail ? "button" : undefined}
      tabIndex={onOpenDetail ? 0 : undefined}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-sm font-semibold leading-snug" style={{ color: theme.textPrimary }}>{entry.hazard}</p>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <RiskLevelChip score={entry.score} mode={mode} />
          {entry.residualScore !== null && entry.residualScore !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-[9.5px]" style={{ color: theme.textFaint }}>Artık →</span>
              <RiskLevelChip score={entry.residualScore} mode={mode} />
            </div>
          )}
        </div>
      </div>
      <p className="text-xs mb-2" style={{ color: theme.textMuted }}>{entry.risk}</p>
      {entry.action && <p className="text-[11.5px] mb-2" style={{ color: theme.textMuted }}>Önlem: {entry.action}</p>}

      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <Badge tone="neutral">{statusLabel}</Badge>
        {entry.priority && <Badge tone={priorityMeta.tone}>{priorityMeta.label} Öncelik</Badge>}
      </div>

      {typeof entry.completionPercent === "number" && (
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10.5px]" style={{ color: theme.textFaint }}>Tamamlanma</span>
            {/* HARDENING: entry.completionPercent bozuk bir yedekten/doğrudan IndexedDB
                düzenlemesinden 0-100 dışı gelebilir — bkz. utils/numberGuards.js. */}
            <span className="text-[10.5px] font-semibold" style={{ color: theme.textPrimary }}>%{clampPercent(entry.completionPercent)}</span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: theme.surfaceAlt }}>
            <div className="h-full rounded-full" style={{ width: `${clampPercent(entry.completionPercent)}%`, background: theme.accent }} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-[11px] flex-wrap gap-1" style={{ color: theme.textFaint }}>
        <span>{entry.responsible || "—"} {entry.date && `• ${entry.date}`}</span>
      </div>
      {(onEdit || onDelete) && (
        <div className="flex gap-2 mt-2">
          {onEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(entry); }} className="text-[11px] font-semibold" style={{ color: theme.accent }}>Düzenle</button>}
          {onDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }} className="text-[11px] font-semibold flex items-center gap-0.5" style={{ color: theme.emergencyText }}>
              <Trash2 style={{ fontSize: "11px" }} /> Sil
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(FineKinneyCard);
