import { dataProvider } from "./dataProvider.js";
import { getActiveCompanyId } from "./companyService.js";
import { buildExpertOverview } from "../utils/expertOverview.js";

export async function getExpertOverview() {
  const companyId = await getActiveCompanyId();
  if (companyId == null) return buildExpertOverview({});
  const stores = ["fineKinney", "periodicChecks", "audits", "auditFindings", "riskDetections"];
  const records = await Promise.all(stores.map((store) => dataProvider.getAll(store, { companyId })));
  return buildExpertOverview(Object.fromEntries(stores.map((store, i) => [store, records[i]])));
}
