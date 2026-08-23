import { NavLink } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { Home, MessageSquare, FileText, UserRound, Menu } from "../components/icons/index.jsx";

// NOT: Bir önceki sürümde Panel/Profil bilinçli olarak kaldırılıp Risk Analizi/Ayarlar
// ile değiştirilmişti (Dashboard zaten Header logosunda, Profil zaten çekmecede diye).
// Kullanıcı bunu açıkça geri aldı — Dashboard ve Profil'in alt çubukta DOĞRUDAN da
// durmasını istiyor, sadece isim/etiket güncellemesiyle: "Panel" → "Dashboard",
// "Belgeler" → "Dökümanlar".
const TABS = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/chat", label: "AI Sohbet", icon: MessageSquare },
  { to: "/documents", label: "Dökümanlar", icon: FileText },
  { to: "/profile", label: "Profil", icon: UserRound },
];

/**
 * "Telefonda bir uygulamanın içindeyiz" hissini asıl veren unsur budur — kalıcı
 * kayan çekmece (Sidebar.jsx) tek başına bir web sitesi menüsü gibi hissettirir,
 * native uygulamalarda (Instagram, Gmail vb.) birincil gezinme hep alttadır.
 *
 * Layout.jsx'teki nihai kaydırma modeli gereği (bkz. Layout.jsx'teki not) bu bar hiç
 * KAYMAZ — Header ile birlikte sabit kalır, aradaki <main> kendi içinde kayar. `sticky
 * bottom-0` bu yüzden aslında hiçbir zaman "yapışma" anına girmez (kayan bir bağlamın
 * içinde değil), ama zararsızdır ve bırakıldı: `position:fixed` KULLANILMADI çünkü
 * fixed, gerçek tarayıcı penceresine göre konumlanır ve masaüstünde PhoneFrame.jsx'teki
 * telefon çerçevesinin dışına taşıp tam genişlik kaplardı; sticky ise içinde bulunduğu
 * flex sütununun genişliğini miras alır — çerçeve dar olduğunda dar, telefonda tam
 * genişlik olur.
 *
 * Sona eklendiği (flex-col'da <main>'den SONRA) için normal akışta kendi yerini
 * ayırır — <main>'in son içeriğinin üstüne binmez, ekstra bottom-padding hilesine
 * gerek yok.
 */
export default function BottomTabBar({ onMoreClick, isMoreActive }) {
  const { theme } = useTheme();

  return (
    <nav
      className="sticky bottom-0 z-30 flex items-stretch shrink-0"
      style={{
        background: theme.header,
        borderTop: `1px solid ${theme.border}`,
        // Ana ekrana eklenmiş PWA'da (bkz. index.html) alt home indicator çentiğinin
        // arkasına içerik girmesin diye güvenli alan boşluğu; normal tarayıcı
        // sekmesinde env() değeri 0 olduğu için hiçbir görsel etkisi yok.
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
