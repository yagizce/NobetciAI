import { Link } from "react-router-dom";
import RiskLevelChip from "../../risk-analysis/fineKinney/RiskLevelChip.jsx";
import { getFineKinneyRiskLevel } from "../../../constants/fineKinney.js";
import { useTheme } from "../../../contexts/ThemeContext.jsx";
import { ShieldAlert, ChevronRight } from "../../../components/icons/index.jsx";

/**
 * Sprint 7.2.4 — "Açık Kritik Riskler" kartı. Mevcut KPI grid'indeki "Kritik Risk"
 * sayısından farklı olarak (o, durumdan bağımsız TÜM yüksek/çok yüksek riskleri sayar),
 * bu kart yalnızca hâlâ AÇIK olanları (status !== "done") somut olarak listeler —
 * "hangi risk, ne durumda" sorusuna cevap verir.
 *
 * @param {{ fineKinneyEntries: import("../../../types/index.js").FineKinneyEntry[] }} props
 */
export default function CriticalRisksCard({ fineKinneyEntries }) {
  const { theme, mode } = useTheme();

  const openCritical = fineKinneyEntries
    .filter((e) => e.status !== "done" && ["high", "veryHigh"].includes(getFineKinneyRiskLevel(e.score).key))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (openCritical.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg px-3 py-3" style={{ background: theme.successBg }}>
        <ShieldAlert style={{ fontSize: "16px", color: theme.successText }} />
        <p className="text-xs font-medium" style={{ color: theme.successText }}>Açık kritik risk yok.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {openCritical.map((e) => (
        <div key={e.id} className="rounded-lg border px-3 py-2 flex items-center justify-between gap-2" style={{ borderColor: theme.border, background: theme.surface }}>
          <div className="min-w-0">
            <p className="text-sm truncate" style={{ color: theme.textPrimary }}>{e.hazard}</p>
            <p className="text-[10.5px] truncate" style={{ color: theme.textFaint }}>{e.responsible || "—"}</p>
          </div>
          <div className="shrink-0"><RiskLevelChip score={e.score} mode={mode} /></div>
        </div>
      ))}
      <Link to="/risk-analysis" className="flex items-center justify-center gap-1 text-[11px] font-semibold mt-1 py-1.5" style={{ color: theme.accent }}>
        Tümünü Gör <ChevronRight style={{ fontSize: "12px" }} />
      </Link>
    </div>
  );
}
