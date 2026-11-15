// Minimaler Service Worker: Network-first für Seiten, Cache-Fallback offline.
// v2: Sperrseite, API und Umleitungen werden nie zwischengespeichert (Zugriffsschutz).
const CACHE = "lern-app-v2";
const PRECACHE = ["/manifest.webmanifest", "/icons/icon-192.png", "/icons/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isCacheable(url, response) {
  if (!response.ok || response.redirected || response.type !== "basic") return false;
  return !url.pathname.startsWith("/unlock") && !url.pathname.startsWith("/api/");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // API immer direkt

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (isCacheable(url, response)) {
          const copy = response.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || (request.mode === "navigate" ? caches.match("/") : undefined)),
      ),
  );
});
