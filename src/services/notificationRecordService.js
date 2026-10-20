// notificationRecordService — bildirim KAYITLARI için servis katmanı (Bildirim Merkezi'ndeki
// ramak kala/tehlike/iş kazası kayıtları). Tarayıcı push bildirimleriyle (services/notificationService.js)
// karışmasın diye adı farklı — o dosya Notification API'sini sarar, bu dosya veri kaydını sarar.
//
// createCrudService factory'si üzerinden kurulmuştur (companyScoped: true — save()
// companyId yoksa otomatik doldurur, bkz. createCrudService.js).

import { createCrudService } from "./createCrudService.js";
import { isFeatureEnabled, requireFeature } from "../constants/releaseProfile.js";

const { getAll, save } = createCrudService("notifications", { companyScoped: true });

/**
 * @returns {Promise<import("../types/index.js").Notification[]>}
 */
export async function getNotificationRecords() {
  return isFeatureEnabled("employeeReports") ? getAll() : [];
}

/**
 * @param {import("../types/index.js").Notification} notification
 */
export async function saveNotificationRecord(notification) {
  requireFeature("employeeReports");
  return save(notification);
}
