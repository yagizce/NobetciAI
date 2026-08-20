import { NavLink } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { Home, MessageSquare, ShieldAlert, FileText, Scale, UserRound, Settings, X, HardHat, BookOpen } from "../components/icons/index.jsx";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: Home, emoji: "🏠" },
  { to: "/chat", label: "AI Chat", icon: MessageSquare, emoji: "🤖" },
  { to: "/risk-analysis", label: "Risk Analizi", icon: ShieldAlert, emoji: "⚠️" },
  { to: "/documents", label: "Dokümanlar", icon: FileText, emoji: "📄" },
  { to: "/legislation", label: "Mevzuat", icon: Scale, emoji: "📚" },
  { to: "/knowledge-center", label: "Bilgi Kütüphanesi", icon: BookOpen, emoji: "📖" },
  { to: "/profile", label: "Profil", icon: UserRound, emoji: "👤" },
  { to: "/settings", label: "Ayarlar", icon: Settings, emoji: "⚙️" },
];

export default function Sidebar({ mobileOpen, onClose }) {
  const { theme } = useTheme();

  const content = (
    <div className="h-full flex flex-col" style={{ background: theme.header, borderRight: `1px solid ${theme.border}` }}>
      <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: theme.accent }}>
            <HardHat style={{ fontSize: "16px", color: theme.onAccent }} sw={2.5} />
          </div>
          <span className="font-[Oswald] text-[15px] uppercase tracking-wide" style={{ color: theme.textPrimary }}>Nöbetçi</span>
        </div>
        <button onClick={onClose} className="md:hidden p-1.5 -m-1.5 rounded-lg" aria-label="Kapat">
          <X style={{ fontSize: "18px", color: theme.textMuted }} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              "flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors"
            }
            style={({ isActive }) => ({
              background: isActive ? theme.accent : "transparent",
              color: isActive ? theme.onAccent : theme.textMuted,
            })}
          >
            <item.icon style={{ fontSize: "18px" }} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-3 text-[10px]" style={{ color: theme.textFaint, borderTop: `1px solid ${theme.border}` }}>
        Nöbetçi İSG Platformu v2.0
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <aside className="hidden md:block w-60 shrink-0 h-screen sticky top-0">{content}</aside>

      {/* Mobile: slide-in drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <div className="absolute left-0 top-0 h-full w-64">{content}</div>
        </div>
      )}
    </>
  );
}
