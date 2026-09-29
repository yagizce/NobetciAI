// constants/backup.js — "en son ne zaman yedek alındı" bilgisine HEM BackupSection.jsx
// (Ayarlar sayfasındaki pasif uyarı metni) HEM DE useReminderScheduler.js (arka plan
// taraması, gerçek bir bildirim üretir) ihtiyaç duyuyor. Anahtar adı ve eşik gün sayısı
// iki dosyada AYRI AYRI tanımlanırsa (kopyala-yapıştır), biri değişip diğeri
// unutulduğunda ikisi sessizce birbirinden kopar — tek kaynak burası.

export const LAST_BACKUP_STORAGE_KEY = "nobetci:lastBackupAt";
export const STALE_BACKUP_DAYS = 30;

/**
 * localStorage'dan `useLocalStorage.js` deseniyle (JSON.stringify'lanmış) yazılmış
 * son yedek tarihini okur. Tarayıcı dışı ortamlarda (SSR/test) veya localStorage
 * erişilemezse (gizli sekme vb.) sessizce null döner — çökme yerine "yedek yok"
 * varsayımı, DEVELOPMENT_RULES.md → "emin olmadığın konularda varsayım yapma"
 * ilkesiyle tutarlı (bilinmeyen durumu "risk var" tarafına yuvarlar, tersine değil).
 * @returns {string|null} ISO tarih
 */
export function readLastBackupAt() {
  try {
    const raw = localStorage.getItem(LAST_BACKUP_STORAGE_KEY);
    if (raw === null) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw; // eski/ham (JSON olmayan) bir değer kalmışsa
    }
  } catch {
    return null;
  }
}

/**
 * Saf fonksiyon — birim testi mümkün. `lastBackupAt` yoksa veya STALE_BACKUP_DAYS
 * gün ya da daha eskiyse "bayat" (uyarı/hatırlatma gerektirir) sayılır.
 * @param {string|null} lastBackupAt - ISO tarih veya null
 * @param {number} [nowMs] - test edilebilirlik için enjekte edilebilir "şimdi" (ms)
 * @returns {boolean}
 */
export function isBackupStale(lastBackupAt, nowMs = Date.now()) {
  if (!lastBackupAt) return true;
  const backupTime = new Date(lastBackupAt).getTime();
  if (Number.isNaN(backupTime)) return true; // geçersiz tarih de "bayat" sayılır, çökmez
  const daysSince = Math.floor((nowMs - backupTime) / (1000 * 60 * 60 * 24));
  return daysSince >= STALE_BACKUP_DAYS;
}

/**
 * @param {string|null} lastBackupAt
 * @param {number} [nowMs]
 * @returns {number|null} gün sayısı, lastBackupAt yoksa null
 */
export function daysSinceLastBackup(lastBackupAt, nowMs = Date.now()) {
  if (!lastBackupAt) return null;
  const backupTime = new Date(lastBackupAt).getTime();
  if (Number.isNaN(backupTime)) return null;
  return Math.floor((nowMs - backupTime) / (1000 * 60 * 60 * 24));
}
