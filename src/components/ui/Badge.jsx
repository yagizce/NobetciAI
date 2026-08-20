import { useTheme } from "../../contexts/ThemeContext.jsx";

/**
 * @param {{ children: React.ReactNode, tone?: "neutral"|"success"|"warning"|"danger"|"pending" }} props
 */
export default function Badge({ children, tone = "neutral" }) {
  const { theme } = useTheme();

  const toneStyle = {
    neutral: { background: theme.surfaceAlt, color: theme.textMuted },
    success: { background: theme.successBg, color: theme.successText },
    warning: { background: theme.warnBg, color: theme.warnText },
    danger: { background: theme.highRiskBg, color: theme.highRiskText },
    pending: { background: theme.pendingBg, color: theme.pendingText },
  }[tone];

  return (
    <span className="text-[9.5px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={toneStyle}>
      {children}
    </span>
  );
}
