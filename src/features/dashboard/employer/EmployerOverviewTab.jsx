import { useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../../../components/EmptyState.jsx";
import DashboardWidget from "../../../components/DashboardWidget.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import { useWidgetVisibility, DASHBOARD_WIDGETS } from "../../../hooks/useWidgetVisibility.js";
import { timeAgo } from "../../../utils/dateUtils.js";
import { ShieldAlert, Users, ClipboardList, Settings, X, Scale } from "../../../components/icons/index.jsx";
import SafetyScoreCard from "./SafetyScoreCard.jsx";
import ExecutiveSummaryCard from "./ExecutiveSummaryCard.jsx";
import ExecutiveSummaryStrip from "./ExecutiveSummaryStrip.jsx";
import StreakCounterCard from "../StreakCounterCard.jsx";
import WorkflowPipelinePanel from "./WorkflowPipelinePanel.jsx";
import DepartmentHeatMap from "./DepartmentHeatMap.jsx";
import AuditPackageButton from "./AuditPackageButton.jsx";
import LegislationImpactCard from "./LegislationImpactCard.jsx";
import TrainingComplianceListCard from "./TrainingComplianceListCard.jsx";
import AttentionNeededPanel from "./AttentionNeededPanel.jsx";
import DashboardExportButtons from "./DashboardExportButtons.jsx";
import Last30DaysChangeCard from "./Last30DaysChangeCard.jsx";
import OngoingTrainingsCard from "./OngoingTrainingsCard.jsx";
import { getActivityLink } from "../../../constants/activityLink.js";

/**
 * İşveren Dashboard'ının Genel Bakış sekmesi.
 *
 * SADELEŞTİRME NOTU: bu sekme önceden aynı soruyu ("hangi bölüm/kayıt riskli,
 * neye bakmalıyım") birbirinden habersiz, zaman zaman çelişen sayılar veren çok
 * sayıda widget'la cevaplıyordu. Her biri TEK bir widget'a indirgendi ve o widget
 * genişletildi (bkz. ilgili bileşenlerin dosya başı yorumları):
 *   - Departman/kritik risk kırılımı (4 widget) → yalnızca `DepartmentHeatMap`
 *   - Dikkat gerektiren faaliyet/kontrol listeleri (3 widget) → yalnızca `AttentionNeededPanel`
 *   - Ayrı bir "Patron Modu" SEKMESİ → `ExecutiveSummaryStrip` olarak buraya taşındı
 *   - Sahte/temsili "Trend Analizi" widget'ı (Performans sekmesindeki GERÇEK
 *     verilerle çelişiyordu) → tamamen kaldırıldı
 *
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

  // NOT: "Risk Kapanma Süresi" ve "Ortalama Risk Puanı" kartları kaldırıldı —
  // İşveren için soyut/teknik sayılardı (istek üzerine). Altyapıdaki hesaplama
  // (useEmployerDashboardData.js → avgClosureDays/avgRiskScore) bilerek
  // DOKUNULMADAN bırakıldı, yalnızca burada gösterimi kaldırıldı.
  const CARDS = [
    { label: "Toplam Çalışan", value: metrics.totalEmployees, bg: theme.surfaceAlt, color: theme.textPrimary },
    { label: "Son AI Analizleri", value: metrics.recentAiAnalyses, bg: theme.surfaceAlt, color: theme.textPrimary },
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
        {isVisible("executiveSummaryStrip") && <ExecutiveSummaryStrip theme={theme} data={data} />}
        {isVisible("safetyScore") && <SafetyScoreCard theme={theme} safetyScore={safetyScore} />}
        {isVisible("executiveSummary") && <ExecutiveSummaryCard theme={theme} weeklySummary={weeklySummary} />}
        {isVisible("accidentStreak") && <StreakCounterCard theme={theme} streak={accidentFreeStreak} />}
        {isVisible("last30DayChange") && <Last30DaysChangeCard theme={theme} change={last30DayChange} />}

        {isVisible("attentionNeeded") && (
          <DashboardWidget theme={theme} title="Dikkat Gerektirenler" icon={ClipboardList}
            description="Yaklaşan/geciken düzeltici faaliyetler ve periyodik kontroller, en acil olandan başlayarak tek listede.">
            <AttentionNeededPanel theme={theme} fineKinneyEntries={fineKinneyEntries} periodicChecks={periodicChecks} />
          </DashboardWidget>
        )}

        {isVisible("departmentHeatMap") && (
          <DashboardWidget theme={theme} title="Departman Risk Analizi" icon={ShieldAlert}
            description="Kritik (yüksek/çok yüksek) açık risk sayısına göre sıralı — artış uyarısı dahil tek widget.">
            <DepartmentHeatMap fineKinneyEntries={fineKinneyEntries} departments={departments}
              periodicChecks={periodicChecks} notifications={notifications} employees={employees}
              trainingProgressRecords={trainingProgressRecords} trainingCompletionRecords={trainingCompletionRecords} />
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

        {isVisible("kpiCards") && (
          <div className="grid grid-cols-2 gap-2">
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

        {isVisible("auditPackage") && (
          <DashboardWidget theme={theme} title="Denetim Dosyası" icon={ClipboardList}>
            <Link to="/audit" className="rounded-lg border px-3.5 py-3 flex items-center justify-between gap-2 mb-3" style={{ borderColor: theme.accent, background: theme.surfaceAlt }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: theme.textPrimary }}>Denetim Modülü</p>
                <p className="text-[11px]" style={{ color: theme.textFaint }}>ISO 45001 ve İSG Mevzuat denetimi planla, madde bazlı checklist yürüt →</p>
              </div>
            </Link>
            <p className="text-[11px] mb-2" style={{ color: theme.textFaint }}>Aşağıdaki hızlı dışa aktarım, tek bir tarih aralığındaki ham kayıtları PDF/HTML olarak birleştirir — planlı bir ISO denetimi için yukarıdaki modülü kullanın.</p>
            <AuditPackageButton theme={theme} fineKinneyEntries={fineKinneyEntries} periodicChecks={periodicChecks}
              trainingStats={trainingStats} companyName={company?.name} documents={documents} />
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
