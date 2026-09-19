// closureEvidenceService — Düzeltici Faaliyet Kanıt Zorunluluğu sprinti. Bir
// Fine-Kinney kaydı "Kapandı" işaretlenirken eklenebilen kanıt fotoğrafı, tıpkı Risk
// Tespiti fotoğrafları gibi (bkz. riskDetectionPhotoService.js) ayrı bir store'da
// saklanır — FineKinneyEntry yalnızca `closurePhotoId` referansını taşır. Aynı
// desenin tekrarı: companyScoped: true (bkz. createCrudService.js).

import { createCrudService } from "./createCrudService.js";
import { dataProvider } from "./dataProvider.js";

const { save, remove } = createCrudService("closureEvidencePhotos", { companyScoped: true });

/**
 * @param {string} dataUrl - image/jpeg data URL (bkz. utils/imageCompression.js)
 * @returns {Promise<{id: string, dataUrl: string, companyId: string|number, createdAt: string}>}
 */
export async function saveClosureEvidencePhoto(dataUrl) {
  return save({ dataUrl, createdAt: new Date().toISOString() });
}

/**
 * Firma kapsam kontrolü yapmaz — bkz. riskDetectionPhotoService.js → getRiskDetectionPhoto
 * için aynı gerekçe (zaten kaydına erişimi olan kullanıcı fotoğrafına da erişebilmeli).
 * @param {string|null} id
 * @returns {Promise<{id: string, dataUrl: string}|null>}
 */
export async function getClosureEvidencePhoto(id) {
  if (!id) return null;
  return dataProvider.getById("closureEvidencePhotos", id);
}

/**
 * @param {string} id
 */
export const deleteClosureEvidencePhoto = remove;
