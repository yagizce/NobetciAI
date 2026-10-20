import { afterEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { postJson } from "./apiClient.js";

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

const abortableBody = (signal) => new Promise((resolve, reject) => {
  signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
});

describe("postJson", () => {
  test("JSON gövdesini ve başlığını gönderir; yanıtı çözer", async () => {
    globalThis.fetch = async (url, init) => {
      assert.equal(url, "/api/chat");
      assert.equal(init.method, "POST");
      assert.equal(init.headers["Content-Type"], "application/json");
      assert.deepEqual(JSON.parse(init.body), { messages: [] });
      assert.ok(init.signal instanceof AbortSignal);
      return new Response(JSON.stringify({ content: "yanıt" }));
    };
    assert.deepEqual(await postJson("/api/chat", { messages: [] }), { content: "yanıt" });
  });

  test("başlıklar gelmeden takılan isteği süre dolunca iptal eder", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    globalThis.fetch = (_, { signal }) => abortableBody(signal);
    const result = assert.rejects(postJson("/api/chat", {}, { timeoutMs: 50 }),
      (error) => error.message === "api_error_504" && error.status === 504 && error.isTimeout);
    t.mock.timers.tick(50);
    await result;
  });

  test("başlıklardan sonra gövde okunurken takılan isteği de iptal eder", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    let readingBody = false;
    globalThis.fetch = async (_, { signal }) => ({
      ok: true,
      json: () => { readingBody = true; return abortableBody(signal); },
    });
    const result = assert.rejects(postJson("/api/chat", {}, { timeoutMs: 50 }),
      (error) => error.isTimeout && error.status === 504);
    await Promise.resolve();
    assert.equal(readingBody, true);
    t.mock.timers.tick(50);
    await result;
  });

  test("başarılı istekten sonra zamanlayıcı temizlenir", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    let signal;
    globalThis.fetch = async (_, init) => {
      signal = init.signal;
      return new Response("{}");
    };
    await postJson("/api/chat", {}, { timeoutMs: 50 });
    t.mock.timers.tick(100);
    assert.equal(signal.aborted, false);
  });

  test("HTML hata gövdesi HTTP durumunu gölgelemez; zamanlayıcı temizlenir", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    let signal;
    globalThis.fetch = async (_, init) => {
      signal = init.signal;
      return new Response("<html>unavailable</html>", { status: 503 });
    };
    await assert.rejects(postJson("/api/chat", {}, { timeoutMs: 50 }),
      (error) => error.message === "api_error_503" && error.status === 503 && !error.isTimeout);
    t.mock.timers.tick(100);
    assert.equal(signal.aborted, false);
  });

  test("200 ile gelen geçersiz JSON, bozuk sunucu yanıtı olarak bildirilir", async () => {
    globalThis.fetch = async () => new Response("<html>not JSON</html>");
    await assert.rejects(postJson("/api/chat", {}), { message: "api_error_502", status: 502 });
  });

  test("bağlantı kopması özgün hatayı korur; zamanlayıcı temizlenir", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    const failure = new TypeError("Network disconnected");
    let signal;
    globalThis.fetch = async (_, init) => { signal = init.signal; throw failure; };
    await assert.rejects(postJson("/api/chat", {}, { timeoutMs: 50 }), (error) => error === failure);
    t.mock.timers.tick(100);
    assert.equal(signal.aborted, false);
  });

  test("gövde okunurken kopan bağlantı sessizce null yanıtına çevrilmez", async () => {
    const failure = new TypeError("Body stream interrupted");
    globalThis.fetch = async () => ({ ok: true, json: async () => { throw failure; } });
    await assert.rejects(postJson("/api/chat", {}), (error) => error === failure);
  });
});
