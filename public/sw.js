// Service worker: เก็บหน้าเว็บ + draws.json ไว้ในเครื่อง เปิดได้แม้ไม่มีเน็ต
// หน้าเว็บและข้อมูล = เน็ตก่อน (ได้ของใหม่) ล้มเหลวค่อยใช้ของในเครื่อง · ไฟล์ assets (ชื่อมี hash) = ใช้ของในเครื่องก่อน
const CACHE = 'lotto-v2'
const SHELL = ['./', './data/draws.json', './manifest.webmanifest', './icon.svg', './icon-192.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      await cache.addAll(SHELL)
      // เก็บไฟล์ JS/CSS ที่ index.html อ้างถึงด้วย
      const html = await (await cache.match('./', { ignoreVary: true })).text()
      const assets = [...html.matchAll(/(?:src|href)="([^"]*assets\/[^"]+)"/g)].map((m) => m[1])
      await cache.addAll(assets)
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key)
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== self.location.origin) return

  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(req, { ignoreVary: true }).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy))
            return res
          }),
      ),
    )
    return
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req.mode === 'navigate' ? './' : req, copy))
        }
        return res
      })
      .catch(async () => (await caches.match(req, { ignoreSearch: true, ignoreVary: true })) || (req.mode === 'navigate' ? caches.match('./', { ignoreVary: true }) : Response.error())),
  )
})
