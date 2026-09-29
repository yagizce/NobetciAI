/**
 * Paylaşımlı aç/kapa anahtarı. Daha önce yalnızca Settings.jsx içinde yerel bir bileşendi;
 * Risk Tespiti'nin "Demo: Otomatik Simülasyon" anahtarı için de aynı ihtiyaç doğunca
 * buraya taşındı — tek kaynak, iki kullanım yeri.
 * @param {{ checked: boolean, onChange: (v: boolean) => void, theme: object }} props
 */
export default function ToggleSwitch({ checked, onChange, theme }) {
  // BU BİLEŞEN ARTIK TAMAMEN INLINE STİLLE ÖLÇÜLENDİRİLİYOR (Tailwind'in w-10/h-6/w-5/h-5
  // sınıflarına değil) — konum matematiği daha önce de doğruydu (2px/18px, simetrik),
  // ama kullanıcı hâlâ hem "kapalıyken solda değil" hem "taşıyor" bildirdi. Bunun tek
  // makul açıklaması: `transform: translateX(...)` ile `top-0.5` (sadece dikey konumu
  // belirtilen, yatay konumu BELİRTİLMEYEN) bir `position:absolute` öğenin "örtük
  // başlangıç konumu"na güvenmekti — spesifikasyonda LTR için bunun sol kenar (0)
  // olması gerekiyor, ama bazı mobil tarayıcı motorlarında güvenilmez olabiliyor.
  // ŞİMDİ: `left` özelliği DOĞRUDAN ve AÇIKÇA veriliyor, hiçbir örtük/miras değere
  // güvenilmiyor — bu, olası nedeni ne olursa olsun sorunu kesin olarak ortadan kaldırır.
  const TRACK_W = 40;
  const TRACK_H = 24;
  const KNOB = 20;
  const PAD = 2; // sol/sağ boşluk — kapalıyken ve açıkken BİREBİR AYNI
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      style={{
        width: `${TRACK_W}px`,
        height: `${TRACK_H}px`,
        borderRadius: `${TRACK_H}px`,
        position: "relative",
        flexShrink: 0,
        background: checked ? theme.accent : theme.border,
        transition: "background-color 0.2s ease",
        border: "none",
        padding: 0,
        cursor: "pointer",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: `${(TRACK_H - KNOB) / 2}px`,
          left: checked ? `${TRACK_W - PAD - KNOB}px` : `${PAD}px`,
          width: `${KNOB}px`,
          height: `${KNOB}px`,
          borderRadius: "9999px",
          background: "#ffffff",
          transition: "left 0.2s ease",
        }}
      />
    </button>
  );
}
