import { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";

// Güvenlik: Görev Değiştirici (App Switcher) Gizlilik Perdesi.
//
// SORUN: Kullanıcı telefonda başka bir uygulamaya geçtiğinde (veya görev değiştirme
// ekranını açtığında), işletim sistemi o anki ekranın bir ANLIK GÖRÜNTÜSÜNÜ alır ve bunu
// önizleme olarak gösterir. Bu uygulama çalışan listesi, risk kayıtları gibi hassas veri
// gösterdiği için, telefonun görev değiştirici ekranında (veya birisi omzunun üzerinden
// bakarken uygulama değiştirdiğinde) bu veriler istemeden görünür olabilir.
//
// ÇÖZÜM: `visibilitychange` olayını dinleyip (sekme/uygulama arka plana alındığında
// `document.visibilityState` "hidden" olur) tam ekran, markaya uygun ama İÇERİKSİZ bir
// perde gösteriyoruz — arka plana geçişin gerçekleştiği anda (görünür olduğu son karede)
// ekranda hassas veri değil, yalnızca logo görünür.
//
// SINIR (dürüstçe belirtilmeli): Bu native bir uygulama DEĞİL, bu yüzden işletim
// sisteminin anlık görüntüyü TAM OLARAK NE ZAMAN aldığı üzerinde kesin bir kontrolümüz
// yok — büyük çoğunlukla tarayıcılar `visibilitychange`'i anlık görüntüden ÖNCE
// tetikler (bu yüzden pratikte işe yarar, bankacılık PWA'larında da aynı teknik
// kullanılır), ama %100 garantili değildir. Gerçek garanti için native bir paket
// (örn. Capacitor'ın ekran güvenliği API'leri) gerekir.
export default function AppSwitcherPrivacyGuard() {
  const { theme } = useTheme();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    function handleVisibilityChange() {
      setHidden(document.visibilityState === "hidden");
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  if (!hidden) return null;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-[9999]" style={{ background: theme.pageBg }}>
      <img src="/icon-192.png" alt="Nöbetçi" className="w-16 h-16 rounded-2xl mb-3" />
      <p className="font-[Oswald] text-lg uppercase tracking-wide" style={{ color: theme.textPrimary }}>Nöbetçi</p>
    </div>
  );
}
