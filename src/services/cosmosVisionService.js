import { postJson } from "./apiClient.js";

/**
 * @param {{ imageBase64: string, mediaType: string, question?: string, mode?: "findings" }} params
 *   `question` verilirse (AI Chat'te fotoğrafla ilgili soru) sunucu, sabit risk-analizi
 *   isteminin yerine kullanıcının sorusunu yanıtlayan sohbet istemini kullanır.
 *   `mode: "findings"` (Risk Tespiti → Fotoğrafla Tespit Et, bkz. visionAnalysisService.js)
 *   sunucudan yapılandırılmış bulgu JSON'u ister; dönen ham metin orada ayrıştırılır.
 * @returns {Promise<string>} AI'nın ham metin yanıtı
 * @throws {Error} `status` (HTTP durum kodu) veya `isTimeout` alanı taşıyabilir — çağıran
 *   taraf (ChatPanel) bunlara göre kullanıcıya anlaşılır mesaj üretir.
 */
export async function analyzePhotoWithCosmos({ imageBase64, mediaType, question, mode }) {
  const data = await postJson("/api/cosmos-vision", {
    imageBase64,
    mediaType,
    ...(question ? { question } : {}),
    ...(mode ? { mode } : {}),
  });

  // NVIDIA'nın OpenAI-uyumlu chat completions yanıt şekli: choices[0].message.content
  const rawText = data?.choices?.[0]?.message?.content;
  // Düşünen (reasoning) bir model yedeğe düşerse yanıtın başında <think> bloğu olabilir —
  // kullanıcıya yalnızca asıl cevap gösterilir.
  const text = typeof rawText === "string" ? rawText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim() : "";
  if (!text) {
    throw new Error("AI'dan beklenen formatta bir yanıt alınamadı.");
  }
  return text;
}
