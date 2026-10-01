import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { analyzePhotoWithCosmos } from "./cosmosVisionService.js";

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

function mockFetch(handler) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) });
    return handler();
  };
  return calls;
}
const okResponse = (content) => ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content } }] }) });
const errResponse = (status, body) => ({ ok: false, status, json: async () => body });

describe("analyzePhotoWithCosmos", () => {
  test("fotoğraf + soru: İKİSİ de tek istekte gönderilir", async () => {
    const calls = mockFetch(() => okResponse("Cevap"));
    const out = await analyzePhotoWithCosmos({ imageBase64: "AAAA", mediaType: "image/jpeg", question: "Kask takıyor mu?" });
    assert.equal(out, "Cevap");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].body.imageBase64, "AAAA");
    assert.equal(calls[0].body.question, "Kask takıyor mu?");
  });

  test("yalnızca fotoğraf: question alanı gönderilmez (mevcut davranış)", async () => {
    const calls = mockFetch(() => okResponse("Analiz"));
    await analyzePhotoWithCosmos({ imageBase64: "AAAA", mediaType: "image/jpeg" });
    assert.equal("question" in calls[0].body, false);
    assert.equal("mode" in calls[0].body, false);
  });

  test("yanıttaki <think> bloğu kullanıcıya gösterilmez", async () => {
    mockFetch(() => okResponse("<think>iç düşünce</think>\nAsıl cevap"));
    assert.equal(await analyzePhotoWithCosmos({ imageBase64: "A", mediaType: "image/jpeg", question: "q" }), "Asıl cevap");
  });

  test("HTTP hatası status alanını taşır", async () => {
    mockFetch(() => errResponse(504, { error: "teknik ayrıntı" }));
    await assert.rejects(
      () => analyzePhotoWithCosmos({ imageBase64: "A", mediaType: "image/jpeg", question: "q" }),
      (err) => err.status === 504 && !err.isTimeout,
    );
  });

  test("zaman aşımı (AbortError) isTimeout olarak işaretlenir", async () => {
    globalThis.fetch = async () => { const e = new Error("aborted"); e.name = "AbortError"; throw e; };
    await assert.rejects(
      () => analyzePhotoWithCosmos({ imageBase64: "A", mediaType: "image/jpeg", question: "q" }),
      (err) => err.isTimeout === true,
    );
  });

  test("ağ hatası (TypeError) olduğu gibi yeniden fırlatılır", async () => {
    globalThis.fetch = async () => { throw new TypeError("Failed to fetch"); };
    await assert.rejects(
      () => analyzePhotoWithCosmos({ imageBase64: "A", mediaType: "image/jpeg" }),
      (err) => err instanceof TypeError,
    );
  });

  test("boş yanıt hata fırlatır", async () => {
    mockFetch(() => okResponse(""));
    await assert.rejects(() => analyzePhotoWithCosmos({ imageBase64: "A", mediaType: "image/jpeg" }));
  });
});
