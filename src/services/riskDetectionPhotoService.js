// riskDetectionPhotoService — Phase 6 depolama optimizasyonu. Fotoğraflar artık ilgili
// RiskDetection kaydına GÖMÜLMÜYOR, ayrı bir "riskDetectionPhotos" store'unda BİR KEZ
// saklanıyor (bkz. db.js DB_VERSION 12 notu). Bir fotoğraftan birden fazla tehlike
// bulgusu onaylandığında (bkz. RiskDetectionPanel.jsx → handleConfirmFindings), o
// bulgulardan türeyen tüm RiskDetection kayıtları AYNI photoId'yi referans eder — fotoğraf
// yalnızca bir kez yazılır.
//
// companyScoped: true — diğer tüm servislerle aynı desen (bkz. createCrudService.js):
// bir fotoğraf yalnızca kaydedildiği aktif firmaya ait olur, başka firmaya yazılamaz.

import { createCrudService } from "./createCrudService.js";
import { dataProvider } from "./dataProvider.js";

const { save, remove } = createCrudService("riskDetectionPhotos", { companyScoped: true });

/**
 * @param {string} dataUrl - image/jpeg data URL (bkz. utils/imageCompression.js)
 * @returns {Promise<{id: string, dataUrl: string, companyId: string|number, createdAt: string}>}
 */
export async function saveRiskDetectionPhoto(dataUrl) {
  return save({ dataUrl, createdAt: new Date().toISOString() });
}

/**
 * Firma kapsam kontrolü YAPMAZ — salt okunur bir tekil kayıt getirir. Bilinçli: bir
 * RiskDetection kaydına zaten erişimi olan kullanıcı, o kaydın referans verdiği
 * photoId'ye de erişebilmeli; ayrıca bir firma kontrolü eklemek yalnızca gereksiz bir
 * dataProvider.getAll(...) + filtre adımı ekler (bkz. createCrudService.js'in getAll'ı
 * tüm koleksiyonu döndürüp filtrelemesi — tekil okuma için verimsiz).
 * @param {string|null} id
 * @returns {Promise<{id: string, dataUrl: string}|null>}
 */
export async function getRiskDetectionPhoto(id) {
  if (!id) return null;
  return dataProvider.getById("riskDetectionPhotos", id);
}

/**
 * @param {string} id
 */
export const deleteRiskDetectionPhoto = remove;
