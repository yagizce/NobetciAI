import { useState, useRef } from "react";
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
  // Enter tuşu `loading` ile devre dışı bırakılan düğmeyi atlıyordu: art arda Enter, aynı soru için
  // birden fazla AI isteği başlatıp eski cevabın yenisini ezmesine yol açıyordu.
  const askingRef = useRef(false);

  async function ask() {
    const trimmed = question.trim();
    if (!trimmed || askingRef.current) return;
    askingRef.current = true;
    setLoading(true);
    setError(null);
    setAnswer(null);

    const relevant = findRelevantDocuments(trimmed, documents, 3);
    setSourceDocs(relevant);

    if (relevant.length === 0) {
      setAnswer("Bu soruyla ilgili Bilgi Kütüphanesi'nde bir doküman bulamadım. Farklı kelimelerle tekrar dener misin?");
      setLoading(false);
      askingRef.current = false;
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
    } catch (err) {
      // Sunucu hata kodu (api_error_*) bağlantı sorunu DEĞİLDİR; "internetinizi kontrol edin"
      // demek kullanıcıyı yanlış yönlendiriyordu. Yalnızca ağ hatasında bağlantı uyarısı verilir.
      const serverSide = /^api_error_/.test(err?.message || "");
      setError(
        serverSide
          ? "AI servisi şu anda yanıt veremiyor. Lütfen birazdan tekrar deneyin."
          : "AI yanıtı alınamadı. İnternet bağlantınızı kontrol edip tekrar deneyin."
      );
    } finally {
      setLoading(false);
      askingRef.current = false;
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
