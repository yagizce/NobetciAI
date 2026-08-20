import { Link } from "react-router-dom";
import { getSafetyScoreLevel } from "../../../utils/safetyScore.js";
import InfoTooltip from "../../../components/ui/InfoTooltip.jsx";
import { ChevronRight } from "../../../components/icons/index.jsx";

/**
 * @param {{ theme: object, safetyScore: { score: number, breakdown: Array<{label:string, impact:number, description:string}> } }} props
 */
export default function SafetyScoreCard({ theme, safetyScore }) {
  const { score, breakdown } = safetyScore;
  const level = getSafetyScoreLevel(score);
  const levelColor = level.tone === "success" ? theme.successText : level.tone === "warning" ? theme.warnText : theme.highRiskText;
  const levelBg = level.tone === "success" ? theme.successBg : level.tone === "warning" ? theme.warnBg : theme.highRiskBg;

  // 0-100 skoru bir yarım-daire göstergeye çeviren basit SVG — bağımlılık yok.
  const radius = 42;
  const circumference = Math.PI * radius; // yarım daire
  const filled = (score / 100) * circumference;

  return (
    <div className="rounded-xl border px-4 py-4" style={{ borderColor: theme.border, background: theme.surface }}>
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <div className="relative shrink-0" style={{ width: 110, height: 62 }}>
          <svg viewBox="0 0 100 55" width="110" height="62">
            <path d="M 8 50 A 42 42 0 0 1 92 50" fill="none" stroke={theme.surfaceAlt} strokeWidth="9" strokeLinecap="round" />
            <path
              d="M 8 50 A 42 42 0 0 1 92 50"
              fill="none"
              stroke={levelColor}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${filled} ${circumference}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-0.5">
            <span className="text-2xl font-bold leading-none" style={{ color: theme.textPrimary }}>{score}</span>
            <span className="text-[9.5px]" style={{ color: theme.textFaint }}>/ 100</span>
          </div>
        </div>

        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-semibold" style={{ color: theme.textPrimary }}>Güvenlik Skoru</p>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: levelBg, color: levelColor }}>{level.label}</span>
            <InfoTooltip theme={theme} text="100 puandan başlar; açık risk, kritik risk, eğitim tamamlama açığı, yaklaşan/geciken kontrol ve bekleyen düzeltici faaliyet sayısına göre düşer." />
          </div>
          <div className="flex flex-col gap-1">
            {breakdown.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-2 text-[11.5px]">
                <span style={{ color: theme.textMuted }}>{item.description}</span>
                {item.impact !== 0 && (
                  <span className="font-semibold shrink-0" style={{ color: item.impact < 0 ? theme.highRiskText : theme.successText }}>
                    {item.impact > 0 ? "+" : ""}{item.impact}
                  </span>
                )}
              </div>
            ))}
          </div>
          <Link to="/risk-analysis" className="flex items-center gap-1 text-[11px] font-semibold mt-2" style={{ color: theme.accent }}>
            Risk Analizi'ne Git <ChevronRight style={{ fontSize: "12px" }} />
          </Link>
        </div>
      </div>
    </div>
  );
}
