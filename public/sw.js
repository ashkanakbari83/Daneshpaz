/*
 * Daneshpaz service worker (hand-written, no build step needed).
 *
 * VERSION must equal "version" in package.json (a test enforces it). Bump it with every release:
 * the new worker then installs next to the old one and the app offers «به‌روزرسانی».
 *
 * What is cached, and what is NEVER cached:
 *  - App shell + built files (from /precache-manifest.json, written at build time): cached at install.
 *  - Public content API (GET /api/catalog, /api/recipes/*, /api/help*): network first, cached copy when offline.
 *  - /api/admin/*, /api/auth/*, every non-GET request, every cross-origin request: never touched,
 *    so private data and login sessions are never stored by the worker.
 */
const VERSION = '0.7.0';
const SHELL_CACHE = `dp-shell-${VERSION}`; // replaced on every release
const RUNTIME_CACHE = 'dp-runtime'; // hashed assets and images, kept across releases
const API_CACHE = 'dp-api'; // public content only
const PRECACHE = ['/', '/offline.html', '/manifest.webmanifest', '/favicon.svg', '/icons/icon-192.png', '/icons/icon-512.png'];
const PRIVATE_API = /^\/api\/(admin|auth)(\/|$)/;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await cache.addAll(PRECACHE); // '/' is the SPA shell: if this fails the install fails and the old worker stays
      try {
        const response = await fetch('/precache-manifest.json', { cache: 'no-cache' });
        if (response.ok) {
          const { files } = await response.json();
          await Promise.allSettled((files || []).filter((f) => typeof f === 'string' && f.startsWith('/')).map((f) => cache.add(f)));
        }
      } catch {
        /* no manifest (dev or older build): files are cached as they are used */
      }
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n.startsWith('dp-shell-') && n !== SHELL_CACHE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') self.skipWaiting();
  if (data.type === 'CACHE_URLS' && Array.isArray(data.urls)) {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const own = data.urls.filter((u) => typeof u === 'string' && u.startsWith(self.location.origin + '/') && !PRIVATE_API.test(new URL(u).pathname) && !new URL(u).pathname.startsWith('/api/'));
        await Promise.allSettled(own.map((u) => cache.add(u)));
      })(),
    );
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/api/')) {
    if (PRIVATE_API.test(url.pathname) || url.pathname === '/api/health') return; // browser handles it; never cached
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }
  if (request.mode === 'navigate') {
    event.respondWith(navigate(request));
    return;
  }
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE)); // hashed file names never change
    return;
  }
  event.respondWith(staleWhileRevalidate(request));
});

async function navigate(request) {
  try {
    const response = await fetch(request);
    if (response.ok && (response.headers.get('content-type') || '').includes('text/html')) {
      (await caches.open(SHELL_CACHE)).put('/', response.clone()); // every route serves the same SPA shell
    }
    return response;
  } catch {
    return (await caches.match('/', { cacheName: SHELL_CACHE })) || (await caches.match('/offline.html')) || Response.error();
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: { code: 'offline', message: 'به اینترنت وصل نیستی و این اطلاعات روی دستگاهت ذخیره نشده است.' } }), {
      status: 503,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = (await cache.match(request)) || (await caches.match(request));
  const refresh = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || (await refresh) || Response.error();
}
