// Ledgerly service worker. Two jobs:
// 1. Cross-origin isolation: expo-sqlite on web needs SharedArrayBuffer, which browsers only allow
//    when the page is served with COOP/COEP headers. GitHub Pages can't set headers, so every
//    same-origin response passing through here gets them added.
// 2. Offline: the build precaches the whole app; later requests are cache-first, pages network-first.
//
// scripts/build-web.mjs fills in VERSION and PRECACHE. Unfilled (the dev server), nothing is cached.

const VERSION = '__BUILD_VERSION__';
const PRECACHE = [/* __PRECACHE__ */];

const CACHING = !VERSION.startsWith('__');
const CACHE = `ledgerly-${VERSION}`;
const scopeUrl = (path) => new URL(path, self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (CACHING ? caches.open(CACHE).then((cache) => cache.addAll(PRECACHE.map(scopeUrl))) : Promise.resolve()).then(
      () => self.skipWaiting()
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('ledgerly-') && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function isolate(response) {
  if (!response || response.status === 0 || response.type === 'opaque') return response;
  const headers = new Headers(response.headers);
  headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    // Network first so a new release is picked up; the cached shell keeps the app working offline.
    // Every route is the same single-page app, so any page can fall back to index.html.
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (CACHING && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(scopeUrl('index.html'), copy));
          }
          return isolate(response);
        })
        .catch(() => caches.match(scopeUrl('index.html')).then(isolate))
    );
    return;
  }

  // Bundles and assets have content-hashed names, so a cached copy is always the right one.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        (cached && isolate(cached)) ||
        fetch(request).then((response) => {
          if (CACHING && response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return isolate(response);
        })
    )
  );
});
