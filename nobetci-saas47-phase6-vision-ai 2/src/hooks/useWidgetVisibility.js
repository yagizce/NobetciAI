import { useLocalStorage } from "./useLocalStorage.js";

// Dashboard'daki tüm widget'ların kayıtlı listesi — sırayla render edilir. Yeni bir
// widget eklemek için buraya bir satır eklemek yeterli, görünürlük altyapısı otomatik
// çalışır.
export const DASHBOARD_WIDGETS = [
  { id: "safetyScore", label: "Güvenlik Skoru" },
  { id: "last30DayChange", label: "Son 30 Gün Değişim" }, // Sprint 7.4
  { id: "criticalRisks", label: "Açık Kritik Riskler" }, // Sprint 7.2.4
  { id: "executiveSummary", label: "Yönetici Özeti" },
  { id: "accidentStreak", label: "Kazasız Gün Sayacı" },
  { id: "attentionNeeded", label: "Dikkat Gerektirenler" },
  { id: "upcomingChecksList", label: "Yaklaşan Periyodik Kontroller" }, // Sprint 7.4
  { id: "kpiCards", label: "KPI Kartları" },
  { id: "workflowPipeline", label: "Risk Workflow" },
  { id: "departmentBreakdown", label: "Departman Kırılımı" },
  { id: "departmentHeatMap", label: "Risk Isı Haritası (Departman)" },
  { id: "auditPackage", label: "Denetim Dosyası Oluşturucu" },
  { id: "departmentTrendAlert", label: "Departman Risk Trend Uyarısı" },
  { id: "legislationImpact", label: "Mevzuat Değişikliği Uyarısı" },
  { id: "trainingComplianceList", label: "Eğitim Uyum Listesi (Kim Almadı)" },
  { id: "periodicCheckOverview", label: "Periyodik Kontrol Özeti" },
  { id: "trends", label: "Trend Analizi" },
  { id: "correctiveActions", label: "Düzeltici Faaliyetler" },
  { id: "riskAnalyses", label: "Risk Analizleri" },
  { id: "employees", label: "Çalışanlar" },
  { id: "education", label: "Devam Eden Eğitimler" }, // Sprint 7.4: içerik statik listeden gerçek veriye geçti
  { id: "recentActivity", label: "Son Aktiviteler" },
];

const STORAGE_KEY = "nobetci-dashboard-widget-visibility";

function defaultVisibility() {
  return Object.fromEntries(DASHBOARD_WIDGETS.map((w) => [w.id, true]));
}

/**
 * @returns {{ visibility: Record<string, boolean>, isVisible: (id: string) => boolean, toggleWidget: (id: string) => void }}
 */
export function useWidgetVisibility() {
  const [visibility, setVisibility] = useLocalStorage(STORAGE_KEY, defaultVisibility());

  function isVisible(id) {
    return visibility[id] !== false;
  }

  function toggleWidget(id) {
    setVisibility({ ...visibility, [id]: !isVisible(id) });
  }

  return { visibility, isVisible, toggleWidget };
}
