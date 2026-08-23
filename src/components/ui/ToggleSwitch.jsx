/**
 * Paylaşımlı aç/kapa anahtarı. Daha önce yalnızca Settings.jsx içinde yerel bir bileşendi;
 * Risk Tespiti'nin "Demo: Otomatik Simülasyon" anahtarı için de aynı ihtiyaç doğunca
 * buraya taşındı — tek kaynak, iki kullanım yeri.
 * @param {{ checked: boolean, onChange: (v: boolean) => void, theme: object }} props
 */
export default function ToggleSwitch({ checked, onChange, theme }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      // HATA DÜZELTMESİ: "işaretli" durumda topuz (span), 40px genişliğindeki kutunun
      // sağına sadece 2px pay bırakacak şekilde kayıyor (translateX(18px) + 20px topuz
      // = 38px). Topuzun kendi `shadow` gölgesinin bulanıklığı (blur) bu 2px'lik payı
      // aşıp yuvarlak kutunun (`rounded-full`) dışına taşıyordu — "kutucuk dışına
      // taşıma" hatası buydu. `overflow-hidden`, topuzun KENDİSİ matematiksel olarak
      // kutunun içinde kalsa bile gölgesinin asla dışarı sızmamasını garanti ediyor.
      className="w-10 h-6 rounded-full relative overflow-hidden transition-colors shrink-0"
      style={{ background: checked ? theme.accent : theme.border }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  );
}
