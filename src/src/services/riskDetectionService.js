// riskDetectionService — Risk Tespiti (triage havuzu) depolaması, diğer tüm servisler
// gibi soyut dataProvider üzerinden (bkz. dataProvider.js), createCrudService factory'si
// aracılığıyla. Fine-Kinney'den ayrı bir koleksiyon ("riskDetections") — bilinçli tasarım
// kararı, bkz. types/index.js → RiskDetection.

import { createCrudService } from "./createCrudService.js";

// companyScoped: true — mevcut davranış korunur (bkz. createCrudService.js).
const { getAll, save, remove } = createCrudService("riskDetections", { companyScoped: true });

/**
 * @returns {Promise<import("../types/index.js").RiskDetection[]>}
 */
export const getRiskDetections = getAll;

/**
 * @param {import("../types/index.js").RiskDetection} detection
 */
export const saveRiskDetection = save;

/**
 * @param {number} id
 */
export const deleteRiskDetection = remove;
