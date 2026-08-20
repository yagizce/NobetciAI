// Vercel Serverless Function: Anthropic API'ye proxy. API key sunucu tarafında kalır,
// tarayıcıya asla gönderilmez. Vercel dashboard → Project → Settings → Environment
// Variables → ANTHROPIC_API_KEY olarak tanımlanmalı, ardından yeniden deploy edilmelidir.
//
// Vercel'in dosya-bazlı routing kuralı: bu dosya /api/chat.js yolunda olduğu için
// otomatik olarak POST https://<domain>/api/chat adresinde erişilebilir (bkz.
// src/services/chatService.js → API_ENDPOINT). Netlify Functions'tan (`exports.handler`,
// `event`/`context`) farklı olarak Vercel Node.js runtime'ı standart
// `(req, res)` imzasını kullanır.
//
// GÜVENLİK SPRINTİ — Bu dosya öncesinde TAMAMEN AÇIK bir proxy'ydi: rate limit yok,
// payload boyutu sınırı yok, origin kontrolü yok, `max_tokens` istemcinin kontrolündeydi.
// Bu, URL'i bulan HERKESİN bu ANTHROPIC_API_KEY'in faturasına sınırsız yük bindirebileceği
// anlamına geliyordu. Aşağıdaki 4 önlem eklendi:

const MAX_TOKENS_CAP = 2000; // en yüksek meşru kullanım (documentService.js) 1500 — 2000 makul tavan
const MAX_PAYLOAD_BYTES = 8 * 1024 * 1024; // ~8MB — mevzuat/yönetmelik PDF yüklemesi de desteklemek için 4MB'den yükseltildi (Güvenlik Sprinti'nde konan sınır, PDF özelliği eklenince gözden geçirildi)
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_PER_WINDOW = 20; // dakikada IP başına 20 istek — normal kullanım için bol, kötüye kullanım için sıkı

// BİLİNÇLİ SINIRLAMA: Vercel serverless fonksiyonları durumsuzdur (her instance ayrı
// bellek), bu Map yalnızca "sıcak" (warm) instance'lar arasında kalıcıdır — soğuk
// başlangıçta (cold start) veya birden fazla bölgede/instance'ta paylaşılmaz. Yani bu,
// KESİN bir rate limit DEĞİL, ek bir sürtünme katmanıdır. Gerçek/kesin rate limiting için
// Vercel KV veya Upstash Redis gibi kalıcı bir depo gerekir — bu, yeni bir bağımlılık/
// backend kararı olduğu için DEVELOPMENT_RULES.md gereği ayrı onay olmadan eklenmedi.
const requestLog = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  // Map sınırsız büyümesin diye basit bir temizlik (yalnızca aktif pencere içindekiler tutulur)
  if (requestLog.size > 5000) requestLog.clear();
  return timestamps.length > RATE_LIMIT_MAX_PER_WINDOW;
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  return (forwarded ? forwarded.split(",")[0].trim() : null) || req.socket?.remoteAddress || "unknown";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // 1) Origin kontrolü — BİLİNÇLİ SINIRLAMA: bu, tarayıcıdan BAŞKA bir sitenin bu
  // endpoint'i kendi sayfasına gömüp çağırmasını engeller, ama Origin header'ı
  // göndermeyen doğrudan bir curl/script çağrısını DURDURMAZ (aşağıdaki rate limit +
  // max_tokens tavanı, o senaryo için asıl korumadır). `req.headers.host` kullanılır
  // (VERCEL_URL değil) ki hem otomatik *.vercel.app hem de sonradan bağlanan özel
  // domain'de doğru çalışsın.
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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: "ANTHROPIC_API_KEY tanımlı değil. Vercel > Project Settings > Environment Variables kısmından ekleyin ve yeniden deploy edin.",
    });
    return;
  }

  // Vercel Node.js fonksiyonları, Content-Type application/json isteklerinde req.body'yi
  // OTOMATİK olarak parse eder (Netlify'daki gibi elle JSON.parse(event.body) gerekmez).
  const payload = req.body || {};

  const payloadSize = Buffer.byteLength(JSON.stringify(payload), "utf8");
  if (payloadSize > MAX_PAYLOAD_BYTES) {
    res.status(413).json({ error: "İstek çok büyük (maksimum ~8MB toplam istek). Dosya boyutunu küçültüp tekrar deneyin." });
    return;
  }

  // max_tokens istemciden ne gelirse gelsin bu tavanı AŞAMAZ — önceki halde
  // `payload.max_tokens || 1000` doğrudan kullanılıyordu, yani çağıran taraf
  // (veya endpoint'i doğrudan çağıran biri) maliyeti dilediği gibi şişirebilirdi.
  const safeMaxTokens = Math.min(Math.max(1, Number(payload.max_tokens) || 1000), MAX_TOKENS_CAP);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: safeMaxTokens,
        system: payload.system,
        messages: payload.messages,
      }),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "Anthropic API'ye ulaşılamadı: " + err.message });
  }
}
