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
      // 40px'lik kutu (w-10), 20px'lik topuz (w-5): kapalıyken sol kenardan 2px,
      // açıkken sağ kenardan 2px boşluk — translateX(2px) / translateX(18px) İKİ
      // DURUMDA DA MATEMATİKSEL OLARAK BİREBİR AYNI (simetrik) boşluğu bırakıyor.
      // ÖNCEKİ HATA: topuzun `shadow` gölgesinin bulanıklığı bu 2px'lik payı aşıp
      // dışarı taşıyordu ("kutucuk dışına taşıma"). `overflow-hidden` eklemek bunu
      // gizledi ama topuzun kendisini de kırpıp küçük/eksik gösterdi — YANLIŞ ÇÖZÜM,
      // GERİ ALINDI. DOĞRU ÇÖZÜM: taşmanın kaynağı olan gölgeyi tamamen kaldırmak —
      // artık hem kapalıyken hem açıkken topuz TAM ve EŞİT boşlukla görünüyor.
      className="w-10 h-6 rounded-full relative transition-colors shrink-0"
      style={{ background: checked ? theme.accent : theme.border }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
        style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  );
}
