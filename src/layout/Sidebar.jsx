import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useRole } from "../contexts/RoleContext.jsx";
import { Home, MessageSquare, ShieldAlert, FileText, Scale, UserRound, Settings, X, HardHat, BookOpen, ClipboardList } from "../components/icons/index.jsx";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: Home, emoji: "🏠" },
  { to: "/chat", label: "AI Chat", icon: MessageSquare, emoji: "🤖" },
  { to: "/risk-analysis", label: "Risk Analizi", icon: ShieldAlert, emoji: "⚠️" },
  // Denetim: yalnızca İSG Uzmanı ve İşveren — Çalışan bu sekmeyi menüde hiç görmesin/
  // ulaşamasın diye `roles` ile kısıtlı (bkz. aşağıdaki filtre). Diğer NAV_ITEMS'ta
  // `roles` YOK — o kalemler tüm rollere açık kalmaya devam ediyor, davranış değişmedi.
  { to: "/audit", label: "Denetim", icon: ClipboardList, emoji: "📋", roles: ["expert", "employer"] },
  { to: "/documents", label: "Dokümanlar", icon: FileText, emoji: "📄" },
  { to: "/legislation", label: "Mevzuat", icon: Scale, emoji: "📚" },
  { to: "/knowledge-center", label: "Bilgi Kütüphanesi", icon: BookOpen, emoji: "📖" },
  { to: "/profile", label: "Profil", icon: UserRound, emoji: "👤" },
  { to: "/settings", label: "Ayarlar", icon: Settings, emoji: "⚙️" },
];

/** Mobil uygulamanın açılır gezinme menüsü. */
export default function Sidebar({ mobileOpen, onClose }) {
  const { theme } = useTheme();
  const { role } = useRole();
  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));

  // A11Y FIX: Modal.jsx'te olduğu gibi (bkz. o dosyadaki not) bu çekmece de Escape
  // tuşuna hiç yanıt vermiyordu — ayrı bir bileşen olduğu için oradaki düzeltme bunu
  // kapsamıyor, burada da aynı desen uygulandı.
  useEffect(() => {
    if (!mobileOpen) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onClose]);

  const content = (
    <div className="h-full flex flex-col" style={{ background: theme.header, borderRight: `1px solid ${theme.border}` }}>
      <div
        className="flex items-center justify-between px-4 pb-4"
        style={{ borderBottom: `1px solid ${theme.border}`, paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: theme.accent }}>
            <HardHat style={{ fontSize: "16px", color: theme.onAccent }} sw={2.5} />
          </div>
          <span className="font-[Oswald] text-[15px] uppercase tracking-wide" style={{ color: theme.textPrimary }}>Nöbetçi</span>
        </div>
        <button onClick={onClose} className="w-11 h-11 flex items-center justify-center rounded-lg" aria-label="Kapat">
          <X style={{ fontSize: "18px", color: theme.textMuted }} />
        </button>
      </div>

      <nav aria-label="Ana gezinme" className="flex-1 overflow-y-auto py-3 px-2">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              "flex items-center gap-3 min-h-11 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors"
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

  if (!mobileOpen) return null;
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Gezinme menüsü" className="absolute left-0 top-0 h-full w-64">{content}</div>
    </div>
  );
}
