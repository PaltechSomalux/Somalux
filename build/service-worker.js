/**
 * Service Worker for Dynamic Feature Updates
 * Implements smart caching strategy without requiring user to clear browser data
 * 
 * Strategy:
 * 1. Network-first for API calls (get fresh feature flags)
 * 2. Cache-first for static assets (fast load)
 * 3. Auto-invalidate caches when features change
 * 4. Broadcast cache updates to all tabs in real-time
 */

const CACHE_VERSION = '1.0.0';
const STATIC_CACHE = `static-cache-${CACHE_VERSION}`;
const API_CACHE = `api-cache-${CACHE_VERSION}`;
const FEATURES_CACHE = 'features-cache';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

const API_PATTERNS = [
  '/api/features',
  '/api/books',
  '/api/past-papers',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[ServiceWorker] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Graceful failure - some assets may not be available yet
        console.log('[ServiceWorker] Some static assets not available');
      });
    })
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            const isOldStatic = name.startsWith('static-cache-') && name !== STATIC_CACHE;
            const isOldApi = name.startsWith('api-cache-') && name !== API_CACHE;
            return isOldStatic || isOldApi;
          })
          .map((name) => {
            console.log('[ServiceWorker] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Feature flags API - NETWORK FIRST (always get latest)
  if (url.pathname.includes('/api/features')) {
    event.respondWith(networkFirstStrategy(request, FEATURES_CACHE));
    return;
  }

  // Other APIs - NETWORK FIRST
  if (API_PATTERNS.some((pattern) => url.pathname.includes(pattern))) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Static assets - CACHE FIRST
  if (request.destination === 'image' || 
      request.destination === 'script' || 
      request.destination === 'style') {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // Default - NETWORK FIRST
  event.respondWith(networkFirstStrategy(request, API_CACHE));
});

/**
 * Network-first strategy: Try network, fallback to cache
 * Best for: APIs, frequently changing data
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Network failed, try cache
    const cached = await caches.match(request);
    if (cached) {
      console.log('[ServiceWorker] Using cached response for:', request.url);
      return cached;
    }

    // No cache available
    return new Response('Network error and cache unavailable', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Cache-first strategy: Try cache, fallback to network
 * Best for: Static assets that don't change often
 */
async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);
  
  if (cached) {
    // Update cache in background if available
    fetch(request).then((response) => {
      if (response && response.status === 200) {
        const cache = caches.open(cacheName);
        cache.then((c) => c.put(request, response.clone()));
      }
    }).catch(() => {}); // Silently fail if network unavailable

    return cached;
  }

  try {
    const response = await fetch(request);
    
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    return new Response('Network error', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Listen for messages from client
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_FEATURES_CACHE') {
    caches.delete(FEATURES_CACHE).then(() => {
      console.log('[ServiceWorker] Cleared features cache');
    });
  }

  if (event.data && event.data.type === 'CLEAR_ALL_CACHES') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => caches.delete(name))
      );
    }).then(() => {
      console.log('[ServiceWorker] Cleared all caches');
    });
  }
});

/**
 * Handle push notifications for feature updates
 * Can be triggered from backend when features change
 */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  if (data.type === 'feature_update') {
    // Clear features cache when features are updated
    caches.delete(FEATURES_CACHE);

    // Notify all clients about the update
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'FEATURE_UPDATE',
          feature: data.feature,
        });
      });
    });
  }
});

export {};
