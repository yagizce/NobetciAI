export const NOTIFICATION_PREFS_STORAGE_KEY = "nobetci-notification-prefs";

export const DEFAULT_NOTIFICATION_PREFS = {
  newNotification: true,
  aiAnalysisComplete: true,
  taskAssigned: true,
  periodicCheckDue: true,
  trainingDue: true,
};

export const NOTIFICATION_PREF_LABELS = {
  newNotification: "Yeni bildirim geldiğinde",
  aiAnalysisComplete: "AI analizi tamamlandığında",
  taskAssigned: "Bana görev atandığında",
  periodicCheckDue: "Periyodik kontrol süresi yaklaşınca/geçince",
  trainingDue: "Eğitim son tarihi yaklaşınca/geçince",
};
