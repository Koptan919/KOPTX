/* مدير أعمالي — service worker (offline-first). Data lives in IndexedDB and is never touched here. */
const V='pbm-v9',CORE=['./','index.html','manifest.json','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
if(u.origin!==location.origin&&!/(fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(u.hostname))return;
if(r.mode==='navigate'){/* network-first: new version appears on the next open when online; cache is the offline fallback */
const net=fetch(u.href,{cache:'no-cache'}).then(x=>{if(x.ok){const c=x.clone();caches.open(V).then(k=>k.put('index.html',c))}return x});
const slow=new Promise(res=>setTimeout(res,3500)).then(()=>caches.match('index.html')).then(h=>h||net);
e.respondWith(Promise.race([net,slow]).catch(()=>caches.match('index.html')));return}
e.respondWith(caches.match(r).then(h=>h||fetch(r).then(x=>{if(x.ok||x.type==='opaque'){const c=x.clone();caches.open(V).then(k=>k.put(r,c))}return x})));});
