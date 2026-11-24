const CACHE = 'tchatlove-pwa-v4-customer-push';
const ASSETS = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('tchatlove-pwa-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (request.mode === 'navigate' && url.pathname === '/' && !url.search) {
    event.respondWith(fetch(request).catch(async () => (await caches.match('/')) || Response.error()));
    return;
  }
  if (ASSETS.includes(url.pathname) && url.pathname !== '/' && !url.search) {
    event.respondWith(fetch(request).catch(async () => (await caches.match(url.pathname)) || Response.error()));
  }
});


self.addEventListener('push', event => {
 let data={};try{data=event.data?.json()||{}}catch{}
 event.waitUntil(self.registration.showNotification(typeof data.title==='string'?data.title.slice(0,60):'Tchat Love Club',{body:typeof data.body==='string'?data.body.slice(0,180):'Une nouvelle notification est disponible.',icon:'/icons/icon-192.png',tag:data.kind==='daily'?'tchatlove-daily':'tchatlove-test',data:{url:'/'}}));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 event.waitUntil((async()=>{const windows=await clients.matchAll({type:'window',includeUncontrolled:true});const w=windows.find(c=>new URL(c.url).origin===self.location.origin);if(w){await w.focus();return}await clients.openWindow('/')})());
});
