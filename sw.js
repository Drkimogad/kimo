const CACHE_NAME = 'kimo-ai-cache-v15'; // Updated version
const OFFLINE_URL = './offline.html';
const CACHE_TIMEOUT = 5000; // 5 second timeout for network requests

// Core app files
const CORE_ASSETS = [
  './',
  '../index.html',
  './styles.css',
  './src/index.js',
  './src/aisearching.js',
  './manifest.json',
  './favicon.ico',
  './offline.html'
];

// Static assets
const STATIC_ASSETS = [
  './icons/icon-512.png',
  './icons/icon-192.png',
  './icons/icon-128.png',
  './icons/icon-64.png'
];

// AI model files
const MODEL_ASSETS = [
  // Local model files
  './tfj/text-model.js',
  './tfj/image-model.js',
  './models/t5-small/tokenizer.json',
  './models/t5-small/config.json',
  './src/ai/summarizer.js',
  './src/ai/personalizer.js',
  './src/utils/offlineStorage.js',

  // TensorFlow
  './model-cache/tf.js',
  
  // MobileNet (single file version)
  './model-cache/mobilenet.js',
  
  // Tesseract
  './model-cache/tesseract.js'
];

// Combined cache list
const CACHE_ASSETS = [...CORE_ASSETS, ...STATIC_ASSETS, ...MODEL_ASSETS];

// Custom fetch with timeout and retry
const fetchWithTimeout = (url, options = {}, timeout = CACHE_TIMEOUT) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => 
      reject(new Error(`Request timeout for ${url}`)), timeout);

    fetch(url, options)
      .then(response => {
        clearTimeout(timer);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        resolve(response);
      })
      .catch(reject);
  });
};

// Install - Cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('Service Worker installing');
      
      // Cache core assets first
      await cache.addAll(CORE_ASSETS);
      
      // Cache remaining assets with retry logic
      const cachePromises = STATIC_ASSETS.concat(MODEL_ASSETS).map(url => 
        cache.add(url).catch(e => 
          console.warn(`Failed to cache ${url}:`, e))
      );
      
      await Promise.all(cachePromises);
      console.log('Caching completed');
    })
  );
});

// Activate - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch - Enhanced caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Handle API requests separately
  if (request.url.includes('/api/')) {
    event.respondWith(networkFirstWithCacheFallback(request));
    return;
  }

  // For all other requests
  event.respondWith(
    cacheFirstWithNetworkFallback(request).catch(() => 
      offlineFallback(request)
    )
  );
});

// Strategies
async function cacheFirstWithNetworkFallback(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    
    // Fallback to network with timeout
    const networkResponse = await fetchWithTimeout(request.clone());
    
    // Cache the response if successful
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn(`Cache-first failed for ${request.url}:`, error);
    throw error;
  }
}

async function networkFirstWithCacheFallback(request) {
  try {
    // Try network first with timeout
    const networkResponse = await fetchWithTimeout(request.clone());
    
    // Update cache if successful
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn(`Network-first failed for ${request.url}:`, error);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    
    throw error;
  }
}

async function offlineFallback(request) {
  if (request.mode === 'navigate') {
    return caches.match(OFFLINE_URL);
  }
  
  // Return empty response for other failed requests
  return new Response('', { 
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain' }
  });
}

// Background sync (optional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'retry-failed-requests') {
    console.log('Background sync triggered');
    // Implement retry logic here
    // Background Sync Retry Logic
const FAILED_REQUESTS = 'failed-requests';
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds between retries

self.addEventListener('sync', (event) => {
  if (event.tag === 'retry-failed-requests') {
    event.waitUntil(
      retryFailedRequests()
    );
  }
});

async function retryFailedRequests() {
  const cache = await caches.open(FAILED_REQUESTS);
  const keys = await cache.keys();
  
  for (const request of keys) {
    const response = await cache.match(request);
    const { url, method, headers, body } = await parseRequest(request);
    const retryCount = parseInt(response.headers.get('x-retry-count')) || 0;

    if (retryCount >= MAX_RETRIES) {
      await cache.delete(request);
      continue;
    }

    try {
      const networkResponse = await fetchWithTimeout(url, {
        method,
        headers: JSON.parse(headers),
        body: body ? await blobToText(body) : null
      });

      if (networkResponse.ok) {
        await cache.delete(request);
        console.log(`Successfully retried: ${url}`);
        
        // Update UI (via postMessage)
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'request-retry-success',
            url
          });
        });
      }
    } catch (error) {
      console.warn(`Retry failed (attempt ${retryCount + 1}): ${url}`, error);
      
      // Update retry count and re-cache
      const newResponse = new Response(response.body, {
        headers: {
          ...Object.fromEntries(response.headers),
          'x-retry-count': (retryCount + 1).toString()
        }
      });
      
      await cache.put(request, newResponse);
    }

    // Delay between retries
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
  }
}

// Helper functions
async function parseRequest(request) {
  return {
    url: request.url,
    method: request.method,
    headers: JSON.stringify(Object.fromEntries(request.headers.entries())),
    body: request.method !== 'GET' ? await request.blob() : null
  };
}

async function blobToText(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsText(blob);
  });
}

// Modified fetch event to store failed requests
self.addEventListener('fetch', (event) => {
  if (shouldCacheRequest(event.request)) {
    event.respondWith(
      handleFetchWithRetry(event)
    );
  }
});

async function handleFetchWithRetry(event) {
  try {
    const response = await cacheFirstWithNetworkFallback(event.request);
    return response;
  } catch (error) {
    if (event.request.method === 'GET') {
      return offlineFallback(event.request);
    }

    // Store POST/PUT/DELETE requests for retry
    if (['POST', 'PUT', 'DELETE'].includes(event.request.method)) {
      const cache = await caches.open(FAILED_REQUESTS);
      const headers = new Headers();
      headers.append('x-retry-count', '0');
      headers.append('x-timestamp', Date.now().toString());
      
      const clonedRequest = event.request.clone();
      const body = await clonedRequest.blob();
      
      await cache.put(
        new Request(event.request.url, {
          method: event.request.method,
          headers: event.request.headers
        }),
        new Response(body, { headers })
      );
      
      // Register for background sync
      if ('sync' in self.registration) {
        try {
          await self.registration.sync.register('retry-failed-requests');
        } catch (syncError) {
          console.error('Background sync registration failed:', syncError);
        }
      }
    }

    throw error;
  }
}

function shouldCacheRequest(request) {
  return (
    request.url.startsWith(self.location.origin) &&
    !request.url.includes('/socket.io/') &&
    !request.url.includes('/api/analytics')

  }
});
