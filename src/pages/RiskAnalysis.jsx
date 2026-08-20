import RiskAnalysisPage from "../features/risk-analysis/RiskAnalysisPage.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export default function RiskAnalysis() {
  useDocumentTitle("Risk Analizi");
  return <RiskAnalysisPage />;
}
