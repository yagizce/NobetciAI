// Phase 9.1 — Risk Tespiti (triage havuzu). Kategoriler bilinçli olarak dar tutuldu:
// ROADMAP.md → Phase 9.2'de "Türkiye kaza istatistiklerinde en sık görülen 3-4 kategori"
// ile başlanması önerilmişti; burada kamerasız/mock aşama olduğu için 6'ya çıkarıldı
// ama hâlâ gerçekçi, sektörden bağımsız, somut kategorilerle sınırlı — jenerik/uydurma
// "AI tehlike listesi" değil.

export const RISK_DETECTION_CATEGORIES = [
  { value: "ppe", label: "KKD Eksikliği" },
  { value: "forkliftProximity", label: "Forklift–İnsan Yakınlığı" },
  { value: "fallRisk", label: "Düşme / Yüksekte Çalışma Riski" },
  { value: "confinedSpace", label: "Kapalı Alan Girişi" },
  { value: "fireSmoke", label: "Yangın / Duman Tespiti" },
  { value: "improperStacking", label: "Uygunsuz İstifleme / Depolama" },
];

export function getDetectionCategoryLabel(value) {
  return RISK_DETECTION_CATEGORIES.find((c) => c.value === value)?.label || value;
}

// Demo/simülasyon modunda ve manuel "hızlı ekle" akışında kullanılan, sektörden
// bağımsız genel konum havuzu — gerçek kamera entegrasyonunda (Phase 9.2) bunun yerini
// gerçek kamera/bölge adları alacak.
export const MOCK_DETECTION_LOCATIONS = [
  "Depo A — Giriş", "Depo B — Raf Alanı", "Üretim Hattı 1", "Üretim Hattı 2",
  "Yükleme Rampası", "Kazan Dairesi", "Saha Ana Girişi", "Otopark — Forklift Yolu",
];

export const DETECTION_STATUS_META = {
  new: { label: "Yeni" },
  reviewing: { label: "İncelemede" },
  converted: { label: "Dönüştürüldü" },
  dismissed: { label: "Reddedildi" },
};

export function getDetectionStatusStyle(status, theme) {
  if (status === "new") return { label: "Yeni", bg: theme.pendingBg, text: theme.pendingText };
  if (status === "reviewing") return { label: "İncelemede", bg: theme.warnBg, text: theme.warnText };
  if (status === "converted") return { label: "Dönüştürüldü", bg: theme.successBg, text: theme.successText };
  return { label: "Reddedildi", bg: theme.surfaceAlt, text: theme.textFaint };
}

/**
 * Panelin üst özet şeridi için. Her zaman TÜM kayıtlar üzerinden (filtreden bağımsız)
 * hesaplanmalı — bkz. Sprint 7.2.3/7.2.4'teki aynı ilke.
 * @param {import("../types/index.js").RiskDetection[]} detections
 */
export function computeRiskDetectionStats(detections) {
  let newCount = 0, reviewingCount = 0, convertedCount = 0, dismissedCount = 0;
  for (const d of detections) {
    if (d.status === "new") newCount += 1;
    else if (d.status === "reviewing") reviewingCount += 1;
    else if (d.status === "converted") convertedCount += 1;
    else if (d.status === "dismissed") dismissedCount += 1;
  }
  return { newCount, reviewingCount, convertedCount, dismissedCount, openCount: newCount + reviewingCount, totalCount: detections.length };
}
