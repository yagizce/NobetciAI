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
  const { imageBase64, mediaType } = payload;

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

  const payloadSize = Buffer.byteLength(imageBase64, "utf8");
  if (payloadSize > MAX_PAYLOAD_BYTES) {
    res.status(413).json({ error: "Görüntü çok büyük (maksimum ~8MB). Lütfen daha küçük bir fotoğraf deneyin." });
    return;
  }

  try {
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        // DÜZELTME: barındırılan (integrate.api.nvidia.com) uç nokta, hesabın /v1/models
        // listesinde yalnızca bu Cosmos modelini sunuyor; "cosmos3-nano-reasoner" 404 dönüyordu.
        model: "nvidia/cosmos-reason2-8b",
        max_tokens: MAX_TOKENS_CAP,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: SAFETY_ANALYSIS_PROMPT },
              { type: "image_url", image_url: { url: `data:${mediaType};base64,${imageBase64}` } },
            ],
          },
        ],
      }),
    });

    // DÜZELTME (teşhis edilebilirlik): NVIDIA bazı hatalarda JSON değil düz metin döndürüyor
    // (örn. "404 page not found"); doğrudan response.json() bu durumda anlamsız bir
    // "Unexpected non-whitespace character" hatası veriyordu. Önce metin olarak okunur,
    // JSON ise olduğu gibi iletilir, değilse durum kodu + yanıtın başı hata olarak döner.
    const rawText = await response.text();
    let data = null;
    try { data = JSON.parse(rawText); } catch { data = null; }
    if (data === null || typeof data !== "object") {
      res.status(response.status >= 400 ? response.status : 502).json({
        error: `NVIDIA API beklenmeyen yanıt döndürdü (HTTP ${response.status}): ${rawText.slice(0, 300)}`,
      });
      return;
    }
    // DÜZELTME (teşhis edilebilirlik): NVIDIA hata durumunda {status,title,detail} veya
    // {error:{message}} gibi JSON döndürüyor; istemci yalnızca `error` alanını okuduğu için
    // ekranda sadece "Sunucu hatası (404)" görünüyordu. Hata detayı `error` alanına taşınır.
    if (!response.ok) {
      const detail =
        (typeof data.error === "string" && data.error) ||
        data.error?.message ||
        data.detail ||
        data.message ||
        data.title ||
        JSON.stringify(data).slice(0, 300);
      res.status(response.status).json({ error: `NVIDIA API hatası (HTTP ${response.status}): ${detail}` });
      return;
    }
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "NVIDIA API'sine ulaşılamadı: " + err.message });
  }
}
