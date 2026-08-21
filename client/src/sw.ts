/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { ExpirationPlugin } from 'workbox-expiration';

declare let self: ServiceWorkerGlobalScope;

// Take over the page immediately
self.skipWaiting();
clientsClaim();

// Precache static assets (injected by Vite PWA plugin)
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

// Setup Background Sync for failed offline API requests
const bgSyncPlugin = new BackgroundSyncPlugin('quran-tracker-sync-queue', {
  maxRetentionTime: 24 * 60, // Retry for max of 24 Hours
});

// Cache API GET requests for offline read access (NetworkFirst)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
  }),
  'GET'
);

// Queue mutating API requests when offline (NetworkOnly with BackgroundSync)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'POST'
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'PUT'
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'DELETE'
);

// --- PUSH NOTIFICATIONS --- (migrated from previous sw.js)
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const title = data.title || 'Qalbimdagi Qur\'on';
    const options = {
      body: data.body,
      icon: '/vite.svg', // Will be replaced by PWA icons later
      badge: '/vite.svg',
      vibrate: [200, 100, 200, 100, 200, 100, 200],
      data: {
        url: data.url || '/'
      }
    };

    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(windowClients => {
      // Check if there is already a window/tab open with the target URL
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(event.notification.data.url);
      }
    })
  );
});
