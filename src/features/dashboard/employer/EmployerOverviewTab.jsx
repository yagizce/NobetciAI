import { useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../../../components/EmptyState.jsx";
import DashboardWidget from "../../../components/DashboardWidget.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import { useWidgetVisibility, DASHBOARD_WIDGETS } from "../../../hooks/useWidgetVisibility.js";
import { timeAgo } from "../../../utils/dateUtils.js";
import { ShieldAlert, Users, ClipboardList, ListChecks, Settings, X, Scale } from "../../../components/icons/index.jsx";
import SafetyScoreCard from "./SafetyScoreCard.jsx";
import ExecutiveSummaryCard from "./ExecutiveSummaryCard.jsx";
import TrendsPanel from "./TrendsPanel.jsx";
import CorrectiveActionsPanel from "./CorrectiveActionsPanel.jsx";
import StreakCounterCard from "../StreakCounterCard.jsx";
import WorkflowPipelinePanel from "./WorkflowPipelinePanel.jsx";
import DepartmentRiskBreakdown from "./DepartmentRiskBreakdown.jsx";
import DepartmentHeatMap from "./DepartmentHeatMap.jsx";
import AuditPackageButton from "./AuditPackageButton.jsx";
import DepartmentTrendAlertCard from "./DepartmentTrendAlertCard.jsx";
import LegislationImpactCard from "./LegislationImpactCard.jsx";
import TrainingComplianceListCard from "./TrainingComplianceListCard.jsx";
import PeriodicCheckOverviewPanel from "./PeriodicCheckOverviewPanel.jsx";
import AttentionNeededPanel from "./AttentionNeededPanel.jsx";
import DashboardExportButtons from "./DashboardExportButtons.jsx";
import Last30DaysChangeCard from "./Last30DaysChangeCard.jsx";
import UpcomingChecksCard from "./UpcomingChecksCard.jsx";
import OngoingTrainingsCard from "./OngoingTrainingsCard.jsx";
import CriticalRisksCard from "./CriticalRisksCard.jsx";
import { getActivityLink } from "../../../constants/activityLink.js";

/**
 * @param {{ theme: object, data: ReturnType<typeof import("./useEmployerDashboardData.js").useEmployerDashboardData> }} props
 */
export default function EmployerOverviewTab({ theme, data }) {
  const {
    employees, riskAnalyses, auditLog, metrics, fineKinneyEntries, periodicChecks, departments,
    safetyScore, weeklySummary, accidentFreeStreak, last30DayChange, trainingStats, ongoingTrainingItems, company,
    notifications, trainingProgressRecords, trainingCompletionRecords, documents,
  } = data;
  const { isVisible, toggleWidget } = useWidgetVisibility();
  const [editMode, setEditMode] = useState(false);

  const CARDS = [
    { label: "Toplam Çalışan", value: metrics.totalEmployees, bg: theme.surfaceAlt, color: theme.textPrimary },
    { label: "Açık Risk", value: metrics.openRisks, bg: theme.pendingBg, color: theme.pendingText },
    { label: "Kritik Risk", value: metrics.criticalRisks, bg: theme.highRiskBg, color: theme.highRiskText },
    { label: "Yaklaşan Kontroller", value: metrics.upcomingChecks, bg: theme.warnBg, color: theme.warnText },
    { label: "Tamamlanan Eğitim", value: `${metrics.completedTrainings}/${metrics.totalTrainings}`, bg: theme.successBg, color: theme.successText },
    { label: "Son AI Analizleri", value: metrics.recentAiAnalyses, bg: theme.surfaceAlt, color: theme.textPrimary },
    { label: "Risk Kapanma Süresi", value: metrics.avgClosureDays !== null ? `${metrics.avgClosureDays} gün` : "—", bg: theme.surfaceAlt, color: theme.textPrimary },
    { label: "Ortalama Risk Puanı", value: fineKinneyEntries.length > 0 ? metrics.avgRiskScore : "—", bg: theme.surfaceAlt, color: theme.textPrimary },
    { label: "Aktif Düzeltici Faaliyet", value: metrics.activeCorrectiveActions, bg: theme.pendingBg, color: theme.pendingText },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-2 gap-2">
        <DashboardExportButtons theme={theme} cards={CARDS} />
        <button onClick={() => setEditMode((v) => !v)} className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-full shrink-0"
          style={{ background: theme.surfaceAlt, color: theme.textMuted, border: `1px solid ${theme.border}` }}>
          {editMode ? <X style={{ fontSize: "11px" }} /> : <Settings style={{ fontSize: "11px" }} />}
          {editMode ? "Bitti" : "Widget'ları Düzenle"}
        </button>
      </div>

      {editMode && (
        <div className="rounded-xl border px-4 py-3 mb-4 flex flex-wrap gap-2" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
          {DASHBOARD_WIDGETS.map((w) => (
            <button key={w.id} onClick={() => toggleWidget(w.id)} className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full flex items-center gap-1"
              style={isVisible(w.id) ? { background: theme.accent, color: theme.onAccent } : { background: theme.surface, color: theme.textFaint, border: `1px solid ${theme.border}` }}>
              {isVisible(w.id) ? "✓" : "○"} {w.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {isVisible("safetyScore") && <SafetyScoreCard theme={theme} safetyScore={safetyScore} />}
        {isVisible("last30DayChange") && <Last30DaysChangeCard theme={theme} change={last30DayChange} />}
        {isVisible("executiveSummary") && <ExecutiveSummaryCard theme={theme} weeklySummary={weeklySummary} />}
        {isVisible("accidentStreak") && <StreakCounterCard theme={theme} streak={accidentFreeStreak} />}

        {isVisible("attentionNeeded") && (
          <DashboardWidget theme={theme} title="Dikkat Gerektirenler" icon={ClipboardList}
            description="Yaklaşan/geciken düzeltici faaliyetler ve periyodik kontroller, en acil olandan başlayarak tek listede.">
            <AttentionNeededPanel theme={theme} fineKinneyEntries={fineKinneyEntries} periodicChecks={periodicChecks} />
          </DashboardWidget>
        )}

        {isVisible("departmentTrendAlert") && (
          <DashboardWidget theme={theme} title="Departman Risk Trend Uyarısı" icon={ShieldAlert}
            description="Son 30 günde önceki 30 güne göre risk kaydı artan departmanlar — erken müdahale için.">
            <DepartmentTrendAlertCard theme={theme} fineKinneyEntries={fineKinneyEntries} departments={departments} />
          </DashboardWidget>
        )}

        {isVisible("legislationImpact") && (
          <DashboardWidget theme={theme} title="Mevzuat Değişikliği Uyarısı" icon={Scale}
            description="Son 90 günde güncellenen mevzuatla anahtar kelimede örtüşen açık risk kayıtları.">
            <LegislationImpactCard theme={theme} fineKinneyEntries={fineKinneyEntries} />
          </DashboardWidget>
        )}

        {isVisible("trainingComplianceList") && (
          <DashboardWidget theme={theme} title="Eğitim Uyum Listesi" icon={Users}
            description="Hangi çalışan hangi eğitimi henüz tamamlamadı — denetimde ibraz edilebilir liste.">
            <TrainingComplianceListCard theme={theme} employees={employees} trainingProgressRecords={trainingProgressRecords} trainingCompletionRecords={trainingCompletionRecords} />
          </DashboardWidget>
        )}

        {isVisible("criticalRisks") && (
          <DashboardWidget theme={theme} title="Açık Kritik Riskler" icon={ShieldAlert}
            description="Durumu 'Tamamlandı' olmayan, Fine-Kinney puanı Yüksek/Çok Yüksek seviyedeki riskler.">
            <CriticalRisksCard fineKinneyEntries={fineKinneyEntries} />
          </DashboardWidget>
        )}

        {isVisible("upcomingChecksList") && (
          <DashboardWidget theme={theme} title="Yaklaşan Periyodik Kontroller" icon={ListChecks}
            description="Süresi geçmiş veya önümüzdeki günlerde yaklaşan kontroller, en yakın tarihten başlayarak.">
            <UpcomingChecksCard theme={theme} periodicChecks={periodicChecks} />
          </DashboardWidget>
        )}

        {isVisible("kpiCards") && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CARDS.map((c) => (
              <div key={c.label} className="rounded-lg p-3" style={{ background: c.bg }}>
                <p className="text-[10.5px]" style={{ color: theme.textFaint }}>{c.label}</p>
                <p className="text-xl font-bold" style={{ color: c.color }}>{c.value}</p>
              </div>
            ))}
          </div>
        )}

        {isVisible("workflowPipeline") && (
          <DashboardWidget theme={theme} title="Risk Workflow">
            <WorkflowPipelinePanel theme={theme} fineKinneyEntries={fineKinneyEntries} />
          </DashboardWidget>
        )}

        {isVisible("departmentBreakdown") && (
          <DashboardWidget theme={theme} title="Departman Bazlı Risk Dağılımı">
            <DepartmentRiskBreakdown theme={theme} fineKinneyEntries={fineKinneyEntries} departments={departments} />
          </DashboardWidget>
        )}

        {isVisible("departmentHeatMap") && (
          <DashboardWidget theme={theme} title="Risk Isı Haritası" icon={ShieldAlert}
            description="Kayıt sayısına değil, ortalama risk şiddetine göre — en tehlikeli bölüm en üstte.">
            <DepartmentHeatMap fineKinneyEntries={fineKinneyEntries} departments={departments}
              periodicChecks={periodicChecks} notifications={notifications} employees={employees}
              trainingProgressRecords={trainingProgressRecords} trainingCompletionRecords={trainingCompletionRecords} />
          </DashboardWidget>
        )}

        {isVisible("auditPackage") && (
          <DashboardWidget theme={theme} title="Denetim Dosyası" icon={ListChecks}>
            <AuditPackageButton theme={theme} fineKinneyEntries={fineKinneyEntries} periodicChecks={periodicChecks}
              trainingStats={trainingStats} companyName={company?.name} documents={documents} />
          </DashboardWidget>
        )}

        {isVisible("periodicCheckOverview") && (
          <DashboardWidget theme={theme} title="Periyodik Kontrol Özeti" icon={ListChecks}>
            <PeriodicCheckOverviewPanel theme={theme} periodicChecks={periodicChecks} />
          </DashboardWidget>
        )}

        {isVisible("trends") && (
          <DashboardWidget theme={theme} title="Trend Analizi">
            <TrendsPanel theme={theme} metrics={metrics} />
          </DashboardWidget>
        )}

        {isVisible("correctiveActions") && (
          <DashboardWidget theme={theme} title="Düzeltici Faaliyetler" icon={ListChecks}>
            <CorrectiveActionsPanel theme={theme} fineKinneyEntries={fineKinneyEntries} />
          </DashboardWidget>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {isVisible("riskAnalyses") && (
            <DashboardWidget theme={theme} title="Risk Analizleri">
              {riskAnalyses.length === 0 ? (
                <EmptyState icon={ShieldAlert} title="Onaylanmış risk analizi yok" />
              ) : (
                <div className="grid gap-2">
                  {riskAnalyses.map((n) => (
                    <div key={n.id} className="rounded-lg border px-3 py-2.5" style={{ borderColor: theme.border, background: theme.surface }}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm" style={{ color: theme.textPrimary }}>{n.desc}</p>
                        <Badge tone="success">Onaylı</Badge>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: theme.textFaint }}>{n.date}</p>
                    </div>
                  ))}
                </div>
              )}
            </DashboardWidget>
          )}

          {isVisible("employees") && (
            <DashboardWidget theme={theme} title="Çalışanlar" icon={Users}>
              {employees.length === 0 ? (
                <EmptyState icon={Users} title="Henüz çalışan eklenmedi" action={<Link to="/settings" className="text-xs font-semibold" style={{ color: theme.accent }}>Ayarlar'dan ekle →</Link>} />
              ) : (
                <div className="grid gap-2">
                  {employees.slice(0, 5).map((e) => (
                    <div key={e.id} className="rounded-lg border px-3 py-2 flex items-center justify-between" style={{ borderColor: theme.border, background: theme.surface }}>
                      <div>
                        <p className="text-sm" style={{ color: theme.textPrimary }}>{e.fullName}</p>
                        <p className="text-xs" style={{ color: theme.textFaint }}>{e.position || "—"}</p>
                      </div>
                      <Badge tone={e.status === "active" ? "success" : "neutral"}>{e.status === "active" ? "Aktif" : "Pasif"}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </DashboardWidget>
          )}
        </div>

        {isVisible("education") && (
          <DashboardWidget theme={theme} title="Devam Eden Eğitimler"
            description="Video izleme durumuna göre halen 'Devam Ediyor' aşamasındaki katılımcılar, en son aktiviteye göre sıralı.">
            <OngoingTrainingsCard theme={theme} trainingStats={trainingStats} ongoingItems={ongoingTrainingItems} />
          </DashboardWidget>
        )}

        {isVisible("recentActivity") && (
          <DashboardWidget theme={theme} title="Son Aktiviteler" icon={ClipboardList}
            description="Fine-Kinney, Eğitim, Periyodik Kontrol ve diğer modüllerdeki tüm ekleme/güncelleme/silme işlemlerinin tek akışı.">
            {auditLog.length === 0 ? (
              <EmptyState icon={ClipboardList} title="Henüz aktivite kaydı yok" />
            ) : (
              <div className="flex flex-col gap-2">
                {auditLog.slice(0, 5).map((entry) => {
                  const link = getActivityLink(entry.entityType);
                  const Wrapper = link ? Link : "div";
                  const wrapperProps = link ? { to: link } : {};
                  return (
                    <Wrapper key={entry.id} {...wrapperProps} className="rounded-lg border px-3 py-2.5 flex items-start justify-between gap-3" style={{ borderColor: theme.border, background: theme.surface }}>
                      <div className="min-w-0">
                        <p className="text-sm font-medium" style={{ color: theme.textPrimary }}>{entry.actor} — {entry.action}</p>
                        <p className="text-xs truncate" style={{ color: theme.textMuted }}>{entry.details}</p>
                      </div>
                      <span className="text-[10.5px] shrink-0" style={{ color: theme.textFaint }}>{timeAgo(entry.timestamp)}</span>
                    </Wrapper>
                  );
                })}
              </div>
            )}
          </DashboardWidget>
        )}
      </div>
    </div>
  );
}
