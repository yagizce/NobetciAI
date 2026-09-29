import { useLocation } from "react-router-dom";
import ChatPanel from "../features/chat/ChatPanel.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export default function Chat() {
  useDocumentTitle("AI Chat");
  // Bağlama duyarlı Copilot: örn. Fine-Kinney ekranından "AI'ya Sor" ile buraya
  // gelindiyse location.state.contextId dolu olur. Doğrudan menüden girildiyse
  // (contextId yok) davranış tamamen eskisi gibi, genel asistan olarak çalışır.
  const location = useLocation();
  return <ChatPanel contextId={location.state?.contextId} />;
}
