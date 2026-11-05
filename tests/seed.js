/* seeds data using the OLD app's own functions so records have exactly the old shape */
module.exports=async(p)=>{await p.goto('http://localhost:8123/old/index.html',{waitUntil:'domcontentloaded'});await p.waitForTimeout(1500);
return await p.evaluate(async()=>{const D=864e5,now=Date.now();
const c=document.createElement('canvas');c.width=400;c.height=300;const x=c.getContext('2d');x.fillStyle='#8a1c3c';x.fillRect(0,0,400,300);x.fillStyle='#fff';x.font='60px sans-serif';x.fillText('IMG',120,170);
const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.9));const img=await procBlob(blob,false);
const mk=async(o)=>{const p={id:uid(),sold:0,fav:false,arch:false,created:now-40*D,min:2,ship:0,extra:0,imgs:[],img:'',notes:'',link:'',cat:'',supplier:'',phone:'',wa:'',pdate:now-40*D,adate:0,...o};if(p.supplier||p.phone)await resolveSup(p,'');S.p.push(p);await put('p',p);return p};
const p1=await mk({name:'سماعات بلوتوث',cat:'إلكترونيات',cost:10,price:25,qty:20,supplier:'شركة النور',phone:'+96170111222',imgs:[img],img,link:'https://example.com/p1'});
const p2=await mk({name:'شاحن سريع',cat:'إلكترونيات',cost:4,price:9,qty:1,min:3,supplier:'شركة النور',phone:'+96170111222'});
const p3=await mk({name:'حقيبة جلد',cat:'إكسسوارات',cost:30,price:28,qty:5,supplier:'مؤسسة الأمل',phone:'03123456'});
const p4=await mk({name:'منتج قديم',cost:2,price:5,qty:0,arch:true});
// duplicate supplier (same name, different phone)
const dup={id:uid(),name:'شركة النور',phone:'+96171999888',wa:'',link:'',created:now};S.sp.push(dup);await put('sp',dup);
const sale=async(p,q,daysAgo,paid)=>{const s={id:uid(),pid:p.id,name:p.name,qty:q,price:p.price,disc:0,uc:uc(p),rate:S.k.rate,date:sod()-daysAgo*D+3600e3*10,note:'',paid:paid??p.price*q,pay:'cash'};p.qty-=q;p.sold=(p.sold||0)+q;S.s.push(s);await put('s',s);await put('p',p);return s};
await sale(p1,2,0);await sale(p1,3,5);await sale(p3,1,40);
const s4=await sale(p1,1,1,10);const d0={id:uid(),pays:[],arch:false,cur:'USD',rate:S.k.rate,created:now,who:'أحمد',phone:'+96170555666',type:'in',amt:15,date:s4.date,due:sod()-2*D,reason:'بيع سماعات بلوتوث × 1',notes:'',pid:p1.id,sid:s4.id,img:''};s4.did=d0.id;s4.cust='أحمد';S.d.push(d0);await put('d',d0);await put('s',s4);
const d1={id:uid(),pays:[{id:uid(),amt:100,date:now-3*D,note:''}],arch:false,cur:'USD',rate:S.k.rate,created:now,who:'مورد الجملة',phone:'',type:'out',amt:300,date:now-10*D,due:sod()+2*D,reason:'بضاعة',notes:'',pid:'',sid:'',img:''};S.d.push(d1);await put('d',d1);
const e1={id:uid(),amt:200,cur:'USD',orig:200,rate:S.k.rate,cat:'rent',pay:'cash',note:'إيجار',notes:'',date:sod()-3*D,pid:'',sid:'',img:'',rec:'m',next:0};S.e.push(e1);await put('e',e1);
const e2={id:uid(),amt:15,cur:'USD',orig:15,rate:S.k.rate,cat:'ads',pay:'card',note:'إعلان فيسبوك',notes:'',date:sod(),pid:'',sid:'',img:'',rec:'',next:0};S.e.push(e2);await put('e',e2);
const t={id:uid(),title:'طلب بضاعة جديدة',due:now-3*D,done:false};S.t.push(t);await put('t',t);
await log('بيانات تجريبية');
return{p:S.p.length,s:S.s.length,e:S.e.length,d:S.d.length,sp:S.sp.length,t:S.t.length,img}})};
