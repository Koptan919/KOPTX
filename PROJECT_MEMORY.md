# KOPTAN · مدير أعمالي — Project memory

> Detailed, persistent context for future development sessions. The concise rules are in [CLAUDE.md](CLAUDE.md).
> Last updated: 2026-11-06 · App version **9.2.0** · Owner: Koptan919 (Arabic-speaking; replies to the owner in Arabic).

---

## 1. What the app is

A personal, single-user business manager for a small seller (Lebanon: USD + LBP, country code 961):
products & stock, sales (incl. partial payment → debt), expenses (incl. recurring), debts owed to / by the user with payments,
suppliers, notifications, reports, tasks, calendar, backups. **All data stays on the device** (IndexedDB) and the app works offline.

### Distribution
| Channel | Where | Updates |
|---|---|---|
| PWA (main) | https://koptan919.github.io/Koptan/ — branch `gh-pages` | Automatic: network-first `index.html`, versioned assets, SW cache `koptan-v<ver>`. From 9.1.1 an open app calls `registration.update()` on resume/online; when a new SW activates it reads `version.json` and, only if newer than the running `APP_VER`, shows a notice and reloads (after any open form closes) |
| Android APK | GitHub Releases `v<ver>-build-<n>` (workflow *Build APK*) | **Automatic self-update** (from 9.0.1; fully automatic from 9.1.1): when online (at start, on resume, on the `online` event; at most hourly unless the last check failed) it shows “updating to vX…”, downloads `koptan-<ver>.zip` via `@capgo/capacitor-updater` (manual mode), calls `next()`, then `set()` by itself with a “restarting…” notice. It waits while a form page (`.pg .ft`) is open (`whenIdle`). Auto-rollback if the bundle fails to call `notifyAppReady` |
| iOS IPA | Releases `ios-v<ver>-build-<n>` (workflow *Build IPA*) | Unsigned; sideload (Sideloadly/AltStore, 7-day free cert). Recommended iOS path is Safari → Add to Home Screen (PWA) |

Repository: `Koptan919/Koptan`. Working branch used so far: `ccr-e2573824-u58q6u` (source + workflows). `gh-pages` holds only the deployed web files + `version.json` + update zip + `.nojekyll`.

---

## 2. Architecture & files

No bundler, no framework, no npm deps for the app itself. Classic `<script>` files share one global scope, loaded in this order:

| File | Role |
|---|---|
| `index.html` | Shell: top header (`#ttl`, `#dt`, bell `#nb`, search `#gb`, eye `#hb`), `#v` main view, `#fab`, `#nav`, hidden file inputs `#fg` (gallery) `#fc` (camera) `#imp` (backup import). Inline script sets `dir=ltr` early if `localStorage['koptan.lang']==='en'`. Assets referenced with `?v=NNN`. |
| `app.css` | Whole design system (see §4). |
| `i18n.js` | `window.EN = { 'Arabic source': 'English', … }` (~730 keys). |
| `core.js` | `APP_VER`; `L()` i18n + `applyDir()`; Lucide icon paths `LU`, official WhatsApp SVG; state `S` + defaults `KDEF`; IndexedDB (`openDB/put/del/load/uniq`); formatting (`fmt`, `fd`, `day`, `dtm`, `toTs/toDs`); money math (`uc`, `sRev`, `prof`, `dPaid`, `dRem`, `toU`, `AGG`); toast (with action/undo), `confirmBox`, `sheet`, `shell` (live page with `_fill`), `page` (form page with dirty guard), `grp` chips, `invalid`; Android back-button history sync; phone/WhatsApp/url/map helpers + `cBtn`; image pipeline (Blob storage, thumbnails, hydration observer, `gcImgs`, `sweepImgs`, data-URL migration); native bridge (`NAT`, `hasPl`, `capCall`), image picking (Camera plugin → file input fallback), `saveFile` (Filesystem+Share → download fallback), `sha`, `log`, animated counters. |
| `views.js` | Delegated actions `ACT[name]` via `data-act`/`data-id`; periods (`per`, `rng`, `inR`); **home**; **profit chart**; **products** (filters, sort, grouping by supplier, card/list, detail page, add/edit page with draft autosave, quick edit, stock add with weighted cost, archive, delete+undo); **sales** (sale page, list, detail, return); **debts** (people view, list, person page, detail, add/edit, payments); **expenses** (page, recurring `runRec`, `expName`). |
| `more.js` | `SUBS` sub-pages + `openSub`/`refreshPages`; **suppliers** (stats, duplicates, migration, `resolveSup`, form, merge, delete, profile page); **notifications**; **data center** (stats, CSV, backup/restore with checksum); **settings**; `setLang`, `applyPrefs`, PIN form + lock screen; **self-update** (`selfUpdate`, `newer`); **reports**; expenses list; tasks; calendar; More menu; global search; **quick-add sheet**; nav/`render`/`refresh`/`rebuildUI`; boot. |
| `extra.js` | v9.1 features (loaded last): monthly goal (`goalHTML`), daily summary (`ACT.daySum`, `scheduleSum` → Android LocalNotifications id 9001), WhatsApp invoice (`invoice`, canvas PNG + `invText`, ref `INV-YYYYMMDD-XXXX`), customers (`customers()` derived from `s.cust`/debts, `SUBS.cus`, `ACT.cus`), reorder (`velocity`, `reorderList`, `SUBS.reo`, `ACT.supOrder`, wraps `nfAll` to add `r:` notifications), barcode (`scanCode` → BarcodeDetector + getUserMedia, manual fallback; `ACT.scanP`), biometric (`bioAvail/bioVerify/ACT.bioSet`: NativeBiometric plugin or WebAuthn platform authenticator), auto backups (`makeSnap`, `snapsHTML`, `autoBackup`), generic settings inputs `[data-setk]`, `afterBoot()`. Extends `KDEF`. |
| `fonts/` | Tajawal woff2 (arabic+latin × 400/500/700/800, ~96 KB) + `OFL-Tajawal.txt`. `@font-face` at top of app.css; no Google Fonts. |
| `sw.js` | Cache `koptan-v<ver>`; precaches core + versioned assets; navigation = network-first with 3.5 s fallback to cached `index.html`; versioned assets cache-first; deletes older caches (incl. legacy `pbm-v9`). Not registered inside the native app. |
| `manifest.json` | PWA manifest (rtl/ar, shortcuts `?a=sale|exp|prod|debt`, version). |
| `icon-192.png`, `icon-512.png` | Titanium × Burgundy bar-chart icon (rendered from an SVG with Playwright; used for PWA, APK launcher, iOS). |
| `tools/publish-web.sh <dir>` | Copies web files into a gh-pages checkout, builds `koptan-<APP_VER>.zip` (files at zip root) and `version.json`. |
| `tests/` | Playwright suite (§9). `tests/fixtures/v8/` = the pre-v9 single-file app, used to seed legacy data. |
| `.github/workflows/` | `build-apk.yml`, `build-ipa.yml`, `verify-pages.yml` (all `workflow_dispatch`). |

### Render model
- `render(enter)` rebuilds `#v` for the current `tab` (`home|box|arch|cart|debt|more`).
- `refresh()` = `render(false)` + `refreshPages()` (re-runs `_fill` of every open `shell` page and redraws charts). Call `refresh()` after any data change.
- Pages/sheets are DOM overlays; `OVS='.sheet-bg,.pg,.zm'` are tracked in `history` so the Android back button closes the top overlay. A `page` with unsaved edits asks before discarding (`_back`).
- In `shell(title, fill)`, `fill` receives the page element as its argument. Use that argument, **not** the outer `const`, because the first fill runs before `shell` returns (this caused a TDZ crash before; fixed).

### Data model (IndexedDB `pbm`, version 5, keyPath `id`): unchanged since v8, do not break it
- `p` product: `id,code?(barcode, unique),name,cat,cost,ship,extra,price,qty,min,sold,fav,arch,created,updated,imgs[],img,link,notes,pdate,adate,sid,supplier,phone,wa`. Unit cost `uc = cost+ship+extra`. `supplier/phone/wa` are a mirror of the linked supplier (kept in sync by `syncSp`).
- `s` sale: `id,pid,name,qty,price,disc,uc,rate,date,note,paid,pay,did?,cust?,cph?` (`cust` can now be set on any sale, not only credit sales). Snapshot: never recomputed.
- `e` expense: `id,amt(USD),cur,orig,rate,cat,pay,note,notes,date,pid,sid,img,rec(''|w|m),next,src?` (children of recurring expenses carry `src`).
- `d` debt: `id,who,phone,type(in=owed to me|out=I owe),amt,cur(USD|LBP),rate,date,due,reason,notes,pid,sid,img,arch,created,pays[{id,amt,date,note,settle}]`.
- `sp` supplier: `id,name,phone,wa,link,addr,img,notes,created`.
- `t` task `{id,title,due,done}` · `l` activity log `{id,m,d}` (messages stored in **Arabic**, translated on display via `LOGP`/`logTxt`).
- `k`: record `k` = settings (`KDEF` in core.js: `cur,rate,hide,pin(sha256 'pbm'+pin),vib,anim,cc,hp,srt,lastBk,lang,lite,nfStock,nfDebt,nfBk,nr[],nd[],nt{},chr,chm,supMig,supBak`); record `dr` = unsaved new-product draft; record `prebak-v8` = safety copy from the v8 supplier migration; records `snap0..snap2` = automatic in-app data snapshots `{id,at,counts,data:{sp,p,s,e,l,t,d,k}}` (no photos, no pin/bio). v9.1 settings: `biz,bizPh,goal,abk(off|d|w),sumOn,sumH,sumM,lead,bio,bioId,lastSnap,snapN,bkAsk`.
- `img`: `{id:'i…', full:Blob, th:Blob, t}`; referenced by id from products/expenses/debts/suppliers/draft.

### Backup format
v5 (current): `{app:'KOPTAN', v:5, ver, at, counts, sum, sp,p,s,e,l,t,d,k,imgs:[{id,full:dataURL}]}`, where `sum` = SHA-256 of `JSON.stringify({sp,p,s,e,l,t,d,k,imgs})` in that key order. PIN, `bio`, `bioId` and snapshot counters are excluded from backups. Import checks JSON validity, structure, per-record validity, checksum (ok / bad / none = legacy) and image data, then shows a preview (file vs. current counts) and asks twice before replacing. Rollback restores the previous data if anything throws. Legacy v4 files (old app, no `app`/`sum`) import fine.

---

## 3. Features (implemented, v9.0.x)

- **Home:** hero card with net profit (today / 7 days / month) + delta vs. previous period, sales & expenses, LBP alternate value; overdue-debt alert; KPI grid (owed to me, I owe, stock value, low stock); profit chart; last 5 operations + full history sheet. No add shortcuts on home: the **FAB** opens a glass bottom sheet (new product / sale / expense / debt).
- **Profit chart** (`chartHTML`/`drawChart`, used on Home and Reports): ranges daily (14 days), weekly (12), monthly (12), yearly (5); metrics profit (net = sales profit − expenses), sales, expenses. Touch/drag tooltip shows date and all three values. Bars animate in place; negative values go below a zero line; total + % vs. the previous equal-length window. Prefs saved (`chr`, `chm`). Data comes from `AGG` only.
- **Products:** search, filter chips (all/low/out/favorites/loss/categories), sort, card/list view, smart grouping by supplier (collapsible; auto-open when ≤2 groups or searching), archived view. Detail page: gallery, KPIs, sell / add stock / edit / more (duplicate, favorite, link supplier, archive, delete), stock & profit, supplier & contact (tel, WhatsApp with prefilled message, link), dates, notes, pricing simulator, sales history. Form: multiple photos (gallery/camera, set main, replace, remove), USD/LBP entry, live profit calc, optional supplier picker with match suggestion, **link fully optional** (validated only if filled), autosaved draft for new products.
- **Product delete:** confirmation sheet with “archive instead”, real delete, **Undo** toast (6.5 s). Images are kept until the undo window ends (`PENDING`). Sales keep their snapshot, so history and profit are unchanged. Linked debts are untouched.
- **Suppliers:** stable `sid` linking. Profile page: photo (tap to change), name, phone, address; Call (`tel:`), WhatsApp (official logo, green), Website, Map (Google Maps search or URL); KPIs (products, stock value, total purchases, profit from its sales); tabs Products (search, sort, edit, move) / Transaction history (purchases + sales); “New product from this supplier” (prefilled); merge; delete (unlinks products, never deletes them). Duplicate detection by normalized name or phone; review sheet; **merge only after confirmation**. Saving a supplier that matches an existing one asks first. Auto-link of legacy products (`migSup`).
- **Sales:** product picker, quantity stepper, price, date, received amount (full / half / credit), payment method; unpaid remainder creates **one** linked debt (`s.did`, `d.sid`); discount/note; detail sheet; return/cancel restores stock and removes or unlinks the debt.
- **Debts:** owed to me / I owe totals (tap to filter), people view (grouped by name), all, overdue; filters (period, status, currency, archived); person page with call/WhatsApp, totals, payments; debt detail with payments edit/delete, copy/share summary, archive (only when settled), delete. Payments larger than the remainder ask to record a settlement.
- **Expenses:** amount (USD/LBP), category grid (rent, shipping, ads, packaging, fuel, tools, salaries, other), date, description, payment method, recurring weekly/monthly (generated on launch without duplicates), invoice photo, links to product/sale; list page with today/month totals; CSV.
- **Notifications** (derived from data, no fake ones): overdue / due-soon debts, out of stock, low stock, price below cost, overdue tasks, backup reminder. Each has a stable id, a persisted first-seen timestamp (`nt`), read state (`nr`), deleted state (`nd`). UI: unread count badge on the bell, icon, title, detail, date & time, New/Read status, mark read/unread, delete, select mode (select all, mark read, delete selected with confirm), mark all read, delete all (confirm), tap opens the related item. Categories can be switched off in Settings.
- **Data center:** stats (products/archived/units, sales, expenses, debts open, suppliers, photos + size, storage used, last backup), full backup with photos, import with integrity check + preview, CSV exports (sales, expenses, debts, products), activity log.
- **Settings** (sections): General (display currency, exchange rate, phone country code, vibration, animations, performance mode); Language (Arabic / English); Notifications (stock, debts, backup reminder, open center); Data (data center, back up now); Security (hide amounts, PIN lock); About (check for updates, version). Every switch persists to `S.k`.
- **Other:** reports (period chips, KPIs, chart, comparison with previous period, financial summary, profit by product, expenses by category, stock, idle products, compare products, print/PDF, CSV); tasks; calendar with daily events; global search (products, suppliers, sales, expenses, debts); hide amounts; PIN lock (local only); manifest shortcuts `?a=`.
- **Android native (APK):** Camera plugin (`pickImages` gallery, `getPhoto` camera) with file-input fallback; Filesystem + Share for backups/CSV/images; `CapacitorUpdater` self-update; `notifyAppReady` at boot; update check at launch and on resume (at most hourly).

---

## 4. Design system: Titanium Gray × Burgundy Liquid Glass (`app.css`)

Tokens (`:root`):
- Base: `--bg #0b0c0f`, `--bg2 #121318`, text `--tx #f4f4f6`, muted `--mu #a6aab3`, `--mu2 #767a84`.
- Titanium: `--ti #cfd3da`, `--ti2 #8d929b`, `--ti3 #3c4048`; `--metal` silver gradient (`#eef0f3 → #b9bec6 → #7f858e`), used for the KOPTAN title.
- Burgundy: `--bu #6e1730`, `--bu2 #9b2546`, `--bu3 #c9416a`, `--bu4 #e8829f` (accent text); `--burg` gradient `#c9416a → #9b2546 → #6e1730` for primary buttons, active chips/segments, FAB, nav indicator, badges.
- Status: `--gr #42d293` (profit/positive), `--rd #ff6178` (loss/overdue), `--or #f3ab55` (expenses/warnings).
- Glass: `--glass` layered white gradients for surfaces; border `--gbd rgba(255,255,255,.1)`; highlight `--ghi`; floating layers `.gl` = `--float rgba(20,21,26,.6)` + `backdrop-filter: blur(22px) saturate(165%)`.
- `.amb` fixed ambient background (burgundy and titanium radial glows) that the glass sits on.

Rules:
- Cards (`.card .kpi .row .sec .ac .pc .pgp .hero .chartc .nfi .dc .grp .sph .es .qc .alert`) use the static glass gradient + inner highlight (no live blur, so they stay cheap).
- Only floating layers (header, nav, sheets, toasts, page header/footer, chart tooltip, select bar) use `.gl` blur.
- `.lite` (performance mode) removes `backdrop-filter` and uses opaque surfaces. It turns on automatically when `deviceMemory ≤ 3` or `hardwareConcurrency ≤ 4`, and is a user toggle. `.noanim` / `prefers-reduced-motion` disable animation.
- Tile color modifiers on `.th`/`.ki`: `g`, `o`, `r`, `tn` (titanium). **Do not use `t`**: `.t` is the text container class inside rows (that collision was a bug, fixed by renaming to `tn`).
- Icons: Lucide stroke icons via `SV(LU.x)`; WhatsApp uses its official mark (`WA_SVG`, green `#25D366`).
- Font: Tajawal (Google Fonts, cached by the SW; falls back to system fonts offline/in APK).
- Mobile-first. Content max width 680px. FAB pinned bottom-right, above a floating rounded nav. Touch targets ≥ 44px.

---

## 5. Localization (Arabic default, English) & RTL

- `L('النص العربي', {vars})` returns English from `EN` when `LANG==='en'`, with `{name}` interpolation. `plural(n,'{n} منتج','{n} منتجات')`.
- `LANG` is restored from `S.k.lang` (authoritative) and mirrored to `localStorage['koptan.lang']` for an instant first paint. `setLang()` saves, sets `<html lang/dir>`, rebuilds chrome and re-renders open pages.
- Directional icons: use `BACK()`/`FWD()` (they swap chevrons by language). Use logical CSS properties. Numbers, phones, URLs, dates use `dir="ltr"` inputs. Money is wrapped in Unicode isolates (`⁦…⁩`). English formats `$1,234` / `LBP 1,234`; Arabic `1,234 $` / `1,234 ل.ل`. Dates via `toLocaleDateString(loc())`: `ar-EG-u-nu-latn` (Latin digits) or `en-GB`.
- Stored user text (names, reasons, log messages, default debt reasons created in Arabic) is data and isn't translated. Exceptions: default expense labels (`expName`) and activity-log prefixes (`logTxt`) are translated on display.
- Coverage check: every Arabic single-quoted literal in core/views/more must be a key in `EN` (script in §9). Currently 731/731.

---

## 6. Money rules (single source of truth)
- Sale revenue `sRev = price*qty − disc`; profit `prof = sRev − uc*qty` (uses the sale's stored `uc`).
- `AGG(a,b)` → `{rev, gp, ex, net = gp − ex, n}` over sales/expenses in `[a,b)`. Debts and payments are **never** part of profit. A credit sale counts its revenue once; its unpaid part is only a debt.
- `uniq()` dedupes records by id on load so nothing is counted twice even if storage contained duplicates.
- LBP debts keep their own currency + `rate`; `toU()` converts to USD for totals.

---

## 7. Development log

### 2026-11-05: initial upload & builds
- Repo was empty; uploaded the user's zip (single-file app `index.html`, ~173 KB, internally “v7/v8/v10” layers) + `build-apk.yml`.
- APK workflow (Capacitor 6) built OK. Added GitHub Release publishing because artifact downloads aren't visible on mobile.
- iOS: added `build-ipa.yml` (unsigned, macOS runner); built OK. Published PWA to GitHub Pages (`gh-pages`, `.nojekyll`).

### 2026-11-05: v9.0.0 “Titanium Liquid Glass” (full rework, same data)
- Split the single file into `index.html / app.css / i18n.js / core.js / views.js / more.js`. All features re-implemented on the same IndexedDB schema.
- New: design system, EN/AR + RTL/LTR, FAB quick-add sheet, interactive chart, product delete + undo + archive alternative, supplier profiles (photo/address/website/map/history) + duplicate review, notification center rework, data center with checksum backups + preview, sectioned settings, performance mode, new icon.
- Bugs found and fixed during testing:
  - `.th.t` tile color collided with `.t` text container → renamed to `tn`.
  - SW “updated” toast showed on first install → only when a controller existed before registration.
  - `shell()` fill referenced its own `const` before it was assigned (TDZ) → fill now receives the element.
  - Closing a new-product form without edits saved a stray draft (click listener) → draft saves only on input; `page.close()` marks it dead.
  - Accordion chevron pointed sideways in RTL → physical borders.
  - “New vs previous” badge was green even when profit was negative → neutral “no earlier data”.
  - Data center showed “0 MB” for small images → KB.
  - Date inputs overflowed the 2-column grid at 320px → `minmax(0,1fr)` + `min-width:0`.
- Verified: 42/42 e2e, no overflow at 320/360/412px in AR/EN, SW upgrade from the old app (data kept, offline OK), live-site check all PASS. APK build 3 and IPA build 2 succeeded.

### 2026-11-05: v9.0.1 Android self-update
- Added `selfUpdate()` (manual-mode `@capgo/capacitor-updater`, `statsUrl:''` so no telemetry, `appReadyTimeout:15000`, `resetWhenUpdate:true`). Added Settings › About › “Check for updates”. Added `tools/publish-web.sh`. Workflows now read the version from `core.js`. Live check verifies `version.json` and the zip.
- Verified with a mocked native plugin: newer → download + `next` + “Update now” → `set`; same version → nothing; offline → silent auto check, clear message on manual check. Deployed 9.0.1 + `koptan-9.0.1.zip` to gh-pages.
- APK build fixes: updater 6.53.0 needed compileSdk 35 → pinned **6.25.6**; that still pulls `androidx.work 2.11.0` (needs SDK 35 / AGP 8.6) → workflow appends `resolutionStrategy.force "androidx.work:work-runtime:2.9.1"` to `android/build.gradle`. That still failed: play-services-tasks needs minSdk 23 → workflow sets `minSdkVersion = 23` (Android 6.0+). **Build APK run #7 succeeded** → release `v9.0.1-build-7` (debug-signed).
- Moved the test suite from a temporary folder into `tests/` (+ `tests/run.sh`, `tests/fixtures/v8`). Fixed a timing race in test O1.

### 2026-11-06: v9.0.2 PIN fix + more transparent glass
- **PIN bug:** Arabic Android keyboards type Arabic-Indic digits (٠-٩), so a correct PIN was rejected and setting a PIN failed the 4-digit check. Fix: `normD()` in core.js (Arabic-Indic/Persian → Latin) when setting a PIN. The lock screen is now an on-screen glass keypad (`.pin-dots`, `.pad`, `.pk`), so it doesn't depend on the system keyboard: auto-unlocks once the hash matches, backspace, shake + clear on wrong PIN, hardware keyboard digits work. PINs saved by older versions with Arabic digits still unlock (it tries Latin/Arabic-Indic/Persian forms).
- **Glass:** `--glass` lighter; cards get `backdrop-filter: blur(12px) saturate(150%)` + brighter top edge; `--float` .6→.34; sheets .78→.5; ambient glows stronger. `.lite` turns blur off on all cards and uses an opaque-ish fill.
- Verified: `tests/run.sh shots` all green (42/42 incl. new PIN cases, self-update, SW upgrade, no overflow at 320/360/412). Full-glass screenshots reviewed (headless Chromium auto-enables `.lite`, so they need `S.k.lite=false`). Live check 9/9 PASS (version.json 9.0.2, bundle 230 KB).
- Tests: `upd.js` now derives versions from `APP_VER`; Q1 covers keypad, wrong PIN, keyboard, legacy Arabic-digit PIN, and setting a PIN with Arabic digits.

### 2026-11-06: permanent APK signing key (infrastructure)
- Added `create-signing-key.yml`; `build-apk.yml` now signs with the decrypted permanent key and verifies the fingerprint (removed the old 4-secret base64 path). Tested the shell logic locally (key generation, AES round trip, wrong password rejected, fingerprint match/mismatch). Waiting for the owner to add `KEYSTORE_PASSWORD`.

### 2026-11-06: v9.1.0 eight features + local font
- Added (mostly in `extra.js`, small hooks in views.js/more.js):
  - WhatsApp invoice: image + text, from sale detail and from the toast after a sale.
  - Barcode: product field, camera scan, search, selecting a product on the sale page.
  - Fingerprint/face unlock.
  - Automatic in-app snapshots + full-backup reminder.
  - Daily summary (+ Android notification).
  - Reorder suggestions + WhatsApp order to the supplier.
  - Customers page + optional customer on every sale.
  - Monthly profit goal.
  - Tajawal bundled.
- Settings: store name/phone, goal, summary time, reorder lead days, auto-backup frequency, fingerprint.
- APK workflow adds `@capacitor/local-notifications@6.1.3`, `@capgo/capacitor-native-biometric@6.0.4` (both compileSdk 34) + POST_NOTIFICATIONS/USE_BIOMETRIC permissions. Copies `extra.js` and `fonts/`.
- Fixed during testing: product-page buttons overflowed at 320px once the real font loaded → `.acts .btn{flex:1 1 0;min-width:0}`. Invoice needed the 500 weight preloaded.
- Deployed 9.1.0 (bundle 328 KB); live check all PASS. **Build APK run #8 succeeded** → release `v9.1.0-build-8` (still debug-signed: `KEYSTORE_PASSWORD` not added yet).
- Verified: `tests/run.sh shots` → e2e 42/42, features 17/17 (WebAuthn via Chromium virtual authenticator, camera via fake device + mocked BarcodeDetector, native plugins mocked), self-update, SW upgrade from the pre-v9 app, no overflow at 320/360/412.

### 2026-11-06: v9.1.1 updates apply by themselves
- The owner wanted updates to install with a visible notice and no button. Android: `selfUpdate` → “جارٍ تحديث التطبيق إلى الإصدار X…” → download → `next()` → `whenIdle` → “تم تنزيل التحديث — جارٍ إعادة التشغيل…” → `set()`. A failed check resets the throttle, and `online` triggers a retry. Web: SW `updatefound` notice + reload when `version.json` is newer.
- Note: APKs running the 9.1.0 bundle receive 9.1.1 the old way (“Update now”/next launch). From 9.1.1 on, updates are automatic.
- Verified: `tests/upd.js` rewritten (newer → auto set + both notices; form open → waits, applies after close; same → nothing; offline → silent, then the `online` event updates); `tests/sw-upgrade.js` publishes a fake next release while the page is open → notice + self-reload. Full `tests/run.sh` green (e2e 42/42, features 17/17). Deployed 9.1.1; *Verify live site* run #5 all PASS. No APK rebuild needed (web-layer change).

### 2026-11-06: v9.2.0 smoother + haptics
- **Measured first** (`tests/perf.js`, 400 products / 6000 sales / 300 debts / 400 expenses, desktop Chromium; phones are ~4–6× slower). Baseline: home render 101 ms, More 68, sales 64, refresh with a page open 84, notifications 10.5, reorder 8.5. Scrolling was already 60 fps.
- **Causes and fixes:**
  - `opsAll()` formatted every record to show 5 → it now sorts lightweight refs (memoized) and formats only the rows shown.
  - `toLocaleString` / `toLocaleDateString` built a formatter on every call → cached `Intl.NumberFormat` (`NF0`, `NF2`) and `Intl.DateTimeFormat` (`DF`).
  - Derived data is recomputed only after writes: `DV` counter bumped in `put`/`del`; `memo(key,fn)` keyed by DV + day + language; used for ops, notifications (`nfAll`), reorder (`sold30` single pass), customers.
  - `refresh()` skips the hidden main view while a page is open and redraws when the last page closes (`mainDirty`).
  - Search typing is batched per animation frame.
- **Result:** home 6.9 ms (8.9 ms right after a data change), More 0.9 (2.8 cold), sales 10, refresh with a page open 3.
- **CSS:** removed live `backdrop-filter` from cards (they sit on the static ambient gradient; pixel diff vs before ≈ 0%, kept on header/nav/sheets/toasts). Added `content-visibility:auto` on list rows/cards, `touch-action:manipulation`, GPU layers for `.amb`/pages/sheets, springy press transitions. All motion kept.
- **Haptics:** `hap(kind)` in core.js: select / tap / press / heavy / success / warning / error. Uses the native `@capacitor/haptics@6.0.3` (APK) or `navigator.vibrate` (browser, only after user activation). Duplicates within 90 ms are merged and stronger feedback wins. Global light tap on every press; success/warning come from toasts; heavy on destructive confirm; error on wrong PIN; success on unlock. `buzz(n)` maps onto it. Setting “الاهتزاز عند اللمس”.
- Verified: `tests/run.sh shots` all green (e2e 42/42, features 18/18 incl. new F18 haptics with a mocked plugin, self-update, web auto-update, SW upgrade, no overflow).

---

## 8. Known issues / pending

- **APK signing (set up 2026-11-06, waiting on the owner):** the permanent-key system is in place but **not active yet**. The owner must add the repository secret `KEYSTORE_PASSWORD` (≥12 chars, chosen by them, never shared). Then run **Create signing key** once, then **Build APK**. Until then builds are debug-signed. The first release-signed APK needs one last back up → uninstall → install → restore; after that every APK installs as an update. Check `signing/` exists to know whether this is done.
- APK minimum is now Android 6.0 (minSdk 23), required by the updater's dependencies.
- **Not verified on a real device:** Camera/gallery plugin flow, Filesystem/Share save, and the actual self-update download/apply inside the APK (only tested with a mocked plugin). If the native camera call fails with a non-cancel error, the code falls back to the file input.
- iOS IPA is unsigned and doesn't self-update (Capgo updater not added to iOS). Recommend the PWA on iOS.
- Arabic plural forms are simplified (singular for 1, plural otherwise).
- Avatars use the first letter of user names (data, not translated).
- Headless test browsers report few CPU cores, so `autoLite()` turns on performance mode. Set `S.k.lite=false` before taking design screenshots.
- Soft-keyboard input of Arabic digits on the lock screen isn't testable in Playwright (it inserts text with no key event). Irrelevant now that the keypad is used.
- **v9.1 native parts not verified on a real phone:** NativeBiometric prompt, LocalNotifications daily notification, camera barcode scanning inside the Android WebView (BarcodeDetector support in WebView is uncertain; manual entry is the fallback), invoice image sharing via the Share plugin.
- Native features (fingerprint, daily notification, native haptics) need an APK built after they were added (haptics: v9.2.0+). Web features arrive by self-update. Haptics on a real phone are not verified yet.
- Pending ideas: delta updates; iOS self-update; ML Kit barcode plugin if WebView lacks BarcodeDetector.

---

## 9. Build, test, deploy

### Test locally (needs Node + Playwright/Chromium; this cloud environment has them preinstalled)
```bash
tests/run.sh          # 42 e2e checks + self-update (mocked native) + 18 feature checks + SW upgrade from the pre-v9 app
node tests/perf.js    # large-dataset timings (needs the run.sh server on :8123); compare before/after performance work
tests/run.sh shots    # + screenshots of every screen (320/412 ar, 360 en) and horizontal-overflow check
node --check core.js views.js more.js i18n.js sw.js
# translation coverage (prints missing keys; must be empty):
node -e "global.window={};require('./i18n.js');const fs=require('fs');const k=new Set();for(const f of ['core.js','views.js','more.js','extra.js'])for(const m of fs.readFileSync(f,'utf8').matchAll(/'((?:[^'\\\\\n]|\\\\.)*)'/g))if(/[؀-ۿ]/.test(m[1]))k.add(m[1]);console.log([...k].filter(x=>!(x in window.EN)))"
```
The e2e seeds data **with the old app's own functions** (`tests/fixtures/v8`) on the same origin, then opens the new app. That proves data compatibility. It covers: chart math vs `AGG`, FAB, product add with photo + optional link, supplier links (tel/wa/link/map), credit sale = one debt and single profit, expenses, debts/payments, supplier merge after confirm, delete + undo + permanent delete (history unchanged, image GC), archive, notifications (read, multi-delete, persistence, deep link, delete all), backup/restore (own, tampered, broken, legacy v4), settings persistence, Android back button, PIN, EN with no untranslated text, RTL restore, reload persistence, zero JS errors.

### Deploy the PWA + Android update bundle
```bash
git fetch origin gh-pages && git worktree add /tmp/ghp gh-pages   # or reuse an existing checkout
tools/publish-web.sh /tmp/ghp
cd /tmp/ghp && git add -A && git commit -m "Deploy KOPTAN vX.Y.Z" && git push origin gh-pages
```
Then run the **Verify live site** workflow (GitHub Actions → `verify-pages.yml`, dispatch on the working branch) and read the log. The cloud sandbox can't reach `*.github.io` directly.

### APK signing key (permanent)
- `create-signing-key.yml` (run **once**): needs secret `KEYSTORE_PASSWORD` (≥12 chars). It generates an RSA-4096 PKCS12 key (alias `koptan`, valid 100 years) on the runner, encrypts it with `openssl enc -aes-256-cbc -pbkdf2 -iter 600000` using that password, checks the encrypted copy decrypts to the same key, and commits `signing/koptan.jks.enc` + `signing/fingerprint-sha256.txt` to the dispatched branch. The plain key never leaves the runner. Refuses to run if the key already exists.
- `build-apk.yml`: if `signing/koptan.jks.enc` exists it **must** decrypt (else the build fails; it never falls back to debug). It signs `assembleRelease` and checks the APK's certificate SHA-256 equals the committed fingerprint. Without the file it builds debug.
- Losing the password = losing the ability to ship APK updates that install over the app. The owner should keep it in a password manager. (Web-layer self-updates keep working regardless.)
- Local round-trip test of the generate/encrypt/decrypt/fingerprint steps passed (keytool 17 + openssl). Not yet run on GitHub as of this entry.

### Native builds (GitHub Actions, `workflow_dispatch`, publish a Release)
- **Build APK** (`build-apk.yml`): Capacitor 6 + camera/filesystem/share + `@capgo/capacitor-updater@6.25.6`; forces `androidx.work 2.9.1`; minSdk 23; permissions CAMERA, READ_MEDIA_IMAGES, READ_EXTERNAL_STORAGE(≤32); icon replaced; `versionName` = `APP_VER`, `versionCode` = 100 + run number; release-signed if `KEYSTORE_*` secrets exist, otherwise debug. Release tag `v<ver>-build-<n>`; direct link `https://github.com/Koptan919/Koptan/releases/download/<tag>/KOPTAN.apk`.
- **Build IPA** (`build-ipa.yml`): macOS, Capacitor iOS, Info.plist usage strings, unsigned `KOPTAN.ipa`, tag `ios-v<ver>-build-<n>`.
- Rebuild native only when plugins or native config change. Web changes reach APK users through self-update.

---

## 10. Resuming in a new session
1. Read `CLAUDE.md`, then this file (§8 Known issues first).
2. `git log --oneline -10` and check the latest GitHub Actions runs (Build APK / Verify live site).
3. Run `tests/run.sh` to confirm a green baseline before you change anything.
4. Make the change → tests → release steps in CLAUDE.md → add an entry to §7 and update §8.
