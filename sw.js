// Service Worker for B-HU Resource PWA
const CACHE_NAME = 'bhu-resource-v1'; //如果要更新应用，修改这个触发
const RUNTIME_CACHE = 'bhu-runtime-v1';

// 需要缓存的资源列表
const STATIC_CACHE_URLS = [
  './tree.html',
  './assets/tailwind.css',
  './assets/lucide.min.js',
  './assets/papaparse.min.js',
  './assets/icon.svg',
  './data/fenlei.md',
  './manifest.json'
];

// 安装 Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.error('[Service Worker] Cache install failed:', err);
      })
  );
});

// 激活 Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 删除旧版本的缓存
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return;
  }

  // 跳过跨域请求（除非是数据文件）
  if (url.origin !== location.origin && !url.pathname.includes('/data/')) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // 如果有缓存，先返回缓存
        if (cachedResponse) {
          // 对于数据文件，同时检查网络更新
          if (url.pathname.includes('/data/')) {
            return fetch(request)
              .then((networkResponse) => {
                // 如果网络请求成功，更新缓存
                if (networkResponse.ok) {
                  const responseClone = networkResponse.clone();
                  caches.open(RUNTIME_CACHE).then((cache) => {
                    cache.put(request, responseClone);
                  });
                }
                return networkResponse.ok ? networkResponse : cachedResponse;
              })
              .catch(() => {
                // 网络失败，返回缓存
                return cachedResponse;
              });
          }
          return cachedResponse;
        }

        // 没有缓存，从网络获取
        return fetch(request)
          .then((response) => {
            // 只缓存成功的响应
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // 克隆响应以缓存
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });

            return response;
          })
          .catch((error) => {
            console.error('[Service Worker] Fetch failed:', error);
            // 如果是 HTML 页面，可以返回离线页面
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match('./tree.html');
            }
            throw error;
          });
      })
  );
});

// 处理消息（用于手动更新缓存）
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_UPDATE') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_CACHE_URLS);
      })
    );
  }
});

