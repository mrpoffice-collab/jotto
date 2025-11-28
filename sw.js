const CACHE_NAME = 'jotto-v6';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.svg',
  '/cover.json'
];

// Install service worker and cache files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate and clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control immediately
  );
});

// Network first, fall back to cache (better for updates)
self.addEventListener('fetch', event => {
  // Only handle http/https requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Got a good response, cache it (only same-origin)
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then(response => {
          return response || caches.match('/index.html');
        });
      })
  );
});
