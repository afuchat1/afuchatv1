// This is needed for the TypeScript types
/// <reference lib="WebWorker" />

// Declare 'self' as a ServiceWorkerGlobalScope
declare const self: ServiceWorkerGlobalScope;

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute, NavigationRoute, Route } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// This line is automatically injected by vite-plugin-pwa
// It contains the list of all your app's files to cache for offline use
precacheAndRoute(self.__WB_MANIFEST || []);

cleanupOutdatedCaches();

// --- Offline-First Navigation Strategy ---
// Cache all navigation requests (HTML pages) for offline access
const navigationHandler = new NetworkFirst({
  cacheName: 'pages-cache',
  plugins: [
    new CacheableResponsePlugin({
      statuses: [0, 200],
    }),
    new ExpirationPlugin({
      maxEntries: 50,
      maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
    })
  ]
});

// Handle all navigation requests
registerRoute(
  ({ request }) => request.mode === 'navigate',
  navigationHandler
);

// --- Static Assets Strategy (Cache First) ---
// Images, fonts, and static files - cache first for fast loading
registerRoute(
  ({ request }) => 
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'style' ||
    request.destination === 'script',
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
      })
    ]
  })
);

// --- External Images (avatars, uploads) ---
registerRoute(
  ({ url }) => 
    url.hostname.includes('supabase.co') && 
    (url.pathname.includes('/storage/') || url.pathname.includes('/object/')),
  new StaleWhileRevalidate({
    cacheName: 'user-images',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
      })
    ]
  })
);

// --- API Data Cache (Supabase REST) ---
// Cache Supabase API requests for offline data access with shorter TTL
registerRoute(
  ({ url }) => 
    url.origin === 'https://rhnsjqqtdzlkvqazfcbg.supabase.co' &&
    !url.pathname.includes('/realtime/') &&
    !url.pathname.includes('/auth/') &&
    !url.pathname.includes('/functions/'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50, // Reduced for better memory usage
        maxAgeSeconds: 60 * 5 // 5 minutes - fresher data
      })
    ]
  })
);

// --- Google Fonts ---
registerRoute(
  ({ url }) => 
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
      })
    ]
  })
);

// --- CDN Resources ---
registerRoute(
  ({ url }) => 
    url.origin.includes('cdn') ||
    url.origin.includes('unpkg') ||
    url.origin.includes('jsdelivr'),
  new CacheFirst({
    cacheName: 'cdn-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
      })
    ]
  })
);

// --- Offline Fallback ---
// When offline and no cache, serve cached index.html for navigation
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try network first
          const response = await fetch(event.request);
          return response;
        } catch (error) {
          // If offline, try to serve from cache
          const cache = await caches.open('pages-cache');
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback to cached index.html for SPA routing
          const indexResponse = await cache.match('/index.html');
          if (indexResponse) {
            return indexResponse;
          }
          throw error;
        }
      })()
    );
  }
});

// --- Service Worker Messages ---
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Handle notification message from main thread
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, {
      icon: '/favicon.png',
      badge: '/favicon.png',
      ...options,
    });
  }
});

// --- Push Event - Handle push notifications ---
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let data = {
    title: 'AfuChat',
    body: 'You have a new notification',
    icon: '/favicon.png',
    badge: '/favicon.png',
    url: '/notifications'
  };
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      data: { url: data.url },
      requireInteraction: true,
    })
  );
});

// --- Notification Click - Handle notification clicks ---
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if a window is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({ type: 'NOTIFICATION_CLICK', url: urlToOpen });
          return;
        }
      }
      // Open new window if none exists
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// --- Install Event - Pre-cache critical assets ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('critical-assets').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/favicon.png'
      ]).catch(() => {
        // Fail silently if some assets aren't available yet
        console.log('Some critical assets could not be cached');
      });
    })
  );
});

// --- Activate Event - Clean old caches ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Delete old caches that don't match current version
            return !['pages-cache', 'static-assets', 'user-images', 'api-cache', 'google-fonts', 'cdn-cache', 'critical-assets'].includes(cacheName);
          })
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
});
