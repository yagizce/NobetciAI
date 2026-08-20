import { createCrudService } from "./createCrudService.js";
import { DEFAULT_DEPARTMENT_NAMES } from "../constants/company.js";
import { createId } from "../utils/id.js";

const { getAll, save, remove } = createCrudService("departments", { companyScoped: true });

/**
 * @param {string} companyId
 * @returns {Promise<import("../types/index.js").Department[]>}
 */
export const getDepartments = getAll;

/**
 * @param {import("../types/index.js").Department} department
 */
export const saveDepartment = save;

/**
 * @param {string|number} id
 */
export const deleteDepartment = remove;

/**
 * Bir firma için hiç departman kaydedilmemişse, varsayılan seti oluşturup kaydeder.
 * Zaten kayıt varsa hiçbir şey yapmaz (mevcut kayıtlar korunur).
 * @param {string} companyId
 * @returns {Promise<import("../types/index.js").Department[]>}
 */
export async function ensureDefaultDepartments(companyId) {
  const existing = await getDepartments(companyId);
  if (existing.length > 0) return existing;

  const seeded = DEFAULT_DEPARTMENT_NAMES.map((name, i) => ({
    id: createId(),
    companyId,
    name,
    isCustom: false,
  }));
  await Promise.all(seeded.map((d) => saveDepartment(d)));
  return seeded;
}
