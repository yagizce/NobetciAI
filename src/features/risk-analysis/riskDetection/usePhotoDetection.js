import { useState } from "react";
import { sendPhotoAnalysis } from "../../../services/chatService.js";
import { PHOTO_DETECTION_PROMPT, parsePhotoDetection } from "../../../constants/systemPrompt.js";
import { RISK_DETECTION_CATEGORIES } from "../../../constants/riskDetection.js";
import { useAiSuggestion } from "../../../hooks/useAiSuggestion.js";

const VALID_CATEGORY_VALUES = RISK_DETECTION_CATEGORIES.map((c) => c.value);

/**
 * AI_ROADMAP.md → "AI Vision — risk fotoğraflarından otomatik tehlike tespiti"
 * maddesinin karşılığı. ÖNEMLİ: bu bir kamera KURULUMU değil — kullanıcının kendi
 * telefonuyla çektiği/galeriden seçtiği bir fotoğrafın analizidir (Phase 9.2'deki
 * gerçek sabit kamera entegrasyonundan bilinçli olarak ayrı). Analiz sonucu asla
 * doğrudan bir Risk Tespiti kaydı OLUŞTURMAZ — yalnızca kategori/not önerir,
 * RiskDetectionForm.jsx'te kullanıcı gözden geçirip onaylar/düzenler.
 *
 * @returns {{
 *   analyzing: boolean, error: string|null,
 *   photoDataUrl: string|null, suggestion: {category: string|null, note: string|null}|null,
 *   analyzePhoto: (file: File) => Promise<void>, reset: () => void,
 * }}
 */
export function usePhotoDetection() {
  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [suggestion, setSuggestion] = useState(null);

  const { loading: analyzing, error, run } = useAiSuggestion(
    async (file) => {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Dosya okunamadı"));
        reader.readAsDataURL(file);
      });
      setPhotoDataUrl(dataUrl);

      const reply = await sendPhotoAnalysis({
        system: PHOTO_DETECTION_PROMPT,
        imageBase64: dataUrl.split(",")[1],
        mediaType: file.type || "image/jpeg",
        instruction: "Saha fotoğrafı — yukarıdaki 6 kategoriden birine göre sınıflandır.",
        max_tokens: 300,
      });
      const parsed = parsePhotoDetection(reply, VALID_CATEGORY_VALUES);
      setSuggestion(parsed);
      return parsed;
    },
    { errorMessage: "Fotoğraf analiz edilemedi. İnternet bağlantınızı kontrol edip tekrar deneyin." }
  );

  async function analyzePhoto(file) {
    if (!file) return;
    setSuggestion(null);
    await run(file);
  }

  function reset() {
    setPhotoDataUrl(null);
    setSuggestion(null);
  }

  return { analyzing, error, photoDataUrl, suggestion, analyzePhoto, reset };
}
