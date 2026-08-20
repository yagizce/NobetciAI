// notificationService — REAL browser notifications via the Notification API.
//
// Service Worker v2 (bkz. public/service-worker.js) geri eklendi — bu yüzden
// showLocalNotification() aşağıda artık `registration.showNotification()` yolunu
// kullanabiliyor (sekme arka plandayken de gösterir). SW herhangi bir nedenle
// mevcut değilse (tarayıcı desteklemiyor, kayıt henüz tamamlanmadı vb.), doğrudan
// `new Notification()` fallback'ine sessizce düşer — iki durumda da çalışır.
//
// Scope boundary (intentional, documented): this is *local* notification triggering —
// the app itself decides when to notify while it's open/running. It is NOT a full push
// infrastructure (that would need a backend push server, VAPID keys, and a subscription
// database — e.g. the `web-push` package — which would be a new dependency and a new
// backend concern). If true "notify even when the site is fully closed" is needed later,
// this file is the natural place to add Push API subscription logic.

import { NOTIFICATION_PREFS_STORAGE_KEY, DEFAULT_NOTIFICATION_PREFS } from "../constants/notificationPrefs.js";

export function isNotificationSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * @returns {"granted"|"denied"|"default"|"unsupported"}
 */
export function getNotificationPermission() {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * @returns {Promise<"granted"|"denied"|"default"|"unsupported">}
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

/**
 * Reads the user's notification preferences directly from localStorage.
 * Kept independent from React so non-component code (e.g. this service) can call it
 * without needing the useLocalStorage hook or a context.
 * @returns {typeof DEFAULT_NOTIFICATION_PREFS}
 */
export function getNotificationPrefs() {
  try {
    const stored = localStorage.getItem(NOTIFICATION_PREFS_STORAGE_KEY);
    return stored ? { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(stored) } : DEFAULT_NOTIFICATION_PREFS;
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

/**
 * Shows a real browser notification if permission was granted and the relevant
 * preference is enabled. Silently does nothing otherwise (never throws).
 * @param {keyof typeof DEFAULT_NOTIFICATION_PREFS} prefKey - which preference gates this notification
 * @param {string} title
 * @param {string} body
 */
export async function showLocalNotification(prefKey, title, body) {
  if (!isNotificationSupported() || Notification.permission !== "granted") return;
  const prefs = getNotificationPrefs();
  if (prefKey && !prefs[prefKey]) return;

  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        registration.showNotification(title, { body, icon: "/icon-192.png", badge: "/icon-192.png" });
        return;
      }
    }
    // Fallback: direct Notification constructor (works without a service worker too).
    new Notification(title, { body, icon: "/icon-192.png" });
  } catch (e) {
    console.error("Bildirim gösterilemedi:", e);
  }
}
