const MODEL_CACHE = 'ai-models-v1';
const CORE_MODELS = [
  '/models/t5-small/onnx/model.onnx',
  '/models/t5-small/tokenizer.json',
  '/models/t5-small/config.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(MODEL_CACHE)
      .then(cache => cache.addAll(CORE_MODELS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('fetch', (event) => {
  if (CORE_MODELS.some(path => event.request.url.includes(path))) {
    event.respondWith(
      caches.match(event.request)
        .then(cached => cached || fetch(event.request))
    );
  }
});

// Check browser's IndexedDB for cached models
import { env } from '@xenova/transformers';

console.log('Model cache directory:', env.cacheDir);
