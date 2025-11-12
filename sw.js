/*
  A service worker for full offline caching.
  Uses a "Cache, falling back to Network, then update cache" strategy.
*/

// UPDATED: Cache name changed to v4 to force old cache deletion
const CACHE_NAME = 'follow-me-cache-v4';

// UPDATED: Paths are now relative so they work on any domain or subfolder.
const APP_SHELL_URLS = [
    './',
    './index.html',
    './style.css',
    './manifest.json',
    './1000021086.jpg',
    './js/config.js',
    './js/state.js',
    './js/ui.js',
    './js/core.js',
    './js/demo.js',
    './js/main.js'
];

// --- Install Event ---
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Install');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching App Shell');
                return cache.addAll(APP_SHELL_URLS).catch(error => {
                    console.error('[Service Worker] Failed to cache app shell resource:', error);
                });
            })
            .then(() => {
                return self.skipWaiting();
            })
    );
});

// --- Activate Event ---
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activate');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Clearing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// --- Fetch Event ---
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request)
                    .then((networkResponse) => {
                        if (!networkResponse || !networkResponse.ok) {
                            return networkResponse;
                        }
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('[Service Worker] Fetch failed, and not in cache:', error);
                    });
            })
    );
});fetch(event.request)
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
                      
