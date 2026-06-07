// Avero Matrix PWA Pass-Through Stub (No-Cache Execution Mode)

// 1. INSTALL: Fire the mandatory hook to tell the browser the worker is ready
self.addEventListener('install', (event) => {
  console.log('[Avero PWA] Service Worker stub installed.');
  self.skipWaiting(); // Force activation instantly
});

// 2. ACTIVATE: Take immediate control of all client tabs
self.addEventListener('activate', (event) => {
  console.log('[Avero PWA] Service Worker active and bypass monitoring initialized.');
  event.waitUntil(self.clients.claim());
});

// 3. FETCH: The minimal required interception loop. 
// It captures the request and passes it directly to the network without touching the cache.
self.addEventListener('fetch', (event) => {
  // Let the browser handle standard requests naturally over the live network connection
  event.respondWith(
    fetch(event.request)
      .catch((err) => {
        console.error('[Avero PWA] Network request failed (Device likely offline):', err);
        // We aren't caching anything yet, so we return a failed response stream if completely offline.
        return Object.create(null); 
      })
  );
});
