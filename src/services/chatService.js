import { postJson } from "./apiClient.js";

/**
 * @param {{system?: string, messages: Array<{role: string, content: any}>, max_tokens?: number}} payload
 * @returns {Promise<string|null>} assistant's text reply, or null if the response had no text block
 */
export async function sendChatMessage({ system, messages, max_tokens = 1000 }) {
  const data = await postJson("/api/chat", { system, messages, max_tokens });
  const textBlock = data?.content?.find((c) => c.type === "text");
  return textBlock ? textBlock.text : null;
}

/**
 * NVIDIA sohbeti. reasoning_content ve tool_calls, sonraki turda modele geri gönderilir.
 * @param {{system?: string, messages: Array<{role: string, content: any, reasoning_content?: string, tool_calls?: any[]}>, max_tokens?: number}} payload
 * @returns {Promise<{text: string|null, reasoningContent: string|null, toolCalls: any[]|null}|null>}
 */
export async function sendKimiChatMessage({ system, messages, max_tokens = 1000 }) {
  const data = await postJson("/api/kimi-chat", { system, messages, max_tokens });
  const message = data?.choices?.[0]?.message;
  if (!message) return null;
  return {
    text: message.content ?? null,
    reasoningContent: message.reasoning_content ?? null,
    toolCalls: Array.isArray(message.tool_calls) ? message.tool_calls : null,
  };
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
