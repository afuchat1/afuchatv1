// This is needed for the TypeScript types
/// <reference lib="WebWorker" />

// Declare 'self' as a ServiceWorkerGlobalScope
declare const self: ServiceWorkerGlobalScope;

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// This line is automatically injected by vite-plugin-pwa
// It contains the list of all your app's files to cache for offline use
precacheAndRoute(self.__WB_MANIFEST || []);

cleanupOutdatedCaches();

// --- Re-implementing your runtimeCaching logic from vite.config.ts ---
// This will cache Supabase requests
registerRoute(
  // The URL of your Supabase project
  ({ url }) => url.origin === 'https://rhnsjqqtdzlkvqazfcbg.supabase.co',
  // Use a "Network First" strategy
  new NetworkFirst({
    cacheName: 'supabase-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 // 24 hours
      })
    ]
  })
);

