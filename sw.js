const CACHE_NAME = 'kimo-ai-cache-v5'; // Increment cache version
const OFFLINE_URL = './offline.html';  // Fallback offline page

// Files to cache (merged list, no duplication)
const CACHE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './models.js',
  './ocr.js',
  './main.js',
  './offline.html',
  './manifest.json',
  './icons/icon-512.png', 
  './icons/icon-192.png', 
  './icons/icon-128.png',
  './icons/icon-64.png',
  './favicon.ico',

  // MobileNet model files
  'https://esm.sh/@tensorflow-models/mobilenet@2.1.0/dist/model.json',
  'https://esm.sh/@tensorflow-models/mobilenet@2.1.0/dist/group1-shard1of5.bin',
  'https://esm.sh/@tensorflow-models/mobilenet@2.1.0/dist/group1-shard2of5.bin',
  'https://esm.sh/@tensorflow-models/mobilenet@2.1.0/dist/group1-shard3of5.bin',
  'https://esm.sh/@tensorflow-models/mobilenet@2.1.0/dist/group1-shard4of5.bin',
  'https://esm.sh/@tensorflow-models/mobilenet@2.1.0/dist/group1-shard5of5.bin',

  // Universal Sentence Encoder files
  'https://esm.sh/@tensorflow-models/universal-sentence-encoder@1.3.2/dist/model.json',
  'https://esm.sh/@tensorflow-models/universal-sentence-encoder@1.3.2/dist/group1-shard1of2',
  'https://esm.sh/@tensorflow-models/universal-sentence-encoder@1.3.2/dist/group1-shard2of2',

  // Tesseract.js library and language file
  'https://cdn.jsdelivr.net/npm/tesseract.js@2.0.0/tesseract.min.js',
  'https://tessdata.projectnaptha.com/4.0.0_best/eng.traineddata.gz',

  // Local model files
  './models/text-model.js',
  './models/image-model.js',
  './models/t5-small/tokenizer.json',
  './models/t5-small/config.json',
  './models/summarizer.js',
  './models/personalizer.js',
  './models/offlineStorage.js',
];

// ✅ Install Service Worker & Cache Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_ASSETS);
    })
  );
  self.skipWaiting();  // Activate SW immediately after installation
});

// ✅ Activate and Remove Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);  // Delete old caches
          }
        })
      );
    })
  );
  self.clients.claim();  // Take control of all pages
});

// ✅ Unified Fetch Handler (Cache-First with Offline Fallback)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if available
      if (response) {
        return response;
      }

      // Fetch from network if not in cache
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      }).catch(() => {
        // Return offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
      });
    })
  );
});
