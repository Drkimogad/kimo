const CACHE_NAME = 'kimo-ai-cache-v13'; // Increment cache version
const OFFLINE_URL = './offline.html';  // Fallback offline page

const CACHE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './aisearching.js',
  './models.js',   // main script
  './offline.html',
  './manifest.json',
  './icons/icon-512.png', 
  './icons/icon-192.png', 
  './icons/icon-128.png',
  './icons/icon-64.png',
  './favicon.ico', 

  // Local model files
  './tfj/text-model.js',
  './tfj/image-model.js',
  './models/t5-small/tokenizer.json',
  './models/t5-small/config.json',
  './ai/summarizer.js',
  './ai/personalizer.js',
  './utils/offlineStorage.js',

   // TensorFlow
  './model-cache/tf-v4.9.0.js',
  
  // MobileNet
  './model-cache/mobilenet-v2.1.0/model.json',
  './model-cache/mobilenet-v2.1.0/group1-shard1of5.bin',
  './model-cache/mobilenet-v2.1.0/group1-shard2of5.bin',
  './model-cache/mobilenet-v2.1.0/group1-shard3of5.bin',
  './model-cache/mobilenet-v2.1.0/group1-shard4of5.bin',
  './model-cache/mobilenet-v2.1.0/group1-shard5of5.bin',
  
  // Tesseract
  './model-cache/tesseract-v6.0.0/tesseract.js',
  './model-cache/tesseract-v6.0.0/eng.traineddata.gz',
];

// ✅ Install Service Worker & Cache Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        CACHE_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error: ${url}`);
            await cache.put(url, response);
          } catch (error) {
            console.error('Failed to cache:', url, error);
          }
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
````

### Summary:
1. **Specific Paths**: Use specific file paths for each resource to ensure they are correctly fetched and cached.
2. **CORS**: Verify that the external resources support CORS, or use a proxy if needed.
