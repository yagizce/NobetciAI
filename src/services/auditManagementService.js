// Denetim Modülü servis katmanı — sihirbazla oluşturma, checklist güncelleme,
// bulgudan tek tıkla DİF açma ve DİF yaşam döngüsü yönetimi.
// Mimari not: `audits`/`auditFindings` COMPANY_SCOPED_STORES'ta (bkz.
// companyService.js) olduğu için createCrudService zaten her kaydı AKTİF firmaya
// bağlar — OSGB/çoklu-müşteri senaryosunda "her firma kendi takibiyle ayrışır"
// ihtiyacı, aktif firma değiştirilerek (bkz. setActiveCompany) doğal olarak karşılanır.

import { createCrudService } from "./createCrudService.js";
import { computeAuditStatus } from "../constants/auditWorkflow.js";
import { createId, ensureId } from "../utils/id.js";
import { todayISO } from "../utils/dateUtils.js";

const auditsCrud = createCrudService("audits", { companyScoped: true });
const findingsCrud = createCrudService("auditFindings", { companyScoped: true });

/**
 * @returns {Promise<import("../types/index.js").Audit[]>}
 */
export async function getAudits() {
  const audits = await auditsCrud.getAll();
  // BUG FIX (periodicCheckService.js'teki desenin aynısı): durum, kayıtta SAKLANMAZ,
  // her okumada plannedDate/completedAt'ten TAZE hesaplanır — "Planlandı" olarak
  // oluşturulan bir denetim, sahaya çıkış günü geldiğinde otomatik "Devam Ediyor"
  // görünür, ayrıca elle güncellenmesi gerekmez.
  return audits.map((a) => ({ ...a, status: computeAuditStatus(a) }));
}

/**
 * Sihirbazın son adımında çağrılır. Bu fonksiyon standarttan/mevzuattan BAĞIMSIZDIR
 * — checklist'i kendisi ÜRETMEZ, çağıran taraf (her denetim türünün kendi
 * `AuditWizard` kullanımı, bkz. features/audit/AuditPage.jsx'teki `config` prop'u)
 * kendi `constants/xxxChecklist.js`'inin `generateChecklist()`'ini çağırıp
 * `wizardInput.checklist` olarak geçirir. Böylece ISO 45001 ve İSG Mevzuat Denetimi
 * (ve ileride 9001/14001/27001) AYNI servisi, hiçbir değişiklik gerekmeden paylaşır.
 * @param {{ companyId?: string|number, standard: string, checklist: object[],
 *   scopeDescription: string, scopeDepartmentIds?: Array<string|number>, plannedDate: string }} wizardInput
 * @returns {Promise<import("../types/index.js").Audit>}
 */
export async function createAudit(wizardInput) {
  const audit = {
    id: createId(),
    companyId: wizardInput.companyId,
    standard: wizardInput.standard,
    scopeDescription: wizardInput.scopeDescription || "",
    scopeDepartmentIds: wizardInput.scopeDepartmentIds || [],
    plannedDate: wizardInput.plannedDate,
    checklist: wizardInput.checklist,
    completedAt: null,
    createdAt: new Date().toISOString(),
  };
  return auditsCrud.save(audit);
}

/**
 * @param {import("../types/index.js").Audit} audit
 */
export async function saveAudit(audit) {
  return auditsCrud.save(audit);
}

/**
 * Bir checklist maddesini günceller (sonuç/not/departman) — tüm checklist dizisini
 * yeniden yazmak yerine tek maddeyi hedefler, çağıran kod (AuditDetailPage) her
 * güncellemede tüm listeyi elle kopyalamak zorunda kalmaz.
 * @param {import("../types/index.js").Audit} audit
 * @param {string} itemId
 * @param {object} patch
 */
export async function updateChecklistItem(audit, itemId, patch) {
  const checklist = audit.checklist.map((item) => (item.id === itemId ? { ...item, ...patch } : item));
  return auditsCrud.save({ ...audit, checklist });
}

/**
 * Bir denetimi "Tamamlandı" olarak işaretler.
 * @param {import("../types/index.js").Audit} audit
 */
export async function completeAudit(audit) {
  return auditsCrud.save({ ...audit, completedAt: new Date().toISOString() });
}

export async function deleteAudit(id) {
  return auditsCrud.remove(id);
}

/**
 * @returns {Promise<import("../types/index.js").AuditFinding[]>}
 */
export async function getAuditFindings() {
  return findingsCrud.getAll();
}

/**
 * Bir checklist maddesinden (majör/minör/gözlem/iyi uygulama) TEK TIKLA DİF açar.
 * Aynı checklist maddesi için zaten bir DİF varsa yenisi açılmaz, mevcut olan döner
 * (yanlışlıkla çift tıklamayla mükerrer kayıt oluşmasın diye).
 * @param {import("../types/index.js").Audit} audit
 * @param {object} checklistItem
 * @param {{ description?: string, responsible?: string, dueDate?: string }} [extra]
 * @returns {Promise<import("../types/index.js").AuditFinding>}
 */
export async function openDifFromFinding(audit, checklistItem, extra = {}) {
  const existing = (await getAuditFindings()).find(
    (f) => String(f.auditId) === String(audit.id) && f.checklistItemId === checklistItem.id
  );
  if (existing) return existing;

  const dif = {
    id: createId(),
    companyId: audit.companyId,
    auditId: audit.id,
    checklistItemId: checklistItem.id,
    standard: checklistItem.standard,
    clauseCode: checklistItem.clauseCode,
    type: checklistItem.result,
    departmentId: checklistItem.departmentId || null,
    description: extra.description || checklistItem.note || checklistItem.question,
    rootCause: "",
    correctiveAction: "",
    stage: "open",
    responsible: extra.responsible || "",
    dueDate: extra.dueDate || "",
    openedAt: todayISO(),
    closedAt: null,
    evidence: [],
  };
  return findingsCrud.save(dif);
}

/**
 * DİF'i bir sonraki (veya elle seçilen herhangi bir) aşamaya taşır. "closed"
 * aşamasına geçildiğinde `closedAt` otomatik doldurulur; geri alınırsa
 * (ör. yanlışlıkla kapatıldıysa) `closedAt` temizlenir.
 * @param {import("../types/index.js").AuditFinding} dif
 * @param {string} newStage
 * @param {object} [patch] - rootCause/correctiveAction gibi ek alanlar aynı anda güncellenebilir
 */
export async function updateDifStage(dif, newStage, patch = {}) {
  return findingsCrud.save({
    ...dif,
    ...patch,
    stage: newStage,
    closedAt: newStage === "closed" ? dif.closedAt || todayISO() : null,
  });
}

/**
 * @param {import("../types/index.js").AuditFinding} dif
 * @param {{ name: string, type: string }} file
 */
export async function addDifEvidence(dif, file) {
  const evidence = [...(dif.evidence || []), { id: createId(), name: file.name, type: file.type || "photo", addedAt: new Date().toISOString() }];
  return findingsCrud.save({ ...dif, evidence });
}

/**
 * @param {import("../types/index.js").AuditFinding} dif
 * @param {string|number} evidenceId
 */
export async function removeDifEvidence(dif, evidenceId) {
  const evidence = (dif.evidence || []).filter((e) => e.id !== evidenceId);
  return findingsCrud.save({ ...dif, evidence });
}

/**
 * @param {import("../types/index.js").AuditFinding} dif
 */
export async function saveDifDetails(dif) {
  return findingsCrud.save({ ...dif, id: ensureId(dif) });
}
