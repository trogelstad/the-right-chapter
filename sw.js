/* The Right Chapter — sw.js */

const CACHE = 'trc-v3';
const ASSETS = ['/index.html', '/style.css', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  /* 1. API calls — always go to network, never cache */
  if (url.includes('/api/')) {
    e.respondWith(fetch(e.request));
    return;
  }

  /* 2. HTML navigation — network first, fall back to cache if offline */
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  /* 3. script.js — network first so updates always land immediately */
  if (url.includes('script.js')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  /* 4. Everything else (CSS, fonts, icons) — cache first for speed */
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
