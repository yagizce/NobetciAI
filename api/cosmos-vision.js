// Vercel Serverless Function: NVIDIA Cosmos3-Nano-Reasoner'a proxy — SADECE TEST
// amaçlı İSG fotoğraf analizi (bkz. src/pages/CosmosVisionTest.jsx). API key sunucu
// tarafında kalır, tarayıcıya ASLA gönderilmez. Vercel dashboard → Project → Settings
// → Environment Variables → NVIDIA_API_KEY olarak tanımlanmalı, ardından yeniden
// deploy edilmelidir. Yerelde test için: `vercel dev` + proje kökünde `.env` dosyasına
// `NVIDIA_API_KEY=...` satırı (bkz. .gitignore — `.env` zaten commit'lenmiyor).
//
// Bu dosya, api/chat.js'teki (Anthropic proxy) İSPATLANMIŞ güvenlik desenini AYNEN
// tekrar eder (origin kontrolü + IP başına rate limit + payload boyutu tavanı) —
// yeni/farklı bir backend mimarisi KURULMADI, mevcut api/ klasörüne bir fonksiyon
// daha eklendi. Genel amaçlı bir proxy DEĞİLDİR (chat.js gibi keyfi `system`/`messages`
// kabul etmez): yalnızca bir fotoğraf alır, İSG analiz istemini SUNUCU TARAFINDA
// SABİT tutar — istemci promptu değiştiremez, bu da kapsamı kasıtlı olarak dar tutar.

const MAX_PAYLOAD_BYTES = 8 * 1024 * 1024; // ~8MB — tipik bir telefon fotoğrafı için yeterli
const MAX_TOKENS_CAP = 1200;
// Hesabın /v1/models listesinde görünen görsel-anlayan modeller, tercih sırasıyla. Barındırılan
// uç noktada bazı modeller "Not found for account" (404) dönebiliyor; bu yüzden sırayla
// denenir, ilk 404 OLMAYAN yanıt kullanılır. (cosmos3-nano-reasoner ve cosmos-reason2-8b
// bu hesapta 404 verdi.)
// HIZ/DOĞRULUK DENGESİ: Chat'teki fotoğraf sorusu HIZLI cevap ister (kullanıcı bekliyor,
// 90B model 504 zaman aşımına yol açabiliyordu) → küçük/hızlı modeller önce. Risk Tespiti
// bulgu JSON'u doğruluk ister ve sonucu uzman onaylar → büyük model önce.
const CHAT_MODELS = [
  "meta/llama-3.2-11b-vision-instruct",
  "google/gemma-3-12b-it",
  "meta/llama-3.2-90b-vision-instruct",
];
const FINDINGS_MODELS = [
  "meta/llama-3.2-90b-vision-instruct",
  "meta/llama-3.2-11b-vision-instruct",
  "google/gemma-3-12b-it",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
];
const CHAT_MAX_TOKENS = 700; // sohbet cevabı kısa/net — daha az token = daha hızlı yanıt
// Vercel fonksiyon süresi (vercel.json → maxDuration 60) dolmadan modeller arası geçiş yapılabilsin.
const TOTAL_BUDGET_MS = 50_000;
const PER_ATTEMPT_TIMEOUT_MS = 25_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_PER_WINDOW = 10; // görüntü analizi maliyetli — chat.js'ten daha sıkı

// BİLİNÇLİ SINIRLAMA: api/chat.js'teki AYNI not geçerli — Vercel fonksiyonları
// durumsuzdur, bu yalnızca "sıcak" instance'lar arası ek bir sürtünme katmanıdır,
// kesin bir rate limit değildir.
const requestLog = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  if (requestLog.size > 5000) requestLog.clear();
  return timestamps.length > RATE_LIMIT_MAX_PER_WINDOW;
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  return (forwarded ? forwarded.split(",")[0].trim() : null) || req.socket?.remoteAddress || "unknown";
}

// İstemin SUNUCU TARAFINDA sabit tutulması bilinçli bir tercih: bu endpoint genel bir
// AI proxy'si değil, tek bir amaca (İSG fotoğraf analizi) kilitli. Kullanıcının
// isteğindeki prensip birebir kullanıldı.
const SAFETY_ANALYSIS_PROMPT = `Bu görüntüyü bir İSG uzmanına yardımcı olacak şekilde analiz et. Yalnızca görüntüde gerçekten görülebilen veya makul şekilde çıkarılabilen riskleri belirt. Görüntüde olmayan bir şeyi varsayma veya uydurma. Görüntü yeterli değilse ya da belirsizse bunu açıkça belirt.

Birden fazla bulgu varsa hepsini ayrı ayrı listele. Her bulgu için TAM OLARAK şu formatı kullan:
- Risk/Uygunsuzluk:
- Tehlike:
- Olası sonuç:
- Önerilen önlem:
- Etkilenen kişiler:
- Güven seviyesi (düşük/orta/yüksek):
- Belirsizlik/kısıtlar: (görüntüden emin olamadığın, doğrulama gerektiren noktalar; yoksa "yok" yaz)

Net bir tehlike tespit edemiyorsan bunu dürüstçe belirt, olmayan bir bulgu uydurma.`;

// AI Chat'te yüklenen fotoğrafla ilgili sorular için (opsiyonel `question` alanı). İstem yine
// SUNUCU TARAFINDA sabit; kullanıcı yalnızca kısa bir soru metni ekleyebilir (MAX_QUESTION_LENGTH).
// Risk/tehlike analizi (Fine-Kinney vb.) bilinçli olarak İSTENMİYOR — o yalnızca Risk Tespiti
// sayfasından yapılır.
const MAX_QUESTION_LENGTH = 2000; // ChatPanel.jsx MAX_MESSAGE_LENGTH ile aynı — daha kısa olursa uzun bir soru teknik 400 hatasına dönerdi
const PHOTO_QUESTION_PROMPT = `Bir İSG platformunun sohbet asistanısın. Kullanıcı bir fotoğraf yükledi ve fotoğrafla ilgili bir soru soruyor. Yalnızca fotoğrafta gerçekten görülebilen şeylere dayanarak Türkçe, kısa ve net yanıt ver. Görüntüde olmayan bir şeyi varsayma veya uydurma; emin olamıyorsan bunu açıkça belirt. Kullanıcı açıkça istemedikçe risk/tehlike analizi yapma.

Kullanıcının sorusu: `;

// Risk Tespiti → "Fotoğrafla Tespit Et" (opsiyonel `mode: "findings"`): yapılandırılmış, ÇOKLU
// bulgu JSON'u ister. İstem yine SUNUCU TARAFINDA sabit. Kategori anahtarları
// src/constants/riskDetection.js → RISK_DETECTION_CATEGORIES ile AYNI tutulmalı; istemci
// (services/visionAnalysisService.js) bu listeye uymayan bulguları zaten eler.
const MAX_FINDINGS = 4;
const FINDINGS_PROMPT = `Bu fotoğrafı bir İSG uzmanına yardımcı olacak şekilde analiz et. YALNIZCA görüntüde gerçekten görülebilen tehlikeleri raporla; görüntüde olmayan bir şeyi varsayma veya uydurma.

Yalnızca aşağıdaki kategorilerden birine uyan tehlikeleri raporla (anahtar: anlamı):
- ppe: kişisel koruyucu donanım (baret, eldiven, gözlük, yelek vb.) eksikliği
- forkliftProximity: forklift/iş makinesi ile yayaların yakınlığı
- fallRisk: düşme / yüksekte çalışma riski (korkuluk, emniyet kemeri/hayat hattı eksikliği vb.)
- confinedSpace: kapalı/dar alana giriş
- fireSmoke: yangın, duman veya ısı kaynağı belirtisi
- improperStacking: uygunsuz istifleme / depolama
Bu kategorilere uymayan bir tehlike varsa raporlama.

SADECE geçerli bir JSON dizisi döndür; başka hiçbir metin, açıklama veya markdown yazma. En fazla ${MAX_FINDINGS} bulgu. Her bulgu şu alanlara sahip olmalı:
{"hazard": "kısa başlık", "description": "görüntüde ne görüldüğü", "category": "yukarıdaki anahtarlardan biri", "recommendedAction": "önerilen önlem", "affected": "etkilenen kişiler", "legislationRef": "emin olduğun kanun/yönetmelik adı; emin değilsen boş metin (asla uydurma)", "confidenceScore": 0 ile 100 arası tam sayı}
Net bir tehlike görmüyorsan boş dizi [] döndür.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Origin kontrolü — bkz. api/chat.js'teki AYNI bilinçli sınırlama notu.
  const origin = req.headers.origin;
  if (origin) {
    let originHost;
    try { originHost = new URL(origin).host; } catch { originHost = null; }
    if (originHost && originHost !== req.headers.host) {
      res.status(403).json({ error: "Bu origin'den istek kabul edilmiyor." });
      return;
    }
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    res.status(429).json({ error: "Çok fazla istek gönderildi. Lütfen bir dakika sonra tekrar deneyin." });
    return;
  }

  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: "NVIDIA_API_KEY tanımlı değil. Vercel > Project Settings > Environment Variables kısmından ekleyin (yerelde .env dosyasına) ve yeniden deploy edin/vercel dev'i yeniden başlatın.",
    });
    return;
  }

  const payload = req.body || {};
  const { imageBase64, mediaType, question, mode } = payload;

  if (!imageBase64 || typeof imageBase64 !== "string") {
    res.status(400).json({ error: "imageBase64 alanı zorunludur." });
    return;
  }
  // DÜZELTME: istemci tarafı ortak doğrulayıcı (utils/fileValidation.js →
  // validateImageFile, bu sayfa VE Chat'teki fotoğraf analizi TARAFINDAN paylaşılıyor)
  // GIF'i geçerli bir görsel formatı olarak kabul ediyor; burada da kabul edilmezse
  // kullanıcı istemcide "geçerli" görüp sunucudan 400 alır. Regex, ortak doğrulayıcıyla
  // hizalandı.
  if (!mediaType || !/^image\/(jpeg|jpg|png|webp|gif)$/.test(mediaType)) {
    res.status(400).json({ error: "Geçersiz veya desteklenmeyen mediaType (yalnızca jpeg/png/webp/gif)." });
    return;
  }

  if (question !== undefined && (typeof question !== "string" || !question.trim() || question.length > MAX_QUESTION_LENGTH)) {
    res.status(400).json({ error: `question alanı 1-${MAX_QUESTION_LENGTH} karakterlik bir metin olmalıdır.` });
    return;
  }
  if (mode !== undefined && mode !== "findings") {
    res.status(400).json({ error: "Geçersiz mode (yalnızca \"findings\")." });
    return;
  }
  const promptText = mode === "findings"
    ? FINDINGS_PROMPT
    : question ? PHOTO_QUESTION_PROMPT + question.trim() : SAFETY_ANALYSIS_PROMPT;

  const payloadSize = Buffer.byteLength(imageBase64, "utf8");
  if (payloadSize > MAX_PAYLOAD_BYTES) {
    res.status(413).json({ error: "Görüntü çok büyük (maksimum ~8MB). Lütfen daha küçük bir fotoğraf deneyin." });
    return;
  }

  try {
    const models = mode === "findings" ? FINDINGS_MODELS : CHAT_MODELS;
    const maxTokens = mode === "findings" ? MAX_TOKENS_CAP : question ? CHAT_MAX_TOKENS : MAX_TOKENS_CAP;
    const startedAt = Date.now();
    let response = null;
    let rawText = "";
    let usedModel = null;
    let lastNetworkError = null;
    for (const model of models) {
      const remaining = TOTAL_BUDGET_MS - (Date.now() - startedAt);
      if (remaining < 5_000) break; // yeni bir deneme için yeterli süre kalmadı
      usedModel = model;
      try {
        response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          signal: AbortSignal.timeout(Math.min(PER_ATTEMPT_TIMEOUT_MS, remaining)),
          body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: promptText },
                  { type: "image_url", image_url: { url: `data:${mediaType};base64,${imageBase64}` } },
                ],
              },
            ],
          }),
        });
        rawText = await response.text();
        lastNetworkError = null;
      } catch (err) {
        // zaman aşımı / ağ hatası → sıradaki modeli dene
        lastNetworkError = err;
        response = null;
        continue;
      }
      // Model hesapta yok (404) ya da geçici sunucu hatası (5xx, örn. 504) → sıradaki modeli dene.
      if (response.status !== 404 && response.status < 500) break;
    }
    if (!response) {
      const timedOut = lastNetworkError?.name === "TimeoutError" || lastNetworkError?.name === "AbortError";
      res.status(504).json({
        error: timedOut
          ? "AI yanıtı zaman aşımına uğradı. Lütfen tekrar deneyin (daha küçük bir fotoğraf da yardımcı olabilir)."
          : "NVIDIA API'sine ulaşılamadı" + (lastNetworkError ? ": " + lastNetworkError.message : "."),
      });
      return;
    }

    // DÜZELTME (teşhis edilebilirlik): NVIDIA bazı hatalarda JSON değil düz metin döndürüyor
    // (örn. "404 page not found"); doğrudan response.json() bu durumda anlamsız bir
    // "Unexpected non-whitespace character" hatası veriyordu. Önce metin olarak okunur,
    // JSON ise olduğu gibi iletilir, değilse durum kodu + yanıtın başı hata olarak döner.
    let data = null;
    try { data = JSON.parse(rawText); } catch { data = null; }
    if (data === null || typeof data !== "object") {
      res.status(response.status >= 400 ? response.status : 502).json({
        error: `NVIDIA API beklenmeyen yanıt döndürdü (HTTP ${response.status}, model: ${usedModel}): ${rawText.slice(0, 300)}`,
      });
      return;
    }
    // Hata durumunda NVIDIA {status,title,detail} veya {error:{message}} döndürüyor; istemci
    // yalnızca `error` alanını okuduğu için detay `error` alanına taşınır.
    if (!response.ok) {
      const detail =
        (typeof data.error === "string" && data.error) ||
        data.error?.message ||
        data.detail ||
        data.message ||
        data.title ||
        JSON.stringify(data).slice(0, 300);
      res.status(response.status).json({ error: `NVIDIA API hatası (HTTP ${response.status}, model: ${usedModel}): ${detail}` });
      return;
    }
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "NVIDIA API'sine ulaşılamadı: " + err.message });
  }
}
