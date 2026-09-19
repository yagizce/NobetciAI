import { createCrudService } from "./createCrudService.js";

const { getAll, save, remove } = createCrudService("employees", { companyScoped: true });

/**
 * @param {string} companyId
 * @returns {Promise<import("../types/index.js").Employee[]>}
 */
export const getEmployees = getAll;

/**
 * @param {import("../types/index.js").Employee} employee
 */
export const saveEmployee = save;

/**
 * @param {string|number} id
 */
export const deleteEmployee = remove;
