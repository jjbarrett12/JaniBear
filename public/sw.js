// =============================================================================
// JANIBEAR PWA Service Worker — privacy-safe caching
// =============================================================================
// RULES:
// - On activate: delete ALL caches except janibear-static-v2 (cleanup old shells).
// - NEVER cache: request.mode === 'navigate' | request.destination === 'document'
//   | any URL /app/* | any /api/* | any /auth/* (network-only).
// - Cache-first ONLY for static assets (JS, CSS, fonts, icons).
// =============================================================================

const CACHE_STATIC = 'janibear-static-v2';

function isAppUrl(url) {
  try {
    const u = new URL(url);
    return u.pathname.startsWith('/app/');
  } catch {
    return false;
  }
}

function isApiOrAuth(url) {
  try {
    const u = new URL(url);
    return u.pathname.startsWith('/api/') || u.pathname.startsWith('/auth/');
  } catch {
    return false;
  }
}

// Static assets only — no session data.
function isStaticAsset(url) {
  try {
    const u = new URL(url);
    return (
      /\.(js|css|woff2?|ttf|eot|png|jpg|jpeg|svg|ico|webp|avif)$/i.test(u.pathname) ||
      u.pathname.startsWith('/_next/static/')
    );
  } catch {
    return false;
  }
}

function shouldNeverCache(request, url) {
  if (request.mode === 'navigate') return true;
  if (request.destination === 'document') return true;
  if (isAppUrl(url)) return true;
  if (isApiOrAuth(url)) return true;
  return false;
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_STATIC).map((n) => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  // Never cache: navigate, document, /app/*, /api/*, /auth/* — same response, no cache headers added.
  if (shouldNeverCache(request, url)) {
    event.respondWith(fetch(request));
    return;
  }

  // Static assets only: cache-first after first successful fetch.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached
          ? Promise.resolve(cached)
          : fetch(request).then((res) => {
              if (res.ok && res.type === 'basic') {
                const clone = res.clone();
                caches.open(CACHE_STATIC).then((cache) => cache.put(request, clone));
              }
              return res;
            })
      )
    );
    return;
  }

  event.respondWith(fetch(request));
});
