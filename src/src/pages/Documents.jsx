import DocumentsPage from "../features/documents/DocumentsPage.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export default function Documents() {
  useDocumentTitle("Dokümanlar");
  return <DocumentsPage />;
}
