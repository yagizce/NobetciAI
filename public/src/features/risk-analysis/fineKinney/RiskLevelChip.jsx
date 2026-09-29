import { memo } from "react";
import { getFineKinneyRiskLevel } from "../../../constants/fineKinney.js";

/**
 * @param {{ score: number, mode: "light"|"dark", showDescription?: boolean }} props
 */
function RiskLevelChip({ score, mode, showDescription = false }) {
  const level = getFineKinneyRiskLevel(score, mode);
  return (
    <div className="inline-flex flex-col gap-0.5">
      <span
        className="text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap inline-flex items-center gap-1.5"
        style={{ background: level.bg, color: level.text }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: level.text }} />
        {score} — {level.label}
      </span>
      {showDescription && (
        <span className="text-[10.5px] px-1" style={{ color: level.text }}>{level.description}</span>
      )}
    </div>
  );
}

export default memo(RiskLevelChip);
