import { MANDATORY_DOCUMENT_TYPES } from "../constants/mandatoryDocuments.js";

/**
 * Her temel belge türü için durumunu döner: hiç yok / yalnızca taslak var / tamamlanmış var.
 * Bir tür için birden fazla kayıt olabilir (örn. güncellenmiş versiyonlar) — en az bir
 * "completed" kayıt varsa o tür "ok" sayılır, yoksa ama en az bir "draft" kayıt varsa
 * "draftOnly", hiç kayıt yoksa "missing".
 * @param {import("../types/index.js").DocumentRecord[]} documents
 * @returns {Array<{ type: string, label: string, status: "ok"|"draftOnly"|"missing" }>}
 */
export function getMandatoryDocumentStatus(documents) {
  return MANDATORY_DOCUMENT_TYPES.map(({ type, label }) => {
    const matching = documents.filter((d) => d.type === type);
    const status = matching.some((d) => d.status === "completed")
      ? "ok"
      : matching.length > 0
        ? "draftOnly"
        : "missing";
    return { type, label, status };
  });
}
