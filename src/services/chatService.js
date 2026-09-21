// chatService — the only service that actually calls the backend right now.
// Talks exclusively to our own Vercel Serverless Function proxy; the Anthropic API key
// never touches the browser (see /api/chat.js).

const API_ENDPOINT = "/api/chat";
const KIMI_API_ENDPOINT = "/api/kimi-chat";

/**
 * @param {{system?: string, messages: Array<{role: string, content: any}>, max_tokens?: number}} payload
 * @returns {Promise<string|null>} assistant's text reply, or null if the response had no text block
 */
export async function sendChatMessage({ system, messages, max_tokens = 1000 }) {
  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, messages, max_tokens }),
  });
  if (!response.ok) throw new Error("api_error_" + response.status);
  const data = await response.json();
  const textBlock = data?.content?.find((c) => c.type === "text");
  return textBlock ? textBlock.text : null;
}

/**
 * AI Chat sekmesi (ChatPanel.jsx) için — NVIDIA moonshotai/kimi-k3'e /api/kimi-chat
 * proxy'si üzerinden düz metin İSG sohbeti gönderir.
 * DÜZELTME (çok turlu tutarlılık): önceden yalnızca `content` metnini döndürüyordu.
 * Kimi K3'ün "preserved thinking" gereksinimi nedeniyle artık asistan cevabının
 * `reasoning_content` ve `tool_calls` alanlarını da (varsa) döndürüyor — çağıran taraf
 * (ChatPanel.jsx) bunları mesaj state'inde saklayıp bir sonraki istekte geri gönderebilsin.
 * Fine-Kinney/mevzuat/doküman/fotoğraf analizleri bu fonksiyonu KULLANMAZ — onlar hâlâ
 * sendChatMessage/sendPhotoAnalysis/sendDocumentAnalysis üzerinden Claude'a gider.
 * @param {{system?: string, messages: Array<{role: string, content: any, reasoning_content?: string, tool_calls?: any[]}>, max_tokens?: number}} payload
 * @returns {Promise<{text: string|null, reasoningContent: string|null, toolCalls: any[]|null}|null>}
 */
export async function sendKimiChatMessage({ system, messages, max_tokens = 1000 }) {
  const response = await fetch(KIMI_API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, messages, max_tokens }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    console.error("Kimi K3 API hatası:", response.status, data?.error || data);
    throw new Error("api_error_" + response.status);
  }
  const message = data?.choices?.[0]?.message;
  if (!message) return null;
  return {
    text: message.content ?? null,
    reasoningContent: message.reasoning_content ?? null,
    toolCalls: Array.isArray(message.tool_calls) ? message.tool_calls : null,
  };
}

/**
 * Sends a single image + instruction for hazard analysis (vision request).
 * @param {{system?: string, imageBase64: string, mediaType: string, instruction: string, max_tokens?: number}} payload
 * @returns {Promise<string|null>}
 */
export async function sendPhotoAnalysis({ system, imageBase64, mediaType, instruction, max_tokens = 1200 }) {
  return sendChatMessage({
    system,
    max_tokens,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
        { type: "text", text: instruction },
      ],
    }],
  });
}

/**
 * Sends a single PDF document + instruction (mevzuat/yönetmelik yükleyip AI'dan
 * bu dokümana dayanarak öneri istemek için). Claude Messages API'nin `document`
 * içerik bloğunu kullanır (PDF'ler doğrudan base64 olarak desteklenir).
 * @param {{system?: string, pdfBase64: string, instruction: string, max_tokens?: number}} payload
 * @returns {Promise<string|null>}
 */
export async function sendDocumentAnalysis({ system, pdfBase64, instruction, max_tokens = 1500 }) {
  return sendChatMessage({
    system,
    max_tokens,
    messages: [{
      role: "user",
      content: [
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } },
        { type: "text", text: instruction },
      ],
    }],
  });
}
