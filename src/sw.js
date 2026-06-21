import { precacheAndRoute } from 'workbox-precaching'

// Précacher tous les assets compilés par Vite
precacheAndRoute(self.__WB_MANIFEST || [])

// Custom runtime caching pour les fichiers MP3 de méditation (identique à l'ancienne config)
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('meditations-audio')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          return caches.open('meditations-audio-cache').then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
  }
});

// Gérer l'événement Push
self.addEventListener('push', (event) => {
  let data = { title: 'Cénacle 📖', body: 'Votre méditation spirituelle du jour est disponible !' }
  if (event.data) {
    try {
      data = event.data.json()
    } catch (err) {
      data = { title: 'Cénacle 📖', body: event.data.text() }
    }
  }

  const options = {
    body: data.body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: {
      url: data.url || '/'
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Gérer le clic sur la notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const targetUrl = event.notification.data.url || '/'
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})
