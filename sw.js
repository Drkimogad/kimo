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
