import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { sendChatMessage, sendDocumentAnalysis, sendKimiChatMessage } from "./chatService.js";

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

const jsonResponse = (status, body) => ({ ok: status < 400, status, json: async () => body });
const payload = { messages: [{ role: "user", content: "Merhaba" }] };

describe("Anthropic metin ve belge analizi", () => {
  test("ilk metin bloğunu döndürür", async () => {
    globalThis.fetch = async () => jsonResponse(200, { content: [{ type: "text", text: "Öneri" }] });
    assert.equal(await sendChatMessage(payload), "Öneri");
  });

  test("metin analizi de zaman aşımını bildirir", async () => {
    globalThis.fetch = async () => { throw new DOMException("Aborted", "AbortError"); };
    await assert.rejects(sendChatMessage(payload), { message: "api_error_504", isTimeout: true });
  });

  test("PDF ve yönerge mevcut API sözleşmesiyle aynı istekte gönderilir", async () => {
    globalThis.fetch = async (url, init) => {
      assert.equal(url, "/api/chat");
      const body = JSON.parse(init.body);
      assert.equal(body.max_tokens, 1500);
      assert.equal(body.system, "İSG");
      assert.deepEqual(body.messages, [{ role: "user", content: [
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: "AAAA" } },
        { type: "text", text: "Özetle" },
      ] }]);
      return jsonResponse(200, { content: [{ type: "text", text: "Özet" }] });
    };
    assert.equal(await sendDocumentAnalysis({ system: "İSG", pdfBase64: "AAAA", instruction: "Özetle" }), "Özet");
  });
});

describe("sendKimiChatMessage — hata ve zaman aşımı", () => {
  test("başarılı yanıtı text/reasoning/toolCalls olarak döndürür", async () => {
    globalThis.fetch = async () => jsonResponse(200, { choices: [{ message: { content: "Selam", reasoning_content: "düşünce" } }] });
    const out = await sendKimiChatMessage(payload);
    assert.deepEqual(out, { text: "Selam", reasoningContent: "düşünce", toolCalls: null });
  });

  test("istemci zaman aşımı (AbortError) api_error_504 olarak bildirilir", async () => {
    globalThis.fetch = async () => { const e = new Error("aborted"); e.name = "AbortError"; throw e; };
    await assert.rejects(() => sendKimiChatMessage(payload), { message: "api_error_504" });
  });

  test("HTTP hataları api_error_<durum> olur (429, 504, 500)", async () => {
    for (const status of [429, 504, 500]) {
      globalThis.fetch = async () => jsonResponse(status, { error: "ham NVIDIA metni" });
      await assert.rejects(() => sendKimiChatMessage(payload), { message: `api_error_${status}` });
    }
  });

  test("JSON olmayan hata gövdesi (Vercel 504 HTML'i) yine api_error_504 olur", async () => {
    globalThis.fetch = async () => ({ ok: false, status: 504, json: async () => { throw new SyntaxError("not json"); } });
    await assert.rejects(() => sendKimiChatMessage(payload), { message: "api_error_504" });
  });

  test("ağ hatası (TypeError) olduğu gibi yeniden fırlatılır", async () => {
    globalThis.fetch = async () => { throw new TypeError("Failed to fetch"); };
    await assert.rejects(() => sendKimiChatMessage(payload), (err) => err instanceof TypeError);
  });

  test("yanıtta message yoksa null döner (kırılmaz)", async () => {
    globalThis.fetch = async () => jsonResponse(200, { choices: [] });
    assert.equal(await sendKimiChatMessage(payload), null);
  });
});
