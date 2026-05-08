// CosmetWiki service worker — minimal install + runtime cache.
// Goals:
//  - Make the app installable (Chrome / Android require a fetch handler).
//  - Network-first for navigation, with a tiny offline fallback page.
//  - Stale-while-revalidate for static assets (so the home screen launch
//    feels instant after the first visit) without going stale forever.

const VERSION = "v1";
const STATIC_CACHE = `cw-static-${VERSION}`;
const RUNTIME_CACHE = `cw-runtime-${VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE = [OFFLINE_URL];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API or auth-sensitive endpoints — they must always hit network.
  if (url.pathname.startsWith("/api/")) return;

  // Navigation requests : network-first, fall back to cached page or offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached ?? caches.match(OFFLINE_URL);
        }),
    );
    return;
  }

  // Same-origin static assets : stale-while-revalidate.
  if (
    url.pathname.startsWith("/_next/") ||
    /\.(?:js|css|woff2?|png|jpe?g|svg|webp|gif|ico)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetched = fetch(request)
          .then((res) => {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
            return res;
          })
          .catch(() => cached);
        return cached || fetched;
      }),
    );
  }
});
