# كيف يحدّث التطبيق نفسه تلقائيًا — دليل لـ Claude Code

> ملف تعليمي مستقل. أعطه لـ Claude Code وقل: «طبّق نظام التحديث التلقائي الموصوف في docs/AUTO-UPDATE.md».
> مأخوذ من نظام KOPT X الفعلي (الإصدار 9.9.2) الذي يعمل على الويب وعلى أندرويد، مع كل الأخطاء التي وقعنا فيها وحلولها.

---

## 1. الفكرة في 30 ثانية

```
أنت تعدّل الكود  →  ترفع رقم الإصدار  →  تنشر على GitHub Pages
                                              │
            ┌─────────────────────────────────┴─────────────────────────────────┐
            ▼                                                                   ▼
   نسخة الويب / الشاشة الرئيسية (PWA)                                 تطبيق أندرويد (APK)
   Service Worker يلاحظ أن sw.js تغيّر                         يقرأ version.json من الموقع
   → يحمّل الملفات الجديدة → يعيد تحميل الصفحة                  → إذا أحدث: ينزّل zip → يبدّل ملفاته → يعيد التشغيل
```

**المفتاح:** مصدر واحد للحقيقة هو **رقم الإصدار** (`APP_VER`)، وملف صغير على الموقع اسمه **`version.json`** يقول ما هو آخر إصدار وأين ملفه.

**متى لا يكفي هذا؟** التحديث التلقائي يغيّر HTML/CSS/JS فقط. أي تغيير في الجزء الأصلي للأندرويد (plugin جديد، صلاحية، أيقونة، اسم التطبيق) يحتاج APK جديدًا يثبّته المستخدم.

---

## 2. الأجزاء الستة

| # | الجزء | الملف |
|---|---|---|
| 1 | رقم الإصدار في الكود | `core.js` → `const APP_VER='9.9.2'` |
| 2 | أرقام كسر الكاش | `index.html` → `app.js?v=992`، و`sw.js` → `V`, `Q` |
| 3 | Service Worker | `sw.js` |
| 4 | تسجيل الـ SW وإعادة التحميل | `more.js` (عند التشغيل) |
| 5 | سكربت النشر: الملفات + `version.json` + `zip` | `tools/publish-web.sh` |
| 6 | التحديث الذاتي داخل الأندرويد | `more.js` → `selfUpdate()` + إعداد Capacitor |

---

## 3. رقم الإصدار (يتغيّر في 4 أماكن عند كل نشر)

```js
// core.js
const APP_VER='9.9.2';
```
```html
<!-- index.html: كل ملف بـ ?v= حتى لا يأخذ المتصفح نسخة قديمة -->
<link rel="stylesheet" href="app.css?v=992">
<script src="core.js?v=992"></script>
```
```js
// sw.js — تغيّر هذا السطر = المتصفح يكتشف أن هناك Service Worker جديدًا
const V='koptan-v9.9.2', Q='?v=992';
```
```json
// manifest.json
"version": "9.9.2"
```

> قاعدة: إذا نسيت تغيير `sw.js` لن يرى مستخدمو الويب التحديث. إذا نسيت `APP_VER` لن يتحدث الأندرويد (يقارن `version.json` بـ `APP_VER`).

---

## 4. Service Worker (sw.js) — كامل

```js
const V='app-v9.9.2', Q='?v=992';
const CORE=['./','index.html','manifest.json','icon-192.png','icon-512.png',
  'app.css'+Q,'core.js'+Q,'views.js'+Q /* … كل الملفات + الخطوط */];

// تثبيت: احفظ كل الملفات، ثم فعّل فورًا
self.addEventListener('install',e=>{e.waitUntil(
  caches.open(V).then(c=>Promise.all(CORE.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{}))))
  .then(()=>self.skipWaiting()))});

// تفعيل: احذف كاش الإصدارات القديمة وتحكّم بالصفحات المفتوحة
self.addEventListener('activate',e=>{e.waitUntil(
  caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x))))
  .then(()=>self.clients.claim()))});

self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
  if(u.origin!==location.origin)return;
  // فتح الصفحة: الشبكة أولًا (حتى تظهر النسخة الجديدة)، مع مهلة 3.5 ثانية ثم الكاش (بدون إنترنت)
  if(r.mode==='navigate'){
    const net=fetch(u.origin+u.pathname,{cache:'no-cache'}).then(x=>{if(x.ok){const c=x.clone();caches.open(V).then(k=>k.put('index.html',c))}return x});
    const slow=new Promise(res=>setTimeout(res,3500)).then(()=>caches.match('index.html')).then(h=>h||net);
    e.respondWith(Promise.race([net,slow]).catch(()=>caches.match('index.html')));return}
  // الملفات ذات ?v= لا تتغير أبدًا → الكاش أولًا
  e.respondWith(caches.match(r).then(h=>h||fetch(r).then(x=>{if(x.ok){const c=x.clone();caches.open(V).then(k=>k.put(r,c))}return x})))});
```

**لا تسجّل الـ SW داخل تطبيق الأندرويد** (`!NAT()`)؛ هناك مكوّن التحديث هو المسؤول.

---

## 5. تسجيل الـ SW وإعادة التحميل بأمان

```js
const newer=(a,b)=>{const x=String(a).split('.').map(n=>+n||0),y=String(b).split('.').map(n=>+n||0);
  for(let i=0;i<3;i++){if((x[i]||0)!==(y[i]||0))return(x[i]||0)>(y[i]||0)}return false}; // 9.10.0 > 9.9.2 ✓

// لا تُعِد التحميل والمستخدم يكتب في نموذج — انتظر حتى يُغلق
function whenIdle(fn){if(!document.querySelector('.pg .ft'))return fn();
  toast('سيُكمَل التحديث بعد إغلاق النموذج المفتوح');
  const o=new MutationObserver(()=>{if(!document.querySelector('.pg .ft')){o.disconnect();fn()}});
  o.observe(document.body,{childList:true})}

if('serviceWorker'in navigator && /^https?:/.test(location.protocol) && !NAT()){
  const hadCtl=!!navigator.serviceWorker.controller;          // false في أول زيارة → لا رسالة تحديث
  navigator.serviceWorker.register('sw.js').then(r=>{
    const chk=()=>r.update().catch(()=>{});
    addEventListener('online',chk);                             // عند عودة الإنترنت
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)chk()}); // عند الرجوع للتطبيق
    r.addEventListener('updatefound',()=>{const w=r.installing;if(!w||!hadCtl)return;
      const done=toastP('جارٍ تحديث التطبيق…');
      w.addEventListener('statechange',async()=>{if(w.state==='redundant')return done();if(w.state!=='activated')return;done();
        let v='';try{v=(await(await fetch('version.json?t='+Date.now(),{cache:'no-store'})).json()).version}catch(e){}
        if(v&&newer(v,APP_VER))whenIdle(()=>{toast('تم تنزيل التحديث '+v+' — جارٍ إعادة التشغيل…');setTimeout(()=>location.reload(),1200)})
      })})})}
```

لاحظ: `version.json` هنا **نسبي** (نفس مكان الصفحة)، فيعمل مهما كان عنوان الموقع.

---

## 6. سكربت النشر (tools/publish-web.sh)

```bash
#!/usr/bin/env bash
set -euo pipefail
SRC="$(cd "$(dirname "$0")/.." && pwd)"; OUT="${1:?gh-pages directory required}"
FILES="index.html sw.js manifest.json app.css i18n.js core.js views.js more.js extra.js icon-192.png icon-512.png"
VER=$(sed -n "s/^const APP_VER='\([0-9.]*\)'.*/\1/p" "$SRC/core.js"); [ -n "$VER" ]
for f in $FILES; do cp "$SRC/$f" "$OUT/$f"; done
mkdir -p "$OUT/fonts" && cp "$SRC"/fonts/* "$OUT/fonts/"
rm -f "$OUT"/app-*.zip
# مهم: الملفات في جذر الـ zip (لا مجلد داخلي) — المكوّن يبحث عن index.html في الجذر
(cd "$SRC" && zip -q -X -r "$OUT/app-$VER.zip" $FILES fonts)
BASE="${PAGES_BASE:-https://USER.github.io/REPO}"   # عنوان الموقع الحالي
printf '{"version":"%s","zip":"%s/app-%s.zip"}\n' "$VER" "$BASE" "$VER" > "$OUT/version.json"
```

النشر:
```bash
git fetch origin gh-pages && git worktree add /tmp/ghp origin/gh-pages
tools/publish-web.sh /tmp/ghp
cd /tmp/ghp && git add -A && git commit -m "Deploy vX.Y.Z" && git push origin HEAD:gh-pages
```

---

## 7. التحديث داخل تطبيق الأندرويد (Capacitor 6 + @capgo/capacitor-updater)

### 7.1 الإعداد (مرة واحدة، عند بناء الـ APK)

```bash
npm install @capacitor/core@6 @capacitor/cli@6 @capacitor/android@6 @capacitor/app@6.0.3 @capgo/capacitor-updater@6.25.6
```
`capacitor.config.json`:
```json
{ "plugins": { "CapacitorUpdater": {
    "autoUpdate": false,       // وضع يدوي: التطبيق يقرر متى (لا خوادم خارجية)
    "statsUrl": "",            // لا إحصائيات
    "appReadyTimeout": 15000,  // حزمة لا تقول "جاهزة" خلال 15 ث → رجوع تلقائي للسابقة
    "resetWhenUpdate": true    // تثبيت APK جديد يبدأ من ملفاته هو
}}}
```

### 7.2 عند التشغيل

```js
if(hasPl('CapacitorUpdater')){
  capCall('CapacitorUpdater','notifyAppReady').catch(()=>{});  // فورًا! وإلا يرجع للنسخة السابقة
  setTimeout(()=>selfUpdate(false),2500);
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)selfUpdate(false)});
addEventListener('online',()=>selfUpdate(false));
```

### 7.3 دالة التحديث (كاملة)

```js
// جرّب أكثر من عنوان: إذا تغيّر اسم المستودع ينتقل الموقع، والتطبيق المثبت يجب أن يجده
const UPD_URLS=['https://USER.github.io/NEW-REPO/version.json','https://USER.github.io/OLD-REPO/version.json'];
let updBusy=false,updAt=0;
async function selfUpdate(manual){
  if(!hasPl('CapacitorUpdater'))return;
  if(updBusy)return; if(!manual&&Date.now()-updAt<3600e3)return;   // مرة كل ساعة كحد أقصى
  updBusy=true;let done=null;
  try{
    let j=null,src='';
    for(const u of UPD_URLS){try{const r=await fetch(u+'?t='+Date.now(),{cache:'no-store'});if(r.ok){j=await r.json();src=u;break}}catch(e){}}
    if(!j)throw new Error('version.json unreachable');
    if(j.zip)j.zip=new URL(j.zip,src).href;          // يقبل رابطًا نسبيًا أو كاملًا
    updAt=Date.now();
    if(!j.version||!j.zip||!newer(j.version,APP_VER)){if(manual)ok('لديك أحدث إصدار');return}
    done=toastP('جارٍ تحديث التطبيق إلى الإصدار '+j.version+'…');
    const b=await capCall('CapacitorUpdater','download',{url:j.zip,version:j.version});done();done=null;
    await capCall('CapacitorUpdater','next',{id:b.id});   // أولًا: يُطبَّق في التشغيل القادم حتى لو انقطع شيء
    whenIdle(()=>{toast('تم تنزيل التحديث — جارٍ إعادة التشغيل…');
      setTimeout(()=>capCall('CapacitorUpdater','set',{id:b.id}).catch(()=>{}),1500)});  // يبدّل الآن
  }catch(e){updAt=0;if(manual)warn('تعذر التحقق من التحديثات — تأكد من الإنترنت')}  // فشل → حاول مجددًا لاحقًا
  finally{done&&done();updBusy=false}
}
```

### 7.4 لماذا `download → next → set`؟
- `download`: ينزّل ويفك الـ zip داخل التطبيق.
- `next`: «استعمل هذه الحزمة في التشغيل القادم» → آمن حتى لو أُغلق التطبيق الآن.
- `set`: «بدّل الآن» → إعادة تحميل فورية، بعد أن يُغلق المستخدم أي نموذج.
- إذا كانت الحزمة الجديدة معطوبة ولم تستدعِ `notifyAppReady` خلال 15 ثانية → يرجع المكوّن للنسخة السابقة تلقائيًا.

### 7.5 التوقيع الدائم للـ APK (بدونه كل APK جديد = حذف التطبيق وضياع البيانات)
- workflow يُشغَّل **مرة واحدة**: يولّد مفتاحًا، يشفّره بكلمة سر من GitHub Secrets، ويحفظ الملف المشفّر + بصمته في المستودع.
- workflow البناء: يفك التشفير، يوقّع، **ويفشل إذا لم تطابق البصمة**.
- لا تحذف المفتاح أبدًا ولا تطبع كلمة السر.

---

## 8. أخطاء حقيقية وقعنا فيها — تعلّم منها

| ما حدث | النتيجة | الدرس |
|---|---|---|
| **تغيّر اسم مستودع GitHub** (Koptan → KOPTX) | GitHub Pages انتقل لعنوان جديد ولا يحوّل القديم → التطبيقات المثبتة توقفت عن التحديث | اجعل التطبيق يجرّب **عدة عناوين**، واستعمل روابط نسبية حيث يمكن. لا تغيّر اسم المستودع بعد النشر |
| نشرنا إصدارًا **أقدم** فوق أحدث على gh-pages | المستخدمون رأوا نسخة قديمة دقيقة | قبل النشر دائمًا: `git show origin/gh-pages:version.json` يجب ألا يكون أحدث من كودك |
| مقارنة الإصدارات كنصوص | `"9.10.0" < "9.9.0"` خطأ | قارن رقمًا رقمًا (`newer()`) |
| zip فيه مجلد داخلي | المكوّن لا يجد `index.html` | الملفات في جذر الـ zip |
| رسالة «تم التحديث» في أول زيارة | إزعاج | لا رسالة إذا لم يكن هناك SW سابق (`hadCtl`) |
| إعادة تحميل والمستخدم يكتب | ضياع ما كتبه | `whenIdle()` ينتظر إغلاق النماذج |
| تحديث معطوب | تطبيق لا يفتح | `notifyAppReady` + `appReadyTimeout` = رجوع تلقائي |
| مفتاح debug عشوائي في كل بناء | كل APK يحتاج حذف التطبيق | مفتاح توقيع دائم |
| updater 6.53 يحتاج SDK 35 | فشل البناء | ثبّت `@capgo/capacitor-updater@6.25.6` + `force androidx.work 2.9.1` + `minSdk 23` |

---

## 9. اختبار التحديث (قبل كل نشر)

- **الأندرويد بدون هاتف:** حاكِ `window.Capacitor` في Playwright وسجّل الاستدعاءات، واعترض `version.json` بـ `page.route`:
  - إصدار أحدث → يجب `download` ثم `next` ثم `set` ورسالتان.
  - نموذج مفتوح → لا `set` حتى يُغلق.
  - نفس الإصدار → لا شيء.
  - بدون إنترنت → صمت، ثم عند `online` يتحدث وحده.
  - العنوان الجديد معطّل → يستعمل القديم.
- **الويب:** افتح الصفحة، ثم «انشر» نسخة وهمية جديدة (غيّر `sw.js` و`version.json` في مجلد الخادم) وتأكد أن الرسالة ظهرت والصفحة أعادت التحميل وحدها.
- **بعد النشر:** workflow يفتح الموقع الحقيقي ويتأكد أن `version.json` = الإصدار في الصفحة، وأن الـ zip قابل للتنزيل، وأن التطبيق يعمل بدون إنترنت.

---

## 10. قائمة كل نشر (انسخها)

1. `git show origin/gh-pages:version.json` ← ليس أحدث من كودك.
2. ارفع الإصدار في 4 أماكن: `APP_VER`، `?v=` في index.html، `V`/`Q` في sw.js، manifest.
3. الاختبارات تنجح.
4. commit + push.
5. `tools/publish-web.sh` على gh-pages ثم push.
6. فحص الموقع المباشر: كل شيء PASS.
7. APK جديد فقط إذا تغيّر شيء أصلي.

---

## 11. نص جاهز تعطيه لـ Claude Code

```text
أضف تحديثًا تلقائيًا لتطبيقي (PWA على GitHub Pages + APK بـ Capacitor 6) كما في docs/AUTO-UPDATE.md:
1) ثابت APP_VER، ونفس الرقم في ?v= لكل ملف وفي اسم كاش sw.js وفي manifest.
2) sw.js: install يحفظ الملفات + skipWaiting؛ activate يحذف الكاش القديم + clients.claim؛
   التنقل = الشبكة أولًا مع مهلة 3.5ث ثم الكاش؛ ملفات ?v= = الكاش أولًا.
3) الصفحة: سجّل sw.js (ليس داخل الأندرويد)، استدعِ update() عند الرجوع وعند online،
   وعند تفعيل SW جديد اقرأ version.json النسبي وأعد التحميل فقط إن كان أحدث وبعد إغلاق النماذج.
4) publish-web.sh: ينسخ الملفات لـ gh-pages، يصنع app-<ver>.zip (الملفات في الجذر)، ويكتب version.json.
5) الأندرويد: @capgo/capacitor-updater@6.25.6 بـ autoUpdate:false, statsUrl:'', appReadyTimeout:15000, resetWhenUpdate:true؛
   notifyAppReady عند التشغيل؛ selfUpdate يجرّب عدة عناوين لـ version.json، يحل رابط zip نسبيًا،
   ثم download → next → (بعد إغلاق النماذج) set، مرة كل ساعة كحد أقصى وعند online والرجوع للتطبيق.
6) مفتاح توقيع APK دائم مشفّر في المستودع، وworkflow البناء يفشل إذا لم تطابق البصمة.
7) اختبارات Playwright تحاكي Capacitor وتعترض version.json لكل الحالات أعلاه.
قارن الإصدارات رقمًا رقمًا، ولا تنشر أبدًا إصدارًا أقدم مما هو على gh-pages.
```
