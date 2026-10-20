import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../../public/service-worker.js", import.meta.url), "utf8");

function createWorker(networkResponse) {
  const listeners = new Map();
  const stored = new Map();
  let fetchCount = 0;
  let putCount = 0;
  const caches = {
    match: async (request) => stored.get(request.url ?? request),
    open: async () => ({ put: async (request, response) => {
      putCount++;
      stored.set(request.url, response);
    } }),
  };
  runInNewContext(source, {
    self: { location: { origin: "https://app.test" }, addEventListener: (name, callback) => listeners.set(name, callback) },
    caches,
    fetch: async () => { fetchCount++; return networkResponse(); },
    URL,
    Response,
  });
  async function request(path) {
    const lifetime = [];
    let response;
    listeners.get("fetch")({
      request: { url: `https://app.test${path}`, method: "GET", mode: "same-origin" },
      respondWith: (promise) => { response = promise; },
      waitUntil: (promise) => lifetime.push(promise),
    });
    const result = await response;
    await Promise.all(lifetime);
    return result;
  }
  return { request, get fetchCount() { return fetchCount; }, get putCount() { return putCount; } };
}

test("başarısız statik yanıt önbelleğe alınmaz; sonraki istek ağdan yeniden dener", async () => {
  const worker = createWorker(() => new Response("missing", { status: 404 }));
  assert.equal((await worker.request("/icon-192.png")).status, 404);
  assert.equal((await worker.request("/icon-192.png")).status, 404);
  assert.equal(worker.fetchCount, 2);
  assert.equal(worker.putCount, 0);
});

test("başarılı statik yanıt önbellekten tekrar kullanılır", async () => {
  const worker = createWorker(() => new Response("icon", { status: 200 }));
  assert.equal((await worker.request("/icon-192.png")).status, 200);
  assert.equal(await (await worker.request("/icon-192.png")).text(), "icon");
  assert.equal(worker.fetchCount, 1);
  assert.equal(worker.putCount, 1);
});

test("başarısız HTML yanıtı da çevrimdışı kopya olarak saklanmaz", async () => {
  const worker = createWorker(() => new Response("error", { status: 500 }));
  assert.equal((await worker.request("/")).status, 500);
  assert.equal(worker.putCount, 0);
});
