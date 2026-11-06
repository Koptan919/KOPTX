/* KOPTAN v9.1 — WhatsApp invoices, barcode scanning, biometric unlock, automatic backups, daily summary,
   reorder suggestions, customers, monthly goal. Loaded after more.js; boot calls afterBoot().
   No new IndexedDB stores: new data is optional fields (p.code, s.cust, s.cph) and settings in S.k. */
'use strict';
Object.assign(KDEF,{biz:'',bizPh:'',goal:0,abk:'w',sumOn:false,sumH:21,sumM:0,lead:7,bio:false,bioId:'',lastSnap:0,snapN:0,bkAsk:0});
for(const k in KDEF)if(!(k in S.k))S.k[k]=KDEF[k];
const plain=v=>{const h=S.k.hide;S.k.hide=false;const r=fmt(v);S.k.hide=h;return r.replace(/[⁦⁩]/g,'')};

/* =================== monthly goal (home) =================== */
function goalHTML(){const g=+S.k.goal||0;if(!(g>0))return'';const n=new Date(),a=new Date(n.getFullYear(),n.getMonth(),1).getTime(),net=AGG(a,sod()+864e5).net,pc=Math.max(0,Math.min(100,net/g*100)),dl=new Date(n.getFullYear(),n.getMonth()+1,0).getDate()-n.getDate()+1,need=Math.max(0,g-net);
return`<section class="card goal ${net>=g?'done':''}"><div class="goal-h"><span>${SV(LU.target)}${L('هدف الشهر')}</span><b>${Math.round(Math.max(0,net/g*100))}%</b></div><div class="gbar"><i style="width:${pc}%"></i></div><small>${net>=g?L('تحقق الهدف ✓ — {a} من {b}',{a:fmt(net),b:fmt(g)}):L('{a} من {b} · تحتاج ~{c} يوميًا خلال {d} يوم',{a:fmt(net),b:fmt(g),c:fmt(need/dl),d:dl})}</small></section>`}

/* =================== daily summary =================== */
function daySum(a){a=a||sod();const b=a+864e5,g=AGG(a,b),ss=S.s.filter(s=>s.date>=a&&s.date<b),inP=t=>S.d.filter(d=>d.type===t).reduce((x,d)=>x+(d.pays||[]).filter(y=>y.date>=a&&y.date<b).reduce((q,y)=>q+toU(d,y.amt),0),0),by={};
ss.forEach(s=>{by[s.name]=(by[s.name]||0)+prof(s)});const top=Object.entries(by).sort((x,y)=>y[1]-x[1])[0],due=S.d.filter(d=>!d.arch&&dRem(d)>0&&d.due&&d.due>=b&&d.due<b+864e5),low=S.p.filter(p=>!p.arch&&p.qty<=p.min).length;
return{a,g,n:ss.length,units:ss.reduce((x,s)=>x+s.qty,0),col:inP('in'),paid:inP('out'),top,due,low}}
function sumText(x){return[L('ملخص يوم {d}',{d:day(x.a)})+' — '+(S.k.biz||'KOPTAN'),L('المبيعات')+': '+plain(x.g.rev)+' ('+plural(x.n,'{n} عملية','{n} عمليات')+')',L('أرباح المبيعات')+': '+plain(x.g.gp),L('المصاريف')+': '+plain(x.g.ex),L('صافي الربح')+': '+plain(x.g.net),L('ديون محصّلة')+': '+plain(x.col)].join('\n')}
ACT.daySum=()=>{const x=daySum();const b=sheet(`<h2 class="sh-h">${SV(LU.cal)} ${L('ملخص اليوم')}</h2><small>${day(x.a)}</small>
<div class="kgrid k4 mt"><div class="kpi s"><small>${L('المبيعات')}</small><b>${fmt(x.g.rev)}</b><em>${plural(x.n,'{n} عملية','{n} عمليات')}</em></div><div class="kpi s"><small>${L('صافي الربح')}</small><b class="${x.g.net<0?'r':'g'}">${fmt(x.g.net)}</b></div><div class="kpi s"><small>${L('أرباح المبيعات')}</small><b>${fmt(x.g.gp)}</b></div><div class="kpi s"><small>${L('المصاريف')}</small><b class="o">${fmt(x.g.ex)}</b></div></div>
${K(L('القطع المباعة'),x.units)}${K(L('ديون محصّلة'),fmt(x.col),'g')}${K(L('ديون مسدّدة'),fmt(x.paid))}${x.top?K(L('الأكثر ربحًا اليوم'),esc(x.top[0])+' · '+fmt(x.top[1]),'g'):''}${K(L('ديون تستحق غدًا'),x.due.length,x.due.length?'o':'')}${K(L('منتجات منخفضة المخزون'),x.low,x.low?'o':'')}
<div class="bar"><button class="btn p" data-sh>${SV(LU.share)}${L('مشاركة الملخص')}</button><button class="btn ghost" data-rep>${SV(LU.chart)}${L('التقارير')}</button></div>`);
b.querySelector('[data-sh]').onclick=()=>shareText(sumText(x));b.querySelector('[data-rep]').onclick=()=>{closeEl(b);openSub('rep')}};
function shareText(t){if(navigator.share)navigator.share({text:t}).catch(()=>{});else if(hasPl('Share'))capCall('Share','share',{text:t}).catch(()=>{});else navigator.clipboard.writeText(t).then(()=>ok(L('تم النسخ ✓')),()=>warn(L('تعذر النسخ')))}
/* Android: repeating local notification at the chosen time; tapping it opens the summary */
async function scheduleSum(){if(!hasPl('LocalNotifications'))return;const LN='LocalNotifications';try{await capCall(LN,'cancel',{notifications:[{id:9001}]})}catch(e){}if(!S.k.sumOn)return;
try{let p=await capCall(LN,'checkPermissions');if(p.display!=='granted')p=await capCall(LN,'requestPermissions');if(p.display!=='granted'){warn(L('اسمح للتطبيق بالإشعارات من إعدادات الهاتف'));return}
await capCall(LN,'schedule',{notifications:[{id:9001,title:L('ملخص اليوم — KOPTAN'),body:L('اضغط لعرض مبيعات وأرباح اليوم'),schedule:{on:{hour:+S.k.sumH,minute:+S.k.sumM||0}},extra:{go:'daySum'}}]})}catch(e){console.warn('notif',e)}}

/* =================== WhatsApp invoice (image + text) =================== */
/* sequential invoice number, assigned once per sale (optional field s.inv) */
async function invNo(s){if(!s.inv){S.k.invN=(S.k.invN||0)+1;s.inv=S.k.invN;await put('s',s);await saveK()}return'INV-'+String(s.inv).padStart(5,'0')}
function invInfo(s){const d=s.did&&S.d.find(x=>x.id===s.did),tot=sRev(s),rem=d?Math.max(0,toU(d,dRem(d))):0,paid=Math.max(0,tot-rem),st=rem<=0.005?['مدفوعة','#1f9d63','#e7f6ee']:paid>0.005?['مدفوعة جزئيًا','#c77712','#fdf1e1']:['غير مدفوعة','#c8334f','#fbe8ec'];
return{d,tot,rem,paid,st,ph:s.cph||(d&&d.phone)||'',pay:(PAYM.find(x=>x[0]===s.pay)||['',''])[1]}}
const timeS=t=>DF('hm',{hour:'2-digit',minute:'2-digit'}).format(t);
function invText(s,ref){const i=invInfo(s),ln='──────────';return[`*${S.k.biz||'KOPTAN'}* — ${L('فاتورة')} ${ref}`,`${L('التاريخ')}: ${day(s.date)}`,s.cust?`${L('الزبون')}: ${s.cust}`:'',ln,`${s.name}`,`${s.qty} × ${plain(s.price)} = ${plain(s.price*s.qty)}`,s.disc?`${L('الخصم')}: −${plain(s.disc)}`:'',`*${L('الإجمالي')}: ${plain(i.tot)}*`,`${L('المدفوع')}: ${plain(i.paid)}`+(i.rem>0?` · ${L('المتبقي')}: ${plain(i.rem)}`:''),`${L('الحالة')}: ${L(i.st[0])}`,ln,S.k.invNote||L('شكرًا لتعاملكم'),S.k.bizPh?S.k.bizPh:''].filter(Boolean).join('\n')}
/* professional white-paper invoice, drawn on canvas (1080 px wide), RTL or LTR with the app language */
async function invImage(s,ref){try{await Promise.all(['400','500','700','800'].map(w=>document.fonts.load(w+' 40px Tajawal','فاتورة Invoice 123')))}catch(e){}
const rtl=LANG!=='en',W=1080,P=70,i=invInfo(s),note=(s.note||'').trim(),INK='#f4f4f6',MU='#a6aab3',LN='rgba(255,255,255,.11)',AC='#e8829f',GR='#42d293',OR='#f3ab55',DK={'#1f9d63':'66,210,147','#c77712':'243,171,85','#c8334f':'255,97,120'};
const rows=[[L('المجموع الفرعي'),plain(s.price*s.qty),INK]];if(s.disc)rows.push([L('الخصم'),'−'+plain(s.disc),INK]);
const H=1080+rows.length*58+(i.rem>0?58:0)+(S.k.bizAddr?34:0);
const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.direction=rtl?'rtl':'ltr';
const X=f=>rtl?W-f:f,AS=rtl?'right':'left',AE=rtl?'left':'right';
const T=(t,px,y,sz,wt,col,al,ltr)=>{x.save();if(ltr)x.direction='ltr';x.font=`${wt||400} ${sz}px Tajawal, 'Noto Sans Arabic', sans-serif`;x.fillStyle=col||INK;x.textAlign=al||AS;x.fillText(String(t),px,y);x.restore()};
const RR=(px,y,w,h,r,fill)=>{x.beginPath();x.roundRect?x.roundRect(px,y,w,h,r):x.rect(px,y,w,h);x.fillStyle=fill;x.fill()};
const fit=(t,max,sz,wt)=>{x.font=`${wt} ${sz}px Tajawal, sans-serif`;let r=String(t);while(x.measureText(r).width>max&&r.length>3)r=r.slice(0,-2);return r===String(t)?r:r+'…'};
const metal=(y0,y1)=>{const m=x.createLinearGradient(0,y0,0,y1);m.addColorStop(0,'#f4f5f7');m.addColorStop(.55,'#c4c8cf');m.addColorStop(1,'#8b9099');return m};
/* dark titanium background, soft burgundy + titanium glows, burgundy edge bars, glass frame */
x.fillStyle='#0b0c0f';x.fillRect(0,0,W,H);let g=x.createRadialGradient(X(W*.9),0,0,X(W*.9),0,640);g.addColorStop(0,'rgba(155,37,70,.32)');g.addColorStop(1,'rgba(155,37,70,0)');x.fillStyle=g;x.fillRect(0,0,W,H);
g=x.createRadialGradient(X(W*.1),H,0,X(W*.1),H,580);g.addColorStop(0,'rgba(207,211,218,.07)');g.addColorStop(1,'rgba(207,211,218,0)');x.fillStyle=g;x.fillRect(0,0,W,H);
g=x.createLinearGradient(0,0,W,0);g.addColorStop(0,'#6e1730');g.addColorStop(.5,'#c9416a');g.addColorStop(1,'#6e1730');x.fillStyle=g;x.fillRect(0,0,W,10);x.fillRect(0,H-8,W,8);
x.beginPath();x.roundRect?x.roundRect(26,34,W-52,H-74,32):x.rect(26,34,W-52,H-74);x.fillStyle='rgba(255,255,255,.025)';x.fill();x.lineWidth=2;x.strokeStyle='rgba(255,255,255,.08)';x.stroke();
/* header: logo + store at the start, title + number + date at the end */
try{const im=await new Promise((a,b)=>{const m=new Image();m.onload=()=>a(m);m.onerror=b;m.src='icon-192.png'});const sz=112,ix=rtl?W-P-sz:P;x.save();x.beginPath();x.roundRect?x.roundRect(ix,62,sz,sz,28):x.rect(ix,62,sz,sz);x.clip();x.drawImage(im,ix,62,sz,sz);x.restore();x.beginPath();x.roundRect?x.roundRect(ix,62,sz,sz,28):x.rect(ix,62,sz,sz);x.lineWidth=2;x.strokeStyle='rgba(255,255,255,.14)';x.stroke()}catch(e){}
const bx=X(P+138);T(fit(S.k.biz||'KOPTAN',400,44,800),bx,112,44,800,metal(74,116));let hy=154;if(S.k.bizPh){T(S.k.bizPh,bx,hy,25,500,MU,AS,true);hy+=34}if(S.k.bizAddr){T(fit(S.k.bizAddr,400,23,500),bx,hy,23,500,MU);hy+=34}
T(L('فاتورة'),X(W-P),118,60,800,metal(66,122),AE);T(ref,X(W-P),162,26,700,INK,AE,true);T(day(s.date)+' · '+timeS(s.date),X(W-P),198,24,500,MU,AE);
x.fillStyle=LN;x.fillRect(P,262,W-2*P,2);
/* billed to + payment status */
T(L('فاتورة إلى'),X(P),318,22,700,MU);T(fit(s.cust||L('زبون نقدي'),460,34,800),X(P),362,34,800,INK);if(i.ph)T(i.ph,X(P),400,24,500,MU,AS,true);
const lab=L(i.st[0]);x.font='800 26px Tajawal, sans-serif';const bw=x.measureText(lab).width+56,bxs=rtl?P:W-P-bw;const sc=DK[i.st[1]]||'166,170,179';RR(bxs,300,bw,54,27,`rgba(${sc},.13)`);x.lineWidth=2;x.strokeStyle=`rgba(${sc},.5)`;x.stroke();T(lab,bxs+bw/2,336,26,800,`rgb(${sc})`,'center');
if(i.pay)T(L('طريقة الدفع')+': '+L(i.pay),X(W-P),400,23,500,MU,AE);
/* items table */
let y=450;RR(P,y,W-2*P,64,14,'rgba(255,255,255,.06)');const cN=X(P+28),cI=X(P+78),cQ=X(W*.6),cU=X(W*.76),cA=X(W-P-24);
T('#',cN,y+42,23,700,MU,'center');T(L('البند'),cI,y+42,23,700,MU);T(L('الكمية'),cQ,y+42,23,700,MU,'center');T(L('سعر الوحدة'),cU,y+42,23,700,MU,'center');T(L('المبلغ'),cA,y+42,23,700,MU,AE);
y+=64;T('1',cN,y+54,26,700,MU,'center');T(fit(s.name,W*.38,30,700),cI,y+54,30,700,INK);T(s.qty,cQ,y+54,30,700,INK,'center');T(plain(s.price),cU,y+54,28,500,INK,'center',true);T(plain(s.price*s.qty),cA,y+54,30,800,INK,AE,true);
y+=88;x.fillStyle=LN;x.fillRect(P,y,W-2*P,2);y+=30;
/* notes at the start, totals box at the end */
if(note){T(L('ملاحظات'),X(P),y+32,22,700,MU);T(fit(note,W*.42,26,500),X(P),y+70,26,500,INK)}
const bxW=470,tx0=rtl?P:W-P-bxW;const L0=rtl?tx0+bxW-20:tx0+20,R0=rtl?tx0+20:tx0+bxW-20;
for(const[l,v,col]of rows){y+=50;T(l,L0,y,26,500,MU,AS);T(v,R0,y,27,700,col,AE,true)}
y+=26;g=x.createLinearGradient(tx0,0,tx0+bxW,0);g.addColorStop(0,'#9b2546');g.addColorStop(1,'#6e1730');RR(tx0,y,bxW,78,18,g);x.lineWidth=2;x.strokeStyle='rgba(232,130,159,.45)';x.stroke();T(L('الإجمالي'),L0,y+51,32,800,'#ffffff',AS);T(plain(i.tot),R0,y+52,36,800,'#ffffff',AE,true);y+=78;
y+=50;T(L('المدفوع'),L0,y,26,500,MU,AS);T(plain(i.paid),R0,y,27,700,GR,AE,true);
if(i.rem>0){y+=58;T(L('المتبقي'),L0,y,26,500,MU,AS);T(plain(i.rem),R0,y,27,800,OR,AE,true)}
/* footer */
const fy=H-150;x.fillStyle=LN;x.fillRect(P,fy-46,W-2*P,2);T(fit(S.k.invNote||L('شكرًا لتعاملكم'),W-2*P,32,800),W/2,fy,32,800,'#cfd3da','center');
T([S.k.bizTax?L('الرقم الضريبي')+': '+S.k.bizTax:'','KOPTAN · '+L('مدير أعمالي')].filter(Boolean).join('   ·   '),W/2,fy+44,22,500,'#767a84','center');
return new Promise(r=>c.toBlob(r,'image/png'))}
async function invoice(sid){const s=S.s.find(x=>x.id===sid);if(!s)return;const done=toastP(L('جارٍ تجهيز الفاتورة…'));let blob,ref;try{ref=await invNo(s);blob=await invImage(s,ref)}catch(e){console.error(e)}done();if(!blob){warn(L('تعذر إنشاء الفاتورة'));return}
const url=URL.createObjectURL(blob),ph=invInfo(s).ph,name=ref+'.png',txt=invText(s,ref);
const b=sheet(`<h2 class="sh-h">${SV(LU.receipt)} ${L('فاتورة')} <small dir="ltr">${ref}</small></h2><img class="invp" src="${url}" alt="">
<div class="bar"><button class="btn p" data-img>${SV(LU.share)}${L('مشاركة صورة الفاتورة')}</button></div>
<div class="bar"><a class="cb wa" target="_blank" rel="noopener" href="${esc(ph&&wn(ph)?waLink(ph,txt):'https://wa.me/?text='+encodeURIComponent(txt))}">${WA_SVG}<span>${ph&&wn(ph)?L('إرسال نصّي للزبون'):L('إرسال نصّي عبر واتساب')}</span></a><button class="btn ghost" data-sv>${SV(LU.dl)}${L('حفظ')}</button></div>`,'tall');
b.querySelector('[data-img]').onclick=async()=>{const f=new File([blob],name,{type:'image/png'});if(!NAT()&&navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],text:txt.split('\n')[0]});return}catch(e){if(e&&e.name==='AbortError')return}}saveFile(name,blob,'image/png')};
b.querySelector('[data-sv]').onclick=()=>saveFile(name,blob,'image/png');new MutationObserver((m,o)=>{if(!b.isConnected){URL.revokeObjectURL(url);o.disconnect()}}).observe(document.body,{childList:true})}
ACT.inv=id=>invoice(id);

/* =================== customers (derived from sales + debts owed to me) =================== */
function customers(){return memo('cus',customers0)}
function customers0(){const m=new Map(),add=(nm,ph)=>{const k=nkey(nm);if(!k)return null;let c=m.get(k);if(!c){c={k,name:String(nm).trim(),ph:'',n:0,rev:0,gp:0,units:0,last:0,ss:[],ds:[],inn:0,out:0,by:{}};m.set(k,c)}if(ph&&!c.ph)c.ph=ph;return c};
[...S.s].sort((a,b)=>b.date-a.date).forEach(s=>{if(!s.cust)return;const c=add(s.cust,s.cph);c.n++;c.rev+=sRev(s);c.gp+=prof(s);c.units+=s.qty;c.last=Math.max(c.last,s.date);c.ss.push(s);c.by[s.name]=(c.by[s.name]||0)+s.qty});
S.d.forEach(d=>{const k=nkey(d.who);if(!m.has(k)&&d.type!=='in')return;const c=add(d.who,d.phone);if(!c)return;c.ds.push(d);if(!d.arch){const r=toU(d,Math.max(0,dRem(d)));d.type==='in'?c.inn+=r:c.out+=r}c.last=Math.max(c.last,d.date||0)});
return[...m.values()].filter(c=>c.n>0||c.ds.some(d=>d.type==='in'))}
let CQ='';
function cusList(){const k=CQ.trim().toLowerCase(),l=customers().filter(c=>!k||(c.name+' '+c.ph).toLowerCase().includes(k)).sort((a,b)=>b.last-a.last);
return l.length?`<div class="list">${l.map(c=>`<button class="row" data-act="cus" data-id="${esc(c.k)}"><span class="av">${esc([...c.name][0]||'?')}</span><span class="t"><b>${esc(c.name)}</b><small>${plural(c.n,'{n} عملية','{n} عمليات')} · ${L('آخر تعامل {d}',{d:day(c.last)})}</small></span><span class="end"><b>${fmt(c.rev)}</b>${c.inn>0?`<small class="o">${L('عليه {n}',{n:fmt(c.inn)})}</small>`:''}</span></button>`).join('')}</div>`:emptyS(LU.users,CQ?L('لا نتائج'):L('لا زبائن بعد'),CQ?'':L('اكتب اسم الزبون عند تسجيل البيع ليظهر هنا مع مشترياته وديونه'))}
SUBS.cus={t:'الزبائن',f(){const l=customers();return`<div class="kgrid"><div class="kpi s"><small>${L('الزبائن')}</small><b>${l.length}</b></div><div class="kpi s"><small>${L('ديون الزبائن لي')}</small><b class="o">${fmt(l.reduce((a,c)=>a+c.inn,0))}</b></div></div><div class="sb"><label class="sbi">${SV(LU.search)}<input class="search" data-cq type="search" placeholder="${esc(L('ابحث باسم الزبون أو رقمه'))}" value="${esc(CQ)}"></label></div><div data-cl>${cusList()}</div>`},
b(el){el.addEventListener('input',e=>{if(e.target.matches('[data-cq]')){CQ=e.target.value;el.querySelector('[data-cl]').innerHTML=cusList()}})}};
ACT.cus=k=>{const c0=customers().find(c=>c.k===k);if(!c0)return;const el=shell(c0.name,E=>{const c=customers().find(x=>x.k===k);if(!c){setTimeout(()=>closeEl(E));return''}const top=Object.entries(c.by).sort((a,b)=>b[1]-a[1]).slice(0,3);
return`<div class="phd"><span class="av big">${esc([...c.name][0]||'?')}</span><div><h1>${esc(c.name)}</h1>${c.ph?`<small dir="ltr">${esc(c.ph)}</small>`:''}<small>${L('آخر تعامل {d}',{d:day(c.last)})}</small></div></div>${c.ph?`<div class="cts">${cBtn('tel',telLink(c.ph),c.ph)}${cBtn('wa',waLink(c.ph,L('مرحبًا {n}',{n:c.name})),c.ph)}</div>`:''}
<div class="kgrid k4"><div class="kpi s"><small>${L('المشتريات')}</small><b>${fmt(c.rev)}</b><em>${plural(c.n,'{n} عملية','{n} عمليات')}</em></div><div class="kpi s"><small>${L('الربح منه')}</small><b class="${c.gp>=0?'g':'r'}">${fmt(c.gp)}</b></div><div class="kpi s"><small>${L('عليه (دين لي)')}</small><b class="${c.inn>0?'o':''}">${fmt(c.inn)}</b></div><div class="kpi s"><small>${L('القطع')}</small><b>${c.units}</b></div></div>
<div class="bar"><button class="btn p" data-ns>${SV(LU.cart)}${L('بيع جديد لهذا الزبون')}</button>${c.ds.length?`<button class="btn" data-pp>${SV(LU.hand)}${L('الديون')}</button>`:''}</div>
${top.length?acc(SV(LU.star)+L('الأكثر شراءً'),top.map(([n,q])=>K(esc(n),'× '+q)).join(''),true):''}
${acc(SV(LU.cart)+L('المشتريات')+` (${c.ss.length})`,c.ss.length?`<div class="list">${c.ss.slice(0,60).map(saleRow).join('')}</div>`:`<div class="sub">${L('لا مبيعات بعد')}</div>`,true)}`});
el.addEventListener('click',e=>{const c=customers().find(x=>x.k===k);if(!c)return;if(e.target.closest('[data-ns]'))salePage(null,{cust:c.name,cph:c.ph});else if(e.target.closest('[data-pp]'))personPage(c.ds[0].who)})};

/* =================== reorder suggestions (sales velocity, last 30 days) =================== */
/* units sold per product in the last 30 days — one pass over sales, cached per data version */
const sold30=()=>memo('sold30',()=>{const from=Date.now()-30*864e5,m=new Map();for(const s of S.s)if(s.date>=from)m.set(s.pid,(m.get(s.pid)||0)+s.qty);return m});
function velocity(p){const now=Date.now(),D=864e5,from=now-30*D,days=Math.max(7,Math.min(30,(now-(p.created||from))/D));return(sold30().get(p.id)||0)/days}
function reorderList(){return memo('reo',reorderList0)}
function reorderList0(){const lead=+S.k.lead||7;return S.p.filter(p=>!p.arch).map(p=>{const v=velocity(p),left=v>0?p.qty/v:Infinity,low=p.qty<=p.min;if(!low&&!(left<lead))return null;const want=Math.max(Math.ceil(v*30),(+p.min||0)*2,1);return{p,v,left,sug:Math.max(1,want-p.qty)}}).filter(Boolean).sort((a,b)=>a.left-b.left||a.p.qty-b.p.qty)}
const leftTxt=r=>r.p.qty<=0?L('نفد'):isFinite(r.left)?L('يكفي ~{d} يوم',{d:Math.max(0,Math.round(r.left))}):L('منخفض');
function orderMsg(sp,items){return[L('مرحبًا {n}، أودّ طلب:',{n:sp?sp.name:''}).replace(' ،',''),...items.map(([p,q])=>`• ${p.name} × ${q}`),'',S.k.biz||'KOPTAN'].join('\n')}
function orderGroup(sp,rows,sel){const w=sp&&(sp.wa||sp.phone);return`<div class="card og" data-g="${sp?sp.id:''}"><div class="pch">${SV(LU.truck)}${esc(sp?sp.name:L('بدون مورد'))}</div>${rows.map(r=>`<div class="orow"><label class="ock"><input type="checkbox" data-pid="${r.p.id}" ${sel?'checked':''}></label><span class="t"><b>${esc(r.p.name)}</b><small>${L('المتوفر {q}',{q:r.p.qty})} · ${r.v>0?L('~{n} أسبوعيًا',{n:num(r.v*7)}):L('لا مبيعات حديثة')} · <span class="${r.p.qty<=0?'r':'o'}">${leftTxt(r)}</span></small></span><input class="inl sm" type="number" inputmode="numeric" min="1" dir="ltr" value="${r.sug}" data-q="${r.p.id}" aria-label="${esc(L('الكمية'))}"></div>`).join('')}
<div class="bar">${w&&wn(w)?`<button class="btn p" data-send="wa">${WA_SVG}${L('إرسال الطلبية واتساب')}</button>`:''}<button class="btn ghost" data-send="copy">${SV(LU.copy)}${L('نسخ الطلبية')}</button></div></div>`}
function orderPick(g){const items=[];g.querySelectorAll('[data-pid]').forEach(c=>{if(!c.checked)return;const p=S.p.find(x=>x.id===c.dataset.pid),q=+g.querySelector(`[data-q="${c.dataset.pid}"]`).value;if(p&&q>0)items.push([p,Math.round(q)])});return items}
function orderSend(g,how){const items=orderPick(g);if(!items.length)return warn(L('اختر منتجًا واحدًا على الأقل'));const sp=spOf(g.dataset.g),t=orderMsg(sp,items);
if(how==='wa'){const u=waLink(sp.wa||sp.phone,t);u&&window.open(u,'_blank','noopener')}else navigator.clipboard.writeText(t).then(()=>ok(L('تم نسخ الطلبية ✓')),()=>shareText(t))}
SUBS.reo={t:'إعادة الطلب',f(){const l=reorderList();if(!l.length)return emptyS(LU.cok,L('المخزون كافٍ'),L('لا منتجات قريبة من النفاد حسب سرعة البيع وحد التنبيه.'));const by=new Map();l.forEach(r=>{const k=r.p.sid&&spOf(r.p.sid)?r.p.sid:'';if(!by.has(k))by.set(k,[]);by.get(k).push(r)});
return`<div class="note">${SV(LU.info)}${L('يُحسب الاقتراح من مبيعات آخر 30 يومًا ليكفي المخزون شهرًا. عدّل الكميات قبل الإرسال.')}</div>${[...by.entries()].map(([k,rows])=>orderGroup(k?spOf(k):null,rows,true)).join('')}`},
b(el){el.addEventListener('click',e=>{const b=e.target.closest('[data-send]');if(b)orderSend(b.closest('.og'),b.dataset.send)})}};
ACT.supOrder=id=>{const sp=spOf(id);if(!sp)return;const sug=new Map(reorderList().map(r=>[r.p.id,r]));const rows=spProds(id).filter(p=>!p.arch).map(p=>sug.get(p.id)||{p,v:velocity(p),left:Infinity,sug:1,none:1}).sort((a,b)=>(a.none||0)-(b.none||0));
if(!rows.length)return warn(L('لا منتجات لهذا المورد'));const b=sheet(`<h2 class="sh-h">${L('طلبية من {n}',{n:sp.name})}</h2>`+orderGroup(sp,rows,false).replace(/data-pid="([^"]+)"/g,(m,pid)=>sug.has(pid)?m+' checked':m),'tall');b.addEventListener('click',e=>{const x=e.target.closest('[data-send]');if(x)orderSend(x.closest('.og'),x.dataset.send)})};
const _nfAll0=nfAll;nfAll=function(){return memo('nf',nfAll1).slice()};function nfAll1(){const R=_nfAll0();if(S.k.nfStock!==false)reorderList().forEach(r=>{if(r.p.qty>r.p.min&&isFinite(r.left))R.push({id:'r:'+r.p.id+':'+Math.ceil(r.left),k:'stock',lv:'o',t:L('قارب على النفاد: {n}',{n:r.p.name}),s:L('{l} — اقتراح طلب {q}',{l:leftTxt(r),q:r.sug}),a:['s','reo']})});return R}

/* =================== barcode scanning (camera via BarcodeDetector, manual entry fallback) =================== */
async function scanCode(cb){const b=sheet(`<h2 class="sh-h">${SV(LU.scan)} ${L('مسح الباركود')}</h2><div class="scanv"><video playsinline muted autoplay></video><i class="scanl"></i></div><p class="sub" data-msg>${L('وجّه الكاميرا نحو الباركود')}</p><div class="fl"><label>${L('أو اكتب الرقم يدويًا')}</label><div class="sb"><input data-man dir="ltr" inputmode="numeric" autocomplete="off"><button class="btn p" data-ok>${L('تم')}</button></div></div>`);
let stream=null,stop=false;const v=b.querySelector('video'),msg=t=>{b.querySelector('[data-msg]').textContent=t},end=()=>{stop=true;stream&&stream.getTracks().forEach(t=>t.stop())};
const done=c=>{c=String(c||'').trim();if(!c)return;end();closeEl(b);buzz(30);cb(c)};
b.querySelector('[data-ok]').onclick=()=>{const raw=b.querySelector('[data-man]').value.trim();done(/^[\s\d\u0660-\u0669\u06F0-\u06F9]+$/.test(raw)?normD(raw):raw)};
b.querySelector('[data-man]').onkeydown=e=>{if(e.key==='Enter')b.querySelector('[data-ok]').click()};
new MutationObserver((m,o)=>{if(!b.isConnected){end();o.disconnect()}}).observe(document.body,{childList:true});
if(!('BarcodeDetector' in window)||!navigator.mediaDevices){b.querySelector('.scanv').hidden=true;msg(L('المسح بالكاميرا غير مدعوم هنا — اكتب الرقم يدويًا'));return}
try{const fm=await BarcodeDetector.getSupportedFormats(),det=new BarcodeDetector(fm&&fm.length?{formats:fm}:undefined);stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});if(stop){end();return}v.srcObject=stream;await v.play();
const loop=async()=>{if(stop)return;try{if(v.readyState>=2){const r=await det.detect(v);if(r&&r[0]&&r[0].rawValue)return done(r[0].rawValue)}}catch(e){}setTimeout(loop,160)};loop()}
catch(e){b.querySelector('.scanv').hidden=true;msg(L('تعذر تشغيل الكاميرا — اسمح بالوصول للكاميرا أو اكتب الرقم يدويًا'))}}
ACT.scanP=()=>scanCode(code=>{const p=S.p.find(x=>x.code===code);if(p)return productDetail(p.id);confirmBox(L('لا يوجد منتج بهذا الباركود'),()=>{addProduct();setTimeout(()=>{const pg=$$('.pg').pop(),i=pg&&pg.querySelector('[name=code]');if(i){i.value=code;i.dispatchEvent(new Event('input',{bubbles:true}))}},120)},{danger:false,icon:LU.scan,yes:L('منتج جديد بهذا الباركود'),sub:code})});

/* =================== biometric unlock (Android: NativeBiometric plugin · browser: WebAuthn platform authenticator) =================== */
let BIO=null;
const rnd=n=>crypto.getRandomValues(new Uint8Array(n)),b64=a=>btoa(String.fromCharCode(...new Uint8Array(a))),ub64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function bioAvail(){if(BIO!==null)return BIO;try{if(hasPl('NativeBiometric')){const r=await capCall('NativeBiometric','isAvailable');BIO=r&&r.isAvailable?'nat':''}else if(window.PublicKeyCredential&&PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable&&await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())BIO='web';else BIO=''}catch(e){BIO=''}return BIO}
function bioRow(){if(BIO===null){bioAvail().then(()=>refreshPages());return''}if(!BIO)return'';return`<div class="srow">${SIc(LU.finger,'r')}<span class="t"><b>${L('الدخول بالبصمة')}</b><small>${S.k.pin?L('بصمة الإصبع أو الوجه بدل كتابة الرمز — الرمز يبقى احتياطيًا'):L('فعّل رمز PIN أولًا')}</small></span><button class="sw ${S.k.bio?'on':''}" role="switch" aria-checked="${!!S.k.bio}" aria-label="${esc(L('الدخول بالبصمة'))}" data-act="bioSet"></button></div>`}
async function bioVerify(){const a=await bioAvail();try{if(a==='nat'){await capCall('NativeBiometric','verifyIdentity',{reason:L('افتح KOPTAN'),title:'KOPTAN',subtitle:L('استخدم البصمة لفتح التطبيق'),negativeButtonText:L('استخدم الرمز'),maxAttempts:3});return true}
if(a==='web'&&S.k.bioId){const r=await navigator.credentials.get({publicKey:{challenge:rnd(32),allowCredentials:[{type:'public-key',id:ub64(S.k.bioId)}],userVerification:'required',timeout:60000}});const ad=new Uint8Array(r.response.authenticatorData);return!!(ad[32]&4)}}catch(e){if(!cancelled(e)&&!(e&&e.name==='NotAllowedError'))console.warn('bio',e)}return false}
ACT.bioSet=async()=>{if(S.k.bio){S.k.bio=false;S.k.bioId='';await saveK();ok(L('تم إيقاف الدخول بالبصمة'));refresh();return}if(!S.k.pin){warn(L('فعّل رمز PIN أولًا — البصمة تُستخدم معه'));return}const a=await bioAvail();
try{if(a==='nat')await capCall('NativeBiometric','verifyIdentity',{reason:L('تفعيل الدخول بالبصمة'),title:'KOPTAN',subtitle:L('ضع إصبعك للتأكيد'),negativeButtonText:L('إلغاء')});
else if(a==='web'){const c=await navigator.credentials.create({publicKey:{challenge:rnd(32),rp:{name:'KOPTAN'},user:{id:rnd(16),name:'koptan',displayName:'KOPTAN'},pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required',residentKey:'discouraged'},attestation:'none',timeout:60000}});S.k.bioId=b64(c.rawId)}else return warn(L('البصمة غير متاحة على هذا الجهاز'))}
catch(e){if(!cancelled(e)&&!(e&&e.name==='NotAllowedError'))warn(L('تعذر تفعيل البصمة'));return}
S.k.bio=true;await saveK();ok(L('تم تفعيل الدخول بالبصمة ✓'));refresh()};

/* =================== automatic backups =================== */
/* 3 rotating in-app snapshots (data only, no photos) stored as records "snap0..2" in the existing "k" store,
   plus a reminder to save a full backup outside the phone. */
let SNAPS=null;
const abkMs=()=>({d:864e5,w:7*864e5})[S.k.abk||'w']||0;
async function makeSnap(){if(memOnly)return;const k={...S.k};['pin','bio','bioId','snapN','lastSnap','bkAsk','nt','nr','nd'].forEach(x=>delete k[x]);const o={id:'snap'+((S.k.snapN||0)%3),at:Date.now(),counts:{p:S.p.length,s:S.s.length,e:S.e.length,d:S.d.length,sp:S.sp.length},data:{sp:S.sp,p:S.p,s:S.s,e:S.e,l:S.l,t:S.t,d:S.d,k}};
await put('k',JSON.parse(JSON.stringify(o)));S.k.snapN=(S.k.snapN||0)+1;S.k.lastSnap=o.at;await saveK();SNAPS=null}
async function getSnaps(){if(memOnly)return[];const r=[];for(const i of[0,1,2]){try{const x=await idbGet('k','snap'+i);if(x&&x.data)r.push(x)}catch(e){}}return r.sort((a,b)=>b.at-a.at)}
function snapsHTML(){if(!SNAPS){getSnaps().then(x=>{SNAPS=x;refreshPages()});return''}return`<h2 class="h2">${L('نسخ تلقائية داخل التطبيق')}</h2><p class="sub">${L('تُحفظ تلقائيًا ({f}) آخر 3 نسخ للبيانات بدون الصور، للرجوع عند الخطأ. لحماية بياناتك من ضياع الهاتف احفظ نسخة كاملة خارجه.',{f:L({off:'متوقف',d:'يوميًا',w:'أسبوعيًا'}[S.k.abk||'w'])})}</p>
${SNAPS.length?`<div class="list">${SNAPS.map(x=>`<div class="row"><span class="th tn">${SV(LU.clock)}</span><span class="t"><b>${dtm(x.at)}</b><small>${L('{p} منتج · {s} بيع · {d} دين',{p:x.counts.p,s:x.counts.s,d:x.counts.d})}</small></span><button class="btn sm" data-act="snapRes" data-id="${x.id}">${L('استعادة')}</button></div>`).join('')}</div>`:`<p class="sub">${L('لا توجد نسخ تلقائية بعد')}</p>`}<button class="btn ghost wide" data-act="snapNow">${SV(LU.db)}${L('إنشاء نسخة داخلية الآن')}</button>`}
ACT.snapNow=async()=>{await makeSnap();ok(L('تم إنشاء نسخة داخلية ✓'));refreshPages()};
ACT.snapRes=async id=>{const x=(SNAPS||await getSnaps()).find(y=>y.id===id);if(!x)return;confirmBox(L('استعادة النسخة الداخلية من {d}؟',{d:dtm(x.at)}),()=>doRestore({...x.data,imgs:[]}),{yes:L('نعم، استبدل'),sub:L('ستُستبدل البيانات الحالية ({p} منتج، {s} بيع) بمحتوى النسخة ({a} منتج، {b} بيع). الصور المحفوظة تبقى.',{p:S.p.length,s:S.s.length,a:x.counts.p,b:x.counts.s})})};
async function autoBackup(){const ms=abkMs();if(!ms||memOnly)return;if(S.p.length+S.s.length+S.e.length+S.d.length===0)return;if(Date.now()-(S.k.lastSnap||0)>=ms)await makeSnap();
if(Date.now()-(S.k.lastBk||0)>=ms&&S.k.bkAsk!==sod()){S.k.bkAsk=sod();saveKSoon();setTimeout(()=>confirmBox(L('حان وقت النسخة الاحتياطية'),()=>exportJ(),{danger:false,icon:LU.db,yes:L('حفظ نسخة كاملة الآن'),no:L('لاحقًا'),sub:L('آخر نسخة: {d}. احفظها في Google Drive أو أرسلها لنفسك على واتساب حتى لا تضيع بياناتك مع الهاتف.',{d:S.k.lastBk?day(S.k.lastBk):L('لم تؤخذ بعد')})}),1800)}}

/* =================== settings fields + boot =================== */
document.addEventListener('change',async e=>{const t=e.target.closest&&e.target.closest('[data-setk]');if(!t)return;const k=t.dataset.setk;let v=t.value.trim();
if(k==='sumT'){const[h,m]=v.split(':').map(Number);if(isFinite(h)){S.k.sumH=h;S.k.sumM=m||0;await saveK();scheduleSum();ok(L('تم الحفظ ✓'))}return}
if(t.hasAttribute('data-num')){v=+normD(v)||0;if(v<0){warn(L('أدخل رقمًا صحيحًا'));return}if(k==='lead')v=Math.min(60,Math.max(1,Math.round(v)||7))}
S.k[k]=v;await saveK();ok(L('تم الحفظ ✓'));refresh()});
document.addEventListener('click',async e=>{const b=e.target.closest&&e.target.closest('[data-abk]');if(b){S.k.abk=b.dataset.abk;await saveK();refresh();return}if(e.target.closest&&e.target.closest('[data-sw="sumOn"]'))setTimeout(scheduleSum,80)});
function afterBoot(){bioAvail();autoBackup().catch(e=>console.warn(e));scheduleSum();
if(hasPl('LocalNotifications')){try{Capacitor.Plugins.LocalNotifications.addListener('localNotificationActionPerformed',a=>{const x=a&&a.notification&&a.notification.extra;if(x&&x.go==='daySum')setTimeout(()=>ACT.daySum(),400)})}catch(e){}}}

/* =================== settings: edit sheets, vibration test, invoice preview =================== */
const EDIT={
store:{t:'بيانات المتجر',f:[['biz','اسم المتجر','text','KOPTAN'],['bizPh','هاتف المتجر','tel','+961…'],['bizAddr','عنوان المتجر','text',''],['bizTax','الرقم الضريبي / السجل التجاري (اختياري)','text','']]},
invNote:{t:'نص أسفل الفاتورة',f:[['invNote','نص أسفل الفاتورة','text','شكرًا لتعاملكم']],h:'مثال: شكرًا لتعاملكم — الاستبدال خلال 7 أيام'},
invN:{t:'رقم الفاتورة التالي',f:[['invN','رقم الفاتورة التالي','number','']],h:'تُرقّم الفواتير تلقائيًا بالتسلسل',get:{invN:()=>(S.k.invN||0)+1},chk:{invN:v=>v>=1&&Number.isInteger(v)},set:{invN:v=>S.k.invN=v-1}},
rate:{t:'سعر الصرف',f:[['rate','ليرة لكل 1 دولار','number','90000']],h:'المبيعات السابقة لا تتغير',chk:{rate:v=>v>0}},
cc:{t:'رمز الدولة للهاتف',f:[['cc','رمز الدولة (بدون +)','tel','961']],h:'يُستخدم لأرقام واتساب المحلية',set:{cc:v=>S.k.cc=normD(v).replace(/^0+/,'')}},
goal:{t:'هدف الربح الشهري ($)',f:[['goal','هدف الربح الشهري ($)','number','0']],h:'صافي الربح المستهدف — 0 لإخفاء الهدف',chk:{goal:v=>v>=0}},
lead:{t:'تنبيه إعادة الطلب قبل',f:[['lead','عدد الأيام','number','7']],h:'عدد الأيام قبل نفاد المخزون المتوقع',chk:{lead:v=>v>=1&&v<=60},set:{lead:v=>S.k.lead=Math.round(v)}},
sumT:{t:'وقت الملخص',f:[['sumT','وقت الملخص','time','']],get:{sumT:()=>String(S.k.sumH??21).padStart(2,'0')+':'+String(S.k.sumM??0).padStart(2,'0')},set:{sumT:v=>{const[h,m]=String(v).split(':').map(Number);if(isFinite(h)){S.k.sumH=h;S.k.sumM=m||0}}},after:()=>scheduleSum()}};
/* number typed with Latin or Arabic digits and . or ٫ as decimal separator → Number (NaN if empty/invalid) */
const numIn=s=>{s=String(s).trim().replace(/[\u0660-\u0669]/g,d=>d.charCodeAt(0)-1632).replace(/[\u06F0-\u06F9]/g,d=>d.charCodeAt(0)-1776).replace(/[٫,]/g,'.').replace(/\s/g,'');return/^\d*\.?\d+$/.test(s)?+s:NaN};
function editK(key){const E=EDIT[key];if(!E)return;const val=k=>E.get&&E.get[k]?E.get[k]():(S.k[k]??'');
const b=sheet(`<h2 class="sh-h">${L(E.t)}</h2>${E.h?`<p class="sub">${L(E.h)}</p>`:''}${E.f.map(([k,l,t,ph])=>`<div class="fl"><label>${L(l)}</label><input data-ek="${k}" type="${t==='number'?'text':t}" ${t==='number'?'inputmode="decimal"':''} ${['number','tel','time'].includes(t)?'dir="ltr"':''} value="${esc(val(k))}" placeholder="${esc(ph&&/[\u0600-\u06FF]/.test(ph)?L(ph):ph)}"></div>`).join('')}<div class="bar"><button class="btn p" data-ok>${SV(LU.check)}${L('حفظ')}</button><button class="btn ghost" data-no>${L('إلغاء')}</button></div>`);
b.querySelector('[data-no]').onclick=()=>closeEl(b);const first=b.querySelector('[data-ek]');setTimeout(()=>first&&first.focus(),250);
const save=async()=>{for(const[k,,t]of E.f){const el=b.querySelector(`[data-ek="${k}"]`);let v=el.value.trim();if(t==='number')v=numIn(v);
if(t==='number'&&(isNaN(v)||(E.chk&&E.chk[k]&&!E.chk[k](v)))){invalid(el,L('أدخل رقمًا صحيحًا'));return}if(E.set&&E.set[k])E.set[k](v);else S.k[k]=v}
await saveK();E.after&&E.after();closeEl(b);ok(L('تم الحفظ ✓'));refresh()};
b.querySelector('[data-ok]').onclick=save;b.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('[data-ek]'))save()})}
document.addEventListener('click',async e=>{const ed=e.target.closest&&e.target.closest('[data-edit]');if(ed){e.preventDefault();editK(ed.dataset.edit);return}
const lv=e.target.closest&&e.target.closest('[data-viblv]');if(lv){S.k.vibLv=lv.dataset.viblv;await saveK();hap('press',true);refreshPages()}});
ACT.vibTest=()=>{const i=hapInfo();if(i==='native'||i==='web'){hap('tap',true);setTimeout(()=>hap('press',true),260);setTimeout(()=>hap('success',true),620);toast(L('هل شعرت بالاهتزاز؟ إن لم تشعر به، ارفع الشدة أو فعّل اهتزاز اللمس في إعدادات الهاتف'))}
else warn({oldapk:L('نسخة التطبيق المثبتة لا تدعم الاهتزاز — ثبّت ملف APK الإصدار 9.2.0 أو أحدث'),ios:L('الآيفون لا يسمح بالاهتزاز للتطبيقات المضافة من Safari'),none:L('هذا الجهاز لا يدعم الاهتزاز')}[i])};
ACT.invPrev=()=>{const s=[...S.s].sort((a,b)=>b.date-a.date)[0];if(!s)return warn(L('سجّل عملية بيع أولًا لمعاينة الفاتورة'));invoice(s.id)};
