// Service Worker for OFFICELAWYER PWA
const CACHE_NAME = 'office-lawyer-v1';
const STATIC_CACHE = 'office-lawyer-static-v1';
const DYNAMIC_CACHE = 'office-lawyer-dynamic-v1';

// الملفات الأساسية للتخزين المؤقت
const STATIC_FILES = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('[SW] Service Worker installed');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache:', error);
      })
  );
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map((key) => {
              console.log('[SW] Removing old cache:', key);
              return caches.delete(key);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim();
      })
  );
});

// استراتيجية التخزين: Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // تجاهل طلبات API (تحتاج اتصال بالإنترنت)
  if (url.pathname.startsWith('/api/')) {
    return;
  }
  
  // تجاهل طلبات Chrome Extension
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // للملفات الثابتة: Cache First
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'image' ||
      request.destination === 'font') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                const responseClone = networkResponse.clone();
                caches.open(STATIC_CACHE)
                  .then((cache) => cache.put(request, responseClone));
              }
              return networkResponse;
            });
        })
        .catch(() => {
          // إذا فشل كل شيء، أعد الصفحة الرئيسية
          if (request.destination === 'document') {
            return caches.match('/');
          }
        })
    );
    return;
  }
  
  // للصفحات: Network First
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request)
            .then((cachedResponse) => {
              return cachedResponse || caches.match('/');
            });
        })
    );
    return;
  }
  
  // للباقي: Network First مع تخزين مؤقت
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse.ok) {
          const responseClone = networkResponse.clone();
          caches.open(DYNAMIC_CACHE)
            .then((cache) => cache.put(request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// معالجة الرسائل من التطبيق
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    });
  }
});

// إشعار بالتحديثات
self.addEventListener('message', (event) => {
  if (event.data === 'checkForUpdate') {
    self.registration.update();
  }
});
