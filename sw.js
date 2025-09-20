const CACHE_NAME = 'usuiensan-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/what-is-ulid.html',
  '/count.html',
  '/mywork.html',
  '/links.html',
  '/style.css',
  '/assets/js/pwgenescript.js',
  '/assets/js/countscript.js',
  '/favicon.ico',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});