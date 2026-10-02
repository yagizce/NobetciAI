import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { sendKimiChatMessage } from "./chatService.js";

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

const jsonResponse = (status, body) => ({ ok: status < 400, status, json: async () => body });
const payload = { messages: [{ role: "user", content: "Merhaba" }] };

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
