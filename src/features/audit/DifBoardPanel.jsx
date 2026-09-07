import { useState, useMemo } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Badge from "../../components/ui/Badge.jsx";
import { DIF_STAGES, isDifOverdue, computeDifClosureMetrics } from "../../constants/auditWorkflow.js";
import { getFindingTypeMeta, getStandardLabel } from "../../constants/isoStandards.js";
import { AlertTriangle, Clock } from "../../components/icons/index.jsx";

/**
 * Sprint isteği: "Departman bazlı kart görünümü ve filtreleme" + "Ortalama kapatma
 * süresi ve gecikme metrikleri". Tüm denetimlerdeki DİF'leri (aktif denetimin
 * checklist'inden BAĞIMSIZ) tek panoda toplar — bir denetim tamamlanıp kapansa
 * bile DİF'lerinin termin takibi burada sürer (bkz. auditManagementService.js
 * dosya başı notu).
 *
 * @param {{ findings: object[], departments: object[], onOpen: (dif: object) => void }} props
 */
export default function DifBoardPanel({ findings, departments, onOpen }) {
  const { theme } = useTheme();
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");

  const metrics = useMemo(() => computeDifClosureMetrics(findings), [findings]);

  const filtered = useMemo(() => {
    return findings.filter((f) => {
      const matchesDept = departmentFilter === "all" || String(f.departmentId) === departmentFilter;
      const matchesStage = stageFilter === "all" || f.stage === stageFilter;
      return matchesDept && matchesStage;
    });
  }, [findings, departmentFilter, stageFilter]);

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-lg px-3 py-2.5" style={{ background: theme.surfaceAlt }}>
          <p className="text-lg font-bold" style={{ color: theme.textPrimary }}>{metrics.openCount}</p>
          <p className="text-[10px]" style={{ color: theme.textFaint }}>Açık DİF</p>
        </div>
        <div className="rounded-lg px-3 py-2.5" style={{ background: theme.surfaceAlt }}>
          <p className="text-lg font-bold" style={{ color: theme.textPrimary }}>{metrics.avgClosureDays ?? "—"}</p>
          <p className="text-[10px]" style={{ color: theme.textFaint }}>Ort. Kapanma (gün)</p>
        </div>
        <div className="rounded-lg px-3 py-2.5" style={{ background: theme.surfaceAlt }}>
          <p className="text-lg font-bold" style={{ color: theme.textPrimary }}>{metrics.delayedRate !== null ? `%${metrics.delayedRate}` : "—"}</p>
          <p className="text-[10px]" style={{ color: theme.textFaint }}>Gecikme Oranı</p>
        </div>
      </div>

      <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1">
        {[{ value: "all", label: "Tüm Aşamalar" }, ...DIF_STAGES].map((s) => (
          <button key={s.value} onClick={() => setStageFilter(s.value)}
            className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full shrink-0"
            style={stageFilter === s.value ? { background: theme.accent, color: theme.onAccent } : { background: theme.surfaceAlt, color: theme.textMuted, border: `1px solid ${theme.border}` }}>
            {s.label}
          </button>
        ))}
      </div>
      {departments.length > 0 && (
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
          {[{ id: "all", name: "Tüm Departmanlar" }, ...departments].map((d) => (
            <button key={d.id} onClick={() => setDepartmentFilter(String(d.id))}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full shrink-0"
              style={departmentFilter === String(d.id) ? { background: theme.accent, color: theme.onAccent } : { background: theme.surfaceAlt, color: theme.textMuted, border: `1px solid ${theme.border}` }}>
              {d.name}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="DİF bulunamadı" description="Bu filtreyle eşleşen bir düzeltici faaliyet yok." />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {filtered.map((dif) => {
            const typeMeta = getFindingTypeMeta(dif.type);
            const overdue = isDifOverdue(dif);
            const stage = DIF_STAGES.find((s) => s.value === dif.stage);
            return (
              <button key={dif.id} onClick={() => onOpen(dif)} className="text-left rounded-lg border px-3 py-2.5" style={{ borderColor: theme.border, background: theme.surface }}>
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <Badge tone={typeMeta.tone}>{typeMeta.label}</Badge>
                  <Badge tone="neutral">{getStandardLabel(dif.standard)} — {dif.clauseCode}</Badge>
                </div>
                <p className="text-sm font-medium mb-1 line-clamp-2" style={{ color: theme.textPrimary }}>{dif.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px]" style={{ color: theme.textFaint }}>{stage?.label}</span>
                  {dif.dueDate && (
                    <span className="text-[10.5px] flex items-center gap-0.5" style={{ color: overdue ? theme.highRiskText : theme.textFaint }}>
                      <Clock style={{ fontSize: "10px" }} /> {dif.dueDate}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
