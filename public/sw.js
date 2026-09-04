// Part-Smart ZA Progressive Web App Service Worker (v2)
// Enhanced for mobile/tablet reliability with Network-First navigation strategy
const CACHE_NAME = 'part-smart-za-v2';

self.addEventListener('install', (event) => {
  // Activate immediately upon install without waiting
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Clean up all old caches (including part-smart-za-v1)
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing legacy cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests from the same origin
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) {
    return;
  }

  // Bypass API calls, robots.txt, sitemap.xml, or dev server websocket
  const url = new URL(request.url);
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.includes('socket') ||
    url.pathname === '/robots.txt' ||
    url.pathname === '/sitemap.xml'
  ) {
    return;
  }

  // 1. Navigation requests (HTML pages): ALWAYS NETWORK-FIRST
  // This ensures mobile users always get the latest bundle hashes and never get stuck on stale index.html
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('/index.html', responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback: serve cached index.html
          return caches.match('/index.html').then((cached) => {
            return cached || new Response('Part-Smart ZA is currently offline. Please reconnect to the Internet.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
        })
    );
    return;
  }

  // 2. Static Asset requests (/assets/*.js, *.css, icons, fonts)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // If we have a valid cached response, return it and update in background
      if (cachedResponse) {
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const contentType = networkResponse.headers.get('content-type') || '';
              // Guard: never cache HTML fallback for JS/CSS assets
              if (!contentType.includes('text/html')) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
              }
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          const contentType = networkResponse.headers.get('content-type') || '';
          // Guard: Don't cache HTML when an asset (like .js or .css) was requested
          if (request.url.includes('/assets/') && contentType.includes('text/html')) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          return new Response('', { status: 408, statusText: 'Request timed out' });
        });
    })
  );
});
