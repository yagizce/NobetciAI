// Fine-Kinney veri servisi. AI scoreRisk() akışı ayrı tutulur; yerel risk kayıtları
// yalnızca aktif firmaya ait kayıtlarla çalışır.

import { dataProvider } from "./dataProvider.js";
import { getActiveCompanyId } from "./companyService.js";
import { ensureId } from "../utils/id.js";
import { sendChatMessage } from "./chatService.js";
import { INITIAL_SCORE_PROMPT, parseInitialScoreSuggestion } from "../constants/systemPrompt.js";

async function requireActiveCompanyId() {
  const companyId = await getActiveCompanyId();
  if (companyId == null) throw new Error("Risk kaydı için aktif firma seçilmelidir.");
  return companyId;
}

function assertCompanyMatch(record, companyId) {
  if (record.companyId != null && String(record.companyId) !== String(companyId)) {
    throw new Error("Risk kaydı aktif firmaya ait değil.");
  }
}

/** @returns {Promise<import("../types/index.js").FineKinneyEntry[]>} */
export async function getFineKinneyEntries() {
  const companyId = await getActiveCompanyId();
  return companyId == null ? [] : dataProvider.getAll("fineKinney", { companyId });
}

/** @param {import("../types/index.js").FineKinneyEntry} entry */
export async function saveFineKinneyEntry(entry) {
  const companyId = await requireActiveCompanyId();
  assertCompanyMatch(entry, companyId);
  const existing = await dataProvider.getById("fineKinney", entry.id);
  if (existing?.companyId != null && String(existing.companyId) !== String(companyId)) {
    throw new Error("Risk kaydı başka bir firmaya ait ve ezilemez.");
  }
  return dataProvider.upsert("fineKinney", { ...entry, id: ensureId(entry), companyId });
}

/** @param {string|number} id */
export async function deleteFineKinneyEntry(id) {
  const companyId = await requireActiveCompanyId();
  const current = await dataProvider.getById("fineKinney", id);
  if (!current) return;
  assertCompanyMatch(current, companyId);
  return dataProvider.remove("fineKinney", id);
}

/**
 * @param {{hazard: string, risk: string}} input
 * @returns {Promise<{probability: number|null, frequency: number|null, severity: number|null, reasoning: string|null}>}
 */
export async function scoreRisk({ hazard, risk }) {
  const reply = await sendChatMessage({
    system: INITIAL_SCORE_PROMPT,
    max_tokens: 300,
    messages: [{ role: "user", content: `Tehlike: ${hazard}\nRisk: ${risk || "belirtilmedi"}` }],
  });
  return parseInitialScoreSuggestion(reply);
}

/**
 * Risk detay sekmelerinin kısmi güncelleme yolu. Patch içinden companyId gelirse
 * aktif firma ile eşleşmesi zorunludur; böylece UI veya import katmanı tenant değiştiremez.
 * @param {string|number} id
 * @param {object} patch
 */
export async function patchFineKinneyEntry(id, patch) {
  const companyId = await requireActiveCompanyId();
  const current = await dataProvider.getById("fineKinney", id);
  if (!current) return null;
  assertCompanyMatch(current, companyId);
  if (patch.companyId != null && String(patch.companyId) !== String(companyId)) {
    throw new Error("Risk kaydı farklı firmaya taşınamaz.");
  }
  if (patch.id != null && String(patch.id) !== String(current.id)) {
    throw new Error("Risk kaydının id değeri değiştirilemez.");
  }
  const { id: _ignoredPatchId, companyId: _ignoredPatchCompanyId, ...safePatch } = patch;
  const updated = { ...current, ...safePatch, id: current.id, companyId };
  await dataProvider.upsert("fineKinney", updated);
  return updated;
}
