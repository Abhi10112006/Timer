
const CACHE_NAME = 'focusflow-v1';
const DYNAMIC_CACHE = 'focusflow-dynamic-v1';

// Files to cache immediately
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Handle External CDN (esm.sh, fonts, etc.) - Stale While Revalidate
  if (url.origin !== self.location.origin) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.match(event.request).then((response) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            // Only cache valid responses
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'cors') {
               cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
             // Swallow errors for background updates
          });
          return response || fetchPromise;
        });
      })
    );
    return;
  }

  // 2. Handle Local Assets - Cache First, Fallback to Network
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((networkResponse) => {
        return caches.open(DYNAMIC_CACHE).then((cache) => {
           // Cache valid local resources
           if (event.request.method === 'GET' && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
           }
           return networkResponse;
        });
      });
    })
  );
});
