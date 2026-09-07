// Denetim (Audit) durumu ve DİF (Düzeltici İyileştirici Faaliyet) yaşam döngüsü.
import { todayISO, isoDateNDaysFromNow } from "../utils/dateUtils.js";

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

// DİF yaşam döngüsü: Açık → Kök Neden → Aksiyon → Doğrulama → Kapalı.
// Sıra önemli — DifStageStepper.jsx bu sırayı bir stepper olarak gösterir ve
// yalnızca bir sonraki (veya geriye herhangi bir) aşamaya geçişe izin verir.
export const DIF_STAGES = [
  { value: "open", label: "Açık" },
  { value: "rootCause", label: "Kök Neden" },
  { value: "action", label: "Aksiyon" },
  { value: "verification", label: "Doğrulama" },
  { value: "closed", label: "Kapalı" },
];

export function getDifStageIndex(stage) {
  const i = DIF_STAGES.findIndex((s) => s.value === stage);
  return i === -1 ? 0 : i;
}

export function getDifStageMeta(stage) {
  return DIF_STAGES.find((s) => s.value === stage) || DIF_STAGES[0];
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
