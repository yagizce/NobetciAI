import { useSearchParams } from "react-router-dom";
import KnowledgeCenterPage from "../features/knowledge-center/KnowledgeCenterPage.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export default function KnowledgeCenter() {
  useDocumentTitle("Bilgi Kütüphanesi");
  // Genel arama (GlobalSearchBar.jsx) buraya "?q=..." ile yönlendirebilir.
  const [searchParams] = useSearchParams();
  return <KnowledgeCenterPage initialSearch={searchParams.get("q") || undefined} />;
}
