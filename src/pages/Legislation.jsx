import LegislationPage from "../features/legislation/LegislationPage.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export default function Legislation() {
  useDocumentTitle("Mevzuat");
  return <LegislationPage />;
}
