// Denetim Modülü servis katmanı — sihirbazla oluşturma, checklist güncelleme,
// bulgudan tek tıkla DİF açma ve DİF yaşam döngüsü yönetimi.
// Mimari not: `audits`/`auditFindings` COMPANY_SCOPED_STORES'ta (bkz.
// companyService.js) olduğu için createCrudService zaten her kaydı AKTİF firmaya
// bağlar — OSGB/çoklu-müşteri senaryosunda "her firma kendi takibiyle ayrışır"
// ihtiyacı, aktif firma değiştirilerek (bkz. setActiveCompany) doğal olarak karşılanır.

import { createCrudService } from "./createCrudService.js";
import { computeAuditStatus, canTransitionDifStage, applyDifTransition } from "../constants/auditWorkflow.js";
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
 * Bir checklist maddesinden (İSG Mevzuat Denetimi'nde "Uygun Değil" çıkan bir
 * kriterden) DİF açılıp AÇILAMAYACAĞINI belirler — SAF fonksiyon, I/O yapmaz,
 * bu yüzden gerçek IndexedDB'ye dokunmadan test edilebilir. UI'daki buton
 * gizleme yalnızca UX'tir; asıl kural burada uygulanır (bkz. openDifFromFinding).
 * @param {{ result?: string }} checklistItem
 * @returns {{ allowed: boolean, reason: string|null }}
 */
export function canCreateDif(checklistItem) {
  if (checklistItem?.result !== "uygun_degil") {
    return { allowed: false, reason: "Yalnızca 'Uygun Değil' sonucundaki kriterlerden uygunsuzluk (DİF) oluşturulabilir." };
  }
  return { allowed: true, reason: null };
}

/**
 * Verilen denetim/kriter için zaten açılmış bir DİF varsa döner — SAF fonksiyon,
 * mükerrer kayıt engelinin gerçek mantığı (openDifFromFinding bunu I/O ile sarar).
 * @param {object[]} findings
 * @param {string|number} auditId
 * @param {string} checklistItemId
 * @returns {object|undefined}
 */
export function findExistingDif(findings, auditId, checklistItemId) {
  return (findings || []).find((f) => String(f.auditId) === String(auditId) && f.checklistItemId === checklistItemId);
}

/**
 * Bir checklist maddesinden yeni bir DİF NESNESİ üretir — SAF fonksiyon (I/O yok,
 * `createId()` hariç hiçbir yan etkisi yok), bu yüzden gerçek IndexedDB'ye
 * dokunmadan test edilebilir. Mevzuat dayanağı (legislationName/article) ve
 * kriter başlığı KRİTERDEN otomatik kopyalanır — kullanıcı elle girmez.
 * @param {import("../types/index.js").Audit} audit
 * @param {object} checklistItem
 * @param {{ description?: string, responsible?: string, dueDate?: string }} [extra]
 * @returns {import("../types/index.js").AuditFinding}
 */
export function buildDifFromFinding(audit, checklistItem, extra = {}) {
  return {
    id: createId(),
    companyId: audit.companyId,
    auditId: audit.id,
    checklistItemId: checklistItem.id,
    criterionTitle: checklistItem.title,
    legislationName: checklistItem.legislationName || null,
    article: checklistItem.article || null,
    standard: checklistItem.standard,
    clauseCode: checklistItem.clauseCode,
    type: checklistItem.result,
    departmentId: checklistItem.departmentId || null,
    description: extra.description || checklistItem.note || checklistItem.title || checklistItem.question,
    rootCause: "",
    correctiveAction: "",
    stage: "open",
    responsible: extra.responsible || "",
    dueDate: extra.dueDate || "",
    openedAt: todayISO(),
    closedAt: null,
    evidence: [],
    actionCompleted: false,
    actionEvidence: "",
    closureNote: "",
    history: [],
  };
}

/**
 * Bir checklist maddesinden (İSG Mevzuat Denetimi'nde "Uygun Değil" çıkan bir
 * kriterden) TEK TIKLA DİF açar. OTOMATİK ÇAĞRILMAZ — yalnızca uzmanın
 * AuditDetailDrawer.jsx'teki "Uygunsuzluk Oluştur" butonuna basmasıyla tetiklenir.
 * Aynı checklist maddesi için zaten bir DİF varsa yenisi açılmaz, mevcut olan
 * sessizce döner (mükerrer kayıt engeli). "Uygun Değil" DIŞINDA bir sonuçtan
 * açma denemesi ise HATA fırlatır (bkz. canCreateDif) — bu, UI buton gizlemeyi
 * atlatan bir çağrıya karşı gerçek koruma sağlar.
 * @param {import("../types/index.js").Audit} audit
 * @param {object} checklistItem
 * @param {{ description?: string, responsible?: string, dueDate?: string }} [extra]
 * @returns {Promise<import("../types/index.js").AuditFinding>}
 * @throws {Error} checklistItem.result "uygun_degil" değilse
 */
export async function openDifFromFinding(audit, checklistItem, extra = {}) {
  const existing = findExistingDif(await getAuditFindings(), audit.id, checklistItem.id);
  if (existing) return existing;

  const check = canCreateDif(checklistItem);
  if (!check.allowed) throw new Error(check.reason);

  return findingsCrud.save(buildDifFromFinding(audit, checklistItem, extra));
}

/**
 * DİF durum geçişi — MERKEZİ doğrulamayı (canTransitionDifStage) KULLANMADAN bu
 * fonksiyon çalışamaz: geçiş uygun değilse (grafik dışı, yetkisiz kullanıcı veya
 * eksik zorunlu alan) bir Error fırlatılır, veritabanına HİÇBİR YAZMA yapılmaz.
 * UI'daki buton gizleme/pasifleştirme yalnızca kullanıcı deneyimi içindir — gerçek
 * geçerlilik kontrolü her zaman burada, tek noktada yapılır.
 *
 * @param {import("../types/index.js").AuditFinding} dif
 * @param {string} newStage
 * @param {{ actorRole: string, actorLabel: string, company?: object, patch?: object,
 *   isReopenAction?: boolean, reason?: string|null }} context
 * @throws {Error} geçiş uygun değilse, `.reason` ile aynı anlamlı mesajla
 */
export async function updateDifStage(dif, newStage, { actorRole, actorLabel, company, patch = {}, isReopenAction = false, reason = null } = {}) {
  const check = canTransitionDifStage({ fromStage: dif.stage, toStage: newStage, dif, patch, actorRole, company, isReopenAction });
  if (!check.allowed) {
    throw new Error(check.reason || "Bu durum geçişine izin verilmiyor.");
  }

  const updated = applyDifTransition(dif, newStage, {
    patch,
    actorLabel: actorLabel || actorRole,
    reason: reason || patch.closureNote || patch.reopenReason || patch.actionEvidence || null,
    historyEntryId: createId(),
    now: new Date().toISOString(),
  });
  return findingsCrud.save(updated);
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
