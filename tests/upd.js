const {chromium}=require('playwright');
const CUR=require('fs').readFileSync(require('path').resolve(__dirname,'../core.js'),'utf8').match(/APP_VER='([\d.]+)'/)[1],NEW=CUR.replace(/\d+$/,n=>+n+1);
(async()=>{const b=await chromium.launch();const R=[];const ok=(c,m)=>R.push((c?'PASS ':'FAIL ')+m);
for(const [remote,label] of [[NEW,'newer'],[CUR,'same'],['ERR','offline']]){
const ctx=await b.newContext({viewport:{width:360,height:780}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(/fonts\./,r=>r.abort());
await p.addInitScript(()=>{window.__calls=[];const f=n=>o=>{window.__calls.push([n,o]);return Promise.resolve(n==='download'?{id:'b1',version:o.version}:{})};window.Capacitor={isNativePlatform:()=>true,Plugins:{CapacitorUpdater:{notifyAppReady:f('notifyAppReady'),download:f('download'),next:f('next'),set:f('set')}}}});
await p.route('https://koptan919.github.io/Koptan/version.json*',r=>remote==='ERR'?r.abort():r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({version:remote,zip:'https://koptan919.github.io/Koptan/koptan-'+remote+'.zip'})}));
await p.goto('http://localhost:8123/new/index.html');await p.waitForSelector('body.ready');await p.waitForTimeout(3500);
const calls=await p.evaluate(()=>window.__calls.map(c=>c[0]));
ok(calls.includes('notifyAppReady'),label+': notifyAppReady called at start');
if(remote===NEW){ok(calls.includes('download')&&calls.includes('next'),label+': downloaded + scheduled for next launch');const zip=await p.evaluate(()=>window.__calls.find(c=>c[0]==='download')[1]);ok(zip.version===NEW&&zip.url.endsWith('koptan-'+NEW+'.zip'),label+': correct bundle url');
ok(await p.locator('.toast .tbtn').count()===1,label+': "update now" toast shown');await p.locator('.toast .tbtn').click();await p.waitForTimeout(200);ok((await p.evaluate(()=>window.__calls.map(c=>c[0]))).includes('set'),label+': update now applies bundle')}
else{ok(!calls.includes('download'),label+': nothing downloaded');ok(await p.locator('.toast').count()===0||!(await p.locator('.toast').innerText()).includes('تعذر'),label+': silent (no error toast) on auto check')}
await p.evaluate(()=>openSub('set'));await p.waitForTimeout(300);await p.locator('[data-act=upd]').click();await p.waitForTimeout(800);R.push('   manual check toast ('+label+'): '+(await p.locator('.toast').allInnerTexts()).join(' | '));
ok(errs.length===0,label+': no JS errors '+errs.join('|'));await ctx.close()}
console.log(R.join('\n'));await b.close()})();
