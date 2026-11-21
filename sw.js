const CACHE='sugar-canvas-phone-v16-repair';
const ASSETS=['./','index.html','app.css','app.js','manifest.webmanifest','version.json','logo-96.png','logo-192.png','logo-512.png','sugar-canvas-logo.png'];
self.addEventListener('install',e=>e.waitUntil((async()=>{
  const c=await caches.open(CACHE);
  await c.addAll(ASSETS.map(x=>x+'?v=16'));
  await self.skipWaiting();
})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener('message',e=>{
  if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting();
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.pathname.endsWith('/version.json')||url.pathname.endsWith('/repair.html')){
    e.respondWith(fetch(req,{cache:'no-store'}));return;
  }
  if(req.mode==='navigate'){
    e.respondWith(fetch(req,{cache:'no-store'}).catch(()=>caches.match('index.html?v=16')||caches.match('./?v=16')));return;
  }
  e.respondWith(fetch(req).then(r=>{
    if(r&&r.ok){
      const copy=r.clone();
      caches.open(CACHE).then(c=>c.put(req,copy));
    }
    return r;
  }).catch(()=>caches.match(req)));
});