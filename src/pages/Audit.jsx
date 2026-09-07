import AuditPage from "../features/audit/AuditPage.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import {
  generateChecklist, CHECKLIST_RESULTS, getResultMeta,
  computeOverallScore, computeProgressPercent, computeCategoryScores,
} from "../constants/iso45001Checklist.js";

const CONFIG = {
  standard: "45001",
  standardLabel: "ISO 45001",
  pageTitle: "ISO 45001 Denetimleri",
  generateChecklist,
  checklistResults: CHECKLIST_RESULTS,
  getResultMeta,
  computeOverallScore,
  computeProgressPercent,
  computeCategoryScores,
};

export default function Audit() {
  useDocumentTitle("ISO 45001 Denetim");
  return <AuditPage config={CONFIG} />;
}
