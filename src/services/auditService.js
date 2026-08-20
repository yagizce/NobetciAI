import { dataProvider } from "./dataProvider.js";
import { getActiveCompanyId } from "./companyService.js";
import { createId } from "../utils/id.js";

/**
 * Records one activity entry. Fire-and-forget — logging failure shouldn't break a feature.
 * @param {{ actor: string, action: string, details: string, entityType: string }} entry
 */
export async function logActivity({ actor, action, details, entityType }) {
  try {
    const companyId = await getActiveCompanyId();
    if (companyId == null) return;
    await dataProvider.upsert("auditLog", {
      id: createId(),
      companyId,
      timestamp: new Date().toISOString(),
      actor,
      action,
      details,
      entityType,
    });
  } catch (e) {
    console.error("Audit log kaydedilemedi:", e);
  }
}

/** @returns {Promise<import("../types/index.js").AuditLogEntry[]>} newest first */
export async function getAuditLog() {
  const companyId = await getActiveCompanyId();
  if (companyId == null) return [];
  const entries = await dataProvider.getAll("auditLog", { companyId });
  return entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}
