import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { MessageSquare } from "./icons/index.jsx";

/**
 * Herhangi bir modülden Bağlama Duyarlı AI Copilot'a giriş noktası. `/chat`'e
 * `contextId`'yi router state olarak taşır (bkz. src/constants/chatContexts.js);
 * ChatPanel bunu okuyup asistanı o bağlama göre ayarlar. Ekstra prop gerekmez,
 * geri dönüşte state kaybolsa bile ChatPanel genel asistan olarak çalışmaya devam eder.
 *
 * @param {{contextId: string, label?: string, className?: string}} props
 */
export default function AskAiButton({ contextId, label = "AI'ya Sor", className = "" }) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/chat", { state: { contextId } })}
      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 ${className}`}
      style={{ background: theme.surfaceAlt, color: theme.accent, border: `1px solid ${theme.accent}` }}
    >
      <MessageSquare style={{ fontSize: "13px" }} /> {label}
    </button>
  );
}
