import { useState, useEffect, useCallback } from "react";
import {
  getAudits, createAudit, saveAudit, updateChecklistItem, completeAudit, deleteAudit,
  getAuditFindings, openDifFromFinding, updateDifStage, addDifEvidence, removeDifEvidence, saveDifDetails,
} from "../../services/auditManagementService.js";
import { logActivity } from "../../services/auditService.js";
import { pushSystemNotification } from "../../services/systemNotificationService.js";
import { useRole } from "../../contexts/RoleContext.jsx";
import { useCompany } from "../../hooks/useCompany.js";
import { getRoleLabel } from "../../constants/allRoles.js";
import { scopeFindingsToAudits } from "../../utils/auditScope.js";

/**
 * Denetim Modülü'nün tek veri kaynağı — usePeriodicChecks.js'teki AYNI desen
 * (yükleme + loaded/error state + service çağrılarını sarıp local state'i optimistik
 * güncelleme + logActivity/bildirim). Audit ve DİF verisi burada birlikte tutulur
 * çünkü aralarında çapraz referans çok sık kullanılıyor (bir denetimin DİF'leri,
 * bir DİF'in denetimi).
 *
 * `standard` parametresiyle filtrelenir — ISO 45001 ve İSG Mevzuat Denetimi AYNI
 * `audits` VE `findings` deposunu (bkz. db.js) paylaşır, birbirinin listesine
 * karışmasınlar diye her sayfa yalnızca kendi `standard` değerine ait kayıtları
 * görür (bkz. utils/auditScope.js → scopeFindingsToAudits). Firma izolasyonu ayrıca
 * ve bağımsız olarak servis katmanında (createCrudService.js → companyScoped:true)
 * zaten sağlanır — buradaki filtre yalnızca AYNI firma İÇİNDEKİ iki standardı ayırır.
 *
 * @param {{ standard: string, standardLabel: string }} config
 * @returns {object}
 */
export function useAudits({ standard, standardLabel }) {
  const { role } = useRole();
  const { company } = useCompany();
  const [audits, setAudits] = useState([]);
  const [findings, setFindings] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const reload = useCallback(() => {
    Promise.all([getAudits(), getAuditFindings()])
      .then(([a, f]) => {
        const scopedAudits = a.filter((audit) => audit.standard === standard);
        setAudits(scopedAudits);
        setFindings(scopeFindingsToAudits(f, scopedAudits));
        setLoaded(true);
      })
      .catch((err) => {
        console.error("Denetim verileri yüklenemedi:", err);
        setLoadError("Denetim verileri yüklenemedi. Sayfayı yenileyip tekrar deneyin.");
        setLoaded(true);
      });
  }, [standard]);

  useEffect(() => { reload(); }, [reload]);

  const addAudit = useCallback(async (wizardInput) => {
    const audit = await createAudit({ ...wizardInput, standard });
    setAudits((prev) => [audit, ...prev]);
    logActivity({
      actor: getRoleLabel(role),
      action: "Denetim planlandı",
      details: `${standardLabel} — ${wizardInput.scopeDescription || "Genel"}`,
      entityType: "audit",
    });
    return audit;
  }, [role, standard, standardLabel]);

  const updateAudit = useCallback(async (audit) => {
    const saved = await saveAudit(audit);
    setAudits((prev) => prev.map((a) => (a.id === saved.id ? { ...saved, status: a.status } : a)));
    return saved;
  }, []);

  const setChecklistResult = useCallback(async (audit, itemId, patch) => {
    const saved = await updateChecklistItem(audit, itemId, patch);
    setAudits((prev) => prev.map((a) => (a.id === saved.id ? saved : a)));
    return saved;
  }, []);

  const finishAudit = useCallback(async (audit) => {
    const saved = await completeAudit(audit);
    setAudits((prev) => prev.map((a) => (a.id === saved.id ? saved : a)));
    logActivity({ actor: getRoleLabel(role), action: "Denetim tamamlandı", details: audit.scopeDescription || `#${audit.id}`, entityType: "audit" });
    return saved;
  }, [role]);

  const removeAudit = useCallback(async (id) => {
    const audit = audits.find((a) => a.id === id);
    await deleteAudit(id);
    setAudits((prev) => prev.filter((a) => a.id !== id));
    logActivity({ actor: getRoleLabel(role), action: "Denetim silindi", details: audit?.scopeDescription || `#${id}`, entityType: "audit" });
  }, [audits, role]);

  const openFinding = useCallback(async (audit, checklistItem, extra) => {
    const dif = await openDifFromFinding(audit, checklistItem, extra);
    setFindings((prev) => (prev.some((f) => f.id === dif.id) ? prev : [dif, ...prev]));
    // BUG FIX: checklistItem.clauseCode yalnızca ISO 45001'de var — Mevzuat
    // kriterlerinde (article/legislationName kullanılır) "undefined" olarak
    // loglanıyordu. Artık ikisini de kapsayan ortak bir referans etiketi kullanılıyor.
    const criterionRef = checklistItem.clauseCode || checklistItem.article || checklistItem.id;
    logActivity({ actor: getRoleLabel(role), action: "DİF açıldı", details: `${criterionRef} — ${dif.description}`, entityType: "audit" });
    if (dif.dueDate) {
      pushSystemNotification({ type: "difDue", title: "Yeni DİF açıldı", message: `${dif.description} — termin: ${dif.dueDate}` });
    }
    return dif;
  }, [role]);

  /**
   * DİF durum geçişi — merkezi doğrulama servis katmanında yapılır (bkz.
   * auditManagementService.js → updateDifStage / constants/auditWorkflow.js →
   * canTransitionDifStage). Geçersiz bir geçiş burada YUTULMAZ, olduğu gibi
   * çağırana (DifDetailDrawer.jsx) fırlatılır ki kullanıcı anlamlı hatayı görsün.
   * @param {object} dif
   * @param {string} newStage
   * @param {{ patch?: object, isReopenAction?: boolean, reason?: string|null }} [options]
   */
  const setDifStage = useCallback(async (dif, newStage, options = {}) => {
    const saved = await updateDifStage(dif, newStage, {
      actorRole: role,
      actorLabel: getRoleLabel(role),
      company,
      patch: options.patch,
      isReopenAction: options.isReopenAction,
      reason: options.reason,
    });
    setFindings((prev) => prev.map((f) => (f.id === saved.id ? saved : f)));
    logActivity({ actor: getRoleLabel(role), action: `DİF durumu güncellendi: ${newStage}`, details: saved.description, entityType: "audit" });
    return saved;
  }, [role, company]);

  const addEvidence = useCallback(async (dif, file) => {
    const saved = await addDifEvidence(dif, file);
    setFindings((prev) => prev.map((f) => (f.id === saved.id ? saved : f)));
    return saved;
  }, []);

  const removeEvidence = useCallback(async (dif, evidenceId) => {
    const saved = await removeDifEvidence(dif, evidenceId);
    setFindings((prev) => prev.map((f) => (f.id === saved.id ? saved : f)));
    return saved;
  }, []);

  const updateDif = useCallback(async (dif) => {
    const saved = await saveDifDetails(dif);
    setFindings((prev) => prev.map((f) => (f.id === saved.id ? saved : f)));
    return saved;
  }, []);

  return {
    audits, findings, loaded, loadError, reload,
    addAudit, updateAudit, setChecklistResult, finishAudit, removeAudit,
    openFinding, setDifStage, addEvidence, removeEvidence, updateDif,
  };
}
