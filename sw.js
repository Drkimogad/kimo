const CACHE_NAME = 'kimo-ai-cache-v10'; // Increment cache version
const OFFLINE_URL = './offline.html';  // Fallback offline page

const CACHE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './aisearching.js',
  './models.js',   // main script
  './offline.html',
  './manifest.json',
  './vite.config.js',
  './icons/icon-512.png', 
  './icons/icon-192.png', 
  './icons/icon-128.png',
  './icons/icon-64.png',
  './favicon.ico', 

  // MobileNet model files
  'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/model.json',
  'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/group1-shard1of5.bin',
  'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/group1-shard2of5.bin',
  'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/group1-shard3of5.bin',
  'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/group1-shard4of5.bin',
  'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/group1-shard5of5.bin',

  // Add other dependencies like TensorFlow core and converter if not already cached for both mobileNet and encoder
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter@^4.9.0?target=es2022',
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core@^4.9.0?target=es2022',

  // Universal Sentence Encoder files
  'https://cdn.jsdelivr.net/npm/@tensorflow-models/universal-sentence-encoder@1.3.2/dist/model.json',
  'https://cdn.jsdelivr.net/npm/@tensorflow-models/universal-sentence-encoder@1.3.2/dist/group1-shard1of2',
  'https://cdn.jsdelivr.net/npm/@tensorflow-models/universal-sentence-encoder@1.3.2/dist/group1-shard2of2',

  // Tesseract.js library and language file
  'https://unpkg.com/tesseract.js@6.0.0/dist/tesseract.min.js',
  'https://tessdata.projectnaptha.com/4.0.0_best/eng.traineddata.gz',
  
  // Xenova transformer.js files
  'https://cdn.jsdelivr.net/npm/@xenova/transformers',

  // Local model files
  './tfj/text-model.js',
  './tfj/image-model.js',
  './models/t5-small/tokenizer.json',
  './models/t5-small/config.json',
  './ai/summarizer.js',
  './ai/personalizer.js',
  './utils/offlineStorage.js',

  // External scripts to be cached
  'https://unpkg.com/@tensorflow-models/universal-sentence-encoder@1.3.2',
  'https://unpkg.com/@tensorflow-models/mobilenet@2.1.0'
];

// ✅ Install Service Worker & Cache Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        CACHE_ASSETS.map((url) => {
          return fetch(url)
            .then((response) => {
              if (!response.ok) throw new Error(`HTTP error: ${url}`);
              return cache.put(url, response);
            })
            .catch((error) => {
              console.error('Failed to cache:', url, error);
            });
        })
      );
    })
  );
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
      }).catch((error) => {
        console.error('Fetch failed; returning offline page instead.', error);
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
      });
    })
  );
});
