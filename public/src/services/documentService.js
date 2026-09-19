// Belge/ekipman yerel veri servisi. AI taslak üretimi ayrı ağ akışı olarak korunur.

import { dataProvider } from "./dataProvider.js";
import { getActiveCompanyId } from "./companyService.js";
import { ensureId } from "../utils/id.js";
import { sendChatMessage } from "./chatService.js";
import { DOCUMENT_DRAFT_PROMPT } from "../constants/systemPrompt.js";

async function requireActiveCompanyId() {
  const companyId = await getActiveCompanyId();
  if (companyId == null) throw new Error("Kayıt için aktif firma seçilmelidir.");
  return companyId;
}

function assertCompanyMatch(record, companyId) {
  if (record.companyId != null && String(record.companyId) !== String(companyId)) {
    throw new Error("Kayıt aktif firmaya ait değil.");
  }
}

/** @returns {Promise<import("../types/index.js").DocumentRecord[]>} */
export async function getDocuments() {
  const companyId = await getActiveCompanyId();
  return companyId == null ? [] : dataProvider.getAll("documents", { companyId });
}

/** @param {import("../types/index.js").DocumentRecord} document */
export async function saveDocument(document) {
  const companyId = await requireActiveCompanyId();
  assertCompanyMatch(document, companyId);
  const existing = await dataProvider.getById("documents", document.id);
  if (existing?.companyId != null && String(existing.companyId) !== String(companyId)) {
    throw new Error("Belge kaydı başka bir firmaya ait ve ezilemez.");
  }
  return dataProvider.upsert("documents", { ...document, id: ensureId(document), companyId });
}

/** @param {string|number} id */
export async function deleteDocument(id) {
  const companyId = await requireActiveCompanyId();
  const document = await dataProvider.getById("documents", id);
  if (!document) return;
  assertCompanyMatch(document, companyId);
  return dataProvider.remove("documents", id);
}

/** @param {{typeLabel: string, title: string}} input */
export async function generateDocumentDraft({ typeLabel, title }) {
  try {
    const reply = await sendChatMessage({
      system: DOCUMENT_DRAFT_PROMPT,
      max_tokens: 1500,
      messages: [{ role: "user", content: `Belge Türü: ${typeLabel}\nBaşlık: ${title}` }],
    });
    return reply || "";
  } catch {
    return "";
  }
}
