import { useState } from "react";
import { sendChatMessage } from "../../services/chatService.js";
import { KNOWLEDGE_AI_PROMPT } from "../../constants/systemPrompt.js";
import { findRelevantDocuments } from "../../constants/knowledgeCenter.js";

/**
 * Sprint 7.3 — Bilgi Kütüphanesi "AI'ya Sor" özelliği. Soruyu önce yerel anahtar kelime
 * eşleştirmesiyle (bkz. findRelevantDocuments) ilgili dokümanlara daraltır, sonra bu
 * dokümanların içeriğini bağlam olarak AI'ye verir. İlgili doküman bulunamazsa AI hiç
 * çağrılmaz — tahmin yürütülmez, dürüstçe "bulunamadı" denir.
 *
 * @param {object[]} documents - o an filtrelenmiş/görünür doküman listesi değil, TÜM kütüphane
 * @returns {{
 *   question: string, setQuestion: (v: string) => void,
 *   loading: boolean, answer: string|null, sourceDocs: object[], error: string|null,
 *   ask: () => Promise<void>, reset: () => void,
 * }}
 */
export function useKnowledgeAI(documents) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [sourceDocs, setSourceDocs] = useState([]);
  const [error, setError] = useState(null);

  async function ask() {
    const trimmed = question.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setAnswer(null);

    const relevant = findRelevantDocuments(trimmed, documents, 3);
    setSourceDocs(relevant);

    if (relevant.length === 0) {
      setAnswer("Bu soruyla ilgili Bilgi Kütüphanesi'nde bir doküman bulamadım. Farklı kelimelerle tekrar dener misin?");
      setLoading(false);
      return;
    }

    const context = relevant.map((d) => `### ${d.title}\n${d.content}`).join("\n\n");

    try {
      const reply = await sendChatMessage({
        system: KNOWLEDGE_AI_PROMPT,
        max_tokens: 700,
        messages: [{ role: "user", content: `Soru: "${trimmed}"\n\nİlgili dokümanlar:\n${context}` }],
      });
      setAnswer(reply || "Yanıt oluşturulamadı, tekrar deneyin.");
    } catch {
      setError("AI yanıtı alınamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setQuestion("");
    setAnswer(null);
    setSourceDocs([]);
    setError(null);
  }

  return { question, setQuestion, loading, answer, sourceDocs, error, ask, reset };
}
