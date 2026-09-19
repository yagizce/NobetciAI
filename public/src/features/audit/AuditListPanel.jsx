import { useState, useMemo } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Badge from "../../components/ui/Badge.jsx";
import { getAuditStatusMeta } from "../../constants/auditWorkflow.js";
import { ClipboardList, ChevronRight, Calendar } from "../../components/icons/index.jsx";

const STATUS_TABS = [
  { value: "all", label: "Tümü" },
  { value: "planned", label: "Planlandı" },
  { value: "ongoing", label: "Devam Ediyor" },
  { value: "completed", label: "Tamamlandı" },
];

/**
 * Sprint isteği: "Planlı, devam eden ve tamamlanan denetimler tek listede" —
 * ayrı sekmeler yerine tek liste + durum filtresi. Aynı liste "Geçmiş
 * Denetimleri Görüntüleme" ihtiyacını da karşılar (durum filtresini
 * "Tamamlandı" yaparak). Denetim TÜRÜNDEN bağımsız, jenerik bileşen — skor/
 * ilerleme fonksiyonları ve gösterilecek etiket dışarıdan gelir.
 *
 * @param {{ audits: object[], onOpen: (audit: object) => void, standardLabel: string,
 *   computeOverallScore: (checklist: object[]) => number|null,
 *   computeProgressPercent: (checklist: object[]) => number }} props
 */
export default function AuditListPanel({ audits, onOpen, standardLabel, computeOverallScore, computeProgressPercent }) {
  const { theme } = useTheme();
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(
    () => (statusFilter === "all" ? audits : audits.filter((a) => a.status === statusFilter)),
    [audits, statusFilter]
  );

  return (
    <div>
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
        {STATUS_TABS.map((t) => (
          <button key={t.value} onClick={() => setStatusFilter(t.value)}
            className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full shrink-0"
            style={statusFilter === t.value ? { background: theme.accent, color: theme.onAccent } : { background: theme.surfaceAlt, color: theme.textMuted, border: `1px solid ${theme.border}` }}>
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Denetim bulunamadı" description="Bu filtreyle eşleşen bir denetim yok." />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((audit) => {
            const statusMeta = getAuditStatusMeta(audit.status);
            const score = computeOverallScore(audit.checklist);
            const progress = computeProgressPercent(audit.checklist);
            return (
              <button key={audit.id} onClick={() => onOpen(audit)}
                className="text-left rounded-lg border px-3.5 py-3 flex items-center justify-between gap-2"
                style={{ borderColor: theme.border, background: theme.surface }}>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <p className="text-sm font-semibold truncate" style={{ color: theme.textPrimary }}>{audit.scopeDescription}</p>
                    <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                  </div>
                  <p className="text-[11px] flex items-center gap-1" style={{ color: theme.textFaint }}>
                    <Calendar style={{ fontSize: "11px" }} /> {audit.plannedDate} • {standardLabel} • %{progress} tamamlandı
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {score !== null && (
                    <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: theme.surfaceAlt, color: theme.textPrimary }}>%{score}</span>
                  )}
                  <ChevronRight style={{ fontSize: "14px", color: theme.textFaint }} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
