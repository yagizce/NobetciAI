import { useSearchParams } from "react-router-dom";
import KnowledgeCenterPage from "../features/knowledge-center/KnowledgeCenterPage.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export default function KnowledgeCenter() {
  useDocumentTitle("Bilgi Kütüphanesi");
  // Genel arama (GlobalSearchBar.jsx) buraya "?q=..." ile yönlendirebilir.
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  // `key`: sayfa zaten açıkken genel aramadan yeni bir "?q=..." ile gelinirse bileşen yeniden
  // oluşur — aksi halde `initialSearch` yalnızca ilk render'da okunduğu için arama kutusu eski
  // sorguda kalıyordu. Sayfa içi arama URL'yi değiştirmediği için yazarken yeniden oluşmaz.
  return <KnowledgeCenterPage key={q} initialSearch={q || undefined} />;
}
