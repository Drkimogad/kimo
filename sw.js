const CACHE_NAME = 'kimo-ai-cache-v2'; // Incremented version
const OFFLINE_URL = '/offline.html';
const CACHE_ASSETS = [
  // Existing assets
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/utils.js',
  '/models.js',
  '/offline.html',
  '/icons/icon-512.png', 
  '/icons/icon-192.png', 
  'icons/icon-128.png',
  'icons/icon-64.png',
  '/favicon.ico',
  '/models/text-model.js',
  '/models/image-model.js',
  '/models/handwritingModel.js',

  // New MobileNet model files
  'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v2_1.0_224/model.json',
  'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v2_1.0_224/group1-shard1of5.bin',
  'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v2_1.0_224/group1-shard2of5.bin',
  'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v2_1.0_224/group1-shard3of5.bin',
  'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v2_1.0_224/group1-shard4of5.bin',
  'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v2_1.0_224/group1-shard5of5.bin',

  // Universal Sentence Encoder files
  'https://storage.googleapis.com/tfjs-models/tfjs/universal-sentence-encoder/model.json',
  'https://storage.googleapis.com/tfjs-models/tfjs/universal-sentence-encoder/group1-shard1of2',
  'https://storage.googleapis.com/tfjs-models/tfjs/universal-sentence-encoder/group1-shard2of2'
];

// ✅ Install Service Worker & Cache Assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_ASSETS))
  );
});

// ✅ Serve Cached Content First (existing logic remains unchanged)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => caches.match(OFFLINE_URL));
    })
  );
});
