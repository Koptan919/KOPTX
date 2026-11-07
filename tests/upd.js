/* Android self-update with a mocked CapacitorUpdater plugin.
   Expected: when online, the app shows "updating…", downloads, schedules next(), then applies set() by itself;
   it waits while a form is open; same version → nothing; offline → silent, retries when back online. */
const {chromium}=require('playwright');
const CUR=require('fs').readFileSync(require('path').resolve(__dirname,'../core.js'),'utf8').match(/APP_VER='([\d.]+)'/)[1],NEW=CUR.replace(/\d+$/,n=>+n+1);
(async()=>{const b=await chromium.launch();const R=[];const ok=(c,m)=>R.push((c?'PASS ':'FAIL ')+m);
for(const [remote,label] of [[NEW,'newer'],[NEW,'busy'],[CUR,'same'],['ERR','offline'],[NEW,'moved']]){
const ctx=await b.newContext({viewport:{width:360,height:780}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(/fonts\./,r=>r.abort());
await p.addInitScript(()=>{window.__calls=[];window.__toasts=[];const f=n=>o=>{window.__calls.push([n,o]);return n==='download'?new Promise(r=>setTimeout(()=>r({id:'b1',version:o.version}),700)):Promise.resolve({})};window.Capacitor={isNativePlatform:()=>true,Plugins:{CapacitorUpdater:{notifyAppReady:f('notifyAppReady'),download:f('download'),next:f('next'),set:f('set')}}};
document.addEventListener('DOMContentLoaded',()=>new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.classList&&n.classList.contains('toast'))window.__toasts.push(n.textContent)}))).observe(document.body,{childList:true}))});
let state=remote;await p.route('https://koptan919.github.io/KOPTX/version.json*',r=>state==='ERR'||label==='moved'?r.abort():r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({version:state,zip:'https://koptan919.github.io/KOPTX/koptan-'+state+'.zip'})}));
await p.route('https://koptan919.github.io/Koptan/version.json*',r=>state==='ERR'||label!=='moved'?r.abort():r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({version:state,zip:'koptan-'+state+'.zip'})}));
await p.goto('http://localhost:8123/new/index.html');await p.waitForSelector('body.ready');
if(label==='busy')await p.evaluate(()=>addProduct());
await p.waitForTimeout(5200);
const calls=()=>p.evaluate(()=>window.__calls.map(c=>c[0])),toasts=()=>p.evaluate(()=>window.__toasts.join(' | '));
const c=await calls();ok(c.includes('notifyAppReady'),label+': notifyAppReady called at start');
if(label==='newer'){ok(c.includes('download')&&c.includes('next'),label+': downloaded + next() scheduled');const zip=await p.evaluate(()=>window.__calls.find(c=>c[0]==='download')[1]);ok(zip.version===NEW&&zip.url.endsWith('koptan-'+NEW+'.zip'),label+': correct bundle url');
const t=await toasts();ok(t.includes(NEW)&&/جارٍ تحديث التطبيق/.test(t),label+': "updating" notice shown');ok(/إعادة التشغيل/.test(t),label+': "restarting" notice shown');ok(c.includes('set'),label+': applied automatically, no button')}
if(label==='moved'){const zip=await p.evaluate(()=>(window.__calls.find(c=>c[0]==='download')||[])[1]);ok(zip&&zip.url==='https://koptan919.github.io/Koptan/koptan-'+NEW+'.zip',label+': new address down → old address used, relative zip resolved');ok(c.includes('set'),label+': applied')}
if(label==='busy'){ok(c.includes('download')&&c.includes('next'),label+': downloaded while form open');ok(!c.includes('set'),label+': NOT applied while a form is open');ok(/بعد إغلاق النموذج/.test(await toasts()),label+': told it will finish after the form');
await p.locator('.pg [data-x]').last().click();await p.waitForTimeout(400);if(await p.locator('.sheet [data-y]').count())await p.locator('.sheet [data-y]').click();await p.waitForTimeout(2200);ok((await calls()).includes('set'),label+': applied after the form closed')}
if(label==='same'||label==='offline'){ok(!c.includes('download'),label+': nothing downloaded');ok(!/تعذر/.test(await toasts()),label+': silent (no error) on auto check')}
if(label==='offline'){state=NEW;await p.evaluate(()=>dispatchEvent(new Event('online')));await p.waitForTimeout(3500);ok((await calls()).includes('set'),label+': back online → updates by itself')}
await p.evaluate(()=>openSub('set:about'));await p.waitForTimeout(300);await p.locator('[data-act=upd]').click();await p.waitForTimeout(900);R.push('   manual check toasts ('+label+'): '+(await p.locator('.toast').allInnerTexts()).join(' | '));
ok(errs.length===0,label+': no JS errors '+errs.join('|'));await ctx.close()}
console.log(R.join('\n'));await b.close()})();
