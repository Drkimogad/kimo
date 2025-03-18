const CACHE_NAME = "kimo-ai-cache-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/offline.html",  // ✅ Add offline fallback
  "/styles.css",
  "/script.js",
  "/utils.js",
  "/models.js",
  "/manifest.json",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/models/text-model.json",
  "/models/image-model.json"
];

// Install Service Worker and Cache Essential Files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Serve Cached Content (Cache-First Strategy with Offline Fallback)
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        // Return offline.html if the request is for an HTML page
        return event.request.destination === "document"
          ? caches.match("/offline.html")
          : null;
      });
    })
  );
});

// Update Cache When New Files Are Available
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});
