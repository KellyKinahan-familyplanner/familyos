// KYNC Service Worker — minimal, enables PWA install on Android/Chrome/Edge
const CACHE = 'kync-v1'
const PRECACHE = ['/Kync_logo.png', '/manifest.json']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim())
})

// Network-first strategy — app always loads fresh data from server
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  // Only cache static assets, not API or Next.js routes
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')) return
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  )
})
