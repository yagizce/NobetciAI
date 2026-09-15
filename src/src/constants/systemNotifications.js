// Header'daki Bildirim Merkezi dropdown'ında kullanılan olay türleri.
// Not: Risk Analizi sayfasındaki "Bildirim Merkezi" (ramak kala/tehlike/kaza iş akışı)
// ile karıştırılmasın — bu tamamen ayrı, genel sistem olayları için.

export const SYSTEM_NOTIFICATION_META = {
  riskCreated: { label: "Yeni Risk", tone: "pending", emoji: "🔵" },
  criticalRisk: { label: "Kritik Risk", tone: "danger", emoji: "🔴" },
  trainingDue: { label: "Eğitim Hatırlatma", tone: "warning", emoji: "🟡" },
  periodicCheckDue: { label: "Periyodik Kontrol", tone: "warning", emoji: "🟡" },
  employeeAdded: { label: "Yeni Çalışan", tone: "success", emoji: "🟢" },
  backupStale: { label: "Yedekleme Hatırlatma", tone: "warning", emoji: "🟡" },
};

export function getNotificationMeta(type) {
  return SYSTEM_NOTIFICATION_META[type] || { label: type, tone: "neutral", emoji: "⚪" };
}
