/* eslint-disable no-restricted-globals */
/* global self, clients */

let apiUrl = '';
let apiKey = '';

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'INIT') {
    apiUrl = event.data.apiUrl;
    apiKey = event.data.apiKey;
    console.log('[Service Worker] Initialized with API URL:', apiUrl);
  }
});

// Handle push events
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');

  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    console.error('[Service Worker] Failed to parse push data:', error);
    return;
  }

  const { title, body, icon, badge, image, url, notificationId, subscriptionId } = data;

  const options = {
    body: body || '',
    icon: icon || '/icon.png',
    badge: badge || '/badge.png',
    image: image || undefined,
    data: {
      url: url || '/',
      notificationId,
      subscriptionId,
    },
    requireInteraction: false,
    tag: notificationId || 'notification',
  };

  event.waitUntil(
    self.registration.showNotification(title || 'Notification', options).then(() => {
      // Track delivery
      if (apiUrl && notificationId && subscriptionId) {
        return fetch(`${apiUrl}/api/v1/webhooks/delivery`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            notificationId,
            subscriptionId,
            event: 'delivered',
          }),
        }).catch((error) => {
          console.error('[Service Worker] Failed to track delivery:', error);
        });
      }
    })
  );
});

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');

  event.notification.close();

  const { url, notificationId, subscriptionId } = event.notification.data || {};

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Track click
        if (apiUrl && notificationId && subscriptionId) {
          fetch(`${apiUrl}/api/v1/webhooks/delivery`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              notificationId,
              subscriptionId,
              event: 'clicked',
            }),
          }).catch((error) => {
            console.error('[Service Worker] Failed to track click:', error);
          });
        }

        // Check if there's already a window open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }

        // Open a new window if none found
        if (clients.openWindow && url) {
          return clients.openWindow(url);
        }
      })
  );
});

// Handle notification close events
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed');
});

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(clients.claim());
});
