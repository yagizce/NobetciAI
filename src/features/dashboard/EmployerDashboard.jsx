import { useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../../components/EmptyState.jsx";
import Loading from "../../components/Loading.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import Button from "../../components/ui/Button.jsx";
import { Building2, BarChart3, LayoutDashboard, Zap, Sparkles } from "../../components/icons/index.jsx";
import { useEmployerDashboardData } from "./employer/useEmployerDashboardData.js";
import { seedDemoData } from "../../services/demoSeedService.js";
import EmployerOverviewTab from "./employer/EmployerOverviewTab.jsx";
import PerformancePanel from "./employer/PerformancePanel.jsx";
import ExecutiveModePanel from "./employer/ExecutiveModePanel.jsx";

const TABS = [
  { key: "overview", label: "Genel Bakış", icon: LayoutDashboard },
  { key: "performance", label: "Performans", icon: BarChart3 },
  { key: "executive", label: "Patron Modu", icon: Zap },
];

/**
 * @param {{ theme: object }} props
 */
export default function EmployerDashboard({ theme }) {
  const data = useEmployerDashboardData();
  const [tab, setTab] = useState("overview");
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState(null);

  async function handleLoadDemoData() {
    setSeeding(true);
    setSeedError(null);
    try {
      const result = await seedDemoData();
      if (result.seeded) {
        // BİLİNÇLİ TERCİH: bir refetch callback'i katmanlar boyunca taşımak yerine tam
        // sayfa yenileme kullanıldı (bu ortamdaki ErrorState onRetry'lerinin de yaptığı
        // gibi) — nadir/kasıtlı bir aksiyon için basit ve güvenilir, tüm React context'
        // önbelleklerinin de temiz başlamasını garanti eder.
        window.location.reload();
      }
    } catch (err) {
      console.error("Örnek veri yüklenemedi:", err);
      setSeedError("Örnek veriler yüklenemedi. Tarayıcı depolama alanını kontrol edip tekrar deneyin.");
      setSeeding(false);
    }
  }

  if (!data.loaded) {
    return (
      <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
        <Loading label="Dashboard yükleniyor..." />
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
        <ErrorState
          title="Dashboard verileri yüklenemedi"
          description="Tarayıcı depolama alanına erişilemedi. Sayfayı yenileyip tekrar deneyin."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (!data.company) {
    return (
      <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
        <p className="font-[Oswald] text-xl uppercase tracking-wide mb-4" style={{ color: theme.textPrimary }}>İşveren Paneli</p>
        <EmptyState
          icon={Building2}
          title="Henüz firma oluşturulmadı"
          description="Platformun neler yapabildiğini hemen görmek için örnek bir firmayla doldurabilir, ya da kendi firma bilgilerinizi girebilirsiniz."
          action={
            <div className="flex flex-col items-center gap-2">
              <Button onClick={handleLoadDemoData} disabled={seeding} className="flex items-center gap-1.5">
                <Sparkles style={{ fontSize: "13px" }} /> {seeding ? "Yükleniyor..." : "Örnek Verilerle Göster"}
              </Button>
              {seedError && <p className="text-[11px]" style={{ color: theme.highRiskText }}>{seedError}</p>}
              <Link to="/settings" className="text-sm font-semibold" style={{ color: theme.accent }}>veya Ayarlar → Firma Yönetimi'nden kendi firmanızı oluşturun →</Link>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
      <p className="font-[Oswald] text-xl uppercase tracking-wide mb-4" style={{ color: theme.textPrimary }}>İşveren Paneli</p>

      <div className="rounded-xl border px-4 py-3 mb-4 flex items-center gap-3" style={{ borderColor: theme.border, background: theme.surface }}>
        {data.company.logo ? (
          <img src={data.company.logo} alt="Firma logosu" className="w-10 h-10 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: theme.surfaceAlt }}>
            <Building2 style={{ fontSize: "18px", color: theme.textFaint }} />
          </div>
        )}
        <div>
          <p className="text-sm font-semibold" style={{ color: theme.textPrimary }}>{data.company.name}</p>
          <p className="text-xs mt-0.5" style={{ color: theme.textFaint }}>
            {data.company.sector} • {data.metrics.departmentCount} departman • {data.metrics.branchCount} şube
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
            style={tab === t.key ? { background: theme.accent, color: theme.onAccent } : { background: theme.surfaceAlt, color: theme.textMuted, border: `1px solid ${theme.border}` }}>
            <t.icon style={{ fontSize: "13px" }} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <EmployerOverviewTab theme={theme} data={data} />}
      {tab === "performance" && <PerformancePanel theme={theme} data={data} />}
      {tab === "executive" && <ExecutiveModePanel theme={theme} data={data} />}
    </div>
  );
}
