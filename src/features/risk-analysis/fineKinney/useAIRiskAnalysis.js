import { useState } from "react";
import { FINE_KINNEY_AI_PROMPT, parseResidualSuggestion } from "../../../constants/systemPrompt.js";
import { sendChatMessage } from "../../../services/chatService.js";
import { useAiSuggestion } from "../../../hooks/useAiSuggestion.js";

/**
 * Fine-Kinney formunun AI destekli önlem/artık risk önerisi mantığını barındırır.
 * FineKinneyForm.jsx'ten bilinçli olarak ayrıldı — form yalnızca görünümden ve alan
 * state'inden sorumlu kalsın, AI çağrısı/parse mantığı kendi başına test edilebilir ve
 * ileride Vision AI/RAG gibi diğer AI özellikleri tarafından da yeniden kullanılabilir
 * bir birim olsun diye. Ortak loading/error iskeleti `useAiSuggestion.js`'ten gelir.
 *
 * Güvenlik ilkesi (değişmedi): AI'nin önerdiği artık risk değerleri, asıl risk
 * değerlerini asla aşamaz (`Math.min` ile sınırlı) ve yalnızca kullanıcının
 * düzenleyip onaylayacağı form alanlarına yazılır.
 *
 * @param {object} form - Güncel form değerleri (hazard, risk, probability, frequency, severity, action, ...)
 * @param {(updater: (prev: object) => object) => void} setForm - Form state setter'ı
 * @returns {{
 *   aiLoading: boolean,
 *   aiSuggestion: string|null,
 *   aiError: string|null,
 *   getAiSuggestion: () => Promise<void>,
 *   applySuggestionToAction: () => void,
 * }}
 */
export function useAIRiskAnalysis(form, setForm) {
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const { loading: aiLoading, error: aiError, run } = useAiSuggestion(async () => {
    const reply = await sendChatMessage({
      system: FINE_KINNEY_AI_PROMPT,
      max_tokens: 500,
      messages: [{
        role: "user",
        content: `Tehlike: ${form.hazard}\nRisk: ${form.risk || "belirtilmedi"}\nÖnlem öncesi Olasılık: ${form.probability}\nÖnlem öncesi Maruziyet: ${form.frequency}\nÖnlem öncesi Şiddet: ${form.severity}`,
      }],
    });
    setAiSuggestion(reply || "Öneri oluşturulamadı, tekrar deneyin.");

    // AI'nin metin cevabından artık risk önerisini ayıkla ve önlem alanına eklendiğinde
    // kullanılmak üzere hazırla — asıl değerleri ASLA aşmayacak şekilde sınırlanır.
    if (reply) {
      const parsed = parseResidualSuggestion(reply);
      setForm((prev) => ({
        ...prev,
        residualProbability: parsed.probability !== null ? Math.min(parsed.probability, Number(prev.probability)) : prev.residualProbability,
        residualFrequency: parsed.frequency !== null ? Math.min(parsed.frequency, Number(prev.frequency)) : prev.residualFrequency,
        residualSeverity: parsed.severity !== null ? Math.min(parsed.severity, Number(prev.severity)) : prev.residualSeverity,
        residualSuggested: parsed.probability !== null || parsed.frequency !== null || parsed.severity !== null,
      }));
    }
    return reply;
  });

  async function getAiSuggestion() {
    if (!form.hazard.trim()) return;
    setAiSuggestion(null);
    await run();
  }

  function applySuggestionToAction() {
    if (!aiSuggestion) return;
    // AI cevabının "Artık Risk Önerisi" kısmını önlem metnine eklemeye gerek yok — o veri
    // zaten Artık Risk dropdown'larına otomatik uygulandı. Yalnızca önlem/KKD/açıklama kısmını ekle.
    const actionOnly = aiSuggestion.split(/\*\*Artık Risk Önerisi/i)[0].trim();
    setForm((prev) => ({ ...prev, action: prev.action ? `${prev.action}\n\n${actionOnly}` : actionOnly }));
  }

  return { aiLoading, aiSuggestion, aiError, getAiSuggestion, applySuggestionToAction };
}
