import { useEffect, useState } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";

function useLiveClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 15000);
    return () => clearInterval(id);
  }, []);
  return time;
}

/**
 * HATA DÜZELTMESİ (gerçek telefonda "kurcalarken" — ör. yatay çevirince — ortaya çıkan
 * sorun): önceki sürüm çerçeveyi salt Tailwind'in `sm:` (genişlik ≥640px) sınıfıyla
 * gösteriyordu. Bu YANLIŞ sinyal — birçok gerçek telefon bu eşiği kolayca geçer:
 * iPhone 14 Pro Max yatay modda ~930px, orta boy Android telefonlar yatayda ~850px'e
 * çıkar. Sonuç: telefonu yan çevirince (ya da bazı büyük telefonlarda dik konumda bile)
 * uygulama kendini "masaüstü" sanıp GERÇEK telefonun İÇİNE bir de sahte bezel/durum
 * çubuğu/home-indicator çizmeye çalışıyordu — iç içe iki telefon, ortalanamayan/bozuk
 * bir görünüm.
 *
 * DOĞRU SİNYAL genişlik DEĞİL, girdi türüdür: gerçek bir masaüstü fare/trackpad ile
 * kullanılır (`hover: hover` + `pointer: fine`), gerçek bir telefon HER ZAMAN dokunmatik
 * birincildir (`hover: none` + `pointer: coarse`) — yönü veya genişliği ne olursa olsun.
 * Bu, saf CSS `sm:` ile ayırt edilemeyeceği için JS ile matchMedia kullanılıyor; sonuç
 * hem PhoneFrame'in kendi çerçevesine hem de aynı ölçütü paylaşması gereken diğer
 * dosyalara (Layout.jsx, Login.jsx vb. — bkz. index.css'teki `.app-framed .frame-fill`)
 * `<html>` üzerine eklenen/kaldırılan `app-framed` sınıfıyla iletiliyor; tek doğruluk
 * kaynağı burada, hiçbir yerde ayrı bir `sm:` genişlik varsayımı kalmadı.
 */
function useIsFramedDesktop() {
  const [isFramed, setIsFramed] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 640px)");
    const update = () => setIsFramed(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("app-framed", isFramed);
  }, [isFramed]);
  return isFramed;
}

/**
 * GERÇEK TELEFON ÇERÇEVESİ — sadece gerçek masaüstünde (fare + ≥640px, bkz. yukarı)
 * devreye girer: siyah bezel, yuvarlak köşeler, saat/sinyal/pil ikonlu sahte durum
 * çubuğu, dynamic island, home indicator. Gerçek bir telefonda (dokunmatik, yön/genişlik
 * fark etmez) `isFramed` hep false'tur, children hiçbir sarmalayıcı olmadan render
 * edilir — işletim sisteminin kendi durum çubuğu zaten var, sahte bir tane eklemek
 * yanlış olurdu.
 *
 * KAYDIRMA MİMARİSİ (bkz. Layout.jsx'teki ayrıntılı not): Header/BottomTabBar sabit,
 * aradaki <main> kendi içinde kayıyor — bu bileşenin iç kaydırma kutusu (aşağıda)
 * SADECE Header/Sidebar OLMAYAN sayfalarda (Login, Register, Şifremi Unuttum, 404)
 * fiilen devrededir; Layout kullanan sayfalarda Layout `frame-fill` ile bu kutuyu tam
 * doldurur, gerçek kaydırma <main>'in kendi içinde olur.
 *
 * `[transform:translateZ(0)]`: transform'lu bir eleman, içindeki TÜM `position: fixed`
 * elemanlar için yeni bir "containing block" oluşturur (spesifikasyon gereği) — Sidebar
 * çekmecesi, Modal, Toast gibi `fixed inset-0` kullanan HER bileşen otomatik olarak
 * gerçek pencereye değil bu telefon ekranına göre konumlanır.
 */
export default function PhoneFrame({ children }) {
  const { theme } = useTheme();
  const time = useLiveClock();
  const isFramed = useIsFramedDesktop();
  const hh = String(time.getHours()).padStart(2, "0");
  const mm = String(time.getMinutes()).padStart(2, "0");

  if (!isFramed) {
    // Gerçek telefon (veya dokunmatik herhangi bir cihaz): hiçbir sarmalayıcı yok,
    // children doğrudan render edilir — bkz. yukarıdaki not.
    return children;
  }

  return (
    <div className="min-h-screen w-full flex justify-center items-center py-8 px-4" style={{ background: "#1C1917" }}>
      <div className="w-[390px] shrink-0">
        <div className="rounded-[52px] p-[12px] shadow-2xl" style={{ background: "#0B0A08" }}>
          <div
            className="relative h-[min(844px,88vh)] rounded-[40px] overflow-hidden flex flex-col [transform:translateZ(0)]"
            style={{ background: theme.pageBg }}
          >
            <div
              className="flex relative items-center justify-between px-7 pt-3 pb-1.5 shrink-0 select-none"
              style={{ background: theme.header }}
              aria-hidden="true"
            >
              <span className="text-[13px] font-semibold tabular-nums" style={{ color: theme.textPrimary }}>
                {hh}:{mm}
              </span>
              <div className="absolute left-1/2 -translate-x-1/2 top-2 w-[100px] h-[26px] rounded-full" style={{ background: "#000" }} />
              <div className="flex items-center gap-1.5" style={{ color: theme.textPrimary }}>
                <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><rect x="0" y="6" width="3" height="5" rx="0.5" /><rect x="4.5" y="4" width="3" height="7" rx="0.5" /><rect x="9" y="2" width="3" height="9" rx="0.5" /><rect x="13" y="0" width="3" height="11" rx="0.5" /></svg>
                <svg width="14" height="11" viewBox="0 0 14 11" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M1 4a9 9 0 0 1 12 0" /><path d="M3.3 6.6a5.5 5.5 0 0 1 7.4 0" /><path d="M5.6 9a2.2 2.2 0 0 1 2.8 0" /></svg>
                <svg width="24" height="12" viewBox="0 0 24 12" fill="none"><rect x="0.5" y="0.5" width="20" height="11" rx="2.5" stroke="currentColor" /><rect x="2" y="2" width="17" height="8" rx="1.5" fill="currentColor" /><rect x="21.5" y="4" width="1.5" height="4" rx="0.7" fill="currentColor" /></svg>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: "touch" }}>
              {children}
            </div>

            <div className="flex items-center justify-center py-2 shrink-0" style={{ background: theme.header }} aria-hidden="true">
              <div className="w-[120px] h-[4px] rounded-full" style={{ background: theme.textPrimary, opacity: 0.35 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
