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
function sumText(x){return[L('ملخص يوم {d}',{d:day(x.a)})+' — '+(S.k.biz||'KOPT X'),L('المبيعات')+': '+plain(x.g.rev)+' ('+plural(x.n,'{n} عملية','{n} عمليات')+')',L('أرباح المبيعات')+': '+plain(x.g.gp),L('المصاريف')+': '+plain(x.g.ex),L('صافي الربح')+': '+plain(x.g.net),L('ديون محصّلة')+': '+plain(x.col)].join('\n')}
ACT.daySum=()=>{const x=daySum();const b=sheet(`<h2 class="sh-h">${SV(LU.cal)} ${L('ملخص اليوم')}</h2><small>${day(x.a)}</small>
<div class="kgrid k4 mt"><div class="kpi s"><small>${L('المبيعات')}</small><b>${fmt(x.g.rev)}</b><em>${plural(x.n,'{n} عملية','{n} عمليات')}</em></div><div class="kpi s"><small>${L('صافي الربح')}</small><b class="${x.g.net<0?'r':'g'}">${fmt(x.g.net)}</b></div><div class="kpi s"><small>${L('أرباح المبيعات')}</small><b>${fmt(x.g.gp)}</b></div><div class="kpi s"><small>${L('المصاريف')}</small><b class="o">${fmt(x.g.ex)}</b></div></div>
${K(L('القطع المباعة'),x.units)}${K(L('ديون محصّلة'),fmt(x.col),'g')}${K(L('ديون مسدّدة'),fmt(x.paid))}${x.top?K(L('الأكثر ربحًا اليوم'),esc(x.top[0])+' · '+fmt(x.top[1]),'g'):''}${K(L('ديون تستحق غدًا'),x.due.length,x.due.length?'o':'')}${K(L('منتجات منخفضة المخزون'),x.low,x.low?'o':'')}
<div class="bar"><button class="btn p" data-sh>${SV(LU.share)}${L('مشاركة الملخص')}</button><button class="btn ghost" data-rep>${SV(LU.chart)}${L('التقارير')}</button></div><div class="bar"><button class="btn" data-cb>${SV(LU.card)}${L('صندوق اليوم')}</button></div>`);
b.querySelector('[data-sh]').onclick=()=>shareText(sumText(x));b.querySelector('[data-rep]').onclick=()=>{closeEl(b);openSub('rep')};b.querySelector('[data-cb]').onclick=()=>{closeEl(b);setTimeout(ACT.cashBox,160)}};
function shareText(t){if(navigator.share)navigator.share({text:t}).catch(()=>{});else if(hasPl('Share'))capCall('Share','share',{text:t}).catch(()=>{});else navigator.clipboard.writeText(t).then(()=>ok(L('تم النسخ ✓')),()=>warn(L('تعذر النسخ')))}
/* Android: repeating local notification at the chosen time; tapping it opens the summary */
async function scheduleSum(){if(!hasPl('LocalNotifications'))return;const LN='LocalNotifications';try{await capCall(LN,'cancel',{notifications:[{id:9001}]})}catch(e){}if(!S.k.sumOn)return;
try{let p=await capCall(LN,'checkPermissions');if(p.display!=='granted')p=await capCall(LN,'requestPermissions');if(p.display!=='granted'){warn(L('اسمح للتطبيق بالإشعارات من إعدادات الهاتف'));return}
await capCall(LN,'schedule',{notifications:[{id:9001,title:L('ملخص اليوم — KOPT X'),body:L('اضغط لعرض مبيعات وأرباح اليوم'),schedule:{on:{hour:+S.k.sumH,minute:+S.k.sumM||0}},extra:{go:'daySum'}}]})}catch(e){console.warn('notif',e)}}

/* =================== WhatsApp invoice (image + text) =================== */
/* sequential invoice number, assigned once per sale (optional field s.inv) */
async function invNo(s){if(!s.inv){S.k.invN=(S.k.invN||0)+1;for(const x of ordL(s)){x.inv=S.k.invN;await put('s',x)}await saveK()}return'INV-'+String(s.inv).padStart(5,'0')}
function invInfo(s){const IL=ordL(s),dd=IL.map(x=>x.did).find(Boolean),d=dd&&S.d.find(x=>x.id===dd),tot=IL.reduce((a,x)=>a+sRev(x),0),rem=d?Math.max(0,toU(d,dRem(d))):0,paid=Math.max(0,tot-rem),st=rem<=0.005?['مدفوعة','#1f9d63','#e7f6ee']:paid>0.005?['مدفوعة جزئيًا','#c77712','#fdf1e1']:['غير مدفوعة','#c8334f','#fbe8ec'];
return{d,tot,rem,paid,st,ph:s.cph||(d&&d.phone)||'',pay:(PAYM.find(x=>x[0]===s.pay)||['',''])[1]}}
const timeS=t=>DF('hm',{hour:'2-digit',minute:'2-digit'}).format(t);
function invText(s,ref){const i=invInfo(s),ln='──────────';return[`*${S.k.biz||'KOPT X'}* — ${L('فاتورة')} ${ref}`,`${L('التاريخ')}: ${day(s.date)}`,s.cust?`${L('الزبون')}: ${s.cust}`:'',ln,...ordL(s).map(x=>`${x.name} — ${x.qty} × ${plain(x.price)} = ${plain(x.price*x.qty)}`),ordL(s).reduce((a,x)=>a+(+x.disc||0),0)>0.005?`${L('الخصم')}: −${plain(ordL(s).reduce((a,x)=>a+(+x.disc||0),0))}`:'',`*${L('الإجمالي')}: ${plain(i.tot)}*`,`${L('المدفوع')}: ${plain(i.paid)}`+(i.rem>0?` · ${L('المتبقي')}: ${plain(i.rem)}`:''),`${L('الحالة')}: ${L(i.st[0])}`,ln,S.k.invNote||L('شكرًا لتعاملكم'),S.k.bizPh?S.k.bizPh:''].filter(Boolean).join('\n')}
/* professional white-paper invoice, drawn on canvas (1080 px wide), RTL or LTR with the app language */
async function invImage(s,ref){try{await Promise.all(['400','500','700','800'].map(w=>document.fonts.load(w+' 40px Tajawal','فاتورة Invoice 123')))}catch(e){}
const rtl=LANG!=='en',W=1080,P=70,i=invInfo(s),IT=ordL(s),DS=IT.reduce((a,x)=>a+(+x.disc||0),0),note=(s.note||'').trim(),INK='#f4f4f6',MU='#a6aab3',LN='rgba(255,255,255,.11)',AC='#e8829f',GR='#42d293',OR='#f3ab55',DK={'#1f9d63':'66,210,147','#c77712':'243,171,85','#c8334f':'255,97,120'};
const rows=[[L('المجموع الفرعي'),plain(IT.reduce((a,x)=>a+x.price*x.qty,0)),INK]];if(DS>0.005)rows.push([L('الخصم'),'−'+plain(DS),INK]);
const H=1080+(IT.length-1)*76+rows.length*58+(i.rem>0?58:0)+(S.k.bizAddr?34:0);
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
const bx=X(P+138);T(fit(S.k.biz||'KOPT X',400,44,800),bx,112,44,800,metal(74,116));let hy=154;if(S.k.bizPh){T(S.k.bizPh,bx,hy,25,500,MU,AS,true);hy+=34}if(S.k.bizAddr){T(fit(S.k.bizAddr,400,23,500),bx,hy,23,500,MU);hy+=34}
T(L('فاتورة'),X(W-P),118,60,800,metal(66,122),AE);T(ref,X(W-P),162,26,700,INK,AE,true);T(day(s.date)+' · '+timeS(s.date),X(W-P),198,24,500,MU,AE);
x.fillStyle=LN;x.fillRect(P,262,W-2*P,2);
/* billed to + payment status */
T(L('فاتورة إلى'),X(P),318,22,700,MU);T(fit(s.cust||L('زبون نقدي'),460,34,800),X(P),362,34,800,INK);if(i.ph)T(i.ph,X(P),400,24,500,MU,AS,true);
const lab=L(i.st[0]);x.font='800 26px Tajawal, sans-serif';const bw=x.measureText(lab).width+56,bxs=rtl?P:W-P-bw;const sc=DK[i.st[1]]||'166,170,179';RR(bxs,300,bw,54,27,`rgba(${sc},.13)`);x.lineWidth=2;x.strokeStyle=`rgba(${sc},.5)`;x.stroke();T(lab,bxs+bw/2,336,26,800,`rgb(${sc})`,'center');
if(i.pay)T(L('طريقة الدفع')+': '+L(i.pay),X(W-P),400,23,500,MU,AE);
/* items table */
let y=450;RR(P,y,W-2*P,64,14,'rgba(255,255,255,.06)');const cN=X(P+28),cI=X(P+78),cQ=X(W*.6),cU=X(W*.76),cA=X(W-P-24);
T('#',cN,y+42,23,700,MU,'center');T(L('البند'),cI,y+42,23,700,MU);T(L('الكمية'),cQ,y+42,23,700,MU,'center');T(L('سعر الوحدة'),cU,y+42,23,700,MU,'center');T(L('المبلغ'),cA,y+42,23,700,MU,AE);
y+=64;IT.forEach((it,k)=>{if(k){y+=76;x.fillStyle='rgba(255,255,255,.06)';x.fillRect(P+20,y+8,W-2*P-40,2)}T(String(k+1),cN,y+54,26,700,MU,'center');T(fit(it.name,W*.38,30,700),cI,y+54,30,700,INK);T(it.qty,cQ,y+54,30,700,INK,'center');T(plain(it.price),cU,y+54,28,500,INK,'center',true);T(plain(it.price*it.qty),cA,y+54,30,800,INK,AE,true)});
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
T([S.k.bizTax?L('الرقم الضريبي')+': '+S.k.bizTax:'','KOPT X · '+L('مدير أعمالي')].filter(Boolean).join('   ·   '),W/2,fy+44,22,500,'#767a84','center');
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
<div class="bar"><button class="btn p" data-ns>${SV(LU.cart)}${L('بيع جديد لهذا الزبون')}</button>${c.ds.length?`<button class="btn" data-pp>${SV(LU.hand)}${L('الديون')}</button>`:''}</div>${cusWa(c)}
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
function orderMsg(sp,items){return[L('مرحبًا {n}، أودّ طلب:',{n:sp?sp.name:''}).replace(' ،',''),...items.map(([p,q])=>`• ${p.name} × ${q}`),'',S.k.biz||'KOPT X'].join('\n')}
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
const _nfAll0=nfAll;nfAll=function(){return memo('nf',nfAll1).slice()};function nfAll1(){const R=_nfAll0();if(S.k.nfStock!==false)reorderList().forEach(r=>{if(r.p.qty>r.p.min&&isFinite(r.left))R.push({id:'r:'+r.p.id+':'+Math.ceil(r.left),k:'stock',lv:'o',t:L('قارب على النفاد: {n}',{n:r.p.name}),s:L('{l} — اقتراح طلب {q}',{l:leftTxt(r),q:r.sug}),a:['s','reo']})});
if(S.k.nfUpd!==false)(S.k.updN||[]).forEach(v=>{const c=CHANGES.find(x=>x.v===v);if(c)R.push({id:'u:'+v,k:'upd',lv:'g',t:L('ما الجديد في الإصدار {v}',{v}),s:c.n.map(x=>L(x)).join(' · '),a:['s','upd']})});return R}

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
let BIO=null,BIOT=null;
/* which biometric the device uses: 'face' | 'finger' | 'any' (both, or unknown). The OS picks the method; we only name it right. */
const BIOK=()=>BIOT||S.k.bioT||'any',bioName=()=>L({face:'الدخول بالوجه',finger:'الدخول بالبصمة'}[BIOK()]||'الدخول بالبصمة أو الوجه'),bioIcon=()=>BIOK()==='face'?LU.face:LU.finger;
function webBioKind(){const u=navigator.userAgent||'';if(/iPhone|iPod/.test(u))return Math.max(screen.width,screen.height)>=812?'face':'finger';if(/iPad/.test(u)||(/Macintosh/.test(u)&&navigator.maxTouchPoints>1))return'any';if(/Macintosh/.test(u))return'finger';return'any'}
function bioKind(k){BIOT=k;if(k&&S.k.bioT!==k){S.k.bioT=k;saveKSoon()}}
const rnd=n=>crypto.getRandomValues(new Uint8Array(n)),b64=a=>btoa(String.fromCharCode(...new Uint8Array(a))),ub64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function bioAvail(){if(BIO!==null)return BIO;try{if(hasPl('NativeBiometric')){const r=await capCall('NativeBiometric','isAvailable');BIO=r&&r.isAvailable?'nat':'';if(BIO)bioKind({1:'finger',3:'finger',2:'face',4:'face'}[r.biometryType]||'any')}else if(window.PublicKeyCredential&&PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable&&await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()){BIO='web';bioKind(webBioKind())}else BIO=''}catch(e){BIO=''}return BIO}
function bioRow(){if(BIO===null){bioAvail().then(()=>refreshPages());return''}if(!BIO)return'';const k=BIOK();return`<div class="srow">${SIc(bioIcon(),'r')}<span class="t"><b>${bioName()}</b><small>${S.k.pin?L(k==='face'?'افتح التطبيق بوجهك بدل كتابة الرمز — الرمز يبقى احتياطيًا':k==='finger'?'افتح التطبيق ببصمة إصبعك بدل كتابة الرمز — الرمز يبقى احتياطيًا':'بصمة الإصبع أو الوجه بدل كتابة الرمز — الرمز يبقى احتياطيًا'):L('فعّل رمز PIN أولًا')}</small></span><button class="sw ${S.k.bio?'on':''}" role="switch" aria-checked="${!!S.k.bio}" aria-label="${esc(bioName())}" data-act="bioSet"></button></div>`}
async function bioVerify(){const a=await bioAvail();try{if(a==='nat'){await capCall('NativeBiometric','verifyIdentity',{reason:L('افتح KOPT X'),title:'KOPT X',subtitle:L({face:'انظر إلى الهاتف لفتح التطبيق',finger:'استخدم البصمة لفتح التطبيق'}[BIOK()]||'استخدم البصمة أو الوجه لفتح التطبيق'),negativeButtonText:L('استخدم الرمز'),maxAttempts:3});return true}
if(a==='web'&&S.k.bioId){const r=await navigator.credentials.get({publicKey:{challenge:rnd(32),allowCredentials:[{type:'public-key',id:ub64(S.k.bioId)}],userVerification:'required',timeout:60000}});const ad=new Uint8Array(r.response.authenticatorData);return!!(ad[32]&4)}}catch(e){if(!cancelled(e)&&!(e&&e.name==='NotAllowedError'))console.warn('bio',e)}return false}
ACT.bioSet=async()=>{if(S.k.bio){S.k.bio=false;S.k.bioId='';await saveK();ok(L('تم إيقاف {n}',{n:bioName()}));refresh();return}if(!S.k.pin){warn(L('فعّل رمز PIN أولًا — البصمة تُستخدم معه'));return}const a=await bioAvail();
try{if(a==='nat')await capCall('NativeBiometric','verifyIdentity',{reason:bioName(),title:'KOPT X',subtitle:L({face:'انظر إلى الهاتف للتأكيد',finger:'ضع إصبعك للتأكيد'}[BIOK()]||'استخدم البصمة أو الوجه للتأكيد'),negativeButtonText:L('إلغاء')});
else if(a==='web'){const c=await navigator.credentials.create({publicKey:{challenge:rnd(32),rp:{name:'KOPT X'},user:{id:rnd(16),name:'koptan',displayName:'KOPT X'},pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required',residentKey:'discouraged'},attestation:'none',timeout:60000}});S.k.bioId=b64(c.rawId)}else return warn(L('البصمة أو الوجه غير متاح على هذا الجهاز'))}
catch(e){if(!cancelled(e)&&!(e&&e.name==='NotAllowedError'))warn(L('تعذر تفعيل {n}',{n:bioName()}));return}
S.k.bio=true;await saveK();ok(L('تم تفعيل {n} ✓',{n:bioName()}));refresh()};

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
/* =================== what's new: one notification per installed update =================== */
/* newest first; add an entry with every release (Arabic source, EN in i18n.js) */
const CHANGES=[
{v:'9.8.0',d:'2026-11-07',n:['قسم مستقل للنسخ الاحتياطي: اختر Google Drive أو واتساب أو الهاتف أو داخل التطبيق','الاستعادة والنسخ التلقائي في نفس المكان']},
{v:'9.7.0',d:'2026-11-07',n:['بيع عدة منتجات في فاتورة واحدة (سلة)','حفظ نسخة خارج الهاتف إلى Google Drive أو واتساب، مع تذكير في الرئيسية','كشف حساب للزبون وتذكير بالدين عبر واتساب','صندوق اليوم: النقد المتوقع في الدرج ومقارنته بالفعلي','تقارير جديدة: الأرباح حسب التصنيف، أفضل الزبائن، أيام الأسبوع','أنواع للمنتج: مقاسات وألوان بمخزون مستقل','إعدادات مرتبة أوضح']},
{v:'9.6.0',d:'2026-11-06',n:['الاسم والأيقونة لطريقة الفتح حسب هاتفك: الوجه أو البصمة']},
{v:'9.5.0',d:'2026-11-06',n:['هوية جديدة: الاسم KOPT X وأيقونة جديدة']},
{v:'9.4.0',d:'2026-11-06',n:['إشعار «ما الجديد» يظهر بعد كل تحديث','زر الرجوع في الهاتف يعود إلى الشاشة السابقة بدل الخروج','اضغط رجوع مرتين في الرئيسية للخروج من التطبيق']},
{v:'9.3.1',d:'2026-11-06',n:['الفاتورة بتصميم داكن احترافي','المبالغ والخصم تظهر بالاتجاه الصحيح في الفاتورة']},
{v:'9.3.0',d:'2026-11-06',n:['فاتورة احترافية بترقيم تسلسلي وحالة الدفع','اهتزاز أوضح مع اختيار القوة وزر تجربة','تصميم جديد للإعدادات']},
{v:'9.2.0',d:'2026-11-06',n:['التطبيق أسرع وأخف بكثير','اهتزاز خفيف عند اللمس']}];
/* runs once per version: queues the notes of every version installed since the last run (only the current one on a first run) */
function updSeen(){const lv=S.k.lastVer;if(lv===APP_VER)return;const nv=CHANGES.filter(c=>!newer(c.v,APP_VER)&&(lv?newer(c.v,lv):c.v===APP_VER)).map(c=>c.v);
S.k.updN=[...new Set([...nv,...(S.k.updN||[])])].filter(v=>CHANGES.some(c=>c.v===v)).sort((a,b)=>newer(a,b)?-1:1).slice(0,3);S.k.lastVer=APP_VER;
S.k.nt=S.k.nt||{};const now=Date.now();nv.slice().sort((a,b)=>newer(a,b)?-1:1).forEach((v,i)=>S.k.nt['u:'+v]=now-i*1000);/* newest version first in the center */
saveK().then(()=>{nfBadge();refreshPages()}).catch(()=>{});if(lv&&newer(APP_VER,lv)&&S.k.nfUpd!==false&&nv.length)setTimeout(()=>toast(L('تم التحديث إلى الإصدار {v}',{v:APP_VER}),'ok',{label:L('ما الجديد'),icon:LU.spark,fn:()=>openSub('upd'),ms:8000}),900)}
SUBS.upd={t:'ما الجديد',f(){return CHANGES.filter(c=>!newer(c.v,APP_VER)).map(c=>`<section class="sec chg"><h3>${SV(LU.spark)}${L('الإصدار {v}',{v:c.v})}${c.v===APP_VER?`<span class="pill">${L('الحالي')}</span>`:''}<small>${day(new Date(c.d+'T12:00:00').getTime())}</small></h3><ul class="chl">${c.n.map(x=>`<li>${esc(L(x))}</li>`).join('')}</ul></section>`).join('')}};
ACT.whatsNew=()=>openSub('upd');

function afterBoot(){bioAvail();autoBackup().catch(e=>console.warn(e));scheduleSum();updSeen();
if(hasPl('App')){try{Capacitor.Plugins.App.addListener('backButton',()=>{if(backTop())return;backRoot(true)})}catch(e){console.warn(e)}}
if(hasPl('LocalNotifications')){try{Capacitor.Plugins.LocalNotifications.addListener('localNotificationActionPerformed',a=>{const x=a&&a.notification&&a.notification.extra;if(x&&x.go==='daySum')setTimeout(()=>ACT.daySum(),400)})}catch(e){}}}

/* =================== settings: edit sheets, vibration test, invoice preview =================== */
const EDIT={
store:{t:'بيانات المتجر',f:[['biz','اسم المتجر','text','KOPT X'],['bizPh','هاتف المتجر','tel','+961…'],['bizAddr','عنوان المتجر','text',''],['bizTax','الرقم الضريبي / السجل التجاري (اختياري)','text','']]},
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

/* =================== v9.7: cart, off-device backup, customer statement, cash box, more reports, product variants =================== */
/* sales made together share an optional order id `o`; a single sale has none */
const ordL=s=>s&&s.o?S.s.filter(x=>x.o===s.o):[s];

/* ---------- cart: several products in one sale → one invoice and at most one debt ---------- */
function cartPage(pre){pre=pre||{};const av=()=>S.p.filter(p=>!p.arch&&p.qty>0);if(!av().length){warn(L('لا يوجد مخزون متاح — أضف منتجًا أو كمية أولًا'));return}
const CL=(pre.lines||[]).filter(l=>S.p.some(p=>p.id===l.pid&&p.qty>0)),st={pay:'cash'};let auto=true;
const opts=()=>`<option value="">${esc(L('＋ اختر منتجًا لإضافته'))}</option>`+av().map(p=>`<option value="${p.id}">${esc(p.name)} — ${L('متوفر {n}',{n:p.qty})}</option>`).join('');
const P=page(L('بيع عدة منتجات'),`<section class="sec"><h3>${SV(LU.cart)}${L('المنتجات')}</h3><div id="cl"></div><div class="fl"><div class="sb"><select data-add class="selw">${opts()}</select><button type="button" class="ib gl" data-scan aria-label="${esc(L('مسح باركود'))}">${SV(LU.scan)}</button></div></div></section>
<section class="sec"><h3>${SV(LU.dollar)}${L('الدفع')}</h3><div class="fl"><label>${L('المبلغ المقبوض ($)')}</label><input name="rec" type="number" inputmode="decimal" step="any" min="0" dir="ltr"></div><div class="chp"><button type="button" data-rc="full">${L('المبلغ كاملًا')}</button><button type="button" data-rc="half">${L('النصف')}</button><button type="button" data-rc="zero">${L('بالدين (لم يُقبض)')}</button></div><label class="lb">${L('طريقة الدفع')}</label><div class="chp">${PAYM.map(([k,l])=>`<button type="button" data-g="pay" data-v="${k}" class="${k==='cash'?'on':''}">${L(l)}</button>`).join('')}</div>
<div class="g2"><div class="fl"><label>${L('اسم الزبون')} <span id="wq" class="sub"></span></label><input name="who" autocomplete="off" list="whol2" value="${esc(pre.who||'')}"><datalist id="whol2">${[...new Set([...S.d.map(d=>d.who),...S.s.map(x=>x.cust).filter(Boolean)])].map(w=>`<option value="${esc(w)}">`).join('')}</datalist></div><div class="fl"><label>${L('هاتف الزبون')}</label><input name="cph" type="tel" dir="ltr" value="${esc(pre.cph||'')}"></div></div>
<div id="cu" hidden><div class="note">${SV(LU.info)}${L('سيُسجَّل المتبقي كدين لك على الزبون، دون احتساب الإيراد أو الربح مرتين.')}</div><div class="fl"><label>${L('تاريخ الاستحقاق')}</label><input name="due" type="date" dir="ltr"></div></div></section>
<details class="ac sec"><summary>${L('خصم وملاحظة وتاريخ (اختياري)')}</summary><div class="ab"><div class="g2"><div class="fl"><label>${L('خصم على الطلب ($)')}</label><input name="disc" type="number" inputmode="decimal" step="any" min="0" dir="ltr" value="0"></div><div class="fl"><label>${L('تاريخ العملية')}</label><input name="date" type="date" dir="ltr" value="${toDs(Date.now())}"></div></div><div class="fl"><label>${L('ملاحظة')}</label><input name="note"></div></div></details><div class="calc" id="sm"></div>`,
`<div class="ft-i"><small>${L('الإجمالي · الربح')}</small><b id="fp">—</b></div>`,async P=>{const c=calc();if(!CL.length)return warn(L('أضف منتجًا واحدًا على الأقل')),false;
for(const l of CL){const p=S.p.find(x=>x.id===l.pid);if(!p)return warn(L('المنتج محذوف')),false;if(!(l.qty>=1)||l.qty!==Math.floor(l.qty))return warn(L('الكمية غير صحيحة')+' — '+p.name),false;if(l.qty>p.qty)return warn(L('الكمية أكبر من المخزون ({n})',{n:p.qty})+' — '+p.name),false;if(!(l.price>=0))return warn(L('القيم لا يمكن أن تكون سالبة')),false}
if(c.disc<0)return warn(L('القيم لا يمكن أن تكون سالبة')),false;if(c.total<0)return warn(L('الخصم أكبر من قيمة البيع')),false;if(c.rec<0||c.rec>c.total+1e-9)return invalid(P.q('rec'),L('المبلغ المقبوض يجب ألا يتجاوز الإجمالي ({n})',{n:num(c.total)})),false;
const who=P.q('who').value.trim(),cph=P.q('cph').value.trim();if(c.unpaid>0.005&&!who)return invalid(P.q('who'),L('أدخل اسم الزبون لتسجيل المتبقي كدين')),false;
const date=toTs(P.q('date').value)||Date.now(),note=P.q('note').value.trim(),o=CL.length>1?'o'+uid():'',ss=[];let left=num(c.rec),dl=num(c.disc);
CL.forEach((l,i)=>{const p=S.p.find(x=>x.id===l.pid),g=l.price*l.qty,dd=i===CL.length-1?dl:num(c.sub>0?c.disc*g/c.sub:0);dl=num(dl-dd);const tot=num(g-dd),pd=num(Math.min(tot,left));left=num(left-pd);
const s={id:uid()+i,pid:p.id,name:p.name,qty:l.qty,price:l.price,disc:dd,uc:uc(p),rate:S.k.rate,date,note,paid:pd,pay:st.pay};if(o)s.o=o;if(who)s.cust=who;if(cph)s.cph=cph;ss.push(s);p.qty-=l.qty;p.sold=(p.sold||0)+l.qty});
if(c.unpaid>0.005){const un=ss.filter(s=>s.paid<sRev(s)-0.005),d={id:uid(),pays:[],arch:false,cur:'USD',rate:S.k.rate,created:Date.now(),who,phone:cph,type:'in',amt:num(c.unpaid),date,due:toTs(P.q('due').value),reason:ss.length>1?L('بيع {n} منتجات',{n:ss.length}):L('بيع {n} × {q}',{n:ss[0].name,q:ss[0].qty}),notes:'',pid:ss.length>1?'':ss[0].pid,sid:(un[0]||ss[0]).id,img:''};if(o)d.oid=o;(un.length?un:[ss[0]]).forEach(s=>{s.did=d.id});S.d.push(d);await put('d',d)}
for(const s of ss){S.s.push(s);await put('s',s)}for(const l of CL)await put('p',S.p.find(x=>x.id===l.pid));
log('بيع: '+ss.map(s=>s.name+' × '+s.qty).join('، '));toast(L('تم تسجيل البيع ✓ — ربح {n}',{n:fmt(ss.reduce((a,s)=>a+prof(s),0))}),'ok',{label:L('فاتورة'),icon:LU.receipt,ms:9000,fn:()=>invoice(ss[0].id)});refresh()});
const n=x=>+P.q(x).value||0,cl=P.d.querySelector('#cl');
function rows(){cl.innerHTML=CL.length?CL.map((l,i)=>{const p=S.p.find(x=>x.id===l.pid);return`<div class="crow"><div class="t"><b>${esc(p.name)}</b><small>${L('متوفر {n}',{n:p.qty})} · <span data-lt="${i}"></span></small></div><button type="button" class="ib cx" data-cx="${i}" aria-label="${esc(L('إزالة'))}">${SV(LU.x)}</button>
<div class="stp"><button type="button" data-cs="-1" data-i="${i}" aria-label="${esc(L('أقل'))}">${SV(LU.minus)}</button><input class="inl" data-cq="${i}" type="number" inputmode="numeric" min="1" step="1" value="${l.qty}" dir="ltr" aria-label="${esc(L('الكمية'))}"><button type="button" data-cs="1" data-i="${i}" aria-label="${esc(L('أكثر'))}">${SV(LU.plus)}</button></div><label class="cpr"><small>${L('سعر القطعة ($)')}</small><input class="inl" data-cp="${i}" type="number" inputmode="decimal" step="any" min="0" dir="ltr" value="${l.price}"></label></div>`}).join(''):`<div class="sub cmt">${L('اختر المنتجات من القائمة أو امسح الباركود — يمكنك إضافة أي عدد')}</div>`}
function calc(){const sub=CL.reduce((a,l)=>a+l.price*l.qty,0),disc=n('disc'),total=num(sub-disc),cost=CL.reduce((a,l)=>{const p=S.p.find(x=>x.id===l.pid);return a+(p?uc(p):0)*l.qty},0),profit=total-cost;if(auto)P.q('rec').value=Math.max(0,total);const rec=n('rec'),unpaid=num(total-rec);
cl.querySelectorAll('[data-lt]').forEach(e=>{const l=CL[+e.dataset.lt],p=l&&S.p.find(x=>x.id===l.pid);if(l){e.innerHTML=fmt(l.price*l.qty);e.style.color=p&&l.qty>p.qty?'var(--rd)':''}});
P.d.querySelector('#cu').hidden=unpaid<=0.005;P.d.querySelector('#wq').textContent=unpaid>0.005?'('+L('مطلوب للدين')+')':'('+L('اختياري')+')';
P.d.querySelector('#sm').innerHTML=K(L('عدد المنتجات'),CL.length+' · '+plural(CL.reduce((a,l)=>a+l.qty,0),'{n} قطعة','{n} قطع'))+K(L('إجمالي البيع'),fmt(total))+K(L('ربح العملية'),fmt(profit),profit>=0?'g':'r')+K(L('غير مقبوض (دين)'),fmt(Math.max(0,unpaid)),unpaid>0.005?'o':'');
P.d.querySelector('#fp').innerHTML=`${fmt(total)} · <span class="${profit>=0?'g':'r'}">${fmt(profit)}</span>`;return{sub,disc,total,profit,rec,unpaid}}
const addP=pid=>{const p=S.p.find(x=>x.id===pid);if(!p)return;const l=CL.find(x=>x.pid===pid);if(l){if(l.qty<p.qty)l.qty++;else warn(L('الكمية أكبر من المخزون ({n})',{n:p.qty}))}else CL.push({pid,qty:1,price:+p.price||0});auto=true;rows();calc();buzz(6)};
P.d.addEventListener('change',e=>{if(e.target.matches('[data-add]')){const v=e.target.value;e.target.value='';addP(v)}});
P.d.addEventListener('input',e=>{const t=e.target;if(t.name==='rec')auto=false;if(t.dataset.cq!=null)CL[+t.dataset.cq].qty=+t.value||0;if(t.dataset.cp!=null)CL[+t.dataset.cp].price=+t.value||0;if(t.dataset.cq!=null||t.dataset.cp!=null)auto=true;calc()});
P.d.addEventListener('click',e=>{const g=s=>e.target.closest(s);let b;if(g('[data-scan]'))return scanCode(code=>{const x=av().find(y=>y.code&&y.code===code);if(!x)return warn(L('لا يوجد منتج متوفر بهذا الباركود'));addP(x.id);ok(x.name)});
if(b=g('[data-cs]')){const l=CL[+b.dataset.i],p=S.p.find(x=>x.id===l.pid);l.qty=Math.max(1,Math.min(p.qty,(l.qty||1)+(+b.dataset.cs)));auto=true;rows();calc();buzz(6)}
else if(b=g('[data-cx]')){CL.splice(+b.dataset.cx,1);auto=true;rows();calc()}
else if(b=g('[data-rc]')){const c=calc();auto=false;P.q('rec').value=b.dataset.rc==='full'?c.total:b.dataset.rc==='half'?num(c.total/2):0;calc()}});
grp(P,st);rows();calc()}
ACT.cart=()=>cartPage();

/* returning one product of an order lowers the shared debt by that product's unpaid part */
const _retSale0=returnSale;returnSale=function(s){if(!s.o)return _retSale0(s);const d=s.did&&S.d.find(x=>x.id===s.did),p=S.p.find(x=>x.id===s.pid),un=Math.max(0,sRev(s)-(+s.paid||0));
confirmBox(L('إلغاء هذا المنتج من الطلب وإرجاع الكمية للمخزون؟'),async()=>{if(p){p.qty+=s.qty;p.sold=Math.max(0,(p.sold||0)-s.qty);await put('p',p)}
const rest=S.s.filter(x=>x.o===s.o&&x.id!==s.id);if(d){d.amt=num(Math.max(0,(+d.amt||0)-un));if(d.amt<=0.005&&!d.pays.length){S.d=S.d.filter(x=>x.id!==d.id);await del('d',d.id);for(const x of rest)if(x.did===d.id){delete x.did;await put('s',x)}}else{if(d.sid===s.id)d.sid=((rest.find(x=>x.did===d.id)||rest[0])||{}).id||'';await put('d',d)}}
S.s=S.s.filter(x=>x.id!==s.id);await del('s',s.id);log('مرتجع: '+s.name+' × '+s.qty);ok(L('تم الإلغاء وإرجاع الكمية ✓'));refresh()},{sub:(p?'':L('المنتج محذوف، لذلك لن تُرجع الكمية لأي مخزون.')+' ')+(d&&un>0.005?L('سيُخصم {n} من دين الطلب.',{n:fmt(un)}):'')})};

/* ---------- off-device backup: the backup file goes to the share sheet (Drive, WhatsApp, Files) when the browser can share files ---------- */
const _saveFile0=saveFile;saveFile=async function(name,data,type){if(!NAT()&&/^koptan-backup-/.test(name)&&navigator.canShare&&navigator.share){try{const f=new File([data instanceof Blob?data:new Blob([data],{type})],name,{type});if(navigator.canShare({files:[f]})){await navigator.share({files:[f],title:name});return true}}catch(e){if(e&&e.name==='AbortError')return false}}return _saveFile0(name,data,type)};
const bkDue=()=>S.p.length+S.s.length+S.d.length+S.e.length>0&&Date.now()-(S.k.lastBk||0)>7*864e5;
const _vHome0=vHome;vHome=function(){const h=_vHome0();if(!bkDue())return h;const c=`<button class="alert o" data-act="bkOpen">${SV(LU.share)}<span>${L('احفظ نسخة من بياناتك خارج الهاتف')}<small>${S.k.lastBk?L('آخر نسخة: {d}',{d:day(S.k.lastBk)}):L('لم تؤخذ أي نسخة بعد')} · ${L('Google Drive أو واتساب')}</small></span>${SV(FWD(),'ch')}</button>`;const i=h.indexOf('<button class="alert mu" data-act="daySum"');return i<0?h:h.slice(0,i)+c+h.slice(i)};

/* ---------- customer statement and debt reminder over WhatsApp ---------- */
function cusStmt(c){const ls=c.ss.slice(0,25).map(s=>`• ${day(s.date)} — ${s.name} × ${s.qty} = ${plain(sRev(s))}`),od=c.ds.filter(d=>d.type==='in'&&!d.arch&&dRem(d)>0.005);
return[`*${S.k.biz||'KOPT X'}* — ${L('كشف حساب')}`,`${L('الزبون')}: ${c.name}`,`${L('التاريخ')}: ${day(Date.now())}`,'──────────',...(ls.length?[L('المشتريات')+':',...ls]:[]),c.ss.length>25?L('…و{n} عمليات أخرى',{n:c.ss.length-25}):'','──────────',`${L('إجمالي المشتريات')}: ${plain(c.rev)}`,...(od.length?[L('الديون المفتوحة')+':',...od.map(d=>`• ${d.reason||day(d.date)}: ${plain(toU(d,dRem(d)))}`)]:[]),`*${L('المتبقي عليك')}: ${plain(c.inn)}*`,S.k.bizPh||''].filter(Boolean).join('\n')}
const cusRem=c=>L('مرحبًا {n}، نذكّرك بلطف بأن المتبقي عليك {a}. شكرًا لتعاملك معنا 🌹',{n:c.name,a:plain(c.inn)})+'\n'+(S.k.biz||'KOPT X');
function cusWa(c){const wl=t=>c.ph&&wn(c.ph)?waLink(c.ph,t):'https://wa.me/?text='+encodeURIComponent(t);return`<div class="bar"><a class="btn" target="_blank" rel="noopener" data-stm href="${esc(wl(cusStmt(c)))}">${SV(LU.list)}${L('كشف حساب')}</a>${c.inn>0.005?`<a class="btn ghost" target="_blank" rel="noopener" data-rmd href="${esc(wl(cusRem(c)))}">${SV(LU.bell)}${L('تذكير بالدين')}</a>`:''}</div>`}

/* ---------- today's cash box: what came in and went out, by payment method ---------- */
function cashBox(a){a=a||sod();const b=a+864e5,inD=x=>x>=a&&x<b,by={};PAYM.forEach(([k])=>by[k]=0);
S.s.filter(s=>inD(s.date)).forEach(s=>{const k=by[s.pay]!=null?s.pay:'cash';by[k]+=s.paid!=null?+s.paid||0:sRev(s)});
const dp=t=>S.d.filter(d=>d.type===t).reduce((x,d)=>x+(d.pays||[]).filter(y=>inD(y.date)).reduce((q,y)=>q+toU(d,y.amt),0),0),col=dp('in'),pout=dp('out');
let exC=0,exO=0;S.e.filter(e=>inD(e.date)).forEach(e=>{if(!e.pay||e.pay==='cash')exC+=+e.amt||0;else exO+=+e.amt||0});
return{a,by,col,pout,exC,exO,cash:num(by.cash+col-pout-exC)}}
function cashText(x){return[L('صندوق يوم {d}',{d:day(x.a)})+' — '+(S.k.biz||'KOPT X'),...PAYM.map(([k,l])=>L('مبيعات {m}',{m:L(l)})+': '+plain(x.by[k])),L('دفعات ديون مقبوضة')+': '+plain(x.col),L('دفعات ديون مدفوعة')+': '+plain(x.pout),L('مصاريف نقدية')+': '+plain(x.exC),L('المتوقع في الدرج')+': '+plain(x.cash)].join('\n')}
ACT.cashBox=()=>{const x=cashBox();const b=sheet(`<h2 class="sh-h">${SV(LU.card)} ${L('صندوق اليوم')}</h2><small>${day(x.a)}</small>
<div class="kgrid mt"><div class="kpi s"><small>${L('المتوقع في الدرج (نقدًا)')}</small><b class="${x.cash<0?'r':'g'}">${fmt(x.cash)}</b></div><div class="kpi s"><small>${L('مقبوض بغير النقد')}</small><b>${fmt(PAYM.filter(([k])=>k!=='cash').reduce((a,[k])=>a+x.by[k],0))}</b></div></div>
${PAYM.map(([k,l])=>K(L('مبيعات {m}',{m:L(l)}),fmt(x.by[k]),k==='cash'?'g':'')).join('')}${K(L('دفعات ديون مقبوضة'),'+ '+fmt(x.col),'g')}${K(L('دفعات ديون مدفوعة'),'− '+fmt(x.pout),'o')}${K(L('مصاريف نقدية'),'− '+fmt(x.exC),'o')}${x.exO?K(L('مصاريف بطرق أخرى'),fmt(x.exO)):''}
<div class="fl mt"><label>${L('كم يوجد في الدرج فعليًا؟ ($)')}</label><input data-cnt type="number" inputmode="decimal" step="any" min="0" dir="ltr" placeholder="0"></div><div class="calc" data-df></div>
<div class="sub">${L('تُحسب دفعات الديون نقدًا. المبالغ بالدولار.')}</div><div class="bar"><button class="btn p" data-sh>${SV(LU.share)}${L('مشاركة')}</button></div>`);
const df=b.querySelector('[data-df]');b.querySelector('[data-cnt]').oninput=e=>{const v=e.target.value;if(v===''){df.innerHTML='';return}const d=num((+v||0)-x.cash);df.innerHTML=K(Math.abs(d)<0.005?L('الصندوق مطابق ✓'):d>0?L('زيادة في الدرج'):L('نقص في الدرج'),fmt(Math.abs(d)),Math.abs(d)<0.005?'g':d>0?'g':'r')};
b.querySelector('[data-sh]').onclick=()=>shareText(cashText(x))};

/* ---------- more reports: profit by category, best customers, weekdays ---------- */
function repMore(){const ss=S.s.filter(inR);if(!ss.length)return'';const cat={},cu={},wd=[0,0,0,0,0,0,0],wn7=[0,0,0,0,0,0,0];
ss.forEach(s=>{const p=S.p.find(x=>x.id===s.pid),c=(p&&p.cat)||'';const o=cat[c]||(cat[c]={r:0,p:0});o.r+=sRev(s);o.p+=prof(s);if(s.cust){const k=nkey(s.cust),x=cu[k]||(cu[k]={n:s.cust.trim(),r:0,c:0});x.r+=sRev(s);x.c++}const w=new Date(s.date).getDay();wd[w]+=sRev(s);wn7[w]++});
const ce=Object.entries(cat).sort((a,b)=>b[1].p-a[1].p),cm=Math.max(1e-9,...ce.map(([,o])=>Math.abs(o.p))),tc=Object.values(cu).sort((a,b)=>b.r-a.r).slice(0,5),wm=Math.max(1e-9,...wd),best=wd.indexOf(Math.max(...wd));
const DN=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'],bar=(l,v,m,c,t)=>`<div class="mrow"><span>${l}</span><div class="mb"><i style="width:${Math.max(3,Math.abs(v)/m*100)}%"></i></div><b class="${c}">${t}</b></div>`;
return acc(SV(LU.grid)+L('الأرباح حسب التصنيف'),ce.map(([c,o])=>bar(esc(c||L('بدون تصنيف')),o.p,cm,o.p>=0?'g':'r',fmt(o.p))).join(''))
+(tc.length?acc(SV(LU.users)+L('أفضل الزبائن'),tc.map((x,i)=>K(`${i+1}. ${esc(x.n)} <small>(${plural(x.c,'{n} عملية','{n} عمليات')})</small>`,fmt(x.r))).join('')):'')
+acc(SV(LU.cal)+L('المبيعات حسب أيام الأسبوع'),[1,2,3,4,5,6,0].map(i=>bar(L(DN[i])+(i===best&&wd[i]>0?' ★':''),wd[i],wm,i===best?'g':'',fmt(wd[i]))).join('')+`<div class="sub">${L('أقوى يوم: {d}',{d:L(DN[best])})}</div>`)}
const _repF0=SUBS.rep.f;SUBS.rep.f=function(d){return _repF0.call(this,d)+repMore()};

/* ---------- product variants (size / colour): each variant is its own product, grouped by `vg` ---------- */
function varPage(id){const p=S.p.find(x=>x.id===id);if(!p)return;const base=p.vb||p.name;
const b=sheet(`<h2 class="sh-h">${SV(LU.plus)} ${L('إضافة نوع')}</h2><small>${esc(base)}</small><div class="fl mt"><label>${L('النوع (مثل: مقاس M أو لون أحمر)')}</label><input data-vl maxlength="40" autocomplete="off"></div><div class="g2"><div class="fl"><label>${L('الكمية')}</label><input data-vq type="number" inputmode="numeric" min="0" step="1" value="0" dir="ltr"></div><div class="fl"><label>${L('سعر البيع ($)')}</label><input data-vp type="number" inputmode="decimal" step="any" min="0" dir="ltr" value="${+p.price||0}"></div></div><div class="note">${SV(LU.info)}${L('يُنشأ منتج مستقل بنفس التكلفة والمورد والصور، وله مخزونه الخاص.')}</div><div class="bar"><button class="btn p" data-vs>${SV(LU.chk)}${L('حفظ النوع')}</button></div>`);
const f=s=>b.querySelector(s);f('[data-vs]').onclick=async()=>{const lab=f('[data-vl]').value.trim(),qty=+f('[data-vq]').value||0,price=+f('[data-vp]').value;if(!lab)return invalid(f('[data-vl]'),L('اكتب اسم النوع'));if(qty<0||qty!==Math.floor(qty))return invalid(f('[data-vq]'),L('الكمية غير صحيحة'));if(!(price>=0))return invalid(f('[data-vp]'),L('السعر غير صحيح'));
const nm=base+' — '+lab;if(S.p.some(x=>!x.arch&&x.name.trim().toLowerCase()===nm.toLowerCase()))return invalid(f('[data-vl]'),L('هذا النوع موجود'));
if(!p.vg){p.vg=p.id;p.vb=base;p.updated=Date.now();await put('p',p)}const now=Date.now(),v={...p,id:uid(),name:nm,price,qty,sold:0,fav:false,arch:false,created:now,updated:now,imgs:[...(p.imgs||[])],notes:'',vg:p.vg,vb:base,vl:lab};delete v.code;
S.p.push(v);await put('p',v);log('إضافة منتج: '+nm);closeEl(b);ok(L('تمت إضافة النوع ✓'));refresh()}}
ACT.addVar=id=>varPage(id);
function varHTML(p){if(!p.vg)return'';const sib=S.p.filter(x=>x.vg===p.vg&&!x.arch);return`<section class="sec"><h3>${SV(LU.grid)}${L('الأنواع')} (${sib.length})</h3><div class="chp">${sib.map(x=>`<button type="button" class="${x.id===p.id?'on':''}" data-act="pd" data-id="${x.id}">${esc(x.vl||L('الأساسي'))} · ${x.qty}</button>`).join('')}<button type="button" data-act="addVar" data-id="${p.id}">＋ ${L('نوع')}</button></div></section>`}
const _pmore0=ACT.pmore;ACT.pmore=id=>{_pmore0(id);const o=$$('.sheet .opts').pop();if(!o)return;const b=document.createElement('button');b.className='opt';b.dataset.var='1';b.innerHTML=SV(LU.plus)+esc(L('إضافة نوع (مقاس / لون)'));b.onclick=e=>{e.stopPropagation();closeEl(o.closest('.sheet-bg'));setTimeout(()=>varPage(id),160)};o.insertBefore(b,o.children[1]||null)};

/* =================== v9.8: backup page — the user picks where the backup goes =================== */
let BKM='';/* '' | 'drive' | 'wa' | 'file' — read by saveFile for backup files */
const _saveFile1=saveFile;saveFile=async function(name,data,type){if(BKM==='file'&&/^koptan-backup-/.test(name)){if(hasPl('Filesystem')){try{const blob=data instanceof Blob?data:new Blob([data],{type}),b64=(await b2d(blob)).split(',')[1];await capCall('Filesystem','writeFile',{path:'KOPTX/'+name,data:b64,directory:'DOCUMENTS',recursive:true});ok(L('تم الحفظ في مجلد Documents/KOPTX'));return true}catch(e){console.warn('bk file',e)}}return _saveFile0(name,data,type)}return _saveFile1(name,data,type)};
const BKW=[['drive',LU.db,'g','Google Drive','ستظهر قائمة المشاركة — اختر «Drive» واحفظ الملف هناك'],['wa',null,'g','واتساب','أرسل الملف لنفسك أو لرقم تثق به، ويبقى محفوظًا في المحادثة'],['file',LU.dl,'tn','حفظ على الهاتف','ملف في مجلد Documents/KOPTX — لا يحميك إذا ضاع الهاتف'],['app',LU.repl,'o','نسخة سريعة داخل التطبيق','بدون صور، للتراجع عن خطأ — لا تحميك إذا حُذف التطبيق']];
ACT.bkGo=async m=>{if(m==='app')return ACT.snapNow();if(m==='drive'||m==='wa')toast(L(m==='drive'?'اختر «Drive» من قائمة المشاركة':'اختر «واتساب» من قائمة المشاركة'));BKM=m;try{await exportJ()}finally{BKM='';refreshPages()}};
ACT.bkOpen=()=>openSub('bk');
SUBS.bk={t:'النسخ الاحتياطي',f(){const old=bkOld(),n=S.p.length+S.s.length+S.e.length+S.d.length;
return`<div class="card bkst ${old?'o':'g'}"><span class="th ${old?'o':'g'} lg">${SV(old?LU.warn:LU.cok)}</span><div><b>${S.k.lastBk?L('آخر نسخة: {d}',{d:dtm(S.k.lastBk)}):L('لم تؤخذ أي نسخة بعد')}</b><small>${old?L('خذ نسخة الآن لتحمي بياناتك'):L('بياناتك محمية')} · ${plural(n,'{n} سجل','{n} سجلات')}</small></div></div>
<h3 class="sh3">${L('اختر طريقة النسخ')}</h3><div class="list">${BKW.map(([k,ic,c,t,s])=>`<button class="row bkw" data-act="bkGo" data-id="${k}"><span class="th ${c}">${ic?SV(ic):WA_SVG}</span><span class="t"><b>${k==='drive'?t:L(t)}</b><small>${L(s)}</small></span>${SV(FWD(),'ch')}</button>`).join('')}</div>
<p class="sub">${L('النسخة تشمل كل البيانات والصور، ولا تشمل رمز القفل أو البصمة. احفظها في مكان خارج الهاتف مثل Drive أو واتساب.')}</p>
<h3 class="sh3">${L('النسخ التلقائي')}</h3><section class="grp">${SSG(LU.repl,'o',L('النسخ الاحتياطي التلقائي'),L('نسخة داخل التطبيق + تذكير بحفظ نسخة خارج الهاتف'),[['off','إيقاف'],['d','يوميًا'],['w','أسبوعيًا']].map(([k,l])=>`<button class="${(S.k.abk||'w')===k?'on':''}" data-abk="${k}">${L(l)}</button>`).join(''))}${SWI('nfBk',LU.bell,'tn',L('تذكير النسخ الاحتياطي'),L('إذا مرّ أسبوع بلا نسخة'),S.k.nfBk!==false)}</section>
<h3 class="sh3">${L('الاستعادة')}</h3><div class="bar"><button class="btn" data-act="restore">${SV(LU.ul)}${L('استعادة من ملف')}</button></div>${snapsHTML()}`},
b(el){el.addEventListener('click',async e=>{const b=e.target.closest('[data-sw]');if(!b)return;const k=b.dataset.sw;S.k[k]=S.k[k]===false;await saveK();buzz(6);refresh()})}};
