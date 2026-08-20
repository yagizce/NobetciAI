import { useState } from "react";
import { sendChatMessage } from "../../../services/chatService.js";
import { DETECTION_TO_RISK_PROMPT, parseDetectionRiskDraft } from "../../../constants/systemPrompt.js";
import { getDetectionCategoryLabel } from "../../../constants/riskDetection.js";

/**
 * Bir Risk Tespiti kaydından AI destekli Fine-Kinney taslağı üretir. `useAIRiskAnalysis.js`
 * ile AYNI ilke: AI hiçbir zaman doğrudan kayıt oluşturmaz, yalnızca öneri üretir —
 * kullanıcı "Fine-Kinney Formuna Aktar" ile formu ÖN DOLDURULMUŞ açar, kaydetme kararı
 * ve son onay tamamen kullanıcıya bırakılır.
 *
 * @param {import("../../../types/index.js").RiskDetection} detection
 */
export function useDetectionAIDraft(detection) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState(null);

  async function generateDraft() {
    setLoading(true);
    setError(null);
    setDraft(null);
    try {
      const reply = await sendChatMessage({
        system: DETECTION_TO_RISK_PROMPT,
        max_tokens: 500,
        messages: [{
          role: "user",
          content: `Kategori: ${getDetectionCategoryLabel(detection.category)}\nKonum: ${detection.location}\nSon 30 gün içinde tespit sayısı: ${detection.occurrenceCount}${detection.hazardNote ? `\nGözlem notu: ${detection.hazardNote}` : ""}`,
        }],
      });
      const parsed = parseDetectionRiskDraft(reply || "");
      setDraft({ ...parsed, hazard: `${getDetectionCategoryLabel(detection.category)} — ${detection.location}` });
    } catch {
      setError("AI taslağı oluşturulamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, draft, generateDraft };
}
