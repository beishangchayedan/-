const CACHE_NAME = 'aussie-ledger-v5';
const APP_SHELL = [
  './index.html',
  './manifest.webmanifest',
  './app-icon.svg'
];

// Install: cache the app shell immediately
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches, take control
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
        return Promise.resolve();
      })))
      .then(() => self.clients.claim())
  );
});

// Fetch: refresh the app when online, fall back to the cached shell offline.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Navigation is network-first so deployed fixes reach installed phones.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Other local resources are cache-first with a network fallback.
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
