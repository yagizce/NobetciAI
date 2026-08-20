import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";
import ErrorBoundary from "../components/ErrorBoundary.jsx";
import AppSwitcherPrivacyGuard from "../components/AppSwitcherPrivacyGuard.jsx";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useIsgData } from "../contexts/IsgDataContext.jsx";
import { useReminderScheduler } from "../hooks/useReminderScheduler.js";

export default function Layout() {
  const { theme } = useTheme();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { notifications } = useIsgData();
  const pendingCount = notifications.filter((n) => n.status !== "approved").length;
  const location = useLocation();
  useReminderScheduler();

  return (
    <div className="flex min-h-screen" style={{ background: theme.pageBg }}>
      <AppSwitcherPrivacyGuard />
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setMobileNavOpen(true)} pendingCount={pendingCount} />
        <main className="flex-1 min-w-0">
          {/* main.jsx'teki tam ekran ErrorBoundary'den AYRI: bu, yalnızca aktif sayfanın
              içeriğini sarar — bir sayfa çökse bile sidebar/header hayatta kalır, tam
              sayfa yenilemeye gerek kalmadan menüden başka bir sayfaya geçilebilir.
              `key={location.pathname}`: rota değişince sınır sıfırdan monte edilir,
              önceki sayfadaki hata durumu yeni sayfaya taşınmaz. */}
          <ErrorBoundary compact key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
