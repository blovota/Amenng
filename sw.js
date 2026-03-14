var CACHE = 'amenitestify-v4';
var ASSETS = ['/'];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = e.request.url;

  // Audio files — cache on first play, serve from cache offline
  if (url.includes('b-cdn.net') || url.includes('amenitestify-audio')) {
    e.respondWith(
      caches.open('amenitestify-audio').then(function(cache) {
        return cache.match(e.request).then(function(cached) {
          return cached || fetch(e.request).then(function(response) {
            return response;
          });
        });
      })
    );
    return;
  }

  // App shell — network first, cache fallback
  e.respondWith(
    fetch(e.request).then(function(response) {
      var copy = response.clone();
      caches.open(CACHE).then(function(cache) {
        cache.put(e.request, copy);
      });
      return response;
    }).catch(function() {
      return caches.match(e.request).then(function(cached) {
        return cached || caches.match('/');
      });
    })
  );
});
