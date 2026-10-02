/* Web-push service worker: shows notifications sent by the server when a
   push provider (VAPID) is configured in production. */
self.addEventListener('push', (event) => {
  let payload = { title: 'Mada Santé', body: '' }
  try {
    if (event.data) payload = event.data.json()
  } catch {
    if (event.data) payload = { title: 'Mada Santé', body: event.data.text() }
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/favicon.ico',
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow('/notifications'))
})
