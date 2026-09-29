import { useTheme } from "../../contexts/ThemeContext.jsx";

/**
 * @param {{ variant?: "primary"|"secondary"|"danger"|"ghost", size?: "sm"|"md", disabled?: boolean, onClick?: () => void, children: React.ReactNode, type?: string, className?: string }} props
 */
export default function Button({ variant = "primary", size = "md", disabled = false, onClick, children, type = "button", className = "", ...rest }) {
  const { theme } = useTheme();

  const sizeStyles = size === "sm" ? "text-xs px-3 py-1.5" : "text-sm px-4 py-2.5";

  const variantStyle = {
    primary: { background: theme.accent, color: theme.onAccent },
    secondary: { background: theme.surfaceAlt, color: theme.textPrimary, border: `1px solid ${theme.border}` },
    danger: { background: theme.emergencyBorder, color: "white" },
    ghost: { background: "transparent", color: theme.textMuted },
  }[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg font-semibold transition-transform hover:brightness-95 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current disabled:opacity-40 disabled:pointer-events-none disabled:hover:brightness-100 ${sizeStyles} ${className}`}
      style={variantStyle}
      {...rest}
    >
      {children}
    </button>
  );
}
