// Minimal service worker: satisfies installability criteria.
// ponytail: no offline caching yet — add a cache strategy when offline support is needed.
self.addEventListener('install', (event) => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
