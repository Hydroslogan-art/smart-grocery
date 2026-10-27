// Service Worker - Auto Cache Cleaner & Always Fresh Network Pass
const CACHE_NAME = 'smart-grocery-v99';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          console.log('[Service Worker] Deleting cache:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Always fetch from network directly to ensure no stale cached files
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
