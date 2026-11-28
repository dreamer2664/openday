/* Cache autonoma: solo file dell'app, mai domande o responsi. */
'use strict';
const CACHE = 'delfi-arcade-deluxe-6';
const SHELL = [
  './', './index.html', './css/style.css', './css/detail.css',
  './js/app.js', './js/audio.js', './js/responsi.js', './js/pythia-face-options.js', './js/pythia-sprites.js', './js/scenery.js',
  './assets/favicon.svg', './assets/laurel.svg', './assets/sanctuary.svg',
  './assets/meander.svg', './assets/panel-grain.svg', './assets/stone-tiles.svg', './assets/oracle-seal.svg',
  './assets/fonts/fonts.css',
  './assets/fonts/pressstart2p-0.woff2', './assets/fonts/pressstart2p-1.woff2',
  './assets/fonts/pressstart2p-2.woff2', './assets/fonts/pressstart2p-3.woff2', './assets/fonts/pressstart2p-4.woff2',
  './assets/fonts/vt323-5.woff2', './assets/fonts/vt323-6.woff2', './assets/fonts/vt323-7.woff2'
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith('delfi-arcade-') && key !== CACHE).map((key) => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then((saved) => saved || fetch(event.request)));
});
