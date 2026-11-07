# ثيم KOPT X — Titanium Gray × Burgundy Liquid Glass

> ملف لتعليم Claude Code (أو أي مصمم/مطوّر) هذا الثيم ليطبّقه بنفس الشكل في أي تطبيق.
> القيم مأخوذة حرفيًا من `app.css` في هذا المستودع. ضع الملف في مشروعك واطلب من Claude: «اتبع docs/THEME.md».

---

## 1. الهوية بجملة واحدة

**داكن، فاخر، هادئ**: خلفية سوداء مائلة للرمادي، سطوح زجاجية شبه شفافة بحواف مضيئة، فضي معدني (تيتانيوم) للعناوين، و**عنابي** (Burgundy) لون التمييز الوحيد للأزرار المهمة والحالة النشطة. الأخضر والأحمر والبرتقالي فقط للحالات (ربح / خسارة / تنبيه).

## 2. المتغيرات (انسخها كما هي)

```css
:root{color-scheme:dark;
  /* الأساس */
  --bg:#0b0c0f; --bg2:#121318;        /* الخلفية */
  --tx:#f4f4f6;                        /* النص */
  --mu:#a6aab3; --mu2:#767a84;         /* نص ثانوي / باهت */
  /* تيتانيوم (فضي) */
  --ti:#cfd3da; --ti2:#8d929b; --ti3:#3c4048;
  /* عنابي */
  --bu:#6e1730; --bu2:#9b2546; --bu3:#c9416a; --bu4:#e8829f;  /* bu4 = نص مميز على الداكن */
  /* الحالات */
  --gr:#42d293;   /* ربح / نجاح */
  --rd:#ff6178;   /* خسارة / متأخر / حذف */
  --or:#f3ab55;   /* مصاريف / تنبيه */
  /* الزجاج */
  --glass:linear-gradient(150deg,rgba(255,255,255,.065),rgba(255,255,255,.012) 55%,rgba(255,255,255,.03));
  --gbd:rgba(255,255,255,.1);          /* حافة الزجاج */
  --ghi:rgba(255,255,255,.17);         /* اللمعة العلوية */
  --float:rgba(20,21,26,.34);          /* خلفية الطبقات العائمة */
  --blur:blur(22px) saturate(165%);
  --sh:0 10px 30px rgba(0,0,0,.38);
  --r:20px;                            /* زاوية البطاقات */
  /* التدرجات */
  --burg:linear-gradient(140deg,#c9416a 0%,#9b2546 45%,#6e1730 100%);
  --metal:linear-gradient(140deg,#eef0f3 0%,#b9bec6 40%,#7f858e 100%);
}
```

## 3. الخلفية المضيئة (أساس شكل «الزجاج»)

الزجاج لا يظهر جميلًا فوق لون سادة؛ يحتاج إضاءة خلفه. ضع عنصرًا ثابتًا خلف كل شيء:

```html
<div class="amb"></div>
```
```css
.amb{position:fixed;inset:0;z-index:-1;pointer-events:none;background:
  radial-gradient(60% 40% at 92% -4%, rgba(155,37,70,.55), transparent 70%),
  radial-gradient(55% 38% at -6% 30%, rgba(130,28,58,.4),  transparent 72%),
  radial-gradient(70% 45% at 100% 78%,rgba(170,178,192,.18),transparent 70%),
  radial-gradient(60% 40% at 0% 105%, rgba(155,37,70,.3),  transparent 70%),
  linear-gradient(180deg,#0d0e12,#0a0b0e);
  transform:translateZ(0)}
body{background:var(--bg);color:var(--tx);font:15px/1.45 Tajawal,'Noto Sans Arabic',system-ui,sans-serif}
```

## 4. نوعان من الزجاج (قاعدة مهمة للأداء)

| النوع | أين | كيف |
|---|---|---|
| **زجاج ثابت** | البطاقات، الصفوف، الأقسام، المؤشرات (كثيرة العدد) | تدرّج أبيض شفاف + حافة + لمعة. **بدون** `backdrop-filter` حتى يبقى التمرير سريعًا |
| **زجاج عائم حقيقي** `.gl` | الشريط العلوي، شريط التنقل، النوافذ السفلية، الرسائل، فوتر الصفحات | `backdrop-filter: blur(22px)` فعلي |

```css
/* بطاقة */
.card{background:var(--glass);border:1px solid rgba(255,255,255,.12);border-radius:var(--r);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.18),      /* لمعة الحافة العلوية */
             inset 0 -1px 0 rgba(255,255,255,.03),
             0 6px 18px rgba(0,0,0,.22)}
/* طبقة عائمة */
.gl{background:var(--float);-webkit-backdrop-filter:var(--blur);backdrop-filter:var(--blur);
  border:1px solid var(--gbd);box-shadow:inset 0 1px 0 var(--ghi),var(--sh)}
```

**وضع الأداء** (للهواتف الضعيفة، يُفعَّل تلقائيًا إذا `deviceMemory<=3` أو `hardwareConcurrency<=4`، ويمكن تبديله من الإعدادات):
```css
.lite .gl{background:rgba(22,23,28,.97);backdrop-filter:none}
.lite .card{background:linear-gradient(150deg,rgba(255,255,255,.085),rgba(255,255,255,.035));box-shadow:inset 0 1px 0 rgba(255,255,255,.08)}
```

## 5. المكوّنات

```css
/* زر عادي (زجاجي) */
.btn{min-height:48px;padding:0 16px;border-radius:15px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;gap:7px;
  color:var(--tx);background:rgba(255,255,255,.07);border:1px solid var(--gbd);box-shadow:inset 0 1px 0 rgba(255,255,255,.12)}
/* زر رئيسي (عنابي) — واحد فقط في كل شاشة */
.btn.p{background:var(--burg);color:#fff;border-color:rgba(232,130,159,.35);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 6px 16px rgba(110,23,48,.45)}
.btn:active{transform:scale(.97)}

/* زر + العائم */
.fab{width:60px;height:60px;border-radius:22px;color:#fff;background:var(--burg);border:1px solid rgba(232,130,159,.45);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 10px 26px rgba(110,23,48,.6)}

/* مربع الأيقونة الملوّن داخل الصفوف — الألوان حسب المعنى */
.th{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:rgba(255,255,255,.07);color:var(--ti)}
.th.g {background:rgba(66,210,147,.13);color:var(--gr)}    /* ربح، مبيعات */
.th.o {background:rgba(243,171,85,.14);color:var(--or)}    /* مصاريف، تنبيه */
.th.r {background:rgba(201,65,106,.2); color:var(--bu4)}   /* عنابي: أمان، ديون، مهم */
.th.tn{background:rgba(207,211,218,.1);color:var(--ti)}    /* تيتانيوم: محايد */

/* مفتاح تشغيل */
.sw{width:52px;height:31px;border-radius:99px;background:rgba(255,255,255,.14);border:1px solid var(--gbd)}
.sw.on{background:var(--burg);border-color:rgba(232,130,159,.4)}

/* أزرار مجموعة (segmented) */
.seg{display:flex;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.07);border-radius:13px;padding:3px;gap:2px}
.seg button.on{background:var(--burg);color:#fff}

/* نافذة سفلية */
.sheet{max-width:680px;border-radius:28px 28px 0 0;background:rgba(24,25,30,.5)}  /* + class gl */

/* رسالة (toast) — كبسولة عائمة أعلى الشاشة */
.toast{border-radius:99px;padding:10px 16px;font-weight:700}                   /* + class gl */

/* عنوان معدني (الشعار) مع حرف عنابي */
.logo{background:var(--metal);-webkit-background-clip:text;background-clip:text;color:transparent}
.logo i{font-style:normal;background:var(--burg);-webkit-background-clip:text;background-clip:text;color:transparent}
```
```html
<h1 class="logo">KOPT <i>X</i></h1>
```

## 6. الخط والأيقونات

- الخط **Tajawal** (عربي + لاتيني) بالأوزان 400/500/700/800، **مدمج محليًا** (`fonts/*.woff2` + `@font-face`) وليس من Google Fonts، حتى يعمل بدون إنترنت.
- الأحجام: نص عادي 15px، صغير 12–13px، عنوان صفحة 20–21px وزن 800، الأرقام الكبيرة وزن 800.
- أيقونات **Lucide** خطية: `stroke-width:2`، `stroke-linecap:round`، حجم 22px، لونها `currentColor`.
- واتساب بشعاره الرسمي فقط، أخضر `#25D366`.

## 7. القواعد (هي ما يجعل الشكل متناسقًا)

1. **عنابي = فعل مهم أو حالة نشطة فقط**: زر رئيسي واحد، المفتاح المفعّل، التبويب المحدد، شارة العدد. لا تلوّن به نصوصًا عادية (استعمل `--bu4` للنص المميز).
2. **أخضر/أحمر/برتقالي للمعنى فقط** (ربح/خسارة/تنبيه)، ليس للزينة.
3. **العناوين والشعار بالمعدني** `--metal`؛ باقي النص `--tx` أو `--mu`.
4. **كل سطح = زجاج**: لا ألوان سادة معتمة للبطاقات. تدرّج شفاف + حافة 1px + لمعة علوية `inset 0 1px 0`.
5. **blur حقيقي على الطبقات العائمة فقط**؛ البطاقات بدون blur (أداء).
6. **زوايا دائرية كبيرة**: بطاقات 20px، أزرار 15px، أيقونات 14px، نوافذ سفلية 28px، رسائل وكبسولات 99px.
7. **أهداف لمس ≥ 44px**، عرض المحتوى الأقصى 680px، تصميم للهاتف أولًا (320px يجب أن يعمل).
8. **اتجاه منطقي**: `margin-inline-start` و`inset-inline-end` بدل left/right، ليعمل العربي والإنجليزي.
9. **حركة ناعمة قصيرة** (0.12–0.3s، `cubic-bezier(.2,.9,.3,1)`)، مع احترام `prefers-reduced-motion`.
10. **وضع داكن دائمًا** (`color-scheme:dark`)، ولا وضع فاتح.

## 8. نص جاهز تعطيه لـ Claude

```text
صمّم الواجهة بثيم "Titanium Gray × Burgundy Liquid Glass" الموصوف في docs/THEME.md:
- انسخ متغيرات :root كما هي، وأضف عنصر .amb للإضاءة الخلفية.
- البطاقات زجاج ثابت (تدرّج شفاف + حافة 1px + لمعة علوية، بدون backdrop-filter).
- الشريط العلوي وشريط التنقل والنوافذ السفلية والرسائل زجاج عائم .gl مع blur(22px).
- العنابي --burg فقط للزر الرئيسي والحالة النشطة؛ الأخضر/الأحمر/البرتقالي للمعنى فقط.
- العناوين بالتدرّج المعدني --metal. خط Tajawal محلي. أيقونات Lucide خطية 22px.
- زوايا 20/15/14/28/99px، أهداف لمس ≥44px، CSS منطقي لدعم RTL، ووضع أداء .lite بدون blur.
```
