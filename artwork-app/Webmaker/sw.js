// sw.js — Service Worker untuk Web Creator v5.0 PWA
// Strategi: App-shell (HTML/manifest/icon) pakai cache-first + update di background.
// Request lain (misal ke server.py / Termux bridge, API eksternal) pakai network-first
// biar fitur live bridge nggak ketahan cache basi.

const CACHE_VERSION = 'webcreator-v5.0.3';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// File-file inti yang wajib bisa dibuka offline.
// Sesuaikan path WebCreator.html kalau nama filenya beda pas di-deploy.
const APP_SHELL = [
  './',
  './WebCreator.html',
  './manifest.json',
  './icon.svg'
];

// ---------- INSTALL ----------
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_SHELL_CACHE);
      // addAll akan gagal total kalau salah satu 404, jadi di-loop biar toleran
      await Promise.all(
        APP_SHELL.map(async (url) => {
          try {
            await cache.add(url);
          } catch (err) {
            console.warn('[SW] gagal cache saat install:', url, err);
          }
        })
      );
      self.skipWaiting();
    })()
  );
});

// ---------- ACTIVATE ----------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('webcreator-') && key !== APP_SHELL_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

// ---------- HELPER: deteksi request ke server lokal / Termux bridge ----------
function isLocalBridgeRequest(url) {
  // PENTING: jangan deteksi berdasarkan hostname saja (localhost/127.0.0.1),
  // karena app shell (WebCreator.html) sendiri juga di-serve dari localhost.
  // Kalau dideteksi dari hostname, request navigasi ke halaman itu sendiri
  // ikut ke-intercept dan gagal total saat server Termux mati (CTRL+C) —
  // padahal harusnya cuma panggilan API/bridge yang boleh gagal begitu.
  // Jadi deteksi HANYA dari path spesifik milik server bridge.
  return (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/fs/') ||
    url.pathname.startsWith('/socket.io/')
  );
}

// ---------- FETCH ----------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // biarkan POST/PUT dsb lewat langsung ke network

  const url = new URL(request.url);

  // Navigasi HTML dicek PALING DULUAN — supaya apapun yang terjadi,
  // membuka/refresh halaman WebCreator.html TIDAK PERNAH kena aturan
  // "server bridge offline", walau server Termux mati (CTRL+C).
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(APP_SHELL_CACHE);
          cache.put(request, fresh.clone());
          return fresh;
        } catch (err) {
          const cached = await caches.match(request);
          return cached || caches.match('./WebCreator.html');
        }
      })()
    );
    return;
  }

  // Request ke server bridge lokal / API: selalu coba network dulu, jangan cache jawaban dinamis.
  if (isLocalBridgeRequest(url)) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(
          JSON.stringify({ error: 'offline', message: 'Server bridge tidak terjangkau saat ini.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    return;
  }

  // Aset statis lain (css/js/svg/font/img): cache-first + update di background (stale-while-revalidate)
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, networkResponse.clone()));
          }
          return networkResponse;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })()
  );
});

// ---------- MESSAGE (opsional: trigger skipWaiting dari halaman) ----------
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
