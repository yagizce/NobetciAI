import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export default function NotFound() {
  useDocumentTitle("Sayfa Bulunamadı");
  const { theme } = useTheme();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center" style={{ background: theme.pageBg }}>
      <p className="font-[Oswald] text-5xl mb-2" style={{ color: theme.accent }}>404</p>
      <p className="text-sm mb-4" style={{ color: theme.textMuted }}>Aradığınız sayfa bulunamadı.</p>
      <Link to="/dashboard" className="text-sm font-semibold px-4 py-2 rounded-lg" style={{ background: theme.accent, color: theme.onAccent }}>
        Dashboard'a Dön
      </Link>
    </div>
  );
}
