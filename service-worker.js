const CACHE_NAME = 'cinemontauge-v2.2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Poppins:wght@400;500;700;900&family=Domine:wght@400;700&family=Roboto+Slab:wght@300;400;700&display=swap'
];

// Install Event: Pre-cache the App Shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Pre-caching App Shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  self.skipWaiting();
});

// Activate Event: Cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch Event: Intelligent Caching Strategy
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Strategy 1: Cache-First for Images (TMDB Posters & Backdrops)
  if (url.hostname === 'image.tmdb.org' || event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) return cachedResponse;

        return fetch(event.request).then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200) return networkResponse;
          
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        });
      })
    );
    return;
  }

  // Strategy 2: Network-First for API calls and dynamic data
  // This ensures that watch history and user profiles are always fresh
  if (url.hostname.includes('supabase.co') || url.hostname.includes('themoviedb.org') || url.hostname.includes('trakt.tv')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Strategy 3: Default - Cache falling back to Network for Shell Assets
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});