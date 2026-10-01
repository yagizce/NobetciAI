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
// Sunucu tarafı toplam bütçe 50 sn / Vercel maxDuration 60 sn (bkz. api/cosmos-vision.js);
// istemci bunun biraz üstünde bekler — takılı kalan bir istek kullanıcıyı sonsuza dek
// "yükleniyor" ekranında bırakmasın.
const REQUEST_TIMEOUT_MS = 65_000;

/**
 * @param {{ imageBase64: string, mediaType: string, question?: string, mode?: "findings" }} params
 *   `question` verilirse (AI Chat'te fotoğrafla ilgili soru) sunucu, sabit risk-analizi
 *   isteminin yerine kullanıcının sorusunu yanıtlayan sohbet istemini kullanır.
 *   `mode: "findings"` (Risk Tespiti → Fotoğrafla Tespit Et, bkz. visionAnalysisService.js)
 *   sunucudan yapılandırılmış bulgu JSON'u ister; dönen ham metin orada ayrıştırılır.
 * @returns {Promise<string>} AI'nın ham metin yanıtı
 * @throws {Error} `status` (HTTP durum kodu) veya `isTimeout` alanı taşıyabilir — çağıran
 *   taraf (ChatPanel) bunlara göre kullanıcıya anlaşılır mesaj üretir; `message` ham
 *   sunucu metni olabilir ve kullanıcıya OLDUĞU GİBİ gösterilmemelidir.
 */
export async function analyzePhotoWithCosmos({ imageBase64, mediaType, question, mode }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  let data;
  try {
    response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ imageBase64, mediaType, ...(question ? { question } : {}), ...(mode ? { mode } : {}) }),
    });
    data = await response.json().catch(() => null);
  } catch (err) {
    if (err?.name === "AbortError") {
      const timeoutError = new Error("Fotoğraf analizi zaman aşımına uğradı.");
      timeoutError.isTimeout = true;
      throw timeoutError;
    }
    throw err; // ağ hatası (TypeError) — çağıran taraf "bağlantı" mesajı gösterir
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const error = new Error(data?.error || `Sunucu hatası (${response.status})`);
    error.status = response.status;
    throw error;
  }

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
