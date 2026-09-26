// cosmosVisionService — SADECE TEST amaçlı. NVIDIA Cosmos3-Nano-Reasoner ile İSG
// fotoğraf analizi. chatService.js'teki AYNI desen: tarayıcı yalnızca kendi
// backend'imizin (/api/cosmos-vision, bkz. api/cosmos-vision.js) proxy'sine konuşur,
// NVIDIA_API_KEY'i asla görmez/göndermez.
//
// BİLİNÇLİ SINIRLAMA: Bu servisin ürettiği sonuç HİÇBİR YERDE kaydedilmez — ne bir
// risk kaydına (Fine-Kinney), ne bir mevzuat eşleştirmesine, ne başka bir veri
// deposuna. Yalnızca ekranda gösterilir (bkz. CosmosVisionTest.jsx). Bu, isteğin
// "AI çıktısını henüz gerçek risk kaydı olarak kaydetme" kuralının doğal sonucu.

const API_ENDPOINT = "/api/cosmos-vision";

/**
 * @param {{ imageBase64: string, mediaType: string }} params
 * @returns {Promise<string>} AI'nın ham metin yanıtı
 */
export async function analyzePhotoWithCosmos({ imageBase64, mediaType }) {
  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, mediaType }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error || `Sunucu hatası (${response.status})`;
    throw new Error(message);
  }

  // NVIDIA'nın OpenAI-uyumlu chat completions yanıt şekli: choices[0].message.content
  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("AI'dan beklenen formatta bir yanıt alınamadı.");
  }
  return text;
}