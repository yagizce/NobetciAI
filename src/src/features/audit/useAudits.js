import { useState, useEffect, useCallback, useRef } from "react";
import {
  getAudits, createAudit, saveAudit, completeAudit, deleteAudit,
  getAuditFindings, openDifFromFinding, updateDifStage, addDifEvidence, removeDifEvidence, saveDifDetails, canCreateDif,
} from "../../services/auditManagementService.js";
import { computeAuditStatus } from "../../constants/auditWorkflow.js";
import { logActivity } from "../../services/auditService.js";
import { pushSystemNotification } from "../../services/systemNotificationService.js";
import { useRole } from "../../contexts/RoleContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
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
  const { showToast } = useToast();
  const [audits, setAudits] = useState([]);
  const [findings, setFindings] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  // Denetim yazımları (checklist maddesi sonucu/notu, tamamlama) ARKA ARKAYA ve hızlı gelir
  // (not alanı her tuşta kaydeder). Her yazım, çağıranın bayat `audit` prop'unu değil ref'teki
  // EN GÜNCEL denetimi sıralı yazar — aksi halde ardışık düzenlemeler birbirini eziyor,
  // kontrollü input'ta karakterler düşüyordu.
  const auditsRef = useRef(audits);
  auditsRef.current = audits;
  const writeQueueRef = useRef(Promise.resolve());
  // Aynı maddeden art arda (çift dokunma) DİF açma isteği tek isteğe indirilir.
  const openingDifRef = useRef(new Map());

  const enqueueAuditWrite = useCallback((task) => {
    const job = writeQueueRef.current.then(task);
    writeQueueRef.current = job.catch(() => {});
    return job;
  }, []);

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
    // Optimistik: yerel state ANINDA güncellenir (kontrollü input gecikmesiz kalır), kalıcı
    // yazım sıraya alınır ve ref'teki en güncel denetimi yazar.
    const base = auditsRef.current.find((a) => a.id === audit.id) || audit;
    const optimistic = { ...base, checklist: base.checklist.map((item) => (item.id === itemId ? { ...item, ...patch } : item)) };
    auditsRef.current = auditsRef.current.map((a) => (a.id === optimistic.id ? optimistic : a));
    setAudits(auditsRef.current);
    try {
      return await enqueueAuditWrite(() => saveAudit(auditsRef.current.find((a) => a.id === audit.id) || optimistic));
    } catch (err) {
      console.error("Denetim maddesi kaydedilemedi:", err);
      showToast("Değişiklik kaydedilemedi. Lütfen tekrar deneyin.", "error");
      reload(); // ekranı kayıtlı gerçek durumla yeniden eşitle
      return null;
    }
  }, [enqueueAuditWrite, reload, showToast]);

  const finishAudit = useCallback(async (audit) => {
    try {
      // Bekleyen madde yazımlarından SONRA, en güncel denetimle tamamlanır (bayat prop'u yazmaz).
      const saved = await enqueueAuditWrite(() => completeAudit(auditsRef.current.find((a) => a.id === audit.id) || audit));
      // BUG FIX: durum kayıtta saklanmıyor, getAudits her okumada hesaplıyordu; burada ise
      // eski "Devam Ediyor" değeri state'te kalıp denetim sayfa yenilenene dek KİLİTLENMİYORDU.
      const completed = { ...saved, status: computeAuditStatus(saved) };
      auditsRef.current = auditsRef.current.map((a) => (a.id === completed.id ? completed : a));
      setAudits(auditsRef.current);
      logActivity({ actor: getRoleLabel(role), action: "Denetim tamamlandı", details: audit.scopeDescription || `#${audit.id}`, entityType: "audit" });
      return completed;
    } catch (err) {
      console.error("Denetim tamamlanamadı:", err);
      showToast("Denetim tamamlanamadı. Lütfen tekrar deneyin.", "error");
      return null;
    }
  }, [role, enqueueAuditWrite, showToast]);

  const removeAudit = useCallback(async (id) => {
    const audit = audits.find((a) => a.id === id);
    await deleteAudit(id);
    setAudits((prev) => prev.filter((a) => a.id !== id));
    logActivity({ actor: getRoleLabel(role), action: "Denetim silindi", details: audit?.scopeDescription || `#${id}`, entityType: "audit" });
  }, [audits, role]);

  const openFinding = useCallback((audit, checklistItem, extra) => {
    const key = `${audit.id}:${checklistItem.id}`;
    const pending = openingDifRef.current.get(key);
    if (pending) return pending; // çift dokunma: ikinci DİF/log/bildirim oluşmaz
    const task = (async () => {
      try {
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
      } catch (err) {
        console.error("Uygunsuzluk (DİF) oluşturulamadı:", err);
        const gate = canCreateDif(checklistItem);
        showToast(gate.allowed ? "Uygunsuzluk (DİF) oluşturulamadı. Lütfen tekrar deneyin." : gate.reason, "error");
        return null;
      } finally {
        openingDifRef.current.delete(key);
      }
    })();
    openingDifRef.current.set(key, task);
    return task;
  }, [role, showToast]);

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

  // Bu üç çağrı arayüzde await edilmiyor (alandan çıkınca/ekle düğmesinde "ateşle-unut") —
  // başarısız kayıt sessizce kaybolmasın diye kullanıcıya bildirilir.
  const addEvidence = useCallback(async (dif, file) => {
    try {
      const saved = await addDifEvidence(dif, file);
      setFindings((prev) => prev.map((f) => (f.id === saved.id ? saved : f)));
      return saved;
    } catch (err) {
      console.error("DİF kanıtı eklenemedi:", err);
      showToast("Kanıt eklenemedi. Lütfen tekrar deneyin.", "error");
      return null;
    }
  }, [showToast]);

  const removeEvidence = useCallback(async (dif, evidenceId) => {
    try {
      const saved = await removeDifEvidence(dif, evidenceId);
      setFindings((prev) => prev.map((f) => (f.id === saved.id ? saved : f)));
      return saved;
    } catch (err) {
      console.error("DİF kanıtı silinemedi:", err);
      showToast("Kanıt silinemedi. Lütfen tekrar deneyin.", "error");
      return null;
    }
  }, [showToast]);

  const updateDif = useCallback(async (dif) => {
    try {
      const saved = await saveDifDetails(dif);
      setFindings((prev) => prev.map((f) => (f.id === saved.id ? saved : f)));
      return saved;
    } catch (err) {
      console.error("DİF değişiklikleri kaydedilemedi:", err);
      showToast("Değişiklikler kaydedilemedi. Lütfen tekrar deneyin.", "error");
      return null;
    }
  }, [showToast]);

  return {
    audits, findings, loaded, loadError, reload,
    addAudit, updateAudit, setChecklistResult, finishAudit, removeAudit,
    openFinding, setDifStage, addEvidence, removeEvidence, updateDif,
  };
}
