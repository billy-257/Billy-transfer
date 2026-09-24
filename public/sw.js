// Service worker for RUNGIKA NA BILLY - handles PWA offline shell + Web Push.

const CACHE = "billy-cache-v1"
const APP_SHELL = ["/", "/manifest.json", "/icon-192.png", "/icon-512.png", "/favicon.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).catch(() => {}))
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

// Network-first for navigations (fresh rates, with an offline fallback to the
// cached shell); cache-first for other same-origin GET assets.
self.addEventListener("fetch", (event) => {
  const req = event.request
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {})
          return res
        })
        .catch(() => caches.match(req).then((c) => c || caches.match("/"))),
    )
    return
  }

  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req)
          .then((res) => {
            if (res && res.status === 200 && res.type === "basic") {
              const copy = res.clone()
              caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {})
            }
            return res
          })
          .catch(() => cached),
    ),
  )
})

self.addEventListener("push", (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    data = { title: "RUNGIKA NA BILLY", body: event.data ? event.data.text() : "" }
  }

  const title = data.title || "RUNGIKA NA BILLY"
  const options = {
    body: data.body || "Ufise ubutumwa bushasha.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "billy-message",
    data: { url: data.url || "/" },
    vibrate: [120, 60, 120],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || "/"
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    }),
  )
})
