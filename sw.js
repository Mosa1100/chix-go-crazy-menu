const CACHE = 'chix-go-crazy-v3';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll([
        './',
        './index.html',
        './manifest.webmanifest'
      ]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const request = event.request;

  // عند فتح أو تحديث الصفحة:
  // استخدم النسخة المحلية أولاً إذا لم يوجد إنترنت.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();

          caches.open(CACHE).then(cache => {
            cache.put('./index.html', copy);
          });

          return response;
        })
        .catch(() =>
          caches.match('./index.html')
            .then(response =>
              response || caches.match('./')
            )
        )
    );

    return;
  }

  // باقي الملفات: Cache First ثم الإنترنت
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then(response => {
            if (response && response.status === 200) {
              const copy = response.clone();

              caches.open(CACHE).then(cache => {
                cache.put(request, copy);
              });
            }

            return response;
          });
      })
      .catch(() => caches.match('./index.html'))
  );
});
