const CACHE_NAME = 'kimo-ai-v2';
const OFFLINE_URL = '/offline.html';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/offline.html',
  '/icon-192.png',
  '/manifest.json'
];

// Install Event - Cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS)
          .catch(error => {
            console.log('Failed to cache:', error);
          });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch Event - Network falling back to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and Vercel API calls
  if (event.request.method !== 'GET' || 
      event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if found
        if (cachedResponse) {
          return cachedResponse;
        }

        // For navigation requests, use network with offline fallback
        if (event.request.mode === 'navigate') {
          return fetch(event.request)
            .catch(() => caches.match(OFFLINE_URL));
        }

        // For other requests, try network first
        return fetch(event.request)
          .then(response => {
            // Cache new responses
            if (!response || response.status !== 200) {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseToCache));

            return response;
          })
          .catch(() => {
            // Return offline page for HTML requests
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});

// Background Sync (if supported)
self.addEventListener('sync', (event) => {
  if (event.tag === 'retry-failed-requests') {
    event.waitUntil(retryFailedRequests());
  }
});

async function retryFailedRequests() {
  // Implement failed request retry logic here
}
