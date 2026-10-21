// HTML/JS/CSS için network-first; resim ve fontlar için cache-first.
// Önbellek davranışı değişirse CACHE_VERSION artırılır; eski uygulama cache’leri temizlenir.

const CACHE_VERSION = "v8";
const RUNTIME_CACHE = `nobetci-isg-runtime-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [OFFLINE_URL, "/icon-192.png", "/icon-512.png", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(RUNTIME_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {}) // precache başarısız olsa bile kurulum durdurulmasın (non-fatal)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Bu uygulamaya ait TÜM eski cache'leri temizle — v1'in kill-switch cache'leri
      // dahil, güncel RUNTIME_CACHE dışında "nobetci-isg-" ile başlayan her şey silinir.
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith("nobetci-isg-") && k !== RUNTIME_CACHE).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

function isStaticAsset(pathname) {
  return /\.(png|jpg|jpeg|svg|webp|ico|woff2?|ttf)$/i.test(pathname);
}

function cacheSuccessfulResponse(event, request, response) {
  if (!response.ok) return;
  const copy = response.clone();
  event.waitUntil(caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy)).catch(() => {}));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // POST vb. (örn. Vercel Functions AI proxy) hiç dokunulmaz

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // yalnızca kendi originimiz — CDN/font/AI proxy istekleri geçilir

  if (isStaticAsset(url.pathname)) {
    // Statik varlıklar: CACHE-FIRST (güvenli — içerikleri pratikte hiç değişmiyor).
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          cacheSuccessfulResponse(event, request, res);
          return res;
        });
      })
    );
    return;
  }

  // HTML/JS/CSS ve diğer her şey: NETWORK-FIRST. Bu, v1'deki beyaz ekran olayının
  // KÖK NEDENİNİ yapısal olarak ortadan kaldırır.
  event.respondWith(
    fetch(request)
      .then((res) => {
        cacheSuccessfulResponse(event, request, res);
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          const offline = await caches.match(OFFLINE_URL);
          if (offline) return offline;
        }
        return Response.error();
      })
  );
});

// Sprint 7.2.3'te eklenmişti (gerçek push bildirim özelliği) — v1→kill-switch
// geçişinde kaybolmuştu, v2'de geri eklendi: bildirime dokununca uygulamaya
// odaklanır/açar.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientsList) => {
      if (clientsList.length > 0) return clientsList[0].focus();
      return self.clients.openWindow("/");
    })
  );
});
