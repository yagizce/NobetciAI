// Periyodik kontrol modülü — kategoriler ve durum hesaplama mantığı.
// "Yaklaşan" eşiği: sonraki kontrole 14 gün veya daha az kaldıysa.

import { toLocalIsoDate } from "../utils/dateUtils.js";

export const CHECK_CATEGORIES = [
  { value: "fireExtinguisher", label: "Yangın Tüpü" },
  { value: "equipment", label: "Ekipman" },
  { value: "electrical", label: "Elektrik Tesisatı" },
  { value: "scaffolding", label: "İskele / Platform" },
  { value: "other", label: "Diğer" },
];

export const INTERVAL_PRESETS = [
  { value: 30, label: "30 gün (Aylık)" },
  { value: 90, label: "90 gün (3 Aylık)" },
  { value: 180, label: "180 gün (6 Aylık)" },
  { value: 365, label: "365 gün (Yıllık)" },
];

export function getCategoryLabel(value) {
  return CHECK_CATEGORIES.find((c) => c.value === value)?.label || value;
}

const UPCOMING_THRESHOLD_DAYS = 14;
export const MIN_INTERVAL_DAYS = 1;
export const MAX_INTERVAL_DAYS = 3650; // 10 yıl; hatalı/istismar edilmiş değerlerin kontrolden çıkmasını önler.

export function normalizeIntervalDays(value, fallback = 30) {
  const parsed = Number(value);
  const safeFallback = Math.min(MAX_INTERVAL_DAYS, Math.max(MIN_INTERVAL_DAYS, Math.round(Number(fallback) || 30)));
  if (!Number.isFinite(parsed)) return safeFallback;
  return Math.min(MAX_INTERVAL_DAYS, Math.max(MIN_INTERVAL_DAYS, Math.round(parsed)));
}
// Hatırlatma bildirimleri için daha dar bir eşik — 14 günlük "yaklaşan" rozetinden
// AYRI: her gün bildirim göndermemek için yalnızca gerçekten yakın olanlar (≤3 gün)
// veya süresi geçmiş olanlar bildirim tetikler. Bkz. useReminderScheduler.js.
const REMINDER_THRESHOLD_DAYS = 3;

/**
 * @param {string} lastCheckDate - ISO date (YYYY-MM-DD)
 * @param {number} intervalDays
 * @returns {string} ISO date
 */
export function computeNextDueDate(lastCheckDate, intervalDays) {
  const parsedBase = lastCheckDate ? new Date(`${lastCheckDate}T00:00:00`) : new Date();
  const base = Number.isNaN(parsedBase.getTime()) ? new Date() : parsedBase;
  base.setDate(base.getDate() + normalizeIntervalDays(intervalDays));
  // RİSK TEMİZLİĞİ: `toISOString()` (UTC) yerine `toLocalIsoDate` (yerel) — bkz.
  // utils/dateUtils.js. `lastCheckDate` verilmeden (yeni kayıt, "bugün" baz alınarak)
  // gece 00:00-02:59 arası (Türkiye saati) çağrılırsa, eski kod bir gün ERKEN bir
  // sonraki kontrol tarihi üretebiliyordu.
  return toLocalIsoDate(base);
}

/**
 * @param {string} nextDueDate - ISO date
 * @returns {"ok"|"upcoming"|"overdue"}
 */
export function computeCheckStatus(nextDueDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(nextDueDate);
  const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "overdue";
  if (diffDays <= UPCOMING_THRESHOLD_DAYS) return "upcoming";
  return "ok";
}

/**
 * @param {"ok"|"upcoming"|"overdue"} status
 * @param {"light"|"dark"} mode
 * @param {object} theme - the active THEMES[mode] object, for consistent shared tokens
 * @returns {{ label: string, bg: string, text: string }}
 */
export function getCheckStatusStyle(status, theme) {
  if (status === "overdue") return { label: "Süresi Geçti", bg: theme.highRiskBg, text: theme.highRiskText };
  if (status === "upcoming") return { label: "Yaklaşıyor", bg: theme.warnBg, text: theme.warnText };
  return { label: "Güncel", bg: theme.successBg, text: theme.successText };
}

/**
 * Sprint 7.2.3 — Periyodik Kontrol Merkezi'nin üst özet kartları VE ileride
 * Employer Dashboard'un tüketebileceği hazır istatistikler için tek yer.
 * Tamamen gerçek `checks` verisinden hesaplanır, uydurma/temsili sayı yoktur.
 * @param {import("../types/index.js").PeriodicCheck[]} checks
 * @returns {{
 *   overdueCount: number, dueTodayCount: number, dueThisWeekCount: number,
 *   completedThisMonthCount: number, upcomingCount: number, okCount: number,
 *   totalCount: number, completionRate: number,
 * }}
 */
export function computePeriodicCheckStats(checks) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = toLocalIsoDate(today);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndIso = toLocalIsoDate(weekEnd);
  const monthPrefix = todayIso.slice(0, 7); // "YYYY-MM"

  let overdueCount = 0, dueTodayCount = 0, dueThisWeekCount = 0, completedThisMonthCount = 0, upcomingCount = 0, okCount = 0;

  for (const c of checks) {
    if (c.status === "overdue") overdueCount += 1;
    if (c.status === "upcoming") upcomingCount += 1;
    if (c.status === "ok") okCount += 1;
    if (c.nextDueDate === todayIso) dueTodayCount += 1;
    if (c.nextDueDate && c.nextDueDate >= todayIso && c.nextDueDate <= weekEndIso) dueThisWeekCount += 1;
    if (c.lastCheckDate && c.lastCheckDate.slice(0, 7) === monthPrefix) completedThisMonthCount += 1;
  }

  const totalCount = checks.length;
  const completionRate = totalCount > 0 ? Math.round((okCount / totalCount) * 100) : 0;

  return { overdueCount, dueTodayCount, dueThisWeekCount, completedThisMonthCount, upcomingCount, okCount, totalCount, completionRate };
}

/**
 * Bildirim/Hatırlatma sistemi (useReminderScheduler.js) için: süresi geçmiş VEYA
 * REMINDER_THRESHOLD_DAYS (3 gün) içinde süresi dolacak kontrolleri döner.
 *
 * ÖNEMLİ: `check.status` alanına GÜVENMEZ — bu alan yalnızca kayıt en son
 * kaydedildiğinde hesaplanmış bir anlık görüntüdür (bkz. usePeriodicChecks.js →
 * saveCheck) ve zamanla BAYATLAYABİLİR (örn. "ok" iken hiç dokunulmadan süresi
 * geçebilir). Bunun yerine `nextDueDate`'den HER ÇAĞRIDA canlı olarak yeniden
 * hesaplar — hatırlatmaların her zaman güncel olmasını garantiler.
 *
 * @param {import("../types/index.js").PeriodicCheck[]} checks
 * @returns {Array<{ id: number, itemName: string, nextDueDate: string, status: "overdue"|"upcoming" }>}
 */
export function getOverdueOrDueSoonChecks(checks) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return checks
    .map((c) => {
      const due = new Date(c.nextDueDate);
      const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));
      return { ...c, _diffDays: diffDays, _liveStatus: computeCheckStatus(c.nextDueDate) };
    })
    .filter((c) => c._liveStatus === "overdue" || (c._liveStatus === "upcoming" && c._diffDays <= REMINDER_THRESHOLD_DAYS))
    .map((c) => ({ id: c.id, itemName: c.itemName, nextDueDate: c.nextDueDate, status: c._liveStatus }));
}
