const CACHE = 'tradeora-v1'

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(['/']))
  )
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim())
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request))
  )
})

// ── Push Notification Handler ──────────
self.addEventListener('push', e => {
  if (!e.data) return

  const data = e.data.json()
  const opts = {
    body:    data.body   || 'إشعار جديد من TRADEORA',
    icon:    data.icon   || '/icon-192.png',
    badge:   '/icon-192.png',
    tag:     data.tag    || 'tradeora',
    data:    { url: data.url || '/' },
    actions: data.actions || [],
    vibrate: [200, 100, 200],
    requireInteraction: data.important || false,
  }

  e.waitUntil(
    self.registration.showNotification(
      data.title || '📊 TRADEORA',
      opts
    )
  )
})

// ── Notification Click ─────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url || '/'
  e.waitUntil(
    clients.matchAll({ type:'window' }).then(wins => {
      const win = wins.find(w => w.focused)
      if (win) {
        win.navigate(url)
        win.focus()
      } else {
        clients.openWindow(url)
      }
    })
  )
})
