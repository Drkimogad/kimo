const CACHE_NAME = 'kimo-ai-cache-v3'; // Incremented version
const OFFLINE_URL = './offline.html';
const CACHE_ASSETS = [
  // Existing assets
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
  './models/text-model.js',
  './models/image-model.js',
  
  // New MobileNet model files
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

  // Tesseract.js handwriting library files
  'https://cdn.jsdelivr.net/npm/tesseract.js@2.0.0/tesseract.min.js',  // Tesseract.js library  
  'https://tessdata.projectnaptha.com/4.0.0_best/eng.traineddata.gz' // english language file
];

// ✅ Install Service Worker & Cache Assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('kimo-cache-v1')
      .then(cache => {
        return cache.addAll([
          '/',
          '/index.html',
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
          './models/text-model.js',
          './models/image-model.js',
          // New MobileNet model files
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
          // Tesseract.js handwriting library files
          'https://cdn.jsdelivr.net/npm/tesseract.js@2.0.0/tesseract.min.js',  // Tesseract.js library  
          'https://tessdata.projectnaptha.com/4.0.0_best/eng.traineddata.gz' // english language file
        ]);
      })
      .catch(error => {
        console.error('Failed to cache resources:', error);
      })
  );
});

// ✅ Fetch resources from cache or network
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // If the request is in the cache, return it
        if (response) {
          return response;
        }

        // If the resource is not in the cache, fetch it from the network
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          function(networkResponse) {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone the response to cache it
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);  // Cache it for future use
              });

            return networkResponse;
          }
        );
      }).catch(function() {
        // Fallback to offline.html if network fetch fails
        // This fallback only happens when there's no cached version and the network fetch fails
        return caches.match(OFFLINE_URL);  // Serve offline page if network fails
      })
  );
});

// ✅ Activate service worker and remove old caches
self.addEventListener('activate', function(event) {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);  // Delete old caches that aren't in the whitelist
          }
        })
      );
    })
  );
});
