// Nöbetçi Service Worker — v2 (GÜVENLİ, NETWORK-FIRST tasarım).
//
// ⚠️ GEÇMİŞ OLAY: v1, cache-first stratejisi kullanıyordu; bu, eski index.html'in
// (o anki Vite build'inin hash'li JS dosya adlarına referans veren) sonsuza dek
// önbellekte kalmasına yol açtı. Bir sonraki deploy'da eski hash'li JS dosyaları
// sunucudan silinince, önbellekteki eski HTML onları isteyip 404 alıyordu → birkaç
// saat sonra beyaz ekran (Chrome'da; Gizli Sekme/Safari farklı SW davranışı
// nedeniyle etkilenmemişti). Bkz. CHANGELOG.md → "ACİL: Service Worker Beyaz Ekran
// Düzeltmesi". v1 daha sonra kendi kendini kaldıran bir "kill-switch"e çevrildi.
//
// v2 TASARIM İLKESİ (bu olayın bir daha YAŞANMAMASI için): index.html, JS ve CSS
// dosyaları İÇİN ASLA cache-first KULLANILMAZ.
// - Navigasyon (HTML) + JS/CSS + diğer her şey → NETWORK-FIRST: önce ağdan denenir,
//   yalnızca ağ TAMAMEN başarısız olursa (gerçek offline durumu) önbellekten/offline
//   sayfasından döner. Bu, "eski HTML'in silinmiş JS dosyalarına referans vermesi"
//   senaryosunu YAPISAL OLARAK imkansız kılar — HTML her zaman ağdan (mevcutsa) gelir.
// - Resim/font/ikon gibi pratikte hiç değişmeyen statik varlıklar → cache-first
//   (güvenli, gerçek offline kullanımda hız/veri tasarrufu sağlar).
//
// CACHE_VERSION elle artırılarak (örn. "v3") eski çalışma zamanı önbellekleri
// activate aşamasında otomatik temizlenir — build script'i olmadığı için versiyon
// numarası manuel yönetiliyor, bu yüzden büyük bir SW değişikliği yapıldığında bu
// sabiti artırmayı unutmayın.

const CACHE_VERSION = "v3";
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
          const clone = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
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
        const clone = res.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
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
