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
      className="w-10 h-6 rounded-full relative transition-colors shrink-0"
      style={{ background: checked ? theme.accent : theme.border }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  );
}
