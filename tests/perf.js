/* Performance benchmark on a large dataset (400 products, 6000 sales, 300 debts, 400 expenses).
   Prints median JS time (ms) of common operations. Run: node tests/perf.js (server on :8123 via run.sh). */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await ctx.newPage();await p.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());
await p.goto('http://localhost:8123/new/index.html');await p.waitForSelector('body.ready');
await p.evaluate(async()=>{for(const n of STORES){for(const o of [...S[n]])await del(n,o.id);S[n]=[]}const D=864e5,now=Date.now();S.k.abk='off';S.k.anim=true;
for(let i=0;i<8;i++){const x={id:'sp'+i,name:'Supplier '+i,phone:'+9617000000'+i,wa:'',link:'',created:now};S.sp.push(x)}
for(let i=0;i<400;i++)S.p.push({id:'p'+i,name:'Product '+i,cat:'Cat '+(i%12),cost:2+i%9,ship:0,extra:0,price:5+i%17,qty:i%23,min:3,sold:0,fav:i%13===0,arch:i%40===0,created:now-200*D,imgs:[],img:'',sid:'sp'+(i%8),supplier:'Supplier '+(i%8)});
for(let i=0;i<6000;i++){const pr=S.p[i%400];S.s.push({id:'s'+i,pid:pr.id,name:pr.name,qty:1+i%3,price:pr.price,disc:0,uc:pr.cost,rate:90000,date:now-(i%365)*D,paid:pr.price,pay:'cash',...(i%7===0?{cust:'Customer '+(i%90)}:{})})}
for(let i=0;i<300;i++)S.d.push({id:'d'+i,who:'Person '+(i%60),phone:'',type:i%3?'in':'out',amt:50+i,cur:'USD',rate:90000,date:now-(i%100)*D,due:now+((i%20)-10)*D,reason:'',notes:'',pid:'',sid:'',img:'',arch:false,created:now,pays:i%2?[{id:'y'+i,amt:10,date:now-D,note:''}]:[]});
for(let i=0;i<400;i++)S.e.push({id:'e'+i,amt:5+i%40,cur:'USD',orig:5,rate:90000,cat:'ads',pay:'cash',note:'Exp '+i,notes:'',date:now-(i%365)*D,pid:'',sid:'',img:'',rec:'',next:0})});
const med=a=>a.sort((x,y)=>x-y)[a.length>>1];
const time=async(label,fn,n=7)=>{const t=[];for(let i=0;i<n;i++)t.push(await p.evaluate(fn));console.log(label.padEnd(34),String(Math.round(med(t)*10)/10).padStart(8),'ms')};
await time('render home',()=>{tab='home';const t=performance.now();render(false);return performance.now()-t});
await time('render products',()=>{tab='box';const t=performance.now();render(false);return performance.now()-t});
await time('render sales',()=>{tab='cart';const t=performance.now();render(false);return performance.now()-t});
await time('render debts',()=>{tab='debt';const t=performance.now();render(false);return performance.now()-t});
await time('render more',()=>{tab='more';const t=performance.now();render(false);return performance.now()-t});
await time('notifications (nfCur)',()=>{const t=performance.now();nfCur();return performance.now()-t});
await time('reorderList',()=>{const t=performance.now();reorderList();return performance.now()-t});
await time('customers',()=>{const t=performance.now();customers();return performance.now()-t});
await time('refresh() with a page open',()=>{tab='home';render(false);productDetail('p5');const t=performance.now();refresh();const d=performance.now()-t;document.querySelectorAll('.pg').forEach(x=>x.remove());return d});
await time('search keystroke (products)',()=>{tab='box';render(false);const i=document.querySelector('#sq');const t=performance.now();i.value='Product 1';i.dispatchEvent(new Event('input'));return performance.now()-t});
/* frame timing while scrolling the products list */
await p.evaluate(()=>{tab='box';q='';render(false)});const fr=await p.evaluate(()=>new Promise(res=>{const f=[];let last=performance.now(),y=0;const st=n=>{f.push(n-last);last=n;y+=40;scrollTo(0,y);if(f.length<120)requestAnimationFrame(st);else res(f)};requestAnimationFrame(st)}));
const s=fr.slice(5).sort((a,b)=>a-b);console.log('scroll frame p50 / p95'.padEnd(34),Math.round(s[s.length>>1]*10)/10,'/',Math.round(s[Math.floor(s.length*.95)]*10)/10,'ms');
await b.close()})();
