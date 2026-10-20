export const NOTIFICATION_PREFS_STORAGE_KEY = "nobetci-notification-prefs";

export const DEFAULT_NOTIFICATION_PREFS = {
  newNotification: true,
  aiAnalysisComplete: true,
  taskAssigned: true,
  criticalRisk: true,
  periodicCheckDue: true,
  trainingDue: true,
  backupStale: true,
};

export const NOTIFICATION_PREF_LABELS = {
  newNotification: "Yeni bildirim geldiğinde",
  aiAnalysisComplete: "AI analizi tamamlandığında",
  taskAssigned: "Bana görev atandığında",
  criticalRisk: "Çok yüksek risk kaydedildiğinde",
  periodicCheckDue: "Periyodik kontrol süresi yaklaşınca/geçince",
  trainingDue: "Eğitim son tarihi yaklaşınca/geçince",
  backupStale: "Yedek alma zamanı geldiğinde",
};

// Kritik risk daha önce genel bildirim tercihini kullanıyordu; eski kapatma tercihini koru.
export function normalizeNotificationPrefs(prefs) {
  return { ...DEFAULT_NOTIFICATION_PREFS, ...prefs,
    criticalRisk: prefs?.criticalRisk ?? prefs?.newNotification ?? DEFAULT_NOTIFICATION_PREFS.criticalRisk };
}
