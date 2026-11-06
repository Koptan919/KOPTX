/* KOPTAN v9 — suppliers, notifications, data center, settings, reports, tasks, calendar, search, quick add, shell & boot */
'use strict';
const SUBS={};

/* =================== SUPPLIERS (stable Supplier ID p.sid → store "sp") =================== */
const pkey=x=>wn(x)||String(x||'').replace(/\D/g,''),nkey=n=>String(n||'').trim().toLowerCase().replace(/\s+/g,' ');
const spOf=id=>S.sp.find(x=>x.id===id),spProds=id=>S.p.filter(p=>p.sid===id);
const spByPhone=ph=>{const k=pkey(ph);return k&&k.length>=6?S.sp.find(x=>pkey(x.phone)===k||pkey(x.wa)===k):null};
const spByName=n=>{const k=nkey(n);return k?S.sp.find(x=>nkey(x.name)===k):null};
function spStats(id){const ps=spProds(id),ids=new Set(ps.map(p=>p.id)),ss=S.s.filter(s=>ids.has(s.pid));return{n:ps.filter(p=>!p.arch).length,all:ps.length,q:ps.reduce((a,p)=>a+(+p.qty||0),0),v:ps.reduce((a,p)=>a+(+p.qty||0)*uc(p),0),b:ps.reduce((a,p)=>a+((+p.qty||0)+(+p.sold||0))*uc(p),0),rev:ss.reduce((a,s)=>a+sRev(s),0),gp:ss.reduce((a,s)=>a+prof(s),0),ss,ps,th:(ps.find(p=>p.img)||{}).img||''}}
/* duplicate detection by normalized name or by phone — always confirmed by the user before merging */
function dupGroups(){const seen=new Set(),G=[];S.sp.forEach(a=>{if(seen.has(a.id))return;const g=S.sp.filter(b=>b.id!==a.id&&!seen.has(b.id)&&(nkey(b.name)===nkey(a.name)||(pkey(a.phone).length>=6&&(pkey(b.phone)===pkey(a.phone)||pkey(b.wa)===pkey(a.phone)))));if(g.length){const all=[a,...g];all.forEach(x=>seen.add(x.id));G.push(all)}});return G}
async function syncSp(x){for(const p of spProds(x.id))if(p.supplier!==x.name||p.phone!==x.phone||p.wa!==x.wa){p.supplier=x.name;p.phone=x.phone;p.wa=x.wa;await put('p',p)}}
async function migSup(force){if(!force&&S.k.supMig)return{made:0,linked:0};const todo=S.p.filter(p=>!p.sid&&(p.supplier||p.phone));
if(todo.length&&!S.k.supBak){await put('k',{id:'prebak-v8',at:Date.now(),p:JSON.parse(JSON.stringify(S.p))});S.k.supBak=1}
let made=0,linked=0;for(const p of todo){let x=spByPhone(p.phone);if(!x&&!pkey(p.phone)&&p.supplier)x=S.sp.find(y=>!pkey(y.phone)&&nkey(y.name)===nkey(p.supplier));
if(!x){x={id:uid(),name:p.supplier||p.phone,phone:p.phone||'',wa:p.wa||'',link:'',created:Date.now()};S.sp.push(x);await put('sp',x);made++}else if(!x.wa&&p.wa){x.wa=p.wa;await put('sp',x)}
p.sid=x.id;await put('p',p);linked++}S.k.supMig=1;await saveK();return{made,linked}}
async function resolveSup(o,sel){let x=sel?spOf(sel):null;if(!x&&o.phone)x=spByPhone(o.phone);
if(!x&&!pkey(o.phone)&&o.supplier)x=S.sp.find(y=>!pkey(y.phone)&&nkey(y.name)===nkey(o.supplier));
if(!x&&(o.supplier||o.phone)){x={id:uid(),name:o.supplier||o.phone,phone:o.phone,wa:o.wa,link:'',created:Date.now()};S.sp.push(x);await put('sp',x)}
if(x){o.sid=x.id;o.supplier=x.name;o.phone=x.phone||o.phone;o.wa=x.wa||o.wa;if(!x.phone&&o.phone){x.phone=o.phone;await put('sp',x)}}else o.sid=''}
ACT.sup=id=>supPage(id);
function spForm(x0,after){const nw=!x0,x=x0?{...x0}:{};let img=x.img||'';
const I=(n,l,t='text',ph='')=>`<div class="fl"><label>${l}</label><input name="${n}" type="${t}" ${t==='tel'||t==='url'?'dir="ltr"':''} value="${esc(x[n]||'')}" placeholder="${esc(ph)}"></div>`;
const P=page(nw?L('مورد جديد'):L('تعديل المورد'),`<section class="sec"><div class="sp-av"><div class="ph" id="ph"></div></div>${I('name',L('اسم المورد *'))}${I('phone',L('رقم الهاتف'),'tel','+961…')}${I('wa',L('واتساب (إن اختلف)'),'tel','+961…')}</section><section class="sec">${I('link',L('رابط الموقع'),'url','https://…')}${I('addr',L('العنوان / الموقع الجغرافي'),'text',L('المدينة، الشارع… أو رابط خرائط'))}<div class="fl"><label>${L('ملاحظات')}</label><textarea name="notes" rows="2">${esc(x.notes||'')}</textarea></div></section>`,'',async P=>{
const g=n=>P.q(n).value.trim(),nm=g('name'),ph=g('phone'),wa=g('wa'),lk=g('link');
if(!nm)return invalid(P.q('name'),L('أدخل اسم المورد')),false;if(ph&&ph.replace(/\D/g,'').length<6)return invalid(P.q('phone'),L('رقم هاتف المورد غير صحيح')),false;
if(wa&&!wn(wa))return invalid(P.q('wa'),L('رقم واتساب غير صالح — اكتبه مع رمز الدولة (مثل +961…)')),false;if(lk&&!urlOk(lk))return invalid(P.q('link'),L('الرابط غير صالح — ابدأه بـ https://')),false;
const dp=S.sp.find(y=>y.id!==x.id&&((ph&&pkey(y.phone)===pkey(ph))||nkey(y.name)===nkey(nm)));
const save=async()=>{const o=nw?{id:uid(),created:Date.now()}:spOf(x0.id)||x0;const oldImg=o.img;Object.assign(o,{name:nm,phone:ph,wa,link:lk?urlOk(lk):'',addr:g('addr'),notes:g('notes'),img});if(nw)S.sp.push(o);await put('sp',o);if(!nw)await syncSp(o);if(oldImg&&oldImg!==img)gcImgs([oldImg]);
log((nw?'إضافة مورد: ':'تعديل مورد: ')+nm);ok(nw?L('تمت إضافة المورد ✓'):L('تم حفظ التعديلات ✓'));refresh();after&&after(o)};
if(dp){confirmBox(L('يوجد مورد مشابه: «{n}»',{n:dp.name}),async()=>{await save();P.close();buzz()},{danger:false,yes:L('حفظ على أي حال'),alt:[L('فتح المورد الموجود'),()=>{P.close();setTimeout(()=>supPage(dp.id),200)}],no:L('رجوع للتعديل'),sub:L('لتجنّب التكرار يمكنك فتح المورد الموجود ودمج البيانات لاحقًا.')});return false}
await save()});
const ph=()=>{P.d.querySelector('#ph').innerHTML=img?`<div class="phi round" ${ibg(img)} data-zi="1"><i data-rm="1">${SV(LU.x)}</i></div>`:ADDT(false)};
P.d.addEventListener('click',t=>{t=t.target;if(t.closest('[data-add]'))return;if(t.closest('[data-rm]')){img='';ph()}else if(t.closest('[data-zi]'))zoomId(img)});P.d._imgCb=a=>{img=a[0]||'';ph();P.d.dispatchEvent(new Event('input'))};ph()}
function pickSup(title,list,fn){if(!list.length){warn(L('لا يوجد مورد آخر'));return}const b=sheet(`<h2 class="sh-h">${esc(title)}</h2><div class="opts">${list.map(x=>`<button class="opt" data-t="${x.id}"><span>${esc(x.name)}</span><small dir="ltr">${esc(x.phone||'')}</small></button>`).join('')}</div>`);b.addEventListener('click',e=>{const t=e.target.closest('[data-t]');if(!t)return;closeEl(b);fn(spOf(t.dataset.t))})}
function mvSheet(pid){const p=S.p.find(x=>x.id===pid);if(!p)return;pickSup(L('نقل «{n}» إلى',{n:p.name}),S.sp.filter(x=>x.id!==p.sid),async x=>{p.sid=x.id;p.supplier=x.name;p.phone=x.phone;p.wa=x.wa;await put('p',p);log('نقل منتج: '+p.name+' ← '+x.name);ok(L('تم ربط المنتج بالمورد ✓'));refresh()})}
async function doMerge(a,b){for(const k of['phone','wa','link','addr','img','notes'])if(!b[k]&&a[k])b[k]=a[k];await put('sp',b);for(const p of spProds(a.id)){p.sid=b.id;await put('p',p)}await syncSp(b);S.sp=S.sp.filter(y=>y.id!==a.id);await del('sp',a.id);log('دمج مورد: '+a.name+' ← '+b.name);$$('.pg').forEach(x=>{if(x.dataset.sid===a.id)closeEl(x)});ok(L('تم الدمج ✓ — لم يُحذف أي منتج'));refresh()}
function mergeAsk(a,b){confirmBox(L('دمج «{a}» داخل «{b}»؟',{a:a.name,b:b.name}),()=>doMerge(a,b),{danger:false,icon:LU.merge,yes:L('دمج'),sub:L('ستنتقل {n} منتجات إلى «{b}» ولن يُحذف أي منتج.',{n:spProds(a.id).length,b:b.name})})}
function delSup(id){const x=spOf(id);if(!x)return;confirmBox(L('حذف المورد «{n}»؟',{n:x.name}),async()=>{for(const p of spProds(id)){p.sid='';await put('p',p)}S.sp=S.sp.filter(y=>y.id!==id);await del('sp',id);if(x.img)gcImgs([x.img]);log('حذف مورد: '+x.name);$$('.pg').forEach(e=>{if(e.dataset.sid===id)closeEl(e)});ok(L('تم حذف المورد'));refresh()},{sub:L('ستبقى منتجاته ({n}) دون ربط ولن يُحذف أي منتج.',{n:spProds(id).length})})}
function dupReview(){const G=dupGroups();if(!G.length){ok(L('لا يوجد موردون مكررون ✓'));return}const b=sheet(`<h2 class="sh-h">${L('موردون محتمل تكرارهم')}</h2><p class="sub">${L('راجع كل مجموعة واختر المورد الذي تريد الإبقاء عليه. لن يتم أي دمج دون تأكيدك.')}</p>${G.map((g,i)=>`<div class="card dupg">${g.map(x=>`<div class="kv"><span><b>${esc(x.name)}</b> <small dir="ltr">${esc(x.phone||'')}</small> · ${plural(spProds(x.id).length,'{n} منتج','{n} منتجات')}</span><button class="btn sm" data-keep="${i}|${x.id}">${L('الإبقاء عليه')}</button></div>`).join('')}</div>`).join('')}`,'tall');
b.addEventListener('click',e=>{const k=e.target.closest('[data-keep]');if(!k)return;const[i,id]=k.dataset.keep.split('|'),keep=spOf(id),others=G[+i].filter(x=>x.id!==id);closeEl(b);confirmBox(L('دمج {n} مورد داخل «{b}»؟',{n:others.length,b:keep.name}),async()=>{for(const o of others)await doMerge(o,keep)},{danger:false,icon:LU.merge,yes:L('دمج'),sub:others.map(o=>o.name).join('، ')})})}
/* supplier profile */
function supPage(id){if(!spOf(id))return;const st={q:'',srt:'new',lim:40,tab:'p'};let el;
el=shell(spOf(id).name,E=>{const x=spOf(id);if(!x){setTimeout(()=>closeEl(E));return''}E.querySelector('h1').textContent=x.name;const t=spStats(id),w=x.wa||x.phone,av=x.img||t.th;
const k=st.q.trim().toLowerCase(),by={name:(a,b)=>a.name.localeCompare(b.name,LANG),qty:(a,b)=>b.qty-a.qty,price:(a,b)=>b.price-a.price,val:(a,b)=>b.qty*uc(b)-a.qty*uc(a),new:(a,b)=>(b.created||0)-(a.created||0)};
const pl=t.ps.filter(p=>!k||(p.name+' '+(p.cat||'')).toLowerCase().includes(k)).sort(by[st.srt]||by.new);
const hist=[...t.ss.map(s=>({t:s.date,ti:L('بيع {n} × {q}',{n:s.name,q:s.qty}),v:fmt(sRev(s)),c:'g',a:'sale',id:s.id})),...t.ps.map(p=>({t:p.pdate||p.created,ti:L('شراء {n} ({q} قطعة)',{n:p.name,q:(+p.qty||0)+(+p.sold||0)}),v:fmt(((+p.qty||0)+(+p.sold||0))*uc(p)),c:'o',a:'pd',id:p.id}))].sort((a,b)=>b.t-a.t);
return`<div class="sph"><div class="sph-t"><button class="spt xl" ${ibg(av)} data-act="supImg" data-id="${id}" aria-label="${esc(L('صورة المورد'))}">${av?'':esc([...x.name][0]||'?')}</button><div class="t"><h1>${esc(x.name)}</h1><small dir="ltr">${esc(x.phone||L('بدون رقم'))}</small>${x.addr?`<small>${SV(LU.map,'xs')}${esc(x.addr)}</small>`:''}</div><button class="ib gl" data-act="supEdit" data-id="${id}" aria-label="${esc(L('تعديل المورد'))}">${SV(LU.pen)}</button></div>
<div class="cts c4">${cBtn('tel',telLink(x.phone),x.phone)}${cBtn('wa',waLink(w,''),w)}${cBtn('link',urlOk(x.link),x.link)}${cBtn('map',mapLink(x.addr),x.addr)}</div>
<div class="kgrid k4"><div class="kpi s"><small>${L('المنتجات')}</small><b>${t.n}</b></div><div class="kpi s"><small>${L('قيمة المخزون')}</small><b>${fmt(t.v)}</b></div><div class="kpi s"><small>${L('إجمالي المشتريات')}</small><b>${fmt(t.b)}</b></div><div class="kpi s"><small>${L('أرباح مبيعاته')}</small><b class="${t.gp>=0?'g':'r'}">${fmt(t.gp)}</b></div></div>
<button class="btn p wide" data-act="supAdd" data-id="${id}">${SV(LU.plus)}${L('منتج جديد من هذا المورد')}</button></div>
${x.notes?`<div class="note">${SV(LU.list)}${esc(x.notes)}</div>`:''}
<div class="seg seg-w"><button class="${st.tab==='p'?'on':''}" data-st="p">${L('المنتجات')} (${t.all})</button><button class="${st.tab==='h'?'on':''}" data-st="h">${L('سجل التعاملات')} (${hist.length})</button></div>
${st.tab==='p'?`<div class="sb"><label class="sbi">${SV(LU.search)}<input class="search" data-sdq type="search" placeholder="${esc(L('ابحث في منتجات المورد'))}" value="${esc(st.q)}"></label><select class="sel" data-sds aria-label="${esc(L('ترتيب'))}">${[['new','الأحدث'],['name','الاسم'],['qty','الكمية'],['price','السعر'],['val','قيمة المخزون']].map(([k2,l])=>`<option value="${k2}" ${k2===st.srt?'selected':''}>${L(l)}</option>`).join('')}</select></div><div data-sdl>${spPl(pl,st)}</div>`:
(hist.length?`<div class="list">${hist.slice(0,80).map(h=>`<button class="row" data-act="${h.a}" data-id="${h.id}"><span class="th ${h.c}">${SV(h.a==='sale'?LU.cart:LU.truck)}</span><span class="t"><b>${esc(h.ti)}</b><small>${day(h.t)}</small></span><b class="amt ${h.c}">${h.v}</b></button>`).join('')}</div>`:emptyS(LU.clock,L('لا تعاملات بعد'),''))}
<div class="bar mt"><button class="btn ghost" data-act="supMerge" data-id="${id}">${SV(LU.merge)}${L('دمج مع مورد آخر')}</button><button class="btn ghost dgt" data-act="supDel" data-id="${id}">${SV(LU.trash)}${L('حذف المورد')}</button></div>`});
el.dataset.sid=id;
el.addEventListener('click',e=>{const b=e.target.closest('[data-st],[data-more]');if(!b)return;if(b.dataset.st){st.tab=b.dataset.st;el._fill()}else{st.lim+=40;el.querySelector('[data-sdl]').innerHTML=spPl(spProds(id).filter(p=>!st.q||(p.name+' '+(p.cat||'')).toLowerCase().includes(st.q.toLowerCase())),st)}});
el.addEventListener('input',e=>{if(e.target.matches('[data-sdq]')){st.q=e.target.value;st.lim=40;const k=st.q.toLowerCase();el.querySelector('[data-sdl]').innerHTML=spPl(spProds(id).filter(p=>!k||(p.name+' '+(p.cat||'')).toLowerCase().includes(k)),st)}});
el.addEventListener('change',e=>{if(e.target.matches('[data-sds]')){st.srt=e.target.value;el._fill()}})}
function spPl(l,st){return l.length?`<div class="list">${l.slice(0,st.lim).map(p=>`<div class="row" data-act="pd" data-id="${p.id}" role="button"><span class="th" ${ibg(p.img)}>${p.img?'':SV(LU.pkg)}</span><span class="t"><b>${esc(p.name)}${p.arch?` <span class="tag">${L('مؤرشف')}</span>`:''}</b><small>${esc(p.cat||L('بدون تصنيف'))} · ${plural(p.qty,'{n} قطعة','{n} قطع')} · ${fmt(p.price)}</small></span><button class="ib sm" data-act="editP" data-id="${p.id}" aria-label="${esc(L('تعديل'))}">${SV(LU.pen)}</button><button class="ib sm" data-act="mvP" data-id="${p.id}" aria-label="${esc(L('نقل لمورد آخر'))}">${SV(LU.truck)}</button></div>`).join('')}</div>${l.length>st.lim?`<button class="btn ghost wide" data-more>${L('عرض المزيد ({n})',{n:l.length-st.lim})}</button>`:''}`:emptyS(LU.pkg,L('لا منتجات مطابقة'),'')}
ACT.mvP=id=>mvSheet(id);ACT.supEdit=id=>spForm(spOf(id));ACT.supAdd=id=>productPage(null,'new',spOf(id));
ACT.supMerge=id=>{const x=spOf(id);pickSup(L('دمج «{n}» داخل',{n:x.name}),S.sp.filter(y=>y.id!==id),y=>mergeAsk(x,y))};ACT.supDel=id=>delSup(id);
ACT.supImg=id=>{const x=spOf(id);if(!x)return;const b=sheet(`<h2 class="sh-h">${L('صورة المورد')}</h2><div class="ph">${ADDT(false)}${x.img?`<button type="button" class="addt dg" data-rmi>${SV(LU.trash)}<small>${L('إزالة')}</small></button>`:''}</div>`);
b._imgCb=async a=>{const o=x.img;x.img=a[0];await put('sp',x);if(o)gcImgs([o]);closeEl(b);ok(L('تم حفظ صورة المورد ✓'));refresh()};const r=b.querySelector('[data-rmi]');if(r)r.onclick=async()=>{const o=x.img;x.img='';await put('sp',x);gcImgs([o]);closeEl(b);refresh()}};
let SQ='';
function vSuppliers(){const k=SQ.trim().toLowerCase(),l=S.sp.map(x=>[x,spStats(x.id)]).filter(([x])=>!k||(x.name+' '+(x.phone||'')+' '+(x.addr||'')).toLowerCase().includes(k)).sort((a,b)=>b[1].v-a[1].v||a[0].name.localeCompare(b[0].name,LANG));
return l.length?`<div class="list">${l.map(([x,t])=>{const av=x.img||t.th;return`<button class="row spc" data-act="sup" data-id="${x.id}"><span class="spt" ${ibg(av)}>${av?'':esc([...x.name][0]||'?')}</span><span class="t"><b>${esc(x.name)}</b><small dir="ltr">${esc(x.phone||L('بدون رقم'))}</small><span class="spm"><i>${plural(t.n,'{n} منتج','{n} منتجات')}</i><i>${fmt(t.v)}</i></span></span>${SV(FWD(),'ch')}</button>`}).join('')}</div>`:emptyS(LU.truck,S.sp.length?L('لا نتائج مطابقة'):L('لا موردين بعد'),S.sp.length?'':L('يُنشأ المورد تلقائيًا عند إضافة منتج مع اسم المورد، أو أضفه الآن.'),`<button class="btn p" data-act="spNew">${SV(LU.plus)}${L('إضافة مورد')}</button>`)}
ACT.spNew=()=>spForm();ACT.dupRev=()=>dupReview();ACT.spScan=async()=>{const t=await migSup(true);ok(L('تم ربط {n} منتج بالموردين ✓',{n:t.linked}));refresh()};
SUBS.sup={t:'الموردون',f(){const un=S.p.filter(p=>!p.sid&&(p.supplier||p.phone)).length,dg=dupGroups(),tot=S.sp.reduce((a,x)=>a+spStats(x.id).v,0);
return`<div class="kgrid"><div class="kpi s"><small>${L('الموردون')}</small><b>${S.sp.length}</b></div><div class="kpi s"><small>${L('قيمة المخزون')}</small><b>${fmt(tot)}</b></div></div>${un?`<div class="note spn"><span>${L('{n} منتج غير مربوط بمورد',{n:un})}</span><button class="btn p sm" data-act="spScan">${L('ربط تلقائي')}</button></div>`:''}${dg.length?`<div class="note spn w"><span>${SV(LU.users)}${L('{n} مجموعة موردين محتمل تكرارها',{n:dg.length})}</span><button class="btn sm" data-act="dupRev">${L('مراجعة')}</button></div>`:''}
<div class="sb"><label class="sbi">${SV(LU.search)}<input class="search" data-spq type="search" placeholder="${esc(L('ابحث باسم المورد أو رقمه'))}" value="${esc(SQ)}"></label><button class="ib gl" data-act="spNew" aria-label="${esc(L('إضافة مورد'))}">${SV(LU.plus)}</button></div><div data-spl>${vSuppliers()}</div>`},
b(el){el.addEventListener('input',e=>{if(e.target.matches('[data-spq]')){SQ=e.target.value;el.querySelector('[data-spl]').innerHTML=vSuppliers()}})}};

/* =================== NOTIFICATION CENTER (derived from real data; read/deleted state persisted) =================== */
const bkOld=()=>(S.p.length+S.s.length+S.e.length+S.d.length>0)&&(!S.k.lastBk||Date.now()-S.k.lastBk>7*864e5);
function nfAll(){const T=sod(),R=[],act=S.p.filter(p=>!p.arch);
if(S.k.nfDebt!==false)S.d.filter(d=>!d.arch&&dRem(d)>0&&d.due&&d.due<T+3*864e5).forEach(d=>{const od=d.due<T,n=Math.round(Math.abs(T-d.due)/864e5);R.push({id:'d:'+d.id+(od?':od':':so'),k:'debt',lv:od?'r':'o',t:(od?L('دين متأخر: {n}',{n:d.who}):L('دين يستحق قريبًا: {n}',{n:d.who})),s:fd(d,dRem(d))+' · '+(od?(n?L('متأخر منذ {n} يوم',{n}):L('يستحق اليوم')):(n?L('بعد {n} يوم',{n}):L('يستحق اليوم')))+' · '+(d.type==='in'?L('لي'):L('عليّ')),a:['d',d.id]})});
if(S.k.nfStock!==false){act.forEach(p=>{if(p.qty<=0)R.push({id:'o:'+p.id,k:'stock',lv:'r',t:L('نفد المخزون: {n}',{n:p.name}),s:L('الكمية 0 — أعد التوريد'),a:['p',p.id]});else if(p.qty<=p.min)R.push({id:'l:'+p.id+':'+p.qty,k:'stock',lv:'o',t:L('مخزون منخفض: {n}',{n:p.name}),s:L('{q} قطعة متبقية · الحد {m}',{q:p.qty,m:p.min}),a:['p',p.id]})});
act.filter(p=>p.price<uc(p)).forEach(p=>R.push({id:'b:'+p.id,k:'stock',lv:'r',t:L('سعر البيع أقل من التكلفة: {n}',{n:p.name}),s:L('ربح القطعة {n}',{n:fmt(p.price-uc(p))}),a:['p',p.id]}))}
S.t.filter(t=>!t.done&&t.due<Date.now()-864e5).forEach(t=>R.push({id:'t:'+t.id,k:'task',lv:'o',t:L('مهمة متأخرة: {n}',{n:t.title}),s:L('افتح المهام لإنجازها'),a:['s','tsk']}));
if(S.k.nfBk!==false&&bkOld())R.push({id:'bk:'+(S.k.lastBk||0),k:'bk',lv:'b',t:L('خذ نسخة احتياطية'),s:L('لا توجد نسخة حديثة — احمِ بياناتك'),a:['s','data']});
return R}
/* first-seen time of each notification is stored so the date & time stay stable */
function nfCur(){const nr=new Set(S.k.nr||[]),nd=new Set(S.k.nd||[]),A=nfAll(),now=Date.now();let ch=false;S.k.nt=S.k.nt||{};A.forEach(n=>{if(!S.k.nt[n.id]){S.k.nt[n.id]=now;ch=true}});
const live=new Set(A.map(n=>n.id));for(const k in S.k.nt)if(!live.has(k)){delete S.k.nt[k];ch=true}if(ch)saveKSoon();
const o={r:0,o:1,b:2};return A.filter(n=>!nd.has(n.id)).map(n=>({...n,r:nr.has(n.id),at:S.k.nt[n.id]})).sort((a,b)=>a.r-b.r||o[a.lv]-o[b.lv]||b.at-a.at)}
const nfUn=()=>nfCur().filter(n=>!n.r).length;
function nfBadge(){const b=$('#nb');if(!b)return;const n=nfUn();b.innerHTML=SV(LU.bell)+(n?`<i class="nbd">${n>9?'9+':n}</i>`:'');b.setAttribute('aria-label',n?L('الإشعارات ({n} غير مقروء)',{n}):L('الإشعارات'))}
async function nfSave(){const cur=new Set(nfAll().map(n=>n.id));S.k.nr=(S.k.nr||[]).filter(i=>cur.has(i));S.k.nd=(S.k.nd||[]).filter(i=>cur.has(i));await saveK();nfBadge();refreshPages()}
const NF={sel:new Set(),mode:false};
const nfMark=(ids,read)=>{const s=new Set(S.k.nr||[]);ids.forEach(i=>read?s.add(i):s.delete(i));S.k.nr=[...s];return nfSave()};
const nfDel=ids=>{S.k.nd=[...new Set([...(S.k.nd||[]),...ids])];ids.forEach(i=>NF.sel.delete(i));return nfSave()};
function nfGo(a){$$('.pg').forEach(x=>{if(x.dataset.sub==='nf')closeEl(x)});setTimeout(()=>{const[k,x]=a;if(k==='p')productDetail(x);else if(k==='d')debtD(x);else openSub(x)},120)}
SUBS.nf={t:'الإشعارات',f(){const Ls=nfCur(),un=Ls.filter(n=>!n.r).length,IC={debt:LU.hand,stock:LU.pkg,task:LU.chk,bk:LU.db},CL={r:'r',o:'o',b:'tn'};
NF.sel.forEach(i=>{if(!Ls.some(n=>n.id===i))NF.sel.delete(i)});const ns=NF.sel.size;
return`<div class="nfh"><div><b>${un?L('{n} غير مقروء',{n:un}):L('لا إشعارات جديدة')}</b><small>${plural(Ls.length,'{n} إشعار','{n} إشعارات')}</small></div>${Ls.length?`<button class="btn sm ${NF.mode?'p':''}" data-nf="mode">${SV(LU.sqc)}${NF.mode?L('إنهاء التحديد'):L('تحديد')}</button>`:''}</div>
${Ls.length&&!NF.mode?`<div class="bar sm"><button class="btn ghost" data-nf="readall" ${un?'':'disabled'}>${SV(LU.cok)}${L('تحديد الكل كمقروء')}</button><button class="btn ghost dgt" data-nf="delall">${SV(LU.trash)}${L('حذف الكل')}</button></div>`:''}
${NF.mode?`<div class="selbar gl"><button class="btn ghost" data-nf="selall">${ns===Ls.length?L('إلغاء تحديد الكل'):L('تحديد الكل')}</button><span>${L('المحدد: {n}',{n:ns})}</span><button class="btn ghost" data-nf="selread" ${ns?'':'disabled'}>${SV(LU.cok)}${L('مقروء')}</button><button class="btn d" data-nf="seldel" ${ns?'':'disabled'}>${SV(LU.trash)}${L('حذف')}</button></div>`:''}
${Ls.length?`<div class="list">${Ls.map(n=>`<div class="nfi ${n.r?'':'un'} ${NF.sel.has(n.id)?'sel':''}" data-o="${esc(n.id)}" role="button">${NF.mode?`<span class="nck">${SV(NF.sel.has(n.id)?LU.sqc:LU.sq)}</span>`:''}<span class="th ${CL[n.lv]}">${SV(IC[n.k])}</span><span class="t"><b>${esc(n.t)}</b><small>${esc(n.s)}</small><em>${SV(LU.clock,'xs')}${dtm(n.at)} · <span class="${n.r?'':'nw'}">${n.r?L('مقروء'):L('جديد')}</span></em></span>${NF.mode?'':`<span class="nfx"><button class="ib sm" data-rd="${esc(n.id)}" aria-label="${esc(n.r?L('تحديد كغير مقروء'):L('تحديد كمقروء'))}">${SV(n.r?LU.circ:LU.cok)}</button><button class="ib sm" data-dl="${esc(n.id)}" aria-label="${esc(L('حذف'))}">${SV(LU.x)}</button></span>`}</div>`).join('')}</div>`:emptyS(LU.bell,L('لا توجد إشعارات'),L('كل شيء على ما يرام — سننبهك عند استحقاق دين أو انخفاض مخزون'))}`},
b(el){el.addEventListener('click',async e=>{const c=q=>e.target.closest(q);let b;const Ls=nfCur();
if(b=c('[data-nf]')){const k=b.dataset.nf;if(k==='mode'){NF.mode=!NF.mode;NF.sel.clear();el._fill()}else if(k==='readall'){await nfMark(Ls.map(n=>n.id),true);ok(L('تم تحديد الكل كمقروء ✓'))}
else if(k==='delall')confirmBox(L('حذف كل الإشعارات؟'),async()=>{await nfDel(Ls.map(n=>n.id));ok(L('تم حذف الإشعارات ✓'))},{sub:L('لن تتأثر بياناتك. يظهر الإشعار مجددًا فقط إذا تغيّرت حالته.')});
else if(k==='selall'){if(NF.sel.size===Ls.length)NF.sel.clear();else Ls.forEach(n=>NF.sel.add(n.id));el._fill()}else if(k==='selread'){await nfMark([...NF.sel],true);NF.sel.clear();NF.mode=false;el._fill();ok(L('تم ✓'))}
else if(k==='seldel'){const ids=[...NF.sel];confirmBox(L('حذف {n} إشعار محدد؟',{n:ids.length}),async()=>{await nfDel(ids);NF.mode=false;el._fill();ok(L('تم الحذف ✓'))})}return}
if(b=c('[data-rd]')){const n=Ls.find(x=>x.id===b.dataset.rd);n&&nfMark([n.id],!n.r);return}
if(b=c('[data-dl]')){nfDel([b.dataset.dl]);buzz(6);return}
if(b=c('[data-o]')){const id=b.dataset.o;if(NF.mode){NF.sel.has(id)?NF.sel.delete(id):NF.sel.add(id);el._fill();return}const n=Ls.find(x=>x.id===id);if(n){await nfMark([n.id],true);nfGo(n.a)}}})}};

/* =================== DATA CENTER =================== */
async function dataStats(){let est=null,isz=0,ni=0;try{est=await navigator.storage.estimate()}catch(e){}if(!memOnly){try{const all=await rq(tx('img','readonly').getAll()),r=refd();all.forEach(x=>{if(r.has(x.id)){ni++;isz+=(x.full&&x.full.size||0)+(x.th&&x.th.size||0)}})}catch(e){}}return{est,isz,ni}}
const mb=b=>b<1048576?Math.max(1,Math.round(b/1024)).toLocaleString('en')+' KB':(b/1048576).toLocaleString('en',{maximumFractionDigits:1})+' MB';
SUBS.data={t:'مركز البيانات',f(el){const act=S.p.filter(p=>!p.arch),inv=act.reduce((a,p)=>a+p.qty*uc(p),0),open=S.d.filter(d=>!d.arch&&dRem(d)>0),U=d=>toU(d,Math.max(0,dRem(d)));
const box=(ic,c,t,v,s)=>`<div class="dc"><span class="th ${c}">${SV(ic)}</span><div><small>${t}</small><b>${v}</b><em>${s}</em></div></div>`;
if(!el._st){el._st=1;dataStats().then(x=>{el._ds=x;el._fill()})}const ds=el._ds;
return`${bkOld()?`<div class="note w">${SV(LU.warn)}${L('لم تأخذ نسخة احتياطية منذ أكثر من أسبوع. خذ نسخة الآن واحفظها خارج الهاتف.')}</div>`:''}
<div class="dgrid">${box(LU.pkg,'tn',L('المنتجات'),act.length,L('{a} مؤرشف · {b} قطعة',{a:S.p.length-act.length,b:act.reduce((a,p)=>a+p.qty,0)}))}${box(LU.cart,'g',L('المبيعات'),S.s.length,fmt(S.s.reduce((a,s)=>a+sRev(s),0)))}${box(LU.receipt,'o',L('المصاريف'),S.e.length,fmt(S.e.reduce((a,e)=>a+(+e.amt||0),0)))}${box(LU.hand,'r',L('الديون'),S.d.length,L('{n} مفتوح',{n:open.length}))}${box(LU.truck,'tn',L('الموردون'),S.sp.length,L('مخزون {v}',{v:fmt(inv)}))}${box(LU.img,'tn',L('الصور'),ds?ds.ni:'…',ds?mb(ds.isz):'')}</div>
<div class="card">${K(L('آخر نسخة احتياطية'),S.k.lastBk?dtm(S.k.lastBk):L('لم تؤخذ بعد'),S.k.lastBk?'':'o')}${K(L('ديون لي (متبقي)'),fmt(open.filter(d=>d.type==='in').reduce((a,d)=>a+U(d),0)),'g')}${K(L('ديون عليّ (متبقي)'),fmt(open.filter(d=>d.type==='out').reduce((a,d)=>a+U(d),0)),'o')}${ds&&ds.est?K(L('مساحة التخزين المستخدمة'),mb(ds.est.usage||0)):''}${K(L('مكان الحفظ'),memOnly?L('مؤقت (غير محفوظ)'):L('على هذا الجهاز (دون إنترنت)'))}</div>
<h2 class="h2">${L('النسخ الاحتياطي')}</h2>
<button class="btn p wide xl" data-act="bk">${SV(LU.dl)}${L('إنشاء نسخة احتياطية كاملة (مع الصور)')}</button>
<button class="btn wide xl" data-act="restore">${SV(LU.ul)}${L('استيراد واستعادة نسخة')}</button>
<p class="sub">${L('تُفحص سلامة الملف وتُعرض محتوياته قبل الاستعادة. لن يُستبدل شيء دون تأكيدك.')}</p>
<h2 class="h2">${L('تصدير جداول CSV')}</h2><div class="bar"><button class="btn ghost" data-act="csvS">${L('المبيعات')}</button><button class="btn ghost" data-act="csvE">${L('المصاريف')}</button><button class="btn ghost" data-act="csvD">${L('الديون')}</button><button class="btn ghost" data-act="csvP">${L('المنتجات')}</button></div>
${acc(SV(LU.clock)+L('سجل النشاط'),[...S.l].sort((a,b)=>b.d-a.d).slice(0,25).map(l=>K(esc(logTxt(l.m)),dtm(l.d))).join('')||`<div class="sub">${L('لا نشاط')}</div>`)}`}};
/* activity log entries are stored in Arabic (as in earlier versions) and translated on display */
const LOGP=['إضافة مخزون ',' إلى ','تعديل سريع: ','أرشفة منتج: ','إلغاء أرشفة: ','حذف منتج: ','تراجع عن حذف: ','تعديل منتج: ','إضافة منتج: ','بيع: ','مرتجع: ','دفعة ','حذف دين ','تعديل دفعة ','تعديل دين ','دين جديد ','مصروف: ','إضافة مورد: ','تعديل مورد: ','نقل منتج: ','دمج مورد: ','حذف مورد: ','استعادة نسخة احتياطية','مهمة: '];
const logTxt=m=>{m=String(m||'');if(LANG!=='en')return m;LOGP.forEach(p=>{m=m.split(p).join(L(p))});return m};
ACT.bk=()=>exportJ();ACT.restore=()=>$('#imp').click();
const cqv=v=>'"'+String(v??'').replace(/"/g,'""')+'"',csv=(n,h,rows)=>saveFile(n,'﻿'+[h,...rows].map(r=>r.map(cqv).join(',')).join('\n'),'text/csv');
ACT.csvS=()=>csv('sales.csv',[L('التاريخ'),L('المنتج'),L('الكمية'),L('سعر القطعة'),L('الخصم'),L('التكلفة'),L('الربح'),L('الزبون')],[...S.s].sort((a,b)=>a.date-b.date).map(s=>[toDs(s.date),s.name,s.qty,s.price,s.disc||0,num(s.uc*s.qty),num(prof(s)),s.cust||'']));
ACT.csvE=()=>csv('expenses.csv',[L('التاريخ'),L('الوصف'),L('التصنيف'),L('المبلغ ($)'),L('طريقة الدفع')],[...S.e].sort((a,b)=>a.date-b.date).map(e=>[toDs(e.date),expName(e),L((XC.find(x=>x[0]===e.cat)||XC[7])[2]),e.amt,L((PAYM.find(x=>x[0]===e.pay)||['',''])[1])]));
ACT.csvD=()=>csv('debts.csv',[L('الشخص'),L('الهاتف'),L('النوع'),L('العملة'),L('المبلغ'),L('المدفوع'),L('المتبقي'),L('الحالة'),L('تاريخ الإنشاء'),L('الاستحقاق'),L('السبب')],S.d.map(d=>[d.who,d.phone,d.type==='in'?L('لي'):L('عليّ'),d.cur,d.amt,dPaid(d),Math.max(0,dRem(d)),dSt(d)[0],toDs(d.date),toDs(d.due),d.reason]));
ACT.csvP=()=>csv('products.csv',[L('المنتج'),L('التصنيف'),L('المورد'),L('التكلفة الكاملة'),L('سعر البيع'),L('الكمية'),L('المباع'),L('الحالة')],S.p.map(p=>[p.name,p.cat,(p.sid&&spOf(p.sid)||{}).name||p.supplier||'',num(uc(p)),p.price,p.qty,p.sold||0,p.arch?L('مؤرشف'):stOf(p)[0]]));
/* backup format v5: {app,v,at,counts,sum,...data}; sum = SHA-256 of the data body for integrity checking */
const BKEYS=['sp','p','s','e','l','t','d','k','imgs'];
async function expImgs(){const out=[];for(const id of refd()){if(isD(id))continue;try{const r=memOnly?MEM[id]:await idbGet('img',id);if(r)out.push({id,full:await b2d(r.full)})}catch(e){}}return out}
async function exportJ(){const done=toastP(L('جارٍ تجهيز النسخة الاحتياطية…'));try{const k={...S.k};delete k.pin;const body={sp:S.sp,p:S.p,s:S.s,e:S.e,l:S.l,t:S.t,d:S.d,k,imgs:await expImgs()},bs=JSON.stringify(body),sum=await sha(bs);
const counts={p:S.p.length,s:S.s.length,e:S.e.length,d:S.d.length,sp:S.sp.length,imgs:body.imgs.length};const head=JSON.stringify({app:'KOPTAN',v:5,ver:APP_VER,at:Date.now(),counts,sum});
const file=head.slice(0,-1)+','+bs.slice(1);const saved=await saveFile('koptan-backup-'+toDs(Date.now())+'.json',file,'application/json');done();if(saved!==false){S.k.lastBk=Date.now();await saveK();ok(L('تم إنشاء النسخة الاحتياطية (شاملة الصور) ✓'));refresh()}}catch(e){console.error(e);done();warn(L('تعذر إنشاء النسخة'))}}
/* integrity check + preview before any replacement */
async function checkBackup(txt){let d;try{d=JSON.parse(txt)}catch(e){return{err:L('الملف ليس ملف نسخة احتياطية صالحًا (JSON تالف)')}}
if(!d||typeof d!=='object'||!Array.isArray(d.p)||!Array.isArray(d.s))return{err:L('الملف لا يحتوي على بيانات KOPTAN')};
const issues=[],arr=n=>Array.isArray(d[n])?d[n]:[];let integrity='none';
if(d.sum){const body={};BKEYS.forEach(k=>{if(d[k]!==undefined)body[k]=d[k]});integrity=(await sha(JSON.stringify(body)))===d.sum?'ok':'bad'}
const bad=(n,f)=>arr(n).filter(o=>!o||typeof o!=='object'||!o.id||!f(o)).length;
const bp=bad('p',o=>typeof o.name==='string'),bs=bad('s',o=>o.pid&&isFinite(o.qty)&&isFinite(o.price)),be=bad('e',o=>isFinite(o.amt)),bd=bad('d',o=>o.who!=null&&isFinite(o.amt));
if(bp)issues.push(L('{n} منتج غير صالح',{n:bp}));if(bs)issues.push(L('{n} بيع غير صالح',{n:bs}));if(be)issues.push(L('{n} مصروف غير صالح',{n:be}));if(bd)issues.push(L('{n} دين غير صالح',{n:bd}));
const bi=arr('imgs').filter(x=>!x||!x.id||!isD(x.full)).length;if(bi)issues.push(L('{n} صورة تالفة',{n:bi}));
return{d,integrity,issues,fatal:bp+bs>0}}
async function importJ(f){if(!f)return;if(f.size>400*1048576){warn(L('الملف كبير جدًا'));return}const done=toastP(L('جارٍ فحص الملف…'));const r=await checkBackup(await f.text());done();
if(r.err){confirmBox(r.err,()=>{},{yes:L('حسنًا'),danger:true,no:L('إغلاق')});return}const d=r.d,c=n=>(d[n]||[]).length;
const IST={ok:['g',LU.fchk,L('سليم — تم التحقق من التوقيع الرقمي للملف')],bad:['r',LU.warn,L('تحذير: محتوى الملف لا يطابق توقيعه — ربما عُدّل أو تلف')],none:['o',LU.info,L('نسخة من إصدار أقدم بدون توقيع — تم فحص البنية فقط')]}[r.integrity];
const b=sheet(`<h2 class="sh-h">${L('معاينة النسخة الاحتياطية')}</h2><div class="note ${IST[0]}">${SV(IST[1])}${IST[2]}</div>${r.issues.length?`<div class="note r">${SV(LU.warn)}${r.issues.join(' · ')}</div>`:''}
<div class="card">${K(L('تاريخ النسخة'),d.at?dtm(d.at):'—')}${K(L('الإصدار'),esc(d.ver||(d.v?'v'+d.v:'—')))}</div>
<table class="cmp"><thead><tr><th></th><th>${L('في الملف')}</th><th>${L('الحالي')}</th></tr></thead><tbody>${[['p','المنتجات'],['s','المبيعات'],['e','المصاريف'],['d','الديون'],['sp','الموردون'],['t','المهام'],['imgs','الصور']].map(([k,l])=>`<tr><td>${L(l)}</td><td><b>${c(k)}</b></td><td>${k==='imgs'?refd().size:(S[k]||[]).length}</td></tr>`).join('')}</tbody></table>
<div class="note w">${SV(LU.warn)}${L('الاستعادة تستبدل كل البيانات الحالية بمحتوى هذا الملف. إن فشلت العملية تُعاد بياناتك كما كانت تلقائيًا.')}</div>
<div class="bar"><button class="btn d" data-go ${r.fatal?'disabled':''}>${SV(LU.repl)}${L('استعادة واستبدال')}</button><button class="btn ghost" data-bk>${SV(LU.dl)}${L('نسخ بياناتي الحالية أولًا')}</button><button class="btn ghost" data-no>${L('إلغاء')}</button></div>`,'tall');
b.querySelector('[data-no]').onclick=()=>closeEl(b);b.querySelector('[data-bk]').onclick=()=>exportJ();
b.querySelector('[data-go]').onclick=()=>confirmBox(L('تأكيد استبدال كل البيانات الحالية؟'),()=>{closeEl(b);doRestore(d)},{yes:L('نعم، استبدل'),sub:L('لا يمكن التراجع بعد اكتمال الاستعادة إلا بنسخة احتياطية.')})}
async function restImgs(a){let n=0;for(const x of a||[]){try{if(!x||!x.id||!isD(x.full))continue;if(!memOnly&&await idbGet('img',x.id)){n++;continue}const b=await(await fetch(x.full)).blob(),dd=await decode(b);try{const th=await canv(dd.bm,dd.W,dd.H,360,.72);await putImg({id:x.id,full:b,th,t:Date.now()});n++}finally{dd.done()}}catch(e){}}return n}
async function doRestore(d){const t_=toastP(L('جارٍ الاستعادة…')),old={};STORES.forEach(n=>old[n]=S[n]);const oldK={...S.k};
try{await restImgs(d.imgs);for(const n of STORES){for(const o of old[n])await del(n,o.id);S[n]=uniq((d[n]||[]).filter(o=>o&&o.id));for(const o of S[n])await put(n,o)}const pin=S.k.pin,lang=S.k.lang;S.k={...KDEF,...S.k,...(d.k||{})};delete S.k.id;S.k.pin=d.k&&d.k.pin!=null?d.k.pin:pin;S.k.lang=lang;S.d.forEach(x=>{if(!Array.isArray(x.pays))x.pays=[]});await saveK();await migImgs();await migSup(true);t_();ok(L('تمت الاستعادة بنجاح ✓'));log('استعادة نسخة احتياطية');refresh()}
catch(e){console.error(e);for(const n of STORES){for(const o of S[n])await del(n,o.id);S[n]=old[n];for(const o of S[n])await put(n,o)}S.k=oldK;await saveK();t_();warn(L('فشلت الاستعادة — أُعيدت بياناتك كما كانت'));refresh()}}

/* =================== SETTINGS =================== */
const SW=(k,t,s,on)=>`<div class="srow"><span class="t"><b>${t}</b>${s?`<small>${s}</small>`:''}</span><button class="sw ${on?'on':''}" role="switch" aria-checked="${!!on}" aria-label="${esc(t)}" data-sw="${k}"></button></div>`;
const SR=(act,ic,t,s,end='')=>`<button class="srow lnk" data-act="${act}"><span class="th tn">${SV(ic)}</span><span class="t"><b>${t}</b>${s?`<small>${s}</small>`:''}</span>${end}${SV(FWD(),'ch')}</button>`;
SUBS.set={t:'الإعدادات',f(){return`<h3 class="sh3">${L('عام')}</h3><section class="grp">
<div class="srow"><span class="t"><b>${L('عملة العرض')}</b><small>${L('تُحفظ المبالغ بالدولار وتُعرض بالعملة المختارة')}</small></span><div class="seg seg-s"><button class="${S.k.cur==='USD'?'on':''}" data-setcur="USD">$</button><button class="${S.k.cur==='LBP'?'on':''}" data-setcur="LBP">${L('ل.ل')}</button></div></div>
<div class="srow"><span class="t"><b>${L('سعر الصرف')}</b><small>${L('ليرة لكل 1 دولار — المبيعات السابقة لا تتغير')}</small></span><input class="inl" type="number" inputmode="numeric" dir="ltr" value="${S.k.rate}" data-set="rate"></div>
<div class="srow"><span class="t"><b>${L('رمز الدولة للهاتف')}</b><small>${L('يُستخدم لأرقام واتساب المحلية (بدون +)')}</small></span><input class="inl" type="tel" inputmode="numeric" dir="ltr" value="${esc(S.k.cc||'')}" placeholder="961" data-set="cc"></div>
${SW('vib',L('اهتزاز خفيف'),L('عند الحفظ والعمليات المهمة'),S.k.vib!==false)}${SW('anim',L('الحركات والانتقالات'),L('عدّادات متحركة وظهور ناعم'),S.k.anim!==false)}${SW('lite',L('وضع الأداء'),L('زجاج أخف بدون تمويه حي — أسرع على الهواتف الضعيفة'),!!S.k.lite)}</section>
<h3 class="sh3">${L('اللغة')}</h3><section class="grp"><div class="srow"><span class="t"><b>${L('لغة التطبيق')}</b><small>${LANG==='ar'?'العربية':'English'}</small></span><div class="seg seg-s"><button class="${LANG==='ar'?'on':''}" data-lang="ar">العربية</button><button class="${LANG==='en'?'on':''}" data-lang="en">English</button></div></div></section>
<h3 class="sh3">${L('الإشعارات')}</h3><section class="grp">${SW('nfStock',L('تنبيهات المخزون'),L('نفاد أو انخفاض الكمية، وسعر أقل من التكلفة'),S.k.nfStock!==false)}${SW('nfDebt',L('تذكير الديون'),L('قبل الاستحقاق بثلاثة أيام وعند التأخر'),S.k.nfDebt!==false)}${SW('nfBk',L('تذكير النسخ الاحتياطي'),L('إذا مرّ أسبوع بلا نسخة'),S.k.nfBk!==false)}${SR('nfOpen',LU.bell,L('مركز الإشعارات'),'')}</section>
<h3 class="sh3">${L('البيانات')}</h3><section class="grp">${SR('dataOpen',LU.db,L('مركز البيانات'),L('آخر نسخة: {d}',{d:S.k.lastBk?day(S.k.lastBk):L('لم تؤخذ بعد')}))}${SR('bk',LU.dl,L('نسخة احتياطية الآن'),L('مع الصور'))}</section>
<h3 class="sh3">${L('الأمان')}</h3><section class="grp">${SW('hide',L('إخفاء المبالغ'),L('تظهر المبالغ على شكل ••••'),!!S.k.hide)}${SR('pin',LU.lock,L('قفل التطبيق برمز PIN'),S.k.pin?L('مفعّل — حماية محلية على هذا الجهاز'):L('غير مفعّل'))}</section>
<h3 class="sh3">${L('حول التطبيق')}</h3><section class="grp">${SR('upd',LU.repl,L('التحقق من التحديثات'),L('الإصدار الحالي {v}',{v:APP_VER}))}<div class="about"><img src="icon-192.png" alt=""><div><b>KOPTAN</b><small>${L('مدير أعمالي')} · v${APP_VER} · Titanium Liquid Glass</small><small>${L('يعمل دون إنترنت، وكل البيانات محفوظة على هذا الجهاز فقط.')}</small></div></div></section>`},
b(el){el.addEventListener('click',async e=>{const c=q=>e.target.closest(q);let b;
if(b=c('[data-sw]')){const k=b.dataset.sw;if(k==='hide')S.k.hide=!S.k.hide;else if(k==='lite')S.k.lite=!S.k.lite;else S.k[k]=S.k[k]===false;await saveK();applyPrefs();buzz(6);refresh();return}
if(b=c('[data-setcur]')){S.k.cur=b.dataset.setcur;await saveK();refresh();return}
if(b=c('[data-lang]')){await setLang(b.dataset.lang);return}});
el.addEventListener('change',async e=>{const t=e.target;if(t.dataset.set==='rate'){const v=+t.value;if(v>0){S.k.rate=v;await saveK();ok(L('تم تحديث سعر الصرف ✓'));refresh()}else{warn(L('أدخل سعر صرف صحيحًا'));t.value=S.k.rate}}
else if(t.dataset.set==='cc'){S.k.cc=String(t.value).replace(/\D/g,'').replace(/^0+/,'');await saveK();ok(L('تم حفظ رمز الدولة ✓'))}})}};
ACT.nfOpen=()=>openSub('nf');ACT.dataOpen=()=>openSub('data');ACT.pin=()=>pinForm();
async function setLang(l){if(l===LANG)return;LANG=l;S.k.lang=l;try{localStorage.setItem('koptan.lang',l)}catch(e){}applyDir();await saveK();rebuildUI();ok(l==='en'?'Language: English ✓':'اللغة: العربية ✓')}
function applyPrefs(){const b=document.body.classList;b.toggle('lite',!!S.k.lite);b.toggle('noanim',S.k.anim===false)}
function pinForm(){const b=sheet(`<h2 class="sh-h">${L('قفل PIN')}</h2><p class="sub">${L('حماية محلية تمنع فتح التطبيق دون الرمز.')}</p><div class="fl"><label>${L('رمز جديد (4 أرقام أو أكثر)')}</label><input data-p1 type="password" inputmode="numeric" dir="ltr" autocomplete="new-password"></div><div class="fl"><label>${L('تأكيد الرمز')}</label><input data-p2 type="password" inputmode="numeric" dir="ltr" autocomplete="new-password"></div><div class="bar"><button class="btn p" data-s>${L('حفظ الرمز')}</button>${S.k.pin?`<button class="btn d" data-r>${L('إزالة القفل')}</button>`:''}<button class="btn ghost" data-n>${L('إلغاء')}</button></div>`);
b.querySelector('[data-n]').onclick=()=>closeEl(b);const r=b.querySelector('[data-r]');if(r)r.onclick=async()=>{S.k.pin='';await saveK();closeEl(b);ok(L('تمت إزالة القفل'));refresh()};
b.querySelector('[data-s]').onclick=async()=>{const r1=b.querySelector('[data-p1]').value.replace(/\s/g,''),a=normD(r1),c=normD(b.querySelector('[data-p2]').value);if(a.length<4||a.length!==r1.length){warn(L('الرمز يجب أن يكون 4 أرقام على الأقل'));return}if(a!==c){warn(L('الرمزان غير متطابقين'));return}S.k.pin=await sha('pbm'+a);await saveK();closeEl(b);ok(L('تم تفعيل القفل ✓'));refresh()}}
function lock(){const d=document.createElement('div');d.className='lockscr';let v='',done=false;const K=['1','2','3','4','5','6','7','8','9','del','0','ok'];
d.innerHTML=`<div class="lk gl"><img src="icon-192.png" alt=""><h1>KOPTAN</h1><p>${L('أدخل رمز PIN')}</p><div class="pin-dots" role="status" aria-label="PIN"></div><div class="pad" dir="ltr">${K.map(k=>`<button type="button" class="pk ${k==='ok'?'ok':k==='del'?'dl':''}" data-k="${k}" aria-label="${k==='del'?esc(L('حذف')):k==='ok'?esc(L('فتح')):k}">${k==='del'?SV(LU.bksp):k==='ok'?SV(LU.check):k}</button>`).join('')}</div></div>`;document.body.append(d);
const dots=()=>{d.querySelector('.pin-dots').innerHTML=Array.from({length:Math.max(4,v.length)},(_,i)=>`<i class="${i<v.length?'on':''}"></i>`).join('')};
/* also accept PINs saved by older versions with Arabic/Persian digits */
const forms=x=>[x,x.replace(/\d/g,n=>String.fromCharCode(1632+ +n)),x.replace(/\d/g,n=>String.fromCharCode(1776+ +n))];
const bad=m=>{const lk=d.querySelector('.lk');lk.classList.remove('shake');void lk.offsetWidth;lk.classList.add('shake');warn(m);buzz(60)};
const tryU=async final=>{const cur=v;if(cur.length<4){if(final)bad(L('الرمز يجب أن يكون 4 أرقام على الأقل'));return}for(const f of forms(cur))if(await sha('pbm'+f)===S.k.pin){if(done)return;done=true;document.removeEventListener('keydown',kd,true);d.classList.add('out');buzz();setTimeout(()=>d.remove(),200);return}if(final&&v===cur){bad(L('رمز خاطئ'));v='';dots()}};
const press=k=>{if(done)return;if(k==='ok')return tryU(true);if(k==='del')v=v.slice(0,-1);else if(v.length<12){v+=k;buzz(5)}dots();tryU(false)};
d.addEventListener('click',e=>{const b=e.target.closest('[data-k]');if(b)press(b.dataset.k)});
const kd=e=>{if(done||!d.isConnected)return;const n=normD(e.key);if(e.key.length===1&&n.length===1){press(n);e.preventDefault()}else if(e.key==='Backspace'){press('del');e.preventDefault()}else if(e.key==='Enter'){press('ok');e.preventDefault()}};
document.addEventListener('keydown',kd,true);dots()}


/* =================== Android self-update (bundle downloaded from the live site; data & offline mode untouched) =================== */
const UPD_URL='https://koptan919.github.io/Koptan/version.json';
const newer=(a,b)=>{const x=String(a||'').split('.').map(n=>+n||0),y=String(b||'').split('.').map(n=>+n||0);for(let i=0;i<3;i++){if((x[i]||0)!==(y[i]||0))return(x[i]||0)>(y[i]||0)}return false};
let updBusy=false,updAt=0;
async function selfUpdate(manual){if(!hasPl('CapacitorUpdater')){if(manual)ok(L('هذه النسخة تتحدّث تلقائيًا عند فتحها مع الإنترنت ✓'));return}
if(updBusy)return;if(!manual&&Date.now()-updAt<3600e3)return;updBusy=true;updAt=Date.now();let done=null;
try{const r=await fetch(UPD_URL+'?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('http '+r.status);const j=await r.json();
if(!j||!j.version||!j.zip||!newer(j.version,APP_VER)){if(manual)ok(L('لديك أحدث إصدار ({v}) ✓',{v:APP_VER}));return}
if(manual)done=toastP(L('جارٍ تنزيل التحديث {v}…',{v:j.version}));
const b=await capCall('CapacitorUpdater','download',{url:j.zip,version:j.version});done&&done();done=null;
await capCall('CapacitorUpdater','next',{id:b.id});
toast(L('التحديث {v} جاهز — يُطبَّق عند إعادة فتح التطبيق',{v:j.version}),'ok',{label:L('تحديث الآن'),icon:LU.repl,ms:12000,fn:()=>{if($('.pg .ft'))return confirmBox(L('لديك نموذج مفتوح. تطبيق التحديث الآن سيغلقه.'),()=>capCall('CapacitorUpdater','set',{id:b.id}),{danger:false,yes:L('تحديث الآن')});capCall('CapacitorUpdater','set',{id:b.id})}})}
catch(e){console.warn('update',e);if(manual)warn(L('تعذر التحقق من التحديثات — تأكد من الاتصال بالإنترنت'))}
finally{done&&done();updBusy=false}}
ACT.upd=()=>selfUpdate(true);

/* =================== REPORTS =================== */
function repCmp(){if(per==='all')return'';const r=rng(),T=sod(),e=Math.min(r[1],T+864e5),len=e-r[0],pr=[r[0]-len,r[0]],c=AGG(r[0],e),p=AGG(pr[0],pr[1]);
const row=(l,a,b,inv)=>{const d=b?Math.round((a-b)/Math.abs(b)*100):null,up=inv?a<=b:a>=b;return`<div class="kv"><span>${l}</span><b>${fmt(a)} <small class="${up?'g':'r'}">${d===null?'':(d>=0?'▲ ':'▼ ')+Math.abs(d)+'%'}</small></b></div>`};
return acc(SV(LU.repl)+L('مقارنة بالفترة السابقة'),row(L('المبيعات'),c.rev,p.rev)+row(L('أرباح المبيعات'),c.gp,p.gp)+row(L('المصاريف'),c.ex,p.ex,1)+row(L('صافي الربح'),c.net,p.net)+`<div class="sub">${L('الفترة السابقة: {a} – {b}',{a:day(pr[0]),b:day(pr[1]-1)})}</div>`,true)}
SUBS.rep={t:'التقارير والتحليلات',f(){const ss=S.s.filter(inR),rev=ss.reduce((a,s)=>a+sRev(s),0),gp=ss.reduce((a,s)=>a+prof(s),0),ex=S.e.filter(inR).reduce((a,e)=>a+(+e.amt||0),0),act=S.p.filter(p=>!p.arch),units=act.reduce((a,p)=>a+p.qty,0),inv=act.reduce((a,p)=>a+p.qty*uc(p),0),now=Date.now(),by={};
ss.forEach(s=>{const x=by[s.pid+'|'+s.name]||(by[s.pid+'|'+s.name]={n:s.name,q:0,p:0,r:0});x.q+=s.qty;x.p+=prof(s);x.r+=sRev(s)});
const stale=act.filter(p=>p.qty>0&&!S.s.some(s=>s.pid===p.id&&s.date>now-30*864e5)&&(p.created||0)<now-30*864e5),top=Object.values(by).sort((a,b)=>b.p-a.p);
const U=d=>toU(d,Math.max(0,dRem(d))),unc=S.d.filter(d=>d.type==='in'&&d.sid&&S.s.some(s=>s.id===d.sid&&inR(s))).reduce((a,d)=>a+U(d),0),dpay=t=>S.d.filter(d=>d.type===t).reduce((a,d)=>a+d.pays.filter(y=>inR({date:y.date})).reduce((s,y)=>s+toU(d,y.amt),0),0);
const xc={};S.e.filter(inR).forEach(e=>{xc[e.cat]=(xc[e.cat]||0)+(+e.amt||0)});const xm=Math.max(1,...Object.values(xc));
return`${perChips('per')}<div class="kgrid k4"><div class="kpi s"><small>${L('المبيعات')}</small><b>${fmt(rev)}</b></div><div class="kpi s"><small>${L('أرباح المبيعات')}</small><b class="g">${fmt(gp)}</b></div><div class="kpi s"><small>${L('المصاريف')}</small><b class="o">${fmt(ex)}</b></div><div class="kpi s"><small>${L('صافي الربح')}</small><b class="${gp-ex>=0?'g':'r'}">${fmt(gp-ex)}</b></div></div>
${chartHTML('rep')}${repCmp()}
${acc(SV(LU.dollar)+L('الملخص المالي'),K(L('إيرادات المبيعات'),fmt(rev))+K(L('أرباح المبيعات'),fmt(gp),'g')+K(L('المصاريف'),fmt(ex),'o')+K(L('صافي الربح'),fmt(gp-ex),gp-ex>=0?'g':'r')+K(L('مقبوض فعليًا من المبيعات'),fmt(Math.max(0,rev-unc)))+K(L('غير محصّل (ديون من مبيعات)'),fmt(unc),'o')+K(L('ديون محصّلة في الفترة'),fmt(dpay('in')))+K(L('ديون مسدّدة في الفترة'),fmt(dpay('out')))+`<div class="sub">${L('الديون تُعرض منفصلة ولا تدخل في الأرباح، فلا يُحتسب أي مبلغ مرتين.')}</div>`,true)}
${acc(SV(LU.star)+L('الأرباح حسب المنتج')+` (${top.length})`,top.map(x=>K(esc(x.n)+` <small>(${x.q}${x.r>0?' · '+L('هامش {n}%',{n:Math.round(x.p/x.r*100)}):''})</small>`,fmt(x.p),x.p>=0?'g':'r')).join('')||`<div class="sub">${L('لا مبيعات في هذه الفترة')}</div>`,true)}
${Object.keys(xc).length?acc(SV(LU.receipt)+L('المصاريف حسب التصنيف'),Object.entries(xc).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<div class="mrow"><span>${L((XC.find(x=>x[0]===c)||XC[7])[2])}</span><div class="mb"><i style="width:${Math.max(3,v/xm*100)}%"></i></div><b class="o">${fmt(v)}</b></div>`).join('')):''}
${acc(SV(LU.pkg)+L('المخزون الحالي'),K(L('عدد المنتجات'),act.length)+K(L('القطع المتوفرة'),units)+K(L('قيمة المخزون (تكلفة)'),fmt(inv))+K(L('راكد منذ 30 يومًا'),stale.length+' · '+fmt(stale.reduce((a,p)=>a+p.qty*uc(p),0))))}
${stale.length?acc(SV(LU.clock)+L('منتجات راكدة')+` (${stale.length})`,`<div class="list">${stale.slice(0,10).map(productRow).join('')}</div>`):''}
<div class="bar"><button class="btn ghost" data-act="compare">${SV(LU.sort)}${L('مقارنة المنتجات')}</button><button class="btn ghost" data-act="timeline">${SV(LU.clock)}${L('سجل العمليات')}</button><button class="btn ghost" data-act="csvS">${SV(LU.dl)}CSV</button><button class="btn ghost" data-act="print">${L('طباعة / PDF')}</button></div>`}};
ACT.print=()=>print();
ACT.compare=()=>{const b=sheet(`<h2 class="sh-h">${L('مقارنة المنتجات')}</h2><div class="opts">${S.p.filter(p=>!p.arch).map(p=>`<label class="opt ck"><input type="checkbox" value="${p.id}"><span>${esc(p.name)}</span></label>`).join('')||`<div class="sub">${L('لا منتجات')}</div>`}</div><div class="bar"><button class="btn p" data-c>${L('قارن')}</button></div><div class="cmpw"></div>`,'tall');
b.querySelector('[data-c]').onclick=()=>{const ps=[...b.querySelectorAll('input:checked')].map(i=>S.p.find(p=>p.id===i.value));if(ps.length<2){warn(L('اختر منتجين على الأقل'));return}const R=(l,f)=>`<tr><td>${l}</td>${ps.map(p=>`<td>${f(p)}</td>`).join('')}</tr>`;
b.querySelector('.cmpw').innerHTML=`<table class="cmp">${R('',p=>'<b>'+esc(p.name)+'</b>')}${R(L('التكلفة'),p=>fmt(uc(p)))}${R(L('سعر البيع'),p=>fmt(p.price))}${R(L('ربح القطعة'),p=>fmt(p.price-uc(p)))}${R(L('الهامش'),p=>p.price?num((p.price-uc(p))/p.price*100)+'%':'—')}${R(L('المخزون'),p=>p.qty)}${R(L('المباع'),p=>p.sold||0)}</table>`}};

/* expenses list page */
SUBS.exp={t:'المصاريف',f(){const t=sod(),n=new Date(),m=new Date(n.getFullYear(),n.getMonth(),1).getTime(),a=S.e.filter(e=>e.date>=t&&e.date<t+864e5).reduce((s,e)=>s+(+e.amt||0),0),b=S.e.filter(e=>e.date>=m).reduce((s,e)=>s+(+e.amt||0),0),ex=[...S.e].sort((x,y)=>y.date-x.date).slice(0,150);
return`<div class="kgrid"><div class="kpi s"><small>${L('مصاريف اليوم')}</small><b class="o">${fmt(a)}</b></div><div class="kpi s"><small>${L('مصاريف الشهر')}</small><b class="o">${fmt(b)}</b></div></div><button class="btn p wide" data-act="addE">${SV(LU.plus)}${L('مصروف جديد')}</button>${ex.length?`<div class="list">${ex.map(e=>`<button class="row" data-act="exp" data-id="${e.id}"><span class="th o">${xi(e.cat)}</span><span class="t"><b>${esc(expName(e))}${e.rec?` <span class="tag">${L('متكرر')}</span>`:''}</b><small>${day(e.date)}</small></span><b class="amt o">${fmt(e.amt)}</b></button>`).join('')}</div>`:emptyS(LU.receipt,L('لا مصاريف بعد'),L('سجّل الإيجار والشحن والإعلانات لتعرف صافي ربحك الحقيقي'))}${S.e.length>150?`<p class="sub">${L('يُعرض آخر 150 مصروفًا — كل السجل في ملف CSV')}</p>`:''}<div class="bar"><button class="btn ghost" data-act="csvE">${SV(LU.dl)}CSV</button></div>`}};
ACT.addE=()=>addExpense();

/* tasks */
SUBS.tsk={t:'المهام والتذكيرات',f(){const L_=[...S.t].sort((a,b)=>a.done-b.done||a.due-b.due);return`<button class="btn p wide" data-act="addT">${SV(LU.plus)}${L('مهمة جديدة')}</button>${L_.length?`<div class="list">${L_.map(t=>`<div class="row tsk ${t.done?'done':''}"><button class="ib tk ${t.done?'on':''}" data-act="togT" data-id="${t.id}" aria-label="${esc(L('إنجاز'))}">${SV(t.done?LU.cok:LU.circ)}</button><span class="t"><b>${esc(t.title)}</b><small class="${!t.done&&t.due<Date.now()-864e5?'r':''}">${day(t.due)}</small></span><button class="ib sm" data-act="delT" data-id="${t.id}" aria-label="${esc(L('حذف'))}">${SV(LU.trash)}</button></div>`).join('')}</div>`:emptyS(LU.chk,L('لا مهام'),L('أضف تذكيرًا لطلبية أو موعد تسليم'))}`}};
ACT.addT=()=>form(L('مهمة جديدة'),[['title',L('المهمة'),'text'],['due',L('الموعد'),'date']],{due:toDs(Date.now())},async o=>{if(!o.title){warn(L('اكتب المهمة'));return false}const t={id:uid(),title:o.title,due:toTs(o.due)||Date.now(),done:false};S.t.push(t);await put('t',t);log('مهمة: '+t.title);ok(L('تمت إضافة المهمة ✓'));refresh()});
ACT.togT=async id=>{const t=S.t.find(x=>x.id===id);if(!t)return;t.done=!t.done;await put('t',t);buzz(8);refresh()};
ACT.delT=id=>confirmBox(L('حذف هذه المهمة؟'),async()=>{S.t=S.t.filter(x=>x.id!==id);await del('t',id);refresh()});

/* calendar */
let cmo=new Date(new Date().getFullYear(),new Date().getMonth(),1),csel=sod();
function dayEv(a){const b=a+864e5,i=t=>t>=a&&t<b;return[...S.s.filter(s=>i(s.date)).map(s=>({k:'s',m:L('بيع {n} × {q}',{n:s.name,q:s.qty}),v:fmt(prof(s))})),...S.e.filter(e=>i(e.date)).map(e=>({k:'e',m:expName(e),v:fmt(e.amt)})),...S.d.flatMap(d=>[(d.due&&i(d.due)&&dRem(d)>0)?{k:'d',m:L('استحقاق دين {n}',{n:d.who}),v:fd(d,dRem(d)),late:a<sod()}:null,...d.pays.filter(y=>i(y.date)).map(y=>({k:'d',m:(d.type==='in'?L('تحصيل من {n}',{n:d.who}):L('سداد إلى {n}',{n:d.who})),v:fd(d,y.amt)}))].filter(Boolean))]}
ACT.calGo=n=>{cmo=new Date(cmo.getFullYear(),cmo.getMonth()+(+n),1);refreshPages()};ACT.calSel=a=>{csel=+a;refreshPages()};
SUBS.cal={t:'التقويم',f(){const y=cmo.getFullYear(),m=cmo.getMonth(),first=new Date(y,m,1).getDay(),n=new Date(y,m+1,0).getDate(),T=sod(),WD=LANG==='en'?['S','M','T','W','T','F','S']:['ح','ن','ث','ر','خ','ج','س'];let c=WD.map(x=>`<div class="wd">${x}</div>`).join('');for(let i=0;i<first;i++)c+='<i></i>';
for(let d=1;d<=n;d++){const a=new Date(y,m,d).getTime(),ks=[...new Set(dayEv(a).map(x=>x.k))];c+=`<button class="cd ${a===T?'tdy':''} ${a===csel?'on':''}" data-act="calSel" data-id="${a}">${d}<span>${ks.map(k=>`<u class="k${k}"></u>`).join('')}</span></button>`}
const ev=dayEv(csel);return`<div class="calh"><button class="ib gl" data-act="calGo" data-id="-1" aria-label="${esc(L('الشهر السابق'))}">${SV(BACK())}</button><h2>${cmo.toLocaleDateString(loc(),{month:'long',year:'numeric'})}</h2><button class="ib gl" data-act="calGo" data-id="1" aria-label="${esc(L('الشهر التالي'))}">${SV(FWD())}</button></div><div class="card"><div class="cal">${c}</div><div class="cal-l"><span class="g">● ${L('مبيعات')}</span><span class="o">● ${L('مصاريف')}</span><span class="r">● ${L('ديون')}</span></div></div><h2 class="h2">${day(csel)}</h2>${ev.map(x=>K(esc(x.m),x.v,x.late?'r':'')).join('')||`<div class="sub">${L('لا أحداث في هذا اليوم')}</div>`}`}};

/* =================== "More" menu + sub pages =================== */
function openSub(id){const ex=$$('.pg').find(x=>x.dataset.sub===id);if(ex)return;const s=SUBS[id];const el=shell(L(s.t),d=>s.f(d));el.dataset.sub=id;s.b&&s.b(el);if(id==='nf'){NF.mode=false;NF.sel.clear()}}
function refreshPages(){$$('.pg').forEach(d=>{if(d._fill){d._fill();anim(d);d.querySelectorAll('[data-ch]').forEach(drawChart)}})}
function vMore(){const n=nfUn(),pend=S.t.filter(t=>!t.done).length,m0=new Date(new Date().getFullYear(),new Date().getMonth(),1).getTime(),exm=S.e.filter(e=>e.date>=m0).reduce((a,e)=>a+(+e.amt||0),0),dg=dupGroups().length;
const R=[['rep',LU.chart,'tn',L('التقارير والتحليلات'),L('الأرباح، أفضل المنتجات، المقارنات'),''],['exp',LU.receipt,'o',L('المصاريف'),L('هذا الشهر: {n}',{n:fmt(exm)}),''],['sup',LU.truck,'g',L('الموردون'),S.sp.length?plural(S.sp.length,'{n} مورد','{n} موردين'):L('اتصال وواتساب ومنتجات كل مورد'),dg?'<span class="bdg">!</span>':''],['nf',LU.bell,'o',L('الإشعارات'),n?L('{n} غير مقروء',{n}):L('لا إشعارات جديدة'),n?`<span class="bdg">${n}</span>`:''],['tsk',LU.chk,'tn',L('المهام والتذكيرات'),pend?plural(pend,'{n} مهمة قيد الإنجاز','{n} مهام قيد الإنجاز'):L('لا مهام معلقة'),''],['cal',LU.cal,'g',L('التقويم'),L('المبيعات والمصاريف والاستحقاقات'),''],['data',LU.db,'r',L('مركز البيانات'),bkOld()?L('خذ نسخة احتياطية الآن'):L('آخر نسخة: {d}',{d:S.k.lastBk?day(S.k.lastBk):'—'}),bkOld()?'<span class="bdg">!</span>':''],['set',LU.gear,'tn',L('الإعدادات'),L('اللغة، العملة، الأمان، الإشعارات'),'']];
return`<div class="wrap"><div class="list">${R.map(([id,ic,c,t,s,b])=>`<button class="row mi" data-act="sub" data-id="${id}"><span class="th ${c}">${SV(ic)}</span><span class="t"><b>${t}</b><small>${s}</small></span>${b}${SV(FWD(),'ch')}</button>`).join('')}</div><p class="foot">KOPTAN · v${APP_VER} · ${L('يعمل دون إنترنت')}</p></div>`}
ACT.sub=id=>openSub(id);

/* =================== global search =================== */
function gsearch(){closeSheets();const b=sheet(`<div class="sb"><label class="sbi">${SV(LU.search)}<input class="search" data-gq type="search" placeholder="${esc(L('ابحث في المنتجات والمبيعات والمصاريف والديون والموردين'))}" autocomplete="off"></label></div><div data-gr></div>`,'tall'),inp=b.querySelector('[data-gq]'),out=b.querySelector('[data-gr]');
const run=()=>{const k=inp.value.trim().toLowerCase();if(!k){out.innerHTML=`<p class="sub ctr">${L('اكتب للبحث')}</p>`;return}const m=v=>String(v||'').toLowerCase().includes(k),R=[];
S.p.filter(p=>m(p.name)||m(p.cat)||m(p.supplier)||m(p.notes)).slice(0,8).forEach(p=>R.push([LU.pkg,'tn',p.name,(p.cat||L('بدون تصنيف'))+' · '+plural(p.qty,'{n} قطعة','{n} قطع'),'pd',p.id]));
S.sp.filter(x=>m(x.name)||m(x.phone)||m(x.addr)).slice(0,5).forEach(x=>R.push([LU.truck,'g',x.name,x.phone||L('مورد'),'sup',x.id]));
S.s.filter(s=>m(s.name)||m(s.note)||m(s.cust)).sort((a,b)=>b.date-a.date).slice(0,6).forEach(s=>R.push([LU.cart,'g',L('بيع {n} × {q}',{n:s.name,q:s.qty}),day(s.date),'sale',s.id]));
S.e.filter(e=>m(e.note)||m(e.notes)||m(expName(e))).sort((a,b)=>b.date-a.date).slice(0,6).forEach(e=>R.push([LU.receipt,'o',expName(e),day(e.date),'exp',e.id]));
S.d.filter(d=>m(d.who)||m(d.reason)||m(d.phone)||m(d.notes)).slice(0,8).forEach(d=>R.push([LU.hand,'r',d.who,(d.type==='in'?L('لي'):L('عليّ'))+' · '+dSt(d)[0],'debt',d.id]));
out.innerHTML=R.length?`<div class="list">${R.map(r=>`<button class="row" data-gx="${r[4]}" data-id="${r[5]}"><span class="th ${r[1]}">${SV(r[0])}</span><span class="t"><b>${esc(r[2])}</b><small>${esc(r[3])}</small></span></button>`).join('')}</div>`:`<p class="sub ctr">${L('لا نتائج')}</p>`};
out.addEventListener('click',e=>{const r=e.target.closest('[data-gx]');if(!r)return;closeEl(b);setTimeout(()=>ACT[r.dataset.gx](r.dataset.id),60)});inp.oninput=run;run();setTimeout(()=>inp.focus(),80)}

/* =================== FAB → glass quick-add sheet =================== */
function quickAdd(){if($('.sheet.qa'))return;closeSheets();buzz();
const A=[['p',LU.pkg,'tn',L('منتج جديد'),L('أضف منتجًا للمخزون'),()=>addProduct()],['s',LU.cart,'g',L('تسجيل بيع'),L('بيع من المخزون'),()=>salePage()],['e',LU.receipt,'o',L('مصروف جديد'),L('إيجار، شحن، إعلانات…'),()=>addExpense()],['d',LU.hand,'r',L('دين جديد'),L('لي أو عليّ مع الدفعات'),()=>debtPage()]];
const b=sheet(`<h2 class="sh-h">${L('إضافة سريعة')}</h2><div class="qg">${A.map(a=>`<button class="qc" data-a="${a[0]}"><span class="th ${a[2]} lg">${SV(a[1])}</span><b>${a[3]}</b><small>${a[4]}</small></button>`).join('')}</div>`,'qa');
b.addEventListener('click',e=>{const x=e.target.closest('[data-a]');if(!x)return;const a=A.find(y=>y[0]===x.dataset.a);closeEl(b);setTimeout(a[5],140)})}

/* =================== shell, navigation, render =================== */
const TABS=[['home',LU.home,'الرئيسية'],['box',LU.pkg,'المنتجات'],['cart',LU.cart,'المبيعات'],['debt',LU.hand,'الديون'],['more',LU.grid,'المزيد']];
function buildChrome(){$('#nb').innerHTML=SV(LU.bell);$('#gb').innerHTML=SV(LU.search);$('#fab').innerHTML=SV(LU.plus);
$('#gb').setAttribute('aria-label',L('بحث'));$('#fab').setAttribute('aria-label',L('إضافة'));$('#nav').setAttribute('aria-label',L('التنقل'));
$('#nav').innerHTML='<i class="ind"></i>'+TABS.map(([k,ic,l])=>`<button data-t="${k}" aria-label="${esc(L(l))}">${SV(ic)}<span>${L(l)}</span></button>`).join('');
$('#dt').textContent=new Date().toLocaleDateString(loc(),{weekday:'long',day:'numeric',month:'long'});document.title='KOPTAN'}
function setNav(t){const n=$('#nav'),bs=n.querySelectorAll('button');bs.forEach(b=>b.classList.toggle('on',b.dataset.t===t));const b=n.querySelector('button.on'),i=n.querySelector('.ind');if(b&&i&&b.offsetWidth){i.style.width=(b.offsetWidth-8)+'px';i.style.transform='translateX('+(b.offsetLeft+4)+'px)'}document.documentElement.style.setProperty('--nh',n.offsetHeight+'px')}
function go(t){if(t!==tab){q='';per='all'}tab=t;render(true);scrollTo(0,0);buzz(5)}
function render(enter){const t=tab==='arch'?'box':tab,V=$('#v');setNav(t);V.className=enter&&S.k.anim!==false?'enter':'';
V.innerHTML=tab==='home'?vHome():tab==='cart'?vSales():tab==='debt'?vDebts():tab==='more'?vMore():vProducts();
if(enter&&V.firstChild)[...V.firstChild.children].forEach((c,i)=>c.style.setProperty('--i',Math.min(i,8)));
$('#ttl').textContent=t==='home'?'KOPTAN':L(TABS.find(x=>x[0]===t)[2]);$('#dt').hidden=t!=='home';
$('#hb').innerHTML=SV(S.k.hide?LU.eyeoff:LU.eye);$('#hb').setAttribute('aria-label',S.k.hide?L('إظهار المبالغ'):L('إخفاء المبالغ'));
anim(V);drawCharts();const sq=$('#sq'),LF=tab==='box'||tab==='arch'?plist:tab==='cart'?slist:tab==='debt'?dlist:null;if(sq&&LF)sq.oninput=e=>{q=e.target.value;$('#lst').innerHTML=LF();anim($('#lst'))};nfBadge()}
/* re-render the main view and every open page after a data change */
function refresh(){render(false);refreshPages()}
function rebuildUI(){buildChrome();$$('.pg').forEach(d=>{const id=d.dataset.sub;if(id){const h=d.querySelector('h1');if(h)h.textContent=L(SUBS[id].t)}d.querySelectorAll('[data-x]').forEach(x=>x.innerHTML=SV(BACK()))});refresh()}
$('#nav').addEventListener('click',e=>{const b=e.target.closest('[data-t]');if(b)go(b.dataset.t)});
$('#fab').onclick=()=>quickAdd();$('#gb').onclick=()=>gsearch();$('#nb').onclick=()=>openSub('nf');
$('#hb').onclick=async()=>{S.k.hide=!S.k.hide;await saveK();buzz(6);refresh()};
$('#imp').onchange=e=>{const f=e.target.files[0];e.target.value='';importJ(f)};
['#fg','#fc'].forEach(s=>$(s).addEventListener('change',onPick));
addEventListener('resize',()=>setNav(tab==='arch'?'box':tab));
addEventListener('error',e=>{if(e&&e.message&&!/ResizeObserver|Script error/i.test(e.message)){console.error(e.error||e.message);toast(L('حدث خطأ غير متوقع'),'w')}});
addEventListener('unhandledrejection',e=>{console.error(e.reason);toast(L('تعذر تنفيذ العملية'),'w')});
/* refresh time-dependent data (overdue debts, today's totals) when the app comes back to the foreground */
let lastDay=sod();document.addEventListener('visibilitychange',()=>{if(document.hidden)return;if(sod()!==lastDay){lastDay=sod();refresh()}selfUpdate(false)});

/* =================== boot =================== */
buildChrome();$('#v').innerHTML='<div class="wrap"><div class="hero sk"></div><div class="kgrid"><div class="kpi sk"></div><div class="kpi sk"></div></div></div>';
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
load().then(async()=>{applyPrefs();buildChrome();await migImgs();await migSup();await runRec();if(S.k.pin)lock();if(memOnly)warn(L('التخزين غير متاح هنا: البيانات مؤقتة'));render(true);sweepImgs();if(hasPl('CapacitorUpdater')){capCall('CapacitorUpdater','notifyAppReady').catch(()=>{});setTimeout(()=>selfUpdate(false),2500)}
const od=S.d.filter(d=>!d.arch&&dRem(d)>0&&d.due&&d.due<sod());if(od.length)setTimeout(()=>toast(plural(od.length,'لديك {n} دين متأخر','لديك {n} ديون متأخرة'),'w'),900);
const a=new URLSearchParams(location.search).get('a'),A={prod:addProduct,sale:()=>salePage(),exp:addExpense,debt:()=>debtPage()}[a];if(A&&!S.k.pin)setTimeout(()=>A(),300);document.body.classList.add('ready')});
if('serviceWorker'in navigator&&/^https?:/.test(location.protocol)&&!NAT()){const hadCtl=!!navigator.serviceWorker.controller;navigator.serviceWorker.register('sw.js').then(r=>{r.addEventListener('updatefound',()=>{const w=r.installing;w&&w.addEventListener('statechange',()=>{if(w.state==='activated'&&hadCtl)toast(L('تم تحديث التطبيق إلى أحدث إصدار ✓'),'ok')})})}).catch(()=>{})}
