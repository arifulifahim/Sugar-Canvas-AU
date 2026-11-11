
const CACHE='sugar-canvas-phone-v5-logo';
const ASSETS=['./','index.html','app.css','app.js','manifest.webmanifest','logo-96.png','logo-192.png','logo-512.png','sugar-canvas-logo.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
