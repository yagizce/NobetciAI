import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { Menu, Sun, Moon, LogOut, UserRound, Settings as SettingsIcon, HardHat } from "../components/icons/index.jsx";
import NotificationCenterDropdown from "../features/notifications/NotificationCenterDropdown.jsx";
import GlobalSearchBar from "./GlobalSearchBar.jsx";

export default function Header({ onMenuClick, pendingCount = 0 }) {
  const { theme, mode, toggleMode } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);

  // BUG FIX (mobil): bu menü önceden yalnızca onMouseLeave ile kapanıyordu — dokunmatik
  // ekranlarda hover/mouseleave hiç oluşmadığı için mobilde açılan menü, bir bağlantıya
  // dokunmadan asla kapanmıyordu (dışarıya dokunmak hiçbir şey yapmıyordu). Aynı
  // "dışarı tıklayınca kapat" deseni NotificationCenterDropdown.jsx'te zaten kullanılıyor
  // ve dokunmatik ekranlarda da çalışıyor (mousedown, touch'ın synthetic click zincirinde
  // tetiklenir) — burada da o desen uygulandı, yeni bir yaklaşım icat edilmedi.
  useEffect(() => {
    if (!profileOpen) return;
    function handleClickOutside(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  return (
    <header
      className="shrink-0 z-30 flex items-center gap-1 sm:gap-3 px-3 sm:px-6 pb-3"
      style={{
        background: theme.header,
        borderBottom: `1px solid ${theme.border}`,
        // Ana ekrana eklenmiş PWA'da (index.html'deki apple-mobile-web-app-status-bar-style
        // "black-translucent") durum çubuğu saydamlaşıp içeriğin üstüne biner — bu padding
        // olmadan menü/logo çentiğin/saatin altında kalırdı. max() sayesinde normal tarayıcı
        // sekmesinde (env() = 0) eski 12px (py-3) padding aynen korunuyor.
        paddingTop: "max(0.75rem, env(safe-area-inset-top))",
      }}
    >
      <button onClick={onMenuClick} aria-label="Menü" className="lg:hidden w-11 h-11 flex items-center justify-center shrink-0 rounded-lg">
        <Menu style={{ fontSize: "20px", color: theme.textPrimary }} />
      </button>

      <Link to="/dashboard" aria-label="Nöbetçi ana sayfa" className="lg:hidden flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: theme.accent }}>
          <HardHat style={{ fontSize: "14px", color: theme.onAccent }} sw={2.5} />
        </div>
      </Link>

      {/* Search — bkz. GlobalSearchBar.jsx (önceden burada işlevsiz bir placeholder vardı) */}
      <GlobalSearchBar />
      <div className="flex-1" />

      {/* Theme toggle */}
      <button onClick={toggleMode} className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: theme.surfaceAlt }} aria-label="Tema değiştir">
        {mode === "light" ? <Moon style={{ fontSize: "16px", color: theme.textMuted }} /> : <Sun style={{ fontSize: "16px", color: theme.accent }} />}
      </button>

      {/* Notification Center */}
      <NotificationCenterDropdown pendingReportsCount={pendingCount} />

      {/* Profile menu */}
      <div className="relative" ref={profileMenuRef}>
        <button onClick={() => setProfileOpen((v) => !v)} aria-label="Profil menüsü" aria-haspopup="true" aria-expanded={profileOpen} className="flex items-center justify-center min-w-11 min-h-11 gap-1.5 sm:pl-1 sm:pr-2 py-1 rounded-full" style={{ background: theme.surfaceAlt }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: theme.accent, color: theme.onAccent }}>
            <UserRound style={{ fontSize: "14px" }} />
          </div>
        </button>
        {profileOpen && (
          <div
            className="absolute right-0 mt-2 w-44 rounded-xl shadow-lg overflow-hidden z-40"
            style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
          >
            <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm" style={{ color: theme.textPrimary }}>
              <UserRound style={{ fontSize: "14px" }} /> Profil
            </Link>
            <Link to="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm" style={{ color: theme.textPrimary }}>
              <SettingsIcon style={{ fontSize: "14px" }} /> Ayarlar
            </Link>
            <Link to="/login" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm" style={{ color: theme.emergencyText, borderTop: `1px solid ${theme.border}` }}>
              <LogOut style={{ fontSize: "14px" }} /> Çıkış Yap
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
