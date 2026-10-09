// Simple service worker: caches the app "shell" (HTML/CSS/JS/icons) for
// PWA installation and faster/offline opening. Network-first strategy with
// cache fallback, so it never gets stuck on an old version while online.
const CACHE_NAME = 'chakras-shell-v4';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/app.js',
  './js/backup.js',
  './js/bodymap.js',
  './js/calculations.js',
  './js/charts.js',
  './js/clients.js',
  './js/export.js',
  './js/report.js',
  './js/store.js',
  './js/ui.js',
  './js/visits.js',
  './assets/logo.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return; // let it pass through: Chart.js CDN, etc.
  }
  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
