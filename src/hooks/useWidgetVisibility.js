import { useLocalStorage } from "./useLocalStorage.js";

// Dashboard'daki tüm widget'ların kayıtlı listesi — sırayla render edilir. Yeni bir
// widget eklemek için buraya bir satır eklemek yeterli, görünürlük altyapısı otomatik
// çalışır.
export const DASHBOARD_WIDGETS = [
  { id: "executiveSummaryStrip", label: "Hızlı Özet (Kritik Risk/Kontrol/Eğitim)" },
  { id: "safetyScore", label: "Güvenlik Skoru" },
  { id: "executiveSummary", label: "Yönetici Özeti" },
  { id: "accidentStreak", label: "Kazasız Gün Sayacı" },
  { id: "last30DayChange", label: "Son 30 Gün Değişim" }, // Sprint 7.4
  { id: "attentionNeeded", label: "Dikkat Gerektirenler" },
  { id: "departmentHeatMap", label: "Departman Risk Analizi" },
  { id: "legislationImpact", label: "Mevzuat Değişikliği Uyarısı" },
  { id: "trainingComplianceList", label: "Eğitim Uyum Listesi (Kim Almadı)" },
  { id: "kpiCards", label: "KPI Kartları" },
  { id: "workflowPipeline", label: "Risk Workflow" },
  { id: "auditPackage", label: "Denetim Dosyası Oluşturucu" },
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
