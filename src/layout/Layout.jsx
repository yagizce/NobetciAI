import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";
import BottomTabBar from "./BottomTabBar.jsx";
import ErrorBoundary from "../components/ErrorBoundary.jsx";
import AppSwitcherPrivacyGuard from "../components/AppSwitcherPrivacyGuard.jsx";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useIsgData } from "../contexts/IsgDataContext.jsx";
import { useReminderScheduler } from "../hooks/useReminderScheduler.js";

const MORE_ROUTES = ["/risk-analysis", "/legislation", "/knowledge-center", "/settings", "/audit"];

export default function Layout() {
  const { theme } = useTheme();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { notifications } = useIsgData();
  const pendingCount = notifications.filter((n) => n.status !== "approved").length;
  const location = useLocation();
  const contentRef = useRef(null);
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, left: 0, behavior: "instant" });
    setMobileNavOpen(false);
  }, [location.pathname]);
  useReminderScheduler();
  const isMoreActive = MORE_ROUTES.some((r) => location.pathname.startsWith(r));

  // Ekranı dolduran kabukta yalnızca içerik kayar; gezinme görünür kalır.
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: theme.pageBg, paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)" }}>
      <AppSwitcherPrivacyGuard />
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <Header onMenuClick={() => setMobileNavOpen(true)} pendingCount={pendingCount} />
        <main
          ref={contentRef}
          className="flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain"
        >
          {/* Sayfa hatası menüyü etkilemez; rota değişince hata sınırı sıfırlanır. */}
          <ErrorBoundary compact key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
        <BottomTabBar onMoreClick={() => setMobileNavOpen(true)} isMoreActive={isMoreActive} />
      </div>
    </div>
  );
}
