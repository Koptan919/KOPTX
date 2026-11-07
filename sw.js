/* KOPTAN v9 service worker — offline-first. App data lives in IndexedDB and is never touched here. */
const V='koptan-v9.7.0',Q='?v=970';
const CORE=['./','index.html','manifest.json','icon-192.png','icon-512.png','app.css'+Q,'i18n.js'+Q,'core.js'+Q,'views.js'+Q,'more.js'+Q,'extra.js'+Q,...['arabic','latin'].flatMap(s=>['400','500','700','800'].map(n=>`fonts/tajawal-${s}-${n}-normal.woff2`))];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(CORE.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))).then(()=>self.skipWaiting()))});
/* remove caches from older versions (pbm-v9 and earlier) */
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
if(u.origin!==location.origin&&!/(fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(u.hostname))return;
if(r.mode==='navigate'){/* network-first so a new version shows on the next open; cached copy when offline or slow */
const net=fetch(u.origin+u.pathname,{cache:'no-cache'}).then(x=>{if(x.ok){const c=x.clone();caches.open(V).then(k=>k.put('index.html',c))}return x});
const slow=new Promise(res=>setTimeout(res,3500)).then(()=>caches.match('index.html')).then(h=>h||net);
e.respondWith(Promise.race([net,slow]).catch(()=>caches.match('index.html')));return}
/* versioned assets: cache-first; everything else: stale-while-revalidate */
e.respondWith(caches.match(r).then(h=>{const f=fetch(r).then(x=>{if(x.ok||x.type==='opaque'){const c=x.clone();caches.open(V).then(k=>k.put(r,c))}return x});if(h){if(!u.search.includes('v='))f.catch(()=>{});return h}return f}))});
