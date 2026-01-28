// VERSIONの値はキャッシュのバージョン管理に使用します。
// 現在はUNIXタイムスタンプ（例: 1758354393）を手動で設定しています。
// 新しいデプロイや静的ファイルの更新時には、以下のいずれかの方法で値を更新してください:
//   - ターミナルで `date +%s` を実行し、現在のUNIXタイムスタンプを取得して設定する
//   - package.jsonのversionを埋め込む
//   - ビルド時に自動でUNIXタイムスタンプを挿入する（推奨: ビルドスクリプトで置換）
// 更新しないとキャッシュが正しく切り替わらないため、必ず変更時に更新してください。
const VERSION = 1738040400; // CSS構造改善のため更新 (2026-01-28)
const PRECACHE = `precache-${VERSION}`;
const RUNTIME = `runtime-${VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/links.html',
  '/offline.html',
  '/manifest.json',
  '/assets/js/sw-register.js',
  '/assets/icons/192.png',
  '/assets/icons/512.png',
  '/count.html',
  '/index.html',
  '/sitemap.html',
  // 新しいCSS構造
  '/assets/css/common.css',
  '/assets/css/components/modal.css',
  '/assets/css/components/toast.css',
  '/assets/css/pages/password.css',
  '/assets/css/pages/counter.css',
  '/assets/css/pages/plate.css',
  '/assets/js/pwgenescript.js',
  '/assets/js/zxcvbn.js'
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
