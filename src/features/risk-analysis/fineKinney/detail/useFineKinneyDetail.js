import { useCallback } from "react";
import { patchFineKinneyEntry } from "../../../../services/riskService.js";
import { logActivity } from "../../../../services/auditService.js";
import { useRole } from "../../../../contexts/RoleContext.jsx";
import { getRoleLabel } from "../../../../constants/allRoles.js";
import { makeHistoryEvent } from "../historyEvent.js";
import { clampPercent } from "../../../../utils/numberGuards.js";
import { createId } from "../../../../utils/id.js";

/**
 * Risk Detay Sayfası'nın Düzeltici Faaliyetler / Ek Dosyalar / Notlar sekmeleri için
 * kalıcılık katmanı. Ana Fine-Kinney formunu (useFineKinneyEntries.saveEntry) HİÇ
 * etkilemez — sadece riskService.patchFineKinneyEntry ile ilgili alt-diziyi günceller.
 *
 * @param {object} entry - Güncel Fine-Kinney kaydı
 * @param {(updated: object) => void} onUpdated - entry güncellendiğinde üst state'e yansıtmak için
 */
export function useFineKinneyDetail(entry, onUpdated) {
  const { role } = useRole();
  const actorLabel = getRoleLabel(role);

  const persist = useCallback(async (fields, historyEvent, activityAction) => {
    if (!entry) return;
    const withHistory = historyEvent ? { history: [...(entry.history || []), historyEvent] } : {};
    const updated = await patchFineKinneyEntry(entry.id, { ...fields, ...withHistory });
    if (updated) {
      onUpdated(updated);
      if (activityAction) {
        logActivity({ actor: actorLabel, action: activityAction, details: entry.hazard, entityType: "fineKinney" });
      }
    }
    return updated;
  }, [entry, onUpdated, actorLabel]);

  const addAttachment = useCallback((attachment) => {
    const newAttachment = { id: createId(), addedAt: new Date().toISOString(), addedBy: actorLabel, ...attachment };
    const attachments = [...(entry.attachments || []), newAttachment];
    return persist(
      { attachments },
      makeHistoryEvent("attachmentAdded", newAttachment.name, actorLabel),
      "Riske dosya eklendi",
    );
  }, [entry, persist, actorLabel]);

  const removeAttachment = useCallback((attachmentId) => {
    const removed = (entry.attachments || []).find((a) => a.id === attachmentId);
    const attachments = (entry.attachments || []).filter((a) => a.id !== attachmentId);
    return persist(
      { attachments },
      makeHistoryEvent("attachmentRemoved", removed?.name || `#${attachmentId}`, actorLabel),
      "Riskten dosya kaldırıldı",
    );
  }, [entry, persist, actorLabel]);

  const addCorrectiveAction = useCallback((action) => {
    const newAction = {
      id: createId(),
      title: action.title?.trim() || "",
      description: action.description?.trim() || "",
      responsible: action.responsible?.trim() || "",
      dueDate: action.dueDate || "",
      priority: action.priority || "medium",
      status: action.status || "open",
      completionPercent: clampPercent(action.completionPercent),
      createdAt: new Date().toISOString(),
    };
    const correctiveActions = [...(entry.correctiveActions || []), newAction];
    return persist(
      { correctiveActions },
      makeHistoryEvent("correctiveActionAdded", newAction.title, actorLabel),
      "Düzeltici faaliyet eklendi",
    );
  }, [entry, persist, actorLabel]);

  const updateCorrectiveAction = useCallback((actionId, patch) => {
    const previous = (entry.correctiveActions || []).find((a) => a.id === actionId);
    const justCompleted = patch.status === "done" && previous?.status !== "done";
    // HARDENING: bu yol (durum değişimi / % slider'ı) addCorrectiveAction'daki clamp'i
    // atlıyordu — patch içinde completionPercent varsa burada da sıkıştırılır.
    const safePatch = "completionPercent" in patch ? { ...patch, completionPercent: clampPercent(patch.completionPercent) } : patch;
    const correctiveActions = (entry.correctiveActions || []).map((a) => (a.id === actionId ? { ...a, ...safePatch } : a));
    return persist(
      { correctiveActions },
      makeHistoryEvent(
        justCompleted ? "correctiveActionCompleted" : "correctiveActionUpdated",
        previous?.title || `#${actionId}`,
        actorLabel,
      ),
      justCompleted ? "Düzeltici faaliyet tamamlandı" : "Düzeltici faaliyet güncellendi",
    );
  }, [entry, persist, actorLabel]);

  const removeCorrectiveAction = useCallback((actionId) => {
    const correctiveActions = (entry.correctiveActions || []).filter((a) => a.id !== actionId);
    return persist({ correctiveActions }, null, "Düzeltici faaliyet silindi");
  }, [entry, persist]);

  const addNote = useCallback((text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const newNote = { id: createId(), text: trimmed, author: actorLabel, at: new Date().toISOString() };
    const notes = [...(entry.notes || []), newNote];
    return persist(
      { notes },
      makeHistoryEvent("noteAdded", trimmed.slice(0, 60), actorLabel),
      "Nota eklendi",
    );
  }, [entry, persist, actorLabel]);

  return { addAttachment, removeAttachment, addCorrectiveAction, updateCorrectiveAction, removeCorrectiveAction, addNote };
}
