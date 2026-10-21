import { dataProvider } from "./dataProvider.js";
import { createId, ensureId } from "../utils/id.js";
import { MAX_COMPANIES } from "../constants/company.js";

const ACTIVE_COMPANY_STORAGE_KEY = "activeCompanyId";

// Bugün local/offline çalışırken tek firma verisini geriye dönük uyumlu biçimde taşır.
// Gerçek backend/RLS bu sprintin kapsamı değildir; bu liste yalnızca local kayıtların
// hangi koleksiyonlarda companyId taşıması gerektiğini merkezi olarak belirtir.
export const COMPANY_SCOPED_STORES = [
  "equipment",
  "notifications",
  "risks",
  "fineKinney",
  "documents",
  "periodicChecks",
  "auditLog",
  "branches",
  "departments",
  "employees",
  "systemNotifications",
  "trainingCompletions",
  "trainingProgress",
  "riskDetections",
  "trainingCourseSettings",
  "audits",
  "auditFindings",
];

/**
 * @returns {Promise<import("../types/index.js").Company[]>}
 */
export async function getCompanies() {
  return dataProvider.getAll("companies");
}

function getStoredActiveCompanyId() {
  try {
    return globalThis.localStorage?.getItem(ACTIVE_COMPANY_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

function storeActiveCompanyId(companyId) {
  try {
    globalThis.localStorage?.setItem(ACTIVE_COMPANY_STORAGE_KEY, companyId);
  } catch {
    // localStorage kapalıysa tek-firma fallback yine çalışır.
  }
}

/**
 * Seçili firmayı döndürür. Seçim yoksa mevcut tek-firma MVP davranışı korunur:
 * ilk kayıt fallback olarak kullanılır. Çoklu firma UX'i bu sprintte eklenmez.
 * @returns {Promise<import("../types/index.js").Company|null>}
 */
export async function getActiveCompany() {
  const companies = await getCompanies();
  const selectedId = getStoredActiveCompanyId();
  return companies.find((company) => String(company.id) === String(selectedId)) || companies[0] || null;
}

// Eski çağrı noktaları kırılmasın; isim korunur, davranış seçili firma fallback'ine taşınır.
export async function getPrimaryCompany() {
  return getActiveCompany();
}

/**
 * @param {string|number} companyId
 * @returns {Promise<import("../types/index.js").Company|null>}
 */
export async function setActiveCompany(companyId) {
  const companies = await getCompanies();
  const company = companies.find((item) => String(item.id) === String(companyId));
  if (!company) throw new Error("Seçilen firma bulunamadı.");
  storeActiveCompanyId(String(company.id));
  invalidatePrimaryCompanyIdCache();
  return company;
}

/**
 * @param {import("../types/index.js").Company} company
 */
export async function saveCompany(company) {
  if (!company.name?.trim()) throw new Error("Firma adı zorunludur.");
  const companies = await getCompanies();
  const exists = companies.some((item) => String(item.id) === String(company.id));
  if (!exists && companies.length >= MAX_COMPANIES) throw new Error(`Bu cihazda en fazla ${MAX_COMPANIES} firma eklenebilir.`);
  // İkinci firma eklenmeden eski sahipsiz kayıtları ilk firmaya bağla.
  if (!exists && companies.length === 1) await migrateLegacyCompanyData(companies[0].id);
  const result = await dataProvider.upsertWithLimit("companies", { ...company, name: company.name.trim(), id: ensureId(company) }, MAX_COMPANIES);
  if (!getStoredActiveCompanyId()) storeActiveCompanyId(String(result.id));
  invalidatePrimaryCompanyIdCache();
  await migrateLegacyCompanyData(result.id);
  return result;
}

/**
 * @param {string|number} id
 */
export async function deleteCompany(id) {
  const result = await dataProvider.remove("companies", id);
  if (String(getStoredActiveCompanyId()) === String(id)) {
    try {
      globalThis.localStorage?.removeItem(ACTIVE_COMPANY_STORAGE_KEY);
    } catch {
      // no-op
    }
    invalidatePrimaryCompanyIdCache();
  }
  return result;
}

let _activeCompanyIdCache;

/**
 * @returns {Promise<string|null>}
 */
export async function getPrimaryCompanyId() {
  if (_activeCompanyIdCache !== undefined) return _activeCompanyIdCache;
  const company = await getActiveCompany();
  _activeCompanyIdCache = company?.id ?? null;
  return _activeCompanyIdCache;
}

export async function getActiveCompanyId() {
  return getPrimaryCompanyId();
}

function invalidatePrimaryCompanyIdCache() {
  _activeCompanyIdCache = undefined;
}

/**
 * Eski tek-firma local kayıtlarını seçili/tek firmaya bağlar. Birden fazla firma
 * mevcutsa otomatik atama yapılmaz; yanlış şirkete veri bağlama riski alınmaz.
 * Mevcut id'ler korunur. Yalnızca trainingCourseSettings'in eski `id=courseId`
 * formatı, courseId alanı eklenerek yeni UUID id'ye taşınır.
 * @param {string|number} [companyId]
 * @returns {Promise<{companyId: string|number|null, migrated: number, skipped: boolean}>}
 */
export async function migrateLegacyCompanyData(companyId) {
  const companies = await getCompanies();
  if (companies.length !== 1) return { companyId: companyId ?? null, migrated: 0, skipped: true };

  const targetCompanyId = companies[0].id;
  // Eski genel sohbeti yalnızca tek firma varken kopyala; özgün geçmişi silme.
  try {
    const key = `nobetci-chat-history:${targetCompanyId}`;
    const old = globalThis.localStorage?.getItem("nobetci-chat-history");
    if (old && globalThis.localStorage?.getItem(key) == null) globalThis.localStorage?.setItem(key, old);
  } catch { /* Sohbet tercihi erişilemese de firma kayıtları taşınır. */ }
  let migrated = 0;

  for (const storeName of COMPANY_SCOPED_STORES) {
    const records = await dataProvider.getAll(storeName);
    for (const record of records) {
      const isLegacyTrainingSetting = storeName === "trainingCourseSettings" && !record.courseId;
      const needsCompanyId = record.companyId == null;
      if (!needsCompanyId && !isLegacyTrainingSetting) continue;

      const updated = { ...record };
      if (needsCompanyId) updated.companyId = targetCompanyId;
      if (isLegacyTrainingSetting) {
        updated.courseId = String(record.id);
        updated.id = createId();
      }
      await dataProvider.upsert(storeName, updated);
      if (updated.id !== record.id) await dataProvider.remove(storeName, record.id);
      migrated += 1;
    }
  }

  return { companyId: targetCompanyId, migrated, skipped: false };
}
