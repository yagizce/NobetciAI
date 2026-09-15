import { useTheme } from "../../contexts/ThemeContext.jsx";
import AskAiButton from "../../components/AskAiButton.jsx";

const LEGISLATION_ITEMS = [
  { title: "6331 Sayılı İş Sağlığı ve Güvenliği Kanunu", desc: "Türkiye'de İSG'nin temel yasal çerçevesi." },
  { title: "İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği", desc: "Ekipman kullanımı ve periyodik kontrol esasları." },
  { title: "Kişisel Koruyucu Donanımların İşyerlerinde Kullanılması Hakkında Yönetmelik", desc: "KKD seçimi, temini ve kullanım kuralları." },
  { title: "Kimyasal Maddelerle Çalışmalarda Sağlık ve Güvenlik Önlemleri Hakkında Yönetmelik", desc: "Kimyasal risklerin yönetimi." },
  { title: "İş Sağlığı ve Güvenliği Risk Değerlendirmesi Yönetmeliği", desc: "L Tipi ve Fine-Kinney gibi yöntemlerin dayanağı." },
];

export default function LegislationPage() {
  const { theme } = useTheme();
  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="font-[Oswald] text-xl uppercase tracking-wide" style={{ color: theme.textPrimary }}>Mevzuat</p>
        <AskAiButton contextId="legislation" />
      </div>
      <p className="text-xs mb-4" style={{ color: theme.textFaint }}>
        Bilgi amaçlıdır, hukuki tavsiye yerine geçmez. Güncel ve tam metin için resmi mevzuat kaynaklarına (mevzuat.gov.tr) başvurun.
      </p>
      <div className="grid gap-2.5">
        {LEGISLATION_ITEMS.map((item) => (
          <div key={item.title} className="rounded-lg border px-3.5 py-3" style={{ borderColor: theme.border, background: theme.surface }}>
            <p className="text-sm font-semibold" style={{ color: theme.textPrimary }}>{item.title}</p>
            <p className="text-xs mt-1" style={{ color: theme.textMuted }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
