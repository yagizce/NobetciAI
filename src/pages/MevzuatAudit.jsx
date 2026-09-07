import AuditPage from "../features/audit/AuditPage.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import {
  generateChecklist, CHECKLIST_RESULTS, getResultMeta,
  computeOverallScore, computeProgressPercent, computeCategoryScores,
} from "../constants/mevzuatChecklist.js";

const CONFIG = {
  standard: "mevzuat",
  standardLabel: "İSG Mevzuat",
  pageTitle: "İSG Mevzuat Denetimleri",
  generateChecklist,
  checklistResults: CHECKLIST_RESULTS,
  getResultMeta,
  computeOverallScore,
  computeProgressPercent,
  computeCategoryScores,
};

export default function MevzuatAudit() {
  useDocumentTitle("İSG Mevzuat Denetim");
  return <AuditPage config={CONFIG} />;
}
