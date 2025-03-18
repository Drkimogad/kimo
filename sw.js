const CACHE_NAME = 'kimo-ai-cache-v1';
const OFFLINE_URL = '/offline.html';
const CACHE_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/utils.js',
    '/models.js',
    '/offline.html',
    '/models/text_model/model.json',
    '/models/image_model/model.json',
    '/models/handwriting_model/model.json'
];

// ✅ Install Service Worker & Cache Assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_ASSETS))
    );
});

// ✅ Serve Cached Content First, Then Fallback
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).catch(() => caches.match(OFFLINE_URL));
        })
    );
});
