/* Service worker khusus dashboard admin (/admin-sulastri-warmak-A3).
   Didaftarkan hanya dari layout admin dengan scope /admin-sulastri-warmak-A3/, sehingga halaman
   katalog tidak pernah dikendalikan SW ini. Lapisan kedua: handler fetch
   di bawah mengabaikan semua request di luar path admin. */
const CACHE = "warmak-admin-v2";
const PRECACHE = ["/admin-sulastri-warmak-A3/", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/apple-touch-icon.png"];

function isAdminRequest(url) {
  const p = url.pathname;
  return (
    p.startsWith("/admin-sulastri-warmak-A3") ||
    p.startsWith("/icons/") ||
    p.startsWith("/_next/static/")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => Promise.all(PRECACHE.map((u) => cache.add(u).catch(() => null))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!isAdminRequest(url)) return; // katalog & lainnya: teruskan tanpa disentuh
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches
            .open(CACHE)
            .then((cache) => cache.put(request, copy))
            .catch(() => null);
        }
        return res;
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match("/admin-sulastri-warmak-A3/"))),
  );
});
