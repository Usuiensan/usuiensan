//VERSIONの値は、バージョンアップ時に更新すること。
//UNIXタイムスタンプを利用。
// package.jsonのversionを埋め込むか、ビルド時にUNIXタイムスタンプを自動挿入することを推奨
const VERSION = 1758354393;
const PRECACHE = `precache-${VERSION}`;
const RUNTIME = `runtime-${VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/links.html',
  '/offline.html',
  '/manifest.json',
  '/assets/js/sw-register.js',
  '/assets/icons/192.png',
  '/assets/icons/512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(PRECACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  const currentCaches = [PRECACHE, RUNTIME];
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => !currentCaches.includes(key))
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // 同一オリジンのナビゲーション要求はキャッシュファースト、失敗時は offline.html を返す
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request)
            .then(response => {
              return caches.open(RUNTIME).then(cache => {
                cache.put(event.request, response.clone());
                return response;
              });
            })
            .catch(() => caches.match('/offline.html'));
        })
    );
    return;
  }

  // その他の GET リクエストはネットワーク優先、失敗時はキャッシュを返す
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (url.origin === location.origin) {
          // キャッシュ操作を完了してからレスポンスを返す
          return caches.open(RUNTIME)
            .then(cache => {
              cache.put(event.request, response.clone());
              return response;
            });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
