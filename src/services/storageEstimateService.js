// storageEstimateService — Storage API (navigator.storage.estimate) üzerinden bu
// cihazdaki tarayıcı depolama kullanımını (IndexedDB + her şey dahil) tahmini olarak
// okur. HARDENING: önceden kullanıcının depolama limitine ne kadar yaklaştığına dair
// HİÇBİR görünürlüğü yoktu — ilk sinyali bir yazma işlemi gerçekten patlayınca
// (QuotaExceededError, bkz. db.js) alıyordu. Bu servis proaktif bir uyarı imkânı sağlar.
//
// BİLİNÇLİ SINIR: `navigator.storage.estimate()` TARAYICI TAHMİNİDİR, kesin bir sayı
// değildir (MDN: "the estimate may be rounded, may include storage used by data the
// origin no longer needs, and its accuracy may otherwise vary"). Ayrıca eski
// tarayıcılarda (özellikle bazı iOS Safari sürümleri) desteklenmeyebilir — bu yüzden
// her yerde `isStorageEstimateSupported()` ile korunuyor, desteklenmiyorsa arayüz
// SESSİZCE gizlenir (bkz. StorageUsageIndicator.jsx), hata göstermez.

export function isStorageEstimateSupported() {
  return typeof navigator !== "undefined" && Boolean(navigator.storage) && typeof navigator.storage.estimate === "function";
}

/**
 * @returns {Promise<{ usageBytes: number, quotaBytes: number, percentUsed: number } | null>}
 *   Desteklenmiyorsa veya tarayıcı geçerli bir quota döndürmezse null.
 */
export async function getStorageEstimate() {
  if (!isStorageEstimateSupported()) return null;
  try {
    const { usage, quota } = await navigator.storage.estimate();
    if (typeof usage !== "number" || typeof quota !== "number" || quota <= 0) return null;
    return { usageBytes: usage, quotaBytes: quota, percentUsed: Math.round((usage / quota) * 100) };
  } catch (err) {
    console.error("Depolama tahmini alınamadı:", err);
    return null;
  }
}

/**
 * Saf fonksiyon — birim testi mümkün.
 * @param {number} percentUsed
 * @returns {{ label: string, tone: "success"|"warning"|"danger" }}
 */
export function getStorageUsageLevel(percentUsed) {
  if (percentUsed >= 90) return { label: "Kritik", tone: "danger" };
  if (percentUsed >= 70) return { label: "Yüksek", tone: "warning" };
  return { label: "Normal", tone: "success" };
}

/**
 * @param {number} bytes
 * @returns {string} ör. "127 MB", "1.2 GB"
 */
export function formatStorageBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 MB";
  const mb = bytes / 1024 / 1024;
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
}
