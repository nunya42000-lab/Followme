/*
  A service worker for full offline caching.
  Uses a "Cache, falling back to Network, then update cache" strategy.
*/

// UPDATED: Cache name changed to v3 to force old cache deletion
const CACHE_NAME = 'follow-me-cache-v3';

// UPDATED: All paths are now absolute to the domain.
const APP_SHELL_URLS = [
    '/Follow/',
    '/Follow/index.html',
    '/Follow/style.css',
    '/Follow/manifest.json',
    '/Follow/1000021086.jpg',
    '/Follow/js/config.js',
    '/Follow/js/state.js',
    '/Follow/js/ui.js',
    '/Follow/js/core.js',
    '/Follow/js/demo.js',
    '/Follow/js/main.js'
];

// --- Install Event ---
// Pre-caches the app shell.
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Install');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching App Shell');
                // We use addAll which fetches and caches.
                // We add a catch block to log if any single resource fails.
                return cache.addAll(APP_SHELL_URLS).catch(error => {
                    console.error('[Service Worker] Failed to cache app shell resource:', error);
                });
            })
            .then(() => {
                // Force the new service worker to activate immediately
                return self.skipWaiting();
            })
    );
});

// --- Activate Event ---
// Cleans up old caches.
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activate');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // If this cache's name isn't the current one, delete it.
                    // This will delete 'follow-me-cache-v1' and 'v2'
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Clearing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Tell the active service worker to take control of the page immediately
            return self.clients.claim();
        })
    );
});

// --- Fetch Event ---
// Implements a "Cache, falling back to Network" strategy.
self.addEventListener('fetch', (event) => {
    // We only want to cache GET requests.
    if (event.request.method !== 'GET') {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // 1. Try to get from Cache
                if (cachedResponse) {
                    return cachedResponse;
                }

                // 2. If not in Cache, try to fetch from Network
                return fetch(event.request)
                    .then((networkResponse) => {
                        
                        // Check if we received a valid response
                        if (!networkResponse || !networkResponse.ok) {
                            return networkResponse;
                        }

                        // 3. If Network fetch succeeds, cache the response and return it
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('[Service Worker] Fetch failed, and not in cache:', error);
                        // Let the request fail
                    });
            })
    );
});
                      
