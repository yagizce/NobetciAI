// systemNotificationService — Header'daki Bildirim Merkezi'nin veri katmanı.
// Service+Repository mimarisine uygun: dataProvider üzerinden IndexedDB'ye yazıyor,
// gerçek backend gelince yalnızca dataProvider'ın implementasyonu değişecek.

import { dataProvider } from "./dataProvider.js";
import { getActiveCompanyId } from "./companyService.js";
import { createId } from "../utils/id.js";

/**
 * @returns {Promise<import("../types/index.js").SystemNotification[]>} en yeni en üstte
 */
export async function getSystemNotifications() {
  const companyId = await getActiveCompanyId();
  if (companyId == null) return [];
  const all = await dataProvider.getAll("systemNotifications", { companyId });
  return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * @param {{ type: string, title: string, message: string }} input
 */
export async function pushSystemNotification({ type, title, message }) {
  const companyId = await getActiveCompanyId();
  if (companyId == null) throw new Error("Bildirim için aktif firma seçilmelidir.");
  return dataProvider.upsert("systemNotifications", {
    id: createId(),
    companyId,
    type,
    title,
    message,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

/**
 * @param {number} id
 */
export async function markNotificationRead(id) {
  const companyId = await getActiveCompanyId();
  if (companyId == null) return null;
  const notif = await dataProvider.getById("systemNotifications", id);
  if (!notif || String(notif.companyId) !== String(companyId)) return null;
  return dataProvider.upsert("systemNotifications", { ...notif, read: true, companyId });
}

/**
 * @param {import("../types/index.js").SystemNotification[]} notifications
 */
export async function markAllNotificationsRead(notifications) {
  const companyId = await getActiveCompanyId();
  if (companyId == null) return;
  const scoped = notifications.filter((notification) => String(notification.companyId) === String(companyId) && !notification.read);
  await Promise.all(scoped.map((notification) => dataProvider.upsert("systemNotifications", { ...notification, read: true, companyId })));
}

// BUG FIX (demo veri temizliği): `ensureSampleTrainingReminders()` buradan kaldırıldı —
// yeni bir firma ilk açıldığında UYDURULMUŞ, o firmayla hiçbir ilgisi olmayan bir
// "Yangın Söndürme eğitiminin tekrarına 5 gün kaldı" bildirimi enjekte ediyordu.
// GERÇEK trainingDue bildirimleri zaten hooks/useReminderScheduler.js tarafından
// gerçek trainingCourseSettings verisinden üretiliyor (bkz. o dosya) — bu fonksiyon
// hem sahte hem de gereksizdi.
