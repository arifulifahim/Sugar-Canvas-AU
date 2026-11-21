const CACHE='sugar-canvas-phone-v19-order-sync';
const ASSETS=['./','index.html?v=19','app.css?v=19','app.js?v=19','manifest.webmanifest','version.json','logo-96.png','logo-192.png','logo-512.png','sugar-canvas-logo.png'];
self.addEventListener('install',e=>e.waitUntil((async()=>{
  const c=await caches.open(CACHE);
  for(const a of ASSETS){try{await c.add(a)}catch(err){}}
  await self.skipWaiting();
})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener('message',e=>{if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==location.origin)return;
  e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{
    if(r&&r.ok)caches.open(CACHE).then(c=>c.put(e.request,r.clone())).catch(()=>{});
    return r;
  }).catch(()=>caches.match(e.request).then(r=>r||caches.match('./'))));
});