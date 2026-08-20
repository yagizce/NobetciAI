import { PROBABILITY_SCALE, FREQUENCY_SCALE, SEVERITY_SCALE } from "../../../../../constants/fineKinney.js";
import RiskLevelChip from "../../RiskLevelChip.jsx";

function findLabel(scale, value) {
  return scale.find((o) => String(o.value) === String(value))?.label || value;
}

/**
 * @param {{ entry: object, theme: object, mode: "light"|"dark" }} props
 */
export default function FineKinneyTab({ entry, theme, mode }) {
  const hasResidual = entry.residualScore !== null && entry.residualScore !== undefined;

  return (
    <div>
      <div className="rounded-lg px-3 py-3 mb-3" style={{ background: theme.surfaceAlt, border: `1px solid ${theme.border}` }}>
        <p className="text-xs font-semibold mb-2" style={{ color: theme.textPrimary }}>Önlem Öncesi Risk</p>
        <div className="space-y-1.5 mb-2 text-[11.5px]" style={{ color: theme.textMuted }}>
          <p>Olasılık: {findLabel(PROBABILITY_SCALE, entry.probability)}</p>
          <p>Maruziyet: {findLabel(FREQUENCY_SCALE, entry.frequency)}</p>
          <p>Şiddet: {findLabel(SEVERITY_SCALE, entry.severity)}</p>
        </div>
        <RiskLevelChip score={entry.score} mode={mode} showDescription />
      </div>

      {entry.action && (
        <div className="rounded-lg px-3 py-3 mb-3" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
          <p className="text-xs font-semibold mb-1" style={{ color: theme.textPrimary }}>Alınacak Önlem</p>
          <p className="text-[11.5px]" style={{ color: theme.textMuted }}>{entry.action}</p>
        </div>
      )}

      {hasResidual && (
        <div className="rounded-lg px-3 py-3" style={{ background: theme.surfaceAlt, border: `1px solid ${theme.border}` }}>
          <p className="text-xs font-semibold mb-2" style={{ color: theme.textPrimary }}>Artık Risk (Önlem Sonrası)</p>
          <div className="space-y-1.5 mb-2 text-[11.5px]" style={{ color: theme.textMuted }}>
            <p>Olasılık: {findLabel(PROBABILITY_SCALE, entry.residualProbability)}</p>
            <p>Maruziyet: {findLabel(FREQUENCY_SCALE, entry.residualFrequency)}</p>
            <p>Şiddet: {findLabel(SEVERITY_SCALE, entry.residualSeverity)}</p>
          </div>
          <RiskLevelChip score={entry.residualScore} mode={mode} showDescription />
        </div>
      )}
    </div>
  );
}
