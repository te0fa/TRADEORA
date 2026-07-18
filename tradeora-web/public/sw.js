const CACHE = 'tradeora-v1';
const ASSETS = [
  '/',
  '/ar',
  '/en',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(
      cached => cached || fetch(e.request)
    )
  );
});
