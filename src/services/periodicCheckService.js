import { createCrudService } from "./createCrudService.js";
import { computeCheckStatus } from "../constants/periodicCheck.js";

// companyScoped: true — save() companyId yoksa getPrimaryCompanyId() ile otomatik
// doldurur (mevcut davranış korunur, bkz. createCrudService.js üstündeki not).
const { getAll: getAllRaw, save, remove } = createCrudService("periodicChecks", { companyScoped: true });

/**
 * BUG FIX: `status` alanı önceden yalnızca kayıt en son KAYDEDİLDİĞİNDE hesaplanıp
 * IndexedDB'ye öyle yazılmış haliyle okunuyordu — yani bir kontrol "Güncel" (ok) olarak
 * kaydedildikten sonra hiç dokunulmazsa, aradan geçen günlerle fiilen "Yaklaşıyor" hatta
 * "Süresi Geçti" duruma gelse bile saklanan alan hep "ok" kalıyordu. Bu, yalnızca
 * `getOverdueOrDueSoonChecks` (tarayıcı bildirimleri) için biliniyor ve orada canlı olarak
 * yeniden hesaplanıyordu — ama Periyodik Kontrol kartları/takvimi/detay paneli, Employer
 * Dashboard'un "Periyodik Kontrol" paneli ve durum filtresi hâlâ bu bayat alana
 * güveniyordu (bkz. constants/periodicCheck.js → getOverdueOrDueSoonChecks üstündeki not,
 * bu uyarı yalnızca o fonksiyon için uygulanmıştı).
 *
 * Düzeltme TEK noktada yapıldı: `getPeriodicChecks()` artık `status`'u her okumada
 * `nextDueDate`'den TAZE hesaplar — bu servisi çağıran HER yer (liste, takvim, detay,
 * dashboard, filtre) otomatik olarak doğru durumu görür, hiçbir tüketici dosyasının
 * ayrıca değiştirilmesi gerekmedi.
 * @returns {Promise<import("../types/index.js").PeriodicCheck[]>}
 */
export async function getPeriodicChecks() {
  const checks = await getAllRaw();
  return checks.map((c) => ({ ...c, status: computeCheckStatus(c.nextDueDate) }));
}

/**
 * @param {import("../types/index.js").PeriodicCheck} check
 */
export const savePeriodicCheck = save;

/**
 * @param {number} id
 */
export const deletePeriodicCheck = remove;
