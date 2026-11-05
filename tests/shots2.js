const {chromium}=require('playwright');const seed=require('./seed.js');const SH=process.argv[2];
(async()=>{const b=await chromium.launch();const out=[];
for(const [w,h,lang] of [[320,640,'ar'],[412,915,'ar'],[360,780,'en']]){const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(/fonts\./,r=>r.abort());
await seed(p);await p.goto('http://localhost:8123/new/index.html');await p.waitForSelector('body.ready');const ev=(f,a)=>p.evaluate(f,a);
if(lang==='en'){await ev(()=>setLang('en'))}await ev(()=>{S.k.anim=false;applyPrefs()});await p.waitForTimeout(300);
const ovf=async n=>{const o=await ev(()=>{const W=innerWidth,bad=[];document.querySelectorAll('body *').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&(r.right>W+1||r.left<-1)&&!e.closest('.chips,.gal,#ph,.ph,.ch-cols,.cmpw,.vh,.toast')&&getComputedStyle(e).position!=='fixed')bad.push(e.tagName+'.'+e.className+' '+Math.round(r.left)+'..'+Math.round(r.right))});return{sw:document.documentElement.scrollWidth,W,bad:bad.slice(0,4)}});if(o.sw>o.W||o.bad.length)out.push(`${w}${lang} ${n}: scrollW=${o.sw} W=${o.W} ${o.bad.join(' ; ')}`)};
const S_=async n=>{await p.waitForTimeout(250);await ovf(n);if(w!==412||['home','pform','sale'].includes(n))await p.screenshot({path:`${SH}/${w}${lang}-${n}.png`})};
const clr=()=>ev(()=>document.querySelectorAll('.pg,.sheet-bg').forEach(x=>x.remove()));
await S_('home');for(const t of ['box','cart','debt','more']){await p.click(`#nav [data-t=${t}]`);await S_(t)}
await ev(()=>addProduct());await S_('pform');await clr();
await ev(()=>salePage());await S_('sale');await clr();
await ev(()=>addExpense());await S_('exp');await clr();
await ev(()=>debtPage());await S_('debtform');await clr();
await ev(()=>productDetail(S.p[0].id));await p.evaluate(()=>document.querySelectorAll('.pg details').forEach(d=>d.open=true));await S_('detail');await clr();
for(const s of ['rep','sup','nf','data','set','cal','tsk','exp']){await ev(s=>openSub(s),s);await S_('sub-'+s);await clr()}
await ev(()=>supPage(S.sp[0].id));await S_('supP');await clr();await ev(()=>personPage(S.d[0].who));await S_('person');await clr();
await ev(()=>debtD(S.d[0].id));await S_('debtD');await clr();await ev(()=>gsearch());await p.fill('[data-gq]','ش');await S_('search');await clr();
await ev(()=>{S.k.pin='x';lock()});await S_('lock');
out.push(`${w}${lang} errors: ${errs.length?errs.join('|'):'none'}`);await ctx.close()}
console.log(out.join('\n'));await b.close()})();
