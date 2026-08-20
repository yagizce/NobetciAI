import { useTheme } from "../../contexts/ThemeContext.jsx";
import { X } from "../icons/index.jsx";

/**
 * @param {{ open: boolean, onClose: () => void, title?: string, children: React.ReactNode }} props
 */
export default function Modal({ open, onClose, title, children }) {
  const { theme } = useTheme();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl p-5 max-h-[85vh] overflow-y-auto"
        style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
      >
        <div className="flex items-center justify-between mb-3">
          {title && <p className="font-[Oswald] text-base uppercase tracking-wide" style={{ color: theme.textPrimary }}>{title}</p>}
          <button onClick={onClose} className="ml-auto p-1.5 -m-1.5 rounded-lg" aria-label="Kapat">
            <X style={{ fontSize: "18px", color: theme.textMuted }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
