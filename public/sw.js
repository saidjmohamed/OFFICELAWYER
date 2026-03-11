const CACHE_NAME = 'lawyer-office-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// استراتيجية Network First مع Fallback للكاش
self.addEventListener('fetch', (event) => {
  // تجاهل طلبات API وملفات قاعدة البيانات
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('.db')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // نسخ الاستجابة للكاش
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // استخدام الكاش في حالة عدم الاتصال
        return caches.match(event.request);
      })
  );
});
