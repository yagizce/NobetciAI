import { useTheme } from "../contexts/ThemeContext.jsx";

/**
 * @param {{ title: string, description?: string, action?: React.ReactNode, icon?: React.ComponentType }} props
 */
export default function EmptyState({ title, description, action, icon: Icon }) {
  const { theme } = useTheme();
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      {Icon && (
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: theme.surfaceAlt }}>
          <Icon style={{ fontSize: "22px", color: theme.textFaint }} />
        </div>
      )}
      <p className="text-sm font-semibold" style={{ color: theme.textPrimary }}>{title}</p>
      {description && <p className="text-xs mt-1 max-w-xs" style={{ color: theme.textFaint }}>{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
