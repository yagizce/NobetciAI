// Risk Geçmişi (timeline) olayı oluşturur — hem useFineKinneyEntries.js (create/update/kapatma)
// hem de useFineKinneyDetail.js (ek dosya/faaliyet/not) tarafından kullanılır. Bu, entry.history
// dizisine eklenen bir kayıttır; mevcut auditLog'dan (genel aktivite geçmişi) tamamen ayrıdır.
/**
 * @param {string} event - HISTORY_EVENT_LABELS anahtarlarından biri (bkz. constants/fineKinney.js)
 * @param {string} detail
 * @param {string} actor
 * @returns {{ id: string, event: string, detail: string, actor: string, at: string }}
 */
import { createId } from "../../../utils/id.js";

export function makeHistoryEvent(event, detail, actor) {
  return { id: createId(), event, detail: detail || "", actor, at: new Date().toISOString() };
}
