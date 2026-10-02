// Vercel Serverless Function: NVIDIA moonshotai/kimi-k3'e proxy — AI Chat sekmesi
// (bkz. src/features/chat/ChatPanel.jsx → src/services/chatService.js →
// sendKimiChatMessage). API key sunucu tarafında kalır, tarayıcıya ASLA gönderilmez.
// Vercel dashboard → Project → Settings → Environment Variables → NVIDIA_API_KEY
// (api/cosmos-vision.js ile AYNI key, yeni bir key alınmadı). Yerelde test için:
// `vercel dev` + proje kökünde `.env` dosyasına `NVIDIA_API_KEY=...` satırı.
//
// Bu dosya, api/chat.js ve api/cosmos-vision.js'teki İSPATLANMIŞ güvenlik desenini
// AYNEN tekrar eder (origin kontrolü + IP başına rate limit + payload boyutu tavanı +
// sunucu tarafında sabit max_tokens tavanı) — yeni bir backend mimarisi KURULMADI,
// mevcut api/ klasörüne bir fonksiyon daha eklendi.
//
// BİLİNÇLİ SINIRLAMA: api/chat.js (Anthropic/Claude) DEĞİŞTİRİLMEDİ — o endpoint
// hâlâ Fine-Kinney AI önerileri, mevzuat taraması, doküman/fotoğraf analizi ve
// Bilgi Merkezi gibi başka modüller tarafından kullanılıyor (bkz.
// src/services/chatService.js → sendChatMessage/sendPhotoAnalysis/sendDocumentAnalysis).
// Bu modüllere dokunmamak için AI Chat'in düz metin sohbeti, YENİ ve AYRI bir
// endpoint (bu dosya) üzerinden NVIDIA'ya bağlandı.

const MAX_TOKENS_CAP = 1200; // ChatPanel.jsx'in gönderdiği tavanla aynı
const MAX_PAYLOAD_BYTES = 512 * 1024; // düz metin sohbet — görüntü/PDF içermez, küçük tavan yeterli
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_PER_WINDOW = 20; // api/chat.js ile aynı tavan

const REASONING_EFFORT = "low";

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

const UPSTREAM_TIMEOUT_MS = 50_000; // Vercel maxDuration (60 sn) dolmadan kontrollü 504 dönebilmek için

// Kullanıcıya/ağ yanıtına HAM NVIDIA hata metni (model adı, hesap kimliği vb.) GİTMEZ; ayrıntı
// yalnızca sunucu günlüğüne (Vercel Logs) yazılır, istemciye HTTP durumuna uygun Türkçe mesaj döner.
function friendlyUpstreamError(status) {
  if (status === 429) return "Şu anda çok fazla istek var. Lütfen birkaç saniye bekleyip tekrar deneyin.";
  if (status === 504) return "AI yanıtı zaman aşımına uğradı. Lütfen tekrar deneyin.";
  if (status === 401 || status === 403) return "AI servisine şu anda erişilemiyor. Lütfen daha sonra tekrar deneyin.";
  return "AI servisi şu anda yanıt veremiyor. Lütfen birazdan tekrar deneyin.";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

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
  const { system, messages } = payload;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages alanı zorunludur ve boş olamaz." });
    return;
  }

  const payloadSize = Buffer.byteLength(JSON.stringify(payload), "utf8");
  if (payloadSize > MAX_PAYLOAD_BYTES) {
    res.status(413).json({ error: "İstek çok büyük. Lütfen mesajı kısaltıp tekrar deneyin." });
    return;
  }

  const safeMaxTokens = Math.min(Math.max(1, Number(payload.max_tokens) || 1000), MAX_TOKENS_CAP);

  const kimiMessages = [
    ...(system ? [{ role: "system", content: String(system) }] : []),
    ...messages.map((m) => {
      const role = m.role === "assistant" ? "assistant" : "user";
      const msg = { role, content: String(m.content ?? "") };
      if (role === "assistant" && typeof m.reasoning_content === "string" && m.reasoning_content) {
        msg.reasoning_content = m.reasoning_content;
      }
      if (role === "assistant" && Array.isArray(m.tool_calls) && m.tool_calls.length > 0) {
        msg.tool_calls = m.tool_calls;
      }
      return msg;
    }),
  ];

  try {
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      body: JSON.stringify({
        model: "moonshotai/kimi-k3",
        max_tokens: safeMaxTokens,
        reasoning_effort: REASONING_EFFORT,
        messages: kimiMessages,
      }),
    });

    // NVIDIA bazı hatalarda JSON değil düz metin döndürüyor (örn. "404 page not found");
    // response.json() bu durumda fırlatıp anlamsız bir 502'ye dönüşüyordu. Önce metin okunur.
    const rawText = await response.text();
    let data = null;
    try { data = JSON.parse(rawText); } catch { data = null; }
    if (data === null || typeof data !== "object") {
      console.error(`[kimi-chat] beklenmeyen yanıt (HTTP ${response.status}):`, rawText.slice(0, 300));
      const unexpectedStatus = response.status >= 400 ? response.status : 502;
      res.status(unexpectedStatus).json({ error: friendlyUpstreamError(unexpectedStatus) });
      return;
    }
    if (!response.ok) {
      console.error(`[kimi-chat] NVIDIA hatası (HTTP ${response.status}):`, JSON.stringify(data).slice(0, 500));
      res.status(response.status).json({ error: friendlyUpstreamError(response.status) });
      return;
    }
    res.status(response.status).json(data);
  } catch (err) {
    const timedOut = err?.name === "TimeoutError" || err?.name === "AbortError";
    console.error("[kimi-chat] NVIDIA isteği başarısız:", err?.name, err?.message);
    res.status(timedOut ? 504 : 502).json({
      error: timedOut ? friendlyUpstreamError(504) : "AI servisine ulaşılamadı. Lütfen birazdan tekrar deneyin.",
    });
  }
}
