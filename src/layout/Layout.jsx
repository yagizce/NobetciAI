import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";
import BottomTabBar from "./BottomTabBar.jsx";
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
  // Alt sekme çubuğunda kendi sekmesi olmayan rotalar (Risk Analizi, Mevzuat, Bilgi
  // Kütüphanesi, Ayarlar) "Diğer" sekmesi altında toplanıyor — o rotalardayken "Diğer"
  // sekmesi de aktif renkte görünsün diye kontrol ediliyor.
  const MORE_ROUTES = ["/risk-analysis", "/legislation", "/knowledge-center", "/settings"];
  const isMoreActive = MORE_ROUTES.some((r) => location.pathname.startsWith(r));

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
        <BottomTabBar onMoreClick={() => setMobileNavOpen(true)} isMoreActive={isMoreActive} />
      </div>
    </div>
  );
}
