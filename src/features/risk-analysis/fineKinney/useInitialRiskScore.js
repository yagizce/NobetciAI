import { useState } from "react";
import { scoreRisk } from "../../../services/riskService.js";
import { useAiSuggestion } from "../../../hooks/useAiSuggestion.js";

/**
 * Fine-Kinney formunun EN BAŞINDA (henüz P/M/Ş seçilmemişken) tehlike+risk metninden
 * başlangıç (önlem öncesi) Olasılık/Maruziyet/Şiddet önerisi almak için kullanılır.
 * `useAIRiskAnalysis`'ten bilinçli olarak AYRI tutuldu — o, önlem sonrası artık riski
 * öneriyor; bu ise formun başındaki ilk puanlamayı öneriyor. İkisi de aynı ilkeyi
 * paylaşır: AI önerir, kullanıcı düzenleyip onaylar; hiçbir değer sessizce kaydedilmez.
 * Ortak loading/error iskeleti `useAiSuggestion.js`'ten gelir.
 *
 * @param {object} form - Güncel form değerleri (hazard, risk, ...)
 * @param {(updater: (prev: object) => object) => void} setForm - Form state setter'ı
 * @returns {{
 *   scoreLoading: boolean,
 *   scoreError: string|null,
 *   scoreReasoning: string|null,
 *   getInitialScore: () => Promise<void>,
 * }}
 */
export function useInitialRiskScore(form, setForm) {
  const [scoreReasoning, setScoreReasoning] = useState(null);
  // Ayrıştırma başarısızlığı, ağ hatasından farklı bir kullanıcı mesajı gerektiriyor
  // (bkz. run() içindeki dönüş) — bu yüzden useAiSuggestion'ın genel `error`'ından ayrı
  // tutulup ikisi en altta birleştiriliyor.
  const [parseError, setParseError] = useState(null);

  const { loading: scoreLoading, error: networkError, run } = useAiSuggestion(async () => {
    const suggestion = await scoreRisk({ hazard: form.hazard, risk: form.risk });
    if (suggestion.probability === null && suggestion.frequency === null && suggestion.severity === null) {
      setParseError("AI önerisi ayrıştırılamadı, lütfen elle seçin.");
      return null;
    }
    setForm((prev) => ({
      ...prev,
      probability: suggestion.probability ?? prev.probability,
      frequency: suggestion.frequency ?? prev.frequency,
      severity: suggestion.severity ?? prev.severity,
    }));
    setScoreReasoning(suggestion.reasoning);
    return suggestion;
  });

  async function getInitialScore() {
    if (!form.hazard.trim()) return;
    setParseError(null);
    setScoreReasoning(null);
    await run();
  }

  return { scoreLoading, scoreError: parseError || networkError, scoreReasoning, getInitialScore };
}
