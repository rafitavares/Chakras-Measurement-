// Service worker simples: cacheia o "shell" do app (HTML/CSS/JS/ícones) para
// instalação como PWA e para abrir mais rápido / offline. Estratégia
// network-first com fallback em cache, para nunca travar numa versão antiga
// enquanto houver internet.
const CACHE_NAME = 'chakras-shell-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/app.js',
  './js/auth.js',
  './js/calculations.js',
  './js/charts.js',
  './js/clients.js',
  './js/export.js',
  './js/firebase.js',
  './js/firebase-config.js',
  './js/ui.js',
  './js/visits.js',
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
    return; // deixa passar direto: Firebase, Chart.js CDN, etc.
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
