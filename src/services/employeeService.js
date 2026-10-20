import { createCrudService } from "./createCrudService.js";
import { isFeatureEnabled, requireFeature } from "../constants/releaseProfile.js";

const { getAll, save, remove } = createCrudService("employees", { companyScoped: true });

/**
 * @param {string} companyId
 * @returns {Promise<import("../types/index.js").Employee[]>}
 */
export async function getEmployees(companyId) {
  return isFeatureEnabled("employeeDirectory") ? getAll(companyId) : [];
}

/**
 * @param {import("../types/index.js").Employee} employee
 */
export async function saveEmployee(employee) {
  requireFeature("employeeDirectory");
  return save(employee);
}

/**
 * @param {string|number} id
 */
export async function deleteEmployee(id) {
  requireFeature("employeeDirectory");
  return remove(id);
}
