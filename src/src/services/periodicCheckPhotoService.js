// periodicCheckPhotoService — QR Kod → Periyodik Kontrol entegrasyonu. Bir kontrol
// yapılırken (örn. yangın tüpü basınç göstergesi okuması) eklenebilen fotoğraf, tıpkı
// riskDetectionPhotoService.js / closureEvidenceService.js'teki gibi ayrı bir store'da
// saklanır — PeriodicCheck yalnızca `photoId` referansını taşır. Aynı desenin üçüncü
// tekrarı: companyScoped: true (bkz. createCrudService.js).

import { createCrudService } from "./createCrudService.js";
import { dataProvider } from "./dataProvider.js";

const { save, remove } = createCrudService("periodicCheckPhotos", { companyScoped: true });

/**
 * @param {string} dataUrl - image/jpeg data URL (bkz. utils/imageCompression.js)
 * @returns {Promise<{id: string, dataUrl: string, companyId: string|number, createdAt: string}>}
 */
export async function savePeriodicCheckPhoto(dataUrl) {
  return save({ dataUrl, createdAt: new Date().toISOString() });
}

/**
 * Firma kapsam kontrolü yapmaz — bkz. riskDetectionPhotoService.js için aynı gerekçe
 * (zaten kaydına erişimi olan kullanıcı fotoğrafına da erişebilmeli).
 * @param {string|null} id
 * @returns {Promise<{id: string, dataUrl: string}|null>}
 */
export async function getPeriodicCheckPhoto(id) {
  if (!id) return null;
  return dataProvider.getById("periodicCheckPhotos", id);
}

/**
 * @param {string} id
 */
export const deletePeriodicCheckPhoto = remove;
