import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getExpertOverview } from "../../services/expertDashboardService.js";
import Loading from "../../components/Loading.jsx";
import ErrorState from "../../components/ErrorState.jsx";

export default function ExpertWorkOverview({ theme }) {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    getExpertOverview().then((data) => { if (!cancelled) setSummary(data); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);
  if (error) return <ErrorState title="İş özeti yüklenemedi" description="Kayıtlar okunamadı." onRetry={() => window.location.reload()} />;
  if (!summary) return <Loading label="Firma özeti yükleniyor..." />;
  const card = { background: theme.surface, borderColor: theme.border };
  return <section className="mt-5">
    <h2 className="text-sm font-semibold mb-2" style={{ color: theme.textPrimary }}>Bu firmada öncelikler</h2>
    <div className="grid grid-cols-2 gap-2">
      {[
        ["Yüksek / çok yüksek risk", summary.priorityRisks.length, "/risk-analysis", { targetTab: "fineKinney" }],
        ["Geciken iş", summary.overdueCount, "#expert-agenda"],
        ["Bugün ve 7 gün içinde", summary.upcomingCount, "#expert-agenda"],
        ["İncelenecek saha tespiti", summary.pendingDetectionCount, "/risk-analysis", { targetTab: "riskDetection" }],
      ].map(([label, count, to, state]) => {
        const content = <><strong className="block text-2xl" style={{ color: theme.textPrimary }}>{count}</strong><span className="text-xs" style={{ color: theme.textMuted }}>{label}</span></>;
        return to.startsWith("#") ? <a key={label} href={to} className="rounded-xl border p-3" style={card}>{content}</a>
          : <Link key={label} to={to} state={state} className="rounded-xl border p-3" style={card}>{content}</Link>;
      })}
    </div>
    <p className="text-[11px] mt-2" style={{ color: theme.textFaint }}>{summary.openRiskCount} açık risk kaydı · Yalnızca kaydedilmiş bilgiler</p>
    {summary.priorityRisks.length > 0 && <div className="mt-4">
      <h3 className="text-sm font-semibold mb-2" style={{ color: theme.textPrimary }}>Önce gözden geçirin</h3>
      {summary.priorityRisks.slice(0, 3).map((risk) => <Link key={risk.id} to="/risk-analysis" state={{ targetTab: "fineKinney", prefillSearch: risk.hazard }} className="block rounded-xl border p-3 mb-2" style={card}>
        <span className="text-xs font-semibold" style={{ color: theme.highRiskText }}>Risk puanı: {risk.score}</span>
        <p className="text-sm break-words" style={{ color: theme.textPrimary }}>{risk.hazard}</p>
      </Link>)}
    </div>}
    <div id="expert-agenda" className="mt-4">
      <h3 className="text-sm font-semibold mb-2" style={{ color: theme.textPrimary }}>İş takibi</h3>
      <p className="text-xs mb-2" style={{ color: theme.textMuted }}>Gecikenler, bugün ve önümüzdeki 7 gün</p>
      {summary.tasks.length === 0 ? <p className="rounded-xl border p-3 text-sm" style={{ ...card, color: theme.textMuted }}>Bu dönem için tarihli iş kaydı yok.</p>
        : summary.tasks.slice(0, 8).map((task) => <Link key={task.id} to={task.to} state={task.state} className="block rounded-xl border p-3 mb-2" style={card}>
          <div className="flex justify-between gap-2 text-[11px]" style={{ color: task.overdue ? theme.highRiskText : theme.textMuted }}><span>{task.kind}{task.overdue ? " · Gecikti" : ""}</span><span>{task.dueDate.split("-").reverse().join(".")}</span></div>
          <p className="text-sm mt-1 break-words" style={{ color: theme.textPrimary }}>{task.title}</p>
          <p className="text-[11px] break-words" style={{ color: theme.textFaint }}>{task.context}</p>
        </Link>)}
      {summary.tasks.length > 8 && <p className="text-xs" style={{ color: theme.textMuted }}>En erken 8 / {summary.tasks.length} iş gösteriliyor. Tüm kayıtlar ilgili modüllerde.</p>}
    </div>
  </section>;
}
