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

// DÜZELTME (yanıt kalitesi + gecikme): Kimi K3, NVIDIA/Moonshot'un resmi dokümantasyonuna
// göre HER ZAMAN "düşünerek" (reasoning) cevap veriyor ve `reasoning_effort` belirtilmezse
// varsayılan "max" kullanılıyor — bu, tek bir cevap için bir dakikanın üzerinde sürebiliyor
// (bkz. platform.kimi.ai/docs/guide/use-reasoning-effort, huggingface.co/moonshotai/Kimi-K3).
// Bir sohbet arayüzünde bu hem kötü UX (kullanıcı dakikalarca bekler) hem de bir risktir:
// Vercel serverless fonksiyonlarının varsayılan çalışma süresi sınırı bu süreyi aşarsa
// istek zaman aşımına uğrar ve istemci bunu "ağa hiç ulaşılamadı" gibi görür — dünkü
// bağlantı sorununun bir parçası muhtemelen buydu. "high", derinlik/hız dengesini "max"tan
// daha iyi kurar (resmi dokümantasyonun kendi önerisi: "'high' is the middle ground").
// Model server-side sabitlendi (max_tokens ile aynı mantık) — istemci bunu değiştiremez.
// DÜZELTME (gecikme): "high" gerçek testte ~126 saniyeye kadar sürebildiği görüldü
// (reasoning token üretimi max_tokens tarafından sınırlanmıyor). "low" ile gecikme
// azaltılıyor, karmaşık sorularda cevap derinliği hafifçe azalabilir — gözlemlenmeli.
const REASONING_EFFORT = "low";

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

  // NVIDIA'nın OpenAI-uyumlu chat completions şeması: system ayrı bir mesaj olarak
  // en başa eklenir, geri kalan mesajlar { role, content } (düz metin) olarak geçer.
  // DÜZELTME (çok turlu tutarlılık): Kimi K3'ün resmi kullanım kılavuzu, çok turlu
  // sohbetlerde önceki asistan cevaplarının yalnızca `content` değil, `reasoning_content`
  // (ve varsa `tool_calls`) ile BİRLİKTE geri gönderilmesini şart koşuyor ("preserved
  // thinking" modu) — aksi halde model önceki turlardaki akıl yürütme bağlamını kaybeder.
  // İstemci (chatService.js → sendKimiChatMessage, ChatPanel.jsx) artık asistan
  // mesajlarına bu alanları ekleyip geri gönderiyor; burada varsa aynen korunuyor.
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
      body: JSON.stringify({
        model: "moonshotai/kimi-k3",
        max_tokens: safeMaxTokens,
        reasoning_effort: REASONING_EFFORT,
        messages: kimiMessages,
      }),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "NVIDIA API'sine ulaşılamadı: " + err.message });
  }
}
