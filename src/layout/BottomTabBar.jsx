import { NavLink } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { Home, MessageSquare, FileText, UserRound, Menu } from "../components/icons/index.jsx";

const TABS = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/chat", label: "AI Sohbet", icon: MessageSquare },
  { to: "/documents", label: "Dökümanlar", icon: FileText },
  { to: "/profile", label: "Profil", icon: UserRound },
];

/** Ana gezinme, kaydırılan içeriğin dışında kalır ve alt güvenli alanı korur. */
export default function BottomTabBar({ onMoreClick, isMoreActive }) {
  const { theme } = useTheme();

  return (
    <nav
      className="z-30 flex items-stretch shrink-0"
      style={{
        background: theme.header,
        borderTop: `1px solid ${theme.border}`,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 min-w-0"
          style={({ isActive }) => ({ color: isActive ? theme.accent : theme.textFaint })}
        >
          <tab.icon style={{ fontSize: "20px" }} />
          <span className="text-[10px] font-medium truncate">{tab.label}</span>
        </NavLink>
      ))}
      <button
        onClick={onMoreClick}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2 min-w-0"
        style={{ color: isMoreActive ? theme.accent : theme.textFaint }}
        aria-label="Diğer sayfalar menüsü"
      >
        <Menu style={{ fontSize: "20px" }} />
        <span className="text-[10px] font-medium">Diğer</span>
      </button>
    </nav>
  );
}
