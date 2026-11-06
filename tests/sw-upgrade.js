const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
/* simulate an existing install of the OLD app at /swt/, then deploy the new files over it (same URL) */
const SITE=process.env.SITE,D=SITE+'/swt';
const cp=(src,files)=>files.forEach(f=>fs.copyFileSync(path.join(src,f),path.join(D,f)));
(async()=>{fs.rmSync(D,{recursive:true,force:true});fs.mkdirSync(D);cp(SITE+'/old',['index.html','sw.js','manifest.json','icon-192.png','icon-512.png']);
const b=await chromium.launch();const ctx=await b.newContext();const p=await ctx.newPage();await p.route(/fonts\./,r=>r.abort());const errs=[];p.on('pageerror',e=>errs.push(e.message));
const U='http://localhost:8123/swt/index.html';await p.goto(U);await p.waitForTimeout(1500);
await p.evaluate(async()=>{const x={id:uid(),name:'OldItem',cost:1,price:2,qty:3,min:1,sold:0,created:Date.now(),imgs:[],img:''};S.p.push(x);await put('p',x)});
await p.waitForFunction(()=>navigator.serviceWorker.controller,null,{timeout:10000});console.log('old SW controls page; caches:',await p.evaluate(()=>caches.keys()));
// deploy new version over the old one
cp(require('path').resolve(__dirname,'..'),['index.html','sw.js','manifest.json','icon-192.png','icon-512.png','app.css','i18n.js','core.js','views.js','more.js','extra.js']);fs.mkdirSync(path.join(D,'fonts'),{recursive:true});fs.readdirSync(path.resolve(__dirname,'../fonts')).forEach(f=>fs.copyFileSync(path.resolve(__dirname,'../fonts',f),path.join(D,'fonts',f)));
await p.reload();await p.waitForSelector('body.ready',{timeout:15000});console.log('after 1st reopen version:',await p.evaluate(()=>APP_VER),'OldItem kept:',await p.evaluate(()=>S.p.some(x=>x.name==='OldItem')));
await p.waitForTimeout(2500);console.log('caches now:',await p.evaluate(()=>caches.keys()));
await ctx.setOffline(true);await p.reload();await p.waitForSelector('body.ready',{timeout:15000});console.log('offline reopen OK, version',await p.evaluate(()=>APP_VER),'products',await p.evaluate(()=>S.p.length));
await ctx.setOffline(false);
/* a new release goes live while the app is open: it must notice, show a message and reload by itself */
const cur=await p.evaluate(()=>APP_VER),nxt=cur.replace(/\d+$/,n=>+n+1);fs.writeFileSync(path.join(D,'version.json'),JSON.stringify({version:nxt}));
fs.writeFileSync(path.join(D,'sw.js'),fs.readFileSync(path.join(D,'sw.js'),'utf8').replace(/const V='[^']+'/,"const V='koptan-test-next'"));
await p.evaluate(()=>{window.__mark=1;window.__toasts=[];new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.classList&&n.classList.contains('toast'))window.__toasts.push(n.textContent)}))).observe(document.body,{childList:true})});
const seen=[];p.on('console',()=>{});const t0=Date.now();await p.evaluate(()=>dispatchEvent(new Event('online')));
let reloaded=false;for(let i=0;i<30&&!reloaded;i++){await p.waitForTimeout(300);try{const m=await p.evaluate(()=>{if(window.__toasts)window.__toasts.forEach(t=>window.__seen=(window.__seen||'')+t+'|');return window.__mark});if(m!==1)reloaded=true;else seen.push(await p.evaluate(()=>(window.__toasts||[]).join('|')))}catch(e){}}
await p.waitForSelector('body.ready',{timeout:15000});
console.log('web auto-update: notice shown:',seen.some(s=>/تحديث/.test(s)),'| reloaded by itself:',reloaded,'| cache:',await p.evaluate(()=>caches.keys()));
console.log('errors:',errs.length?errs:'none');await b.close()})();
