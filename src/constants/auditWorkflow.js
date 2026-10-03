// Denetim (Audit) durumu ve DİF (Düzeltici İyileştirici Faaliyet) yaşam döngüsü.
import { todayISO, isoDateNDaysFromNow } from "../utils/dateUtils.js";
import { canManageAudits } from "../utils/permissions.js";

export const AUDIT_STATUSES = [
  { value: "planned", label: "Planlandı", tone: "pending" },
  { value: "ongoing", label: "Devam Ediyor", tone: "warning" },
  { value: "completed", label: "Tamamlandı", tone: "success" },
];

export function getAuditStatusMeta(value) {
  return AUDIT_STATUSES.find((s) => s.value === value) || AUDIT_STATUSES[0];
}

/**
 * @param {import("../types/index.js").Audit} audit
 * @returns {"planned"|"ongoing"|"completed"}
 */
export function computeAuditStatus(audit) {
  if (audit.completedAt) return "completed";
  if (audit.plannedDate && audit.plannedDate > todayISO()) return "planned";
  return "ongoing";
}

// DİF (Düzeltici İyileştirici Faaliyet) yaşam döngüsü — 4 durum: Açık → Aksiyon
// Bekliyor → İnceleme Bekliyor → Kapatıldı. "İnceleme Bekliyor"dan "Aksiyon
// Bekliyor"a geri dönülebilir; "Kapatıldı"dan yalnızca "Yeniden Aç" eylemiyle
// çıkılabilir. TEK KAYNAK: bu dosyadaki `canTransitionDifStage` — UI (DifDetailDrawer.jsx)
// ve servis katmanı (auditManagementService.js) durum değiştirmeden ÖNCE MUTLAKA
// bunu çağırır; UI'da bir butonun gizlenmesi/pasifleşmesi yalnızca kullanıcı
// deneyimi içindir, gerçek geçerlilik kontrolü HER ZAMAN burada yapılır.
export const DIF_STAGES = [
  { value: "open", label: "Açık" },
  { value: "awaitingAction", label: "Aksiyon Bekliyor" },
  { value: "pendingReview", label: "İnceleme Bekliyor" },
  { value: "closed", label: "Kapatıldı" },
];

// Geçiş grafiği: hangi durumdan hangi durum(lar)a geçilebilir. "closed" → "awaitingAction"
// burada da yer alır çünkü grafik olarak izinlidir — ama canTransitionDifStage bu
// geçişi ayrıca `isReopenAction` bayrağı olmadan REDDEDER (bkz. aşağıdaki fonksiyon),
// böylece "Kapatıldı"dan çıkışın yalnızca özel "Yeniden Aç" eylemiyle mümkün olması
// tek bir yerde (grafik + ek koşul) garanti edilir.
const ALLOWED_TRANSITIONS = {
  open: ["awaitingAction"],
  awaitingAction: ["pendingReview"],
  pendingReview: ["closed", "awaitingAction"],
  closed: ["awaitingAction"],
};

export function getDifStageIndex(stage) {
  const i = DIF_STAGES.findIndex((s) => s.value === stage);
  return i === -1 ? 0 : i;
}

export function getDifStageMeta(stage) {
  return DIF_STAGES.find((s) => s.value === stage) || DIF_STAGES[0];
}

/**
 * MERKEZİ durum geçişi doğrulaması — `mevcutDurum + hedefDurum + kullanıcı/yetki +
 * gerekli alanlar` tek fonksiyonda kontrol edilir. Hiçbir UI bileşeni veya servis
 * fonksiyonu kendi geçiş mantığını YENİDEN TANIMLAMAZ, hepsi bunu çağırır.
 *
 * @param {{
 *   fromStage: string,
 *   toStage: string,
 *   dif: import("../types/index.js").AuditFinding,
 *   patch?: object,               // bu geçişle birlikte yazılacak alanlar (ör. closureNote)
 *   actorRole: string,            // "expert" | "employer" | "employee"
 *   company?: { expertIsEmployer?: boolean }|null,
 *   isReopenAction?: boolean,     // yalnızca "Yeniden Aç" eylemi bunu true geçer
 * }} input
 * @returns {{ allowed: boolean, reason: string|null }}
 */
export function canTransitionDifStage({ fromStage, toStage, dif, patch = {}, actorRole, company, isReopenAction = false }) {
  if (fromStage === toStage) {
    return { allowed: false, reason: "Zaten bu durumda." };
  }

  const allowedTargets = ALLOWED_TRANSITIONS[fromStage] || [];
  if (!allowedTargets.includes(toStage)) {
    return { allowed: false, reason: `${getDifStageMeta(fromStage).label} durumundan ${getDifStageMeta(toStage).label} durumuna geçiş yapılamaz.` };
  }

  // Kapatıldı → Aksiyon Bekliyor grafikte izinli ama YALNIZCA "Yeniden Aç" eylemiyle.
  if (fromStage === "closed" && toStage === "awaitingAction" && !isReopenAction) {
    return { allowed: false, reason: "Kapatılmış bir DİF yalnızca \"Yeniden Aç\" işlemiyle tekrar açılabilir." };
  }

  // Tüm DİF durum değişiklikleri yetkili kullanıcı gerektirir — Fine-Kinney ile
  // AYNI kural (bkz. utils/permissions.js → canManageAudits).
  if (!canManageAudits(actorRole, company)) {
    return { allowed: false, reason: "Bu işlem için yetkiniz yok — DİF yönetimi İSG Uzmanı'na özgüdür." };
  }

  const merged = { ...dif, ...patch };

  if (fromStage === "open" && toStage === "awaitingAction" && !merged.correctiveAction?.trim()) {
    return { allowed: false, reason: "Düzeltici faaliyet girilmeden \"Aksiyon Bekliyor\" durumuna geçilemez." };
  }

  if (fromStage === "awaitingAction" && toStage === "pendingReview") {
    if (!merged.actionCompleted) {
      return { allowed: false, reason: "Aksiyon tamamlandı olarak işaretlenmeden \"İnceleme Bekliyor\" durumuna geçilemez." };
    }
    if (!merged.actionEvidence?.trim()) {
      return { allowed: false, reason: "Aksiyonun açıklaması/kanıtı girilmeden \"İnceleme Bekliyor\" durumuna geçilemez." };
    }
  }

  if (fromStage === "pendingReview" && toStage === "closed" && !merged.closureNote?.trim()) {
    return { allowed: false, reason: "Kapanış açıklaması girilmeden DİF kapatılamaz." };
  }

  if (fromStage === "closed" && toStage === "awaitingAction" && !merged.reopenReason?.trim()) {
    return { allowed: false, reason: "Yeniden açma nedeni girilmeden DİF yeniden açılamaz." };
  }

  return { allowed: true, reason: null };
}

/**
 * Onaylanmış (canTransitionDifStage → allowed:true) bir geçişi SAF (I/O'suz)
 * olarak DİF nesnesine uygular; yeni durumu, patch'i, closedAt'i ve geçiş
 * geçmişi kaydını hesaplayıp YENİ bir nesne döner. I/O'dan (id/tarih üretimi)
 * bilinçli olarak ayrıştırıldı ki DB'ye dokunmadan test edilebilsin — servis
 * katmanı (auditManagementService.js) yalnızca sonucu veritabanına yazar.
 *
 * @param {import("../types/index.js").AuditFinding} dif
 * @param {string} newStage
 * @param {{ patch?: object, actorLabel: string, reason?: string|null, historyEntryId: string|number, now: string }} options
 * @returns {import("../types/index.js").AuditFinding}
 */
export function applyDifTransition(dif, newStage, { patch = {}, actorLabel, reason = null, historyEntryId, now }) {
  const historyEntry = { id: historyEntryId, from: dif.stage, to: newStage, at: now, actor: actorLabel, reason: reason || null };
  return {
    ...dif,
    ...patch,
    stage: newStage,
    closedAt: newStage === "closed" ? (dif.closedAt || now) : (dif.stage === "closed" ? null : dif.closedAt),
    history: [...(dif.history || []), historyEntry],
  };
}

// DİF detay çekmecesinde KULLANICININ düzenlediği alanlar. Kalıcı yazımda yalnızca bunlar
// TAZE DİF kaydının üstüne uygulanır — çekmecenin yerel `fields` kopyası bir aşama
// geçişinden sonra bayat kalır (stage/history/closedAt eski), bütün nesneyi yazmak DİF'i
// eski aşamaya döndürüp geçiş geçmişini silerdi.
export const DIF_EDITABLE_FIELDS = ["responsible", "dueDate", "rootCause", "correctiveAction", "actionCompleted", "actionEvidence", "closureNote"];

/**
 * @param {object} fields
 * @returns {object} yalnızca düzenlenebilir (ve mevcut) alanlar
 */
export function pickDifEditableFields(fields) {
  const out = {};
  for (const key of DIF_EDITABLE_FIELDS) {
    if (fields && key in fields) out[key] = fields[key];
  }
  return out;
}

/**
 * @param {import("../types/index.js").AuditFinding} freshDif - güncel kayıt (aşama, geçmiş, kanıtlar)
 * @param {object} fields - çekmecedeki düzenlenebilir alan değerleri (bayat olabilir)
 * @returns {import("../types/index.js").AuditFinding}
 */
export function mergeDifEditableFields(freshDif, fields) {
  return { ...freshDif, ...pickDifEditableFields(fields) };
}

/**
 * @param {import("../types/index.js").AuditFinding} dif
 * @returns {boolean}
 */
export function isDifOverdue(dif) {
  if (dif.stage === "closed" || !dif.dueDate) return false;
  return dif.dueDate < todayISO();
}

/**
 * Termine göre yaklaşan/geciken DİF'leri döner — hatırlatma/bildirim sistemleri
 * (bkz. useReminderScheduler.js'teki periyodik kontrol deseni) için hazırdır.
 * @param {import("../types/index.js").AuditFinding[]} findings
 * @param {number} thresholdDays
 */
export function getDueSoonOrOverdueDifs(findings, thresholdDays = 3) {
  const today = todayISO();
  const soonIso = isoDateNDaysFromNow(thresholdDays);
  return (findings || []).filter((f) => {
    if (f.stage === "closed" || !f.dueDate) return false;
    return f.dueDate < today || f.dueDate <= soonIso;
  });
}

/**
 * Kapatılmış DİF'lerin ortalama kapanma süresini (gün) ve gecikme oranını hesaplar.
 * Sprint isteği: "Ortalama kapatma süresi ve gecikme metrikleri".
 * @param {import("../types/index.js").AuditFinding[]} findings
 * @returns {{ avgClosureDays: number|null, delayedRate: number|null, closedCount: number, openCount: number }}
 */
export function computeDifClosureMetrics(findings) {
  const all = findings || [];
  const closed = all.filter((f) => f.stage === "closed" && f.openedAt && f.closedAt);
  const openCount = all.filter((f) => f.stage !== "closed").length;

  if (closed.length === 0) {
    return { avgClosureDays: null, delayedRate: null, closedCount: 0, openCount };
  }

  const totalDays = closed.reduce((sum, f) => {
    const days = Math.round((new Date(f.closedAt) - new Date(f.openedAt)) / (1000 * 60 * 60 * 24));
    return sum + Math.max(0, days);
  }, 0);
  const delayedCount = closed.filter((f) => f.dueDate && f.closedAt > f.dueDate).length;

  return {
    avgClosureDays: Math.round(totalDays / closed.length),
    delayedRate: Math.round((delayedCount / closed.length) * 100),
    closedCount: closed.length,
    openCount,
  };
}
