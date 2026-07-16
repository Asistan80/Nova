// Basit bir service worker: sadece statik dosyaları (css/js/img) önbelleğe
// alır, sayfa içeriğini (HTML) her zaman ağdan taze çeker. Amaç offline
// çalışmak değil, PWA kurulabilirliğini sağlamak ve statik dosyaları
// hızlandırmak.

const CACHE_NAME = "murnova-static-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isStatic = url.pathname.startsWith("/static/");

  if (!isStatic || event.request.method !== "GET") {
    return; // statik değilse tarayıcıya bırak (her zaman ağdan)
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    )
  );
});
