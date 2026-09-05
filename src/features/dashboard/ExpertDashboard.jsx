import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useIsgData } from "../../contexts/IsgDataContext.jsx";
import { getCompanies } from "../../services/companyService.js";
import EmptyState from "../../components/EmptyState.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import Loading from "../../components/Loading.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import { MessageSquare, ShieldAlert } from "../../components/icons/index.jsx";

/**
 * @param {{ theme: object }} props
 */
export default function ExpertDashboard({ theme }) {
  const { notifications, loaded: notificationsLoaded } = useIsgData();
  const [companies, setCompanies] = useState([]);
  const [companiesLoaded, setCompaniesLoaded] = useState(false);
  const [companiesError, setCompaniesError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getCompanies()
      .then((data) => {
        if (!cancelled) { setCompanies(data); setCompaniesLoaded(true); }
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

      <div className="grid gap-4 md:grid-cols-2">
        <section>
          <p className="text-sm font-semibold mb-2" style={{ color: theme.textPrimary }}>Aktif Şirketler</p>
          <div className="grid gap-2">
            {!companiesLoaded ? (
              <Loading label="Firmalar yükleniyor..." />
            ) : companiesError ? (
              <ErrorState title="Firmalar yüklenemedi" description="Tarayıcı depolama alanına erişilemedi. Sayfayı yenileyip tekrar deneyin." onRetry={() => window.location.reload()} />
            ) : companies.length === 0 ? (
              <EmptyState icon={ShieldAlert} title="Henüz firma oluşturulmadı" />
            ) : companies.map((company) => (
              <div key={company.id} className="rounded-lg border px-3 py-2.5" style={{ borderColor: theme.border, background: theme.surface }}>
                <p className="text-sm font-medium" style={{ color: theme.textPrimary }}>{company.name}</p>
                <p className="text-xs" style={{ color: theme.textFaint }}>{company.sector} • {company.employeeCount} çalışan</p>
              </div>
            ))}
          </div>
        </section>

        <section>
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
        </section>
      </div>

      <section className="mt-4">
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
      </section>
    </div>
  );
}
