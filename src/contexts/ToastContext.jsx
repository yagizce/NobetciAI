import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useTheme } from "./ThemeContext.jsx";

const ToastContext = createContext(null);
let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const activeToasts = useRef(new Map());

  useEffect(() => {
    const active = activeToasts.current;
    return () => {
      active.forEach(({ timer }) => clearTimeout(timer));
      active.clear();
    };
  }, []);

  const showToast = useCallback((message, tone = "neutral", duration = 3000) => {
    // Ref aynı render içindeki ardışık çağrıları da birleştirir.
    const isDuplicate = [...activeToasts.current.values()]
      .some((t) => t.message === message && t.tone === tone);
    if (isDuplicate) return;
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, tone }]);
    const timer = setTimeout(() => {
      activeToasts.current.delete(id);
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
    activeToasts.current.set(id, { message, tone, timer });
  }, []);
  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastViewport toasts={toasts} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ toasts }) {
  const { theme } = useTheme();
  if (toasts.length === 0) return null;

  const toneStyle = {
    neutral: { background: theme.surface, color: theme.textPrimary, border: `1px solid ${theme.border}` },
    success: { background: theme.successBg, color: theme.successText },
    error: { background: theme.highRiskBg, color: theme.highRiskText },
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center px-4 w-full max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="w-full text-sm px-4 py-2.5 rounded-xl shadow-lg text-center"
          style={toneStyle[t.tone] || toneStyle.neutral}
          role="status"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
