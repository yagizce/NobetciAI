// Company-scoped CRUD servisleri için ortak factory.
// Firma kapsamı açıkça belirtilir; scoped kayıtlar aktif firmadan başka bir firmaya
// yazılamaz, filtresiz okunamaz ve id'siyle sessizce silinemez.

import { dataProvider } from "./dataProvider.js";
import { getActiveCompanyId } from "./companyService.js";
import { ensureId } from "../utils/id.js";

/**
 * @param {string} collection
 * @param {{ companyScoped?: boolean }} [options]
 * @returns {{
 *   getAll: (companyId?: string|number) => Promise<object[]>,
 *   save: (record: object) => Promise<object>,
 *   remove: (id: number|string) => Promise<void>
 * }}
 */
export function createCrudService(collection, { companyScoped = false } = {}) {
  async function resolveCompanyId(requestedCompanyId) {
    const activeCompanyId = await getActiveCompanyId();
    if (activeCompanyId == null) return null;
    if (requestedCompanyId != null && String(requestedCompanyId) !== String(activeCompanyId)) return null;
    return activeCompanyId;
  }

  async function getAll(companyId) {
    if (!companyScoped) return dataProvider.getAll(collection);
    const activeCompanyId = await resolveCompanyId(companyId);
    // Aktif firma yoksa tüm tenant verisini döndürmek yerine boş sonuç verilir.
    if (activeCompanyId == null) return [];
    return dataProvider.getAll(collection, { companyId: activeCompanyId });
  }

  async function save(record) {
    const normalized = { ...record, id: ensureId(record) };
    if (!companyScoped) return dataProvider.upsert(collection, normalized);

    const activeCompanyId = await resolveCompanyId(record.companyId);
    if (activeCompanyId == null) {
      throw new Error(`"${collection}" kaydı aktif firma olmadan veya farklı firmaya yazılamaz.`);
    }
    const existing = await dataProvider.getById(collection, record.id);
    if (existing?.companyId != null && String(existing.companyId) !== String(activeCompanyId)) {
      throw new Error(`"${collection}" kaydı başka bir firmaya ait ve ezilemez.`);
    }
    return dataProvider.upsert(collection, { ...normalized, companyId: activeCompanyId });
  }

  async function remove(id) {
    if (!companyScoped) return dataProvider.remove(collection, id);
    const record = await dataProvider.getById(collection, id);
    if (!record) return;
    const activeCompanyId = await resolveCompanyId(record.companyId);
    if (activeCompanyId == null || String(record.companyId) !== String(activeCompanyId)) {
      throw new Error(`"${collection}" kaydı aktif firmaya ait değil.`);
    }
    return dataProvider.remove(collection, record.id);
  }

  return { getAll, save, remove };
}
