const CACHE_NAME = 'kimo-ai-cache-v2'; // Incremented version
const OFFLINE_URL = '/offline.html';
const CACHE_ASSETS = [
  // Existing assets
  'https://drkimogad.github.io/kimo/',
  'https://drkimogad.github.io/kimo/index.html',
  'https://drkimogad.github.io/kimo/styles.css',
  'https://drkimogad.github.io/kimo/script.js',
  '/https://drkimogad.github.io/kimo/models.js',
  'https://drkimogad.github.io/kimo/offline.html',
  'https://drkimogad.github.io/kimo/icons/icon-512.png', 
  'https://drkimogad.github.io/kimo/icons/icon-192.png', 
  '/https://drkimogad.github.io/kimoicons/icon-128.png',
  'https://drkimogad.github.io/kimo/icons/icon-64.png',
  'https://drkimogad.github.io/kimo/favicon.ico',
  'https://drkimogad.github.io/kimo/models/text-model.js',
  'https://drkimogad.github.io/kimo/models/image-model.js',
  'https://drkimogad.github.io/kimo/models/handwritingModel.js',

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
   // Handwriting model files
  '/models/handwriting/model.json',
  '/models/handwriting/group1-shard1of1.bin', 
  // canvas implementation files
  '/models/crnn/model.json',
  '/models/crnn/group1-shard1of1.bin'
];

// ✅ Install Service Worker & Cache Assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

//✅ Fetch resources from cache or network
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // If the request is in the cache, return it
        if (response) {
          return response;
        }
        
        // Clone the request to fetch it from the network
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
                cache.put(event.request, responseToCache);
              });
            
            return networkResponse;
          }
        );
      }).catch(function() {
        // Fallback to index.html in case of failure
        return caches.match('/index.html');
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
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
