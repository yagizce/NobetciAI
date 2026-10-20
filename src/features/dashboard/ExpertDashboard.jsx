import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useIsgData } from "../../contexts/IsgDataContext.jsx";
import { getCompanies, setActiveCompany, getActiveCompanyId } from "../../services/companyService.js";
import EmptyState from "../../components/EmptyState.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import Loading from "../../components/Loading.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { MessageSquare, ShieldAlert } from "../../components/icons/index.jsx";
import { isFeatureEnabled } from "../../constants/releaseProfile.js";

/**
 * @param {{ theme: object }} props
 */
export default function ExpertDashboard({ theme }) {
  const { notifications, loaded: notificationsLoaded } = useIsgData();
  const { showToast } = useToast();
  const [companies, setCompanies] = useState([]);
  const [companiesLoaded, setCompaniesLoaded] = useState(false);
  const [companiesError, setCompaniesError] = useState(null);
  const [activeCompanyId, setActiveCompanyIdState] = useState(null);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getCompanies(), getActiveCompanyId()])
      .then(([data, activeId]) => {
        if (!cancelled) { setCompanies(data); setActiveCompanyIdState(activeId); setCompaniesLoaded(true); }
      })
      .catch((error) => {
        console.error("Firmalar yüklenemedi:", error);
        // BUG FIX (Sprint 8 polish): önceden hata yalnızca console'a yazılıyordu — "Aktif
        // Şirketler" bölümü sonsuza kadar boş görünüyordu, kullanıcı bunun bir hata mı
        // yoksa gerçekten firma yok mu olduğunu ayırt edemiyordu.
        if (!cancelled) { setCompaniesError(error); setCompaniesLoaded(true); }
      });
    return () => { cancelled = true; };
  }, []);

  // OSGB/çoklu-müşteri portföyü: Fine-Kinney, Denetim vb. TÜM modüller yalnızca
  // AKTİF firmanın verisini gösterir (bkz. companyService.js → COMPANY_SCOPED_STORES).
  // Bu yüzden "portföyde her firma kendi takibiyle ayrışır" ihtiyacı, İSG Uzmanı'nın
  // burada bir müşteriye tıklayıp onu aktif hale getirmesiyle karşılanır — sayfa
  // yenilendiğinde tüm modüller o müşterinin verisiyle açılır.
  async function handleSwitch(companyId) {
    if (String(companyId) === String(activeCompanyId) || switching) return;
    setSwitching(true);
    try {
      await setActiveCompany(companyId);
      showToast("Aktif firma değiştirildi, sayfa yenileniyor...", "neutral");
      window.location.reload();
    } catch (err) {
      console.error("Firma değiştirilemedi:", err);
      showToast("Firma değiştirilemedi.", "error");
      setSwitching(false);
    }
  }

  const pendingAnalyses = useMemo(() => notifications.filter((n) => n.status === "pending" || n.status === "ai_analyzed"), [notifications]);
  const recentAnalyses = useMemo(() => notifications.filter((n) => n.aiAnalysis).slice(0, 5), [notifications]);

  return (
    <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <p className="font-[Oswald] text-xl uppercase tracking-wide" style={{ color: theme.textPrimary }}>Uzman Paneli</p>
        <Link to="/chat">
          <Button size="sm" className="flex items-center gap-1.5"><MessageSquare style={{ fontSize: "13px" }} /> AI Chat</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {[["/risk-analysis", "Risk değerlendirmesi"], ["/audit", "Denetim"], ["/documents", "Belgeler ve kontroller"]].map(([to, label]) => (
          <Link key={to} to={to} className="rounded-lg border px-3 py-2 text-xs font-semibold" style={{ borderColor: theme.border, color: theme.accent }}>{label}</Link>
        ))}
      </div>

      <div className={`grid gap-4 ${isFeatureEnabled("employeeReports") ? "md:grid-cols-2" : ""}`}>
        <section>
          <p className="text-sm font-semibold mb-2" style={{ color: theme.textPrimary }}>Aktif Şirketler</p>
          <div className="grid gap-2">
            {!companiesLoaded ? (
              <Loading label="Firmalar yükleniyor..." />
            ) : companiesError ? (
              <ErrorState title="Firmalar yüklenemedi" description="Tarayıcı depolama alanına erişilemedi. Sayfayı yenileyip tekrar deneyin." onRetry={() => window.location.reload()} />
            ) : companies.length === 0 ? (
              <div>
                <EmptyState icon={ShieldAlert} title="Henüz firma oluşturulmadı" />
                <Link to="/settings" className="text-sm font-semibold" style={{ color: theme.accent }}>Firma bilgilerini ekle →</Link>
              </div>
            ) : companies.map((company) => {
              const isActive = String(company.id) === String(activeCompanyId);
              return (
                <button key={company.id} onClick={() => handleSwitch(company.id)} disabled={switching}
                  className="text-left rounded-lg border px-3 py-2.5 flex items-center justify-between gap-2"
                  style={{ borderColor: isActive ? theme.accent : theme.border, background: theme.surface }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: theme.textPrimary }}>{company.name}</p>
                    <p className="text-xs" style={{ color: theme.textFaint }}>{company.sector} • {company.employeeCount} çalışan</p>
                  </div>
                  {isActive ? <Badge tone="success">Aktif</Badge> : <span className="text-[10.5px] font-semibold" style={{ color: theme.accent }}>Bu firmaya geç →</span>}
                </button>
              );
            })}
          </div>
        </section>

        {isFeatureEnabled("employeeReports") && <section>
          <p className="text-sm font-semibold mb-2" style={{ color: theme.textPrimary }}>Bekleyen Analizler</p>
          {/* UX FIX (loading/empty state cilası): bildirimler context'te ayrı yükleniyor —
              önceden `loaded` hiç kontrol edilmiyordu, ilk render'da (veri henüz gelmeden)
              kısa süreliğine "Bekleyen analiz yok" gösterilebiliyordu. */}
          {!notificationsLoaded ? (
            <Loading label="Analizler yükleniyor..." />
          ) : pendingAnalyses.length === 0 ? (
            <EmptyState icon={ShieldAlert} title="Bekleyen analiz yok" />
          ) : (
            <div className="grid gap-2">
              {pendingAnalyses.map((n) => (
                <div key={n.id} className="rounded-lg border px-3 py-2.5 flex items-start justify-between gap-2" style={{ borderColor: theme.border, background: theme.surface }}>
                  <div>
                    <p className="text-sm" style={{ color: theme.textPrimary }}>{n.desc}</p>
                    <p className="text-xs" style={{ color: theme.textFaint }}>{n.worker} • {n.date}</p>
                  </div>
                  <Badge tone={n.status === "pending" ? "pending" : "warning"}>{n.status === "pending" ? "AI Analiz Ediyor" : "İncelemede"}</Badge>
                </div>
              ))}
            </div>
          )}
        </section>}
      </div>

      {isFeatureEnabled("employeeReports") && <section className="mt-4">
        <p className="text-sm font-semibold mb-2" style={{ color: theme.textPrimary }}>Son Analizler</p>
        {!notificationsLoaded ? (
          <Loading label="Analizler yükleniyor..." />
        ) : recentAnalyses.length === 0 ? (
          <EmptyState icon={ShieldAlert} title="Henüz analiz yapılmadı" />
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {recentAnalyses.map((n) => (
              <div key={n.id} className="rounded-lg border px-3 py-2.5" style={{ borderColor: theme.border, background: theme.surface }}>
                <p className="text-sm font-medium mb-1" style={{ color: theme.textPrimary }}>{n.desc}</p>
                <p className="text-xs whitespace-pre-wrap" style={{ color: theme.textMuted }}>{n.aiAnalysis}</p>
              </div>
            ))}
          </div>
        )}
      </section>}
    </div>
  );
}
