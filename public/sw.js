/* Service worker for חשמל חנקין PWA.
   Network-first for page navigations (fresh prices/content),
   cache-first for static assets (images, _next, icons). */
const CACHE = "hankin-v4";
const OFFLINE_FALLBACK = "/";
const PRECACHE = ["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API calls — admin reads/writes and live data must always be
  // fresh. Letting the SW fall through to cache-first here served stale
  // /api/homepage, /api/products and /api/categories for the whole cache life.
  if (url.pathname.startsWith("/api/")) return;

  // Admin panel must always be fresh. Next.js <Link> prefetches request the
  // admin doc with a non-"navigate" mode, which would otherwise fall into the
  // cache-first branch below and pin a stale admin bundle for the whole cache
  // life (this is what hid the category image-upload UI after a deploy).
  // Bypass the SW entirely for /admin so the browser always fetches live.
  if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) return;

  // Network-first for navigations so content stays fresh.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match(OFFLINE_FALLBACK))
        )
    );
    return;
  }

  // Cache-first for static same-origin assets.
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req)
          .then((res) => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => cached)
    )
  );
});
