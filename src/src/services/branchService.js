import { createCrudService } from "./createCrudService.js";

const { getAll, save, remove } = createCrudService("branches", { companyScoped: true });

/**
 * @param {string} companyId
 * @returns {Promise<import("../types/index.js").Branch[]>}
 */
export const getBranches = getAll;

/**
 * @param {import("../types/index.js").Branch} branch
 */
export const saveBranch = save;

/**
 * @param {string|number} id
 */
export const deleteBranch = remove;
