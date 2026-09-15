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
  // Alt sekme çubuğunda kendi sekmesi olmayan rotalar "Diğer" sekmesi altında
  // toplanıyor — o rotalardayken "Diğer" sekmesi de aktif renkte görünsün diye kontrol
  // ediliyor. Dashboard ve Profil artık YENİDEN BottomTabBar.jsx'te kendi doğrudan
  // sekmesine sahip (kullanıcı isteği üzerine geri alındı), o yüzden burada değiller;
  // Risk Analizi, Mevzuat, Bilgi Kütüphanesi, Ayarlar hâlâ sadece çekmecede.
  const MORE_ROUTES = ["/risk-analysis", "/legislation", "/knowledge-center", "/settings"];
  const isMoreActive = MORE_ROUTES.some((r) => location.pathname.startsWith(r));

  // NİHAİ KAYDIRMA MODELİ (hem mobilde hem PhoneFrame'de AYNI, tek bir davranış):
  // Header ve BottomTabBar SABİT kalır, aralarındaki <main> KENDİ İÇİNDE kayar.
  // - min-h-screen frame-fill: frame-fill, PhoneFrame.jsx'in JS ile <html>'e eklediği
  //   `.app-framed` sınıfı ÜZERİNDEN (bkz. index.css) devreye girer — gerçek masaüstünde
  //   (fare + ≥640px) bu kök artık gerçek tarayıcı yüksekliğini (100dvh) değil,
  //   PhoneFrame'in kendi ekran kutusunun yüksekliğini dolduruyor. Gerçek bir telefonda
  //   (dokunmatik, genişlik/yön fark etmez — bkz. PhoneFrame.jsx'teki yatay-telefon
  //   hata düzeltmesi notu) `.app-framed` hiç eklenmez, min-h-screen (100dvh) aynen sürer.
  // - min-h-0 (kolon + main) + main'deki overflow-y-auto: flexbox'ın "flex-1 verilen bir
  //   öğe içeriği daha büyükse küçülmez" tuzağını (min-height:auto varsayılanı) devre
  //   dışı bırakır — main artık HER ZAMAN Header/BottomTabBar arası kalan sabit alanı
  //   kaplar, sayfa ne kadar uzun olursa olsun SADECE main'in içi kayar, Header/
  //   BottomTabBar asla kaymaz. Bu, hem ChatPanel.jsx'in `h-full` ile beklediği sabit
  //   yüksekliği doğru şekilde verir HEM DE önceki "sticky + tüm sayfa kayar" modelinden
  //   çok daha az kırılgandır (sticky'nin doğru scroll bağlamını bulmasına bağımlı değil).
  // - overflow-x-hidden (main): index.css'teki html/body kuralıyla aynı mantık — main
  //   içindeki bir kart/rozet/tablo viewport'tan piksel taşırsa, main'in kendisi yana
  //   kaymasın; sadece tasarlanan yatay alanlar (.overflow-x-auto filtre/sekme
  //   çubukları — bkz. index.css) kendi içinde kaymaya devam eder.
  // - overscroll-contain + WebkitOverflowScrolling: main artık kendi scroll kutusu
  //   olduğu için, index.css'te html/body'ye uygulanan lastik-esnemesi engelleme
  //   (overscroll-behavior-y:none) buraya miras kalmaz — aynı korumayı burada da
  //   ayrıca veriyoruz, yoksa mobilde main'in içinde tekrar "bounce" hissi dönerdi.
  return (
    <div className="flex min-h-screen frame-fill" style={{ background: theme.pageBg }}>
      <AppSwitcherPrivacyGuard />
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <Header onMenuClick={() => setMobileNavOpen(true)} pendingCount={pendingCount} />
        <main
          className="flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
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
