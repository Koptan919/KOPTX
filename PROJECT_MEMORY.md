# KOPT X (formerly KOPTAN) · مدير أعمالي — Project memory

> Detailed, persistent context for future development sessions. The concise rules are in [CLAUDE.md](CLAUDE.md).
> Last updated: 2026-11-06 · App version **9.9.1** · Owner: Koptan919 (Arabic-speaking; replies to the owner in Arabic).

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
- Deployed 9.2.0; *Verify live site* run #6 success. **Build APK run #9 succeeded** → release `v9.2.0-build-9` (debug-signed; includes Haptics, NativeBiometric, LocalNotifications, Camera, Filesystem, Share, CapacitorUpdater).

### 2026-11-06: v9.3.0 professional invoice, working haptics, settings redesign
- **Invoice** (`extra.js` › `invImage/invText/invNo/invInfo`):
  - White-paper layout: burgundy edge bars, logo + store name/phone/address, title + number + date/time, “billed to” (or walk-in customer).
  - Payment-status pill: paid / partially paid / unpaid (from the linked debt), payment method, items table (# / item / qty / unit price / amount), totals box (subtotal, discount, burgundy total band, paid, remaining), optional sale note, custom footer (`S.k.invNote`), tax no. (`S.k.bizTax`).
  - **Sequential numbers** `INV-00001`: optional field `s.inv`, counter `S.k.invN`; assigned once per sale.
  - WhatsApp text uses *bold*.
- **Haptics:** web pulses were 5–14 ms, which many phones ignore → now 12–45 ms × strength. New strength setting `S.k.vibLv` (l/m/h) maps to native impact styles (heavy is always HEAVY). `hapInfo()` tells native / web / oldapk / ios / none; Settings › “تجربة الاهتزاز” vibrates and explains if unsupported. Reasons a user may feel nothing: an APK older than 9.2.0 (no plugin, no VIBRATE permission) or iPhone Safari (no Vibration API). The native plugin uses the Vibrator directly (LIGHT 50 ms amp 110), not the system touch-feedback setting.
- **Settings redesigned:**
  - Store card + edit button at the top.
  - Every row has an icon tile (`SIc`, `SWI`, `SVR`, `SSG`, `SRI` helpers in more.js).
  - Values open edit sheets (`EDIT` + `editK` in extra.js; numbers accept Arabic digits/decimal `٫` via `numIn`).
  - New sections: Invoice, Currency & goals, Look & feel. Rows wrap at 320px.
- New optional settings: `bizAddr, bizTax, invNote, invN, vibLv`.
- Verified: `tests/run.sh shots` → e2e 42/42, features 20/20 (new F19 invoice numbering/status/footer, F20 strength + old-APK diagnosis; F2/F14 use the edit sheets), self-update, web auto-update, SW upgrade, no overflow. Invoice and settings screenshots reviewed. Deployed 9.3.0; *Verify live site* run #7 success. No APK rebuild needed (haptics plugin already in APK 9.2.0-build-9).

### 2026-11-06: v9.3.1 dark invoice
- The owner asked for the invoice in the dark color. `invImage` keeps the 9.3.0 layout and data (sequential number, status pill, address, tax no., notes, custom footer) but is now drawn dark: `#0b0c0f` background with soft burgundy/titanium glows, burgundy edge bars, rounded glass frame, metal-gradient store name and title, logo outline, dark table header, status pill as tinted outline (colors mapped by `DK` from `invInfo`'s light colors, so `invInfo`/`invText` are unchanged), burgundy-gradient total box. Amounts are drawn LTR so Arabic shows `70 $` / `−5 $` like the app (the minus sign used to land on the wrong side).
- Verified: AR/EN previews (partial debt with note/address/tax, walk-in paid by card), `tests/run.sh shots` green (e2e 42/42, features 20/20, self-update, web auto-update, SW upgrade, no overflow); invoice screenshots reviewed. Deployed 9.3.1; *Verify live site* run #8 (attempt 2) all PASS (version.json 9.3.1, bundle 335 KB). Web-layer only, no APK rebuild.
- **Incident:** this session started from an older branch (9.2.0) and published a 9.2.1 build to gh-pages over the live 9.3.0 for about a minute, then reverted it (gh-pages `cc00f72`). APKs only update to newer versions, so none moved back. The 9.2.1 commit is reverted on `claude/new-session-a3tcdh`, and 9.3.0 (`ccr-e2573824-u58q6u`) is merged into it. **Before deploying, always check `git show origin/gh-pages:version.json` and that the source branch contains the live version.**

### 2026-11-06: v9.4.0 what's new notifications + Android back button
- **What's new** (`extra.js`): `CHANGES` = release notes, newest first (`{v,d,n:[Arabic notes]}`; **add an entry with every release** + EN keys). `updSeen()` (from `afterBoot`) runs once per version (`S.k.lastVer`): it queues the versions installed since the last run (only the current one on a first run) in `S.k.updN` (max 3, newest first; `nt` stamps keep newest on top). `nfAll1` adds one notification per queued version (`u:<ver>`, kind `upd`, green spark, opens `SUBS.upd`). After a real update a toast “Updated to version X” with a “What's new” button. `SUBS.upd` page lists every version ≤ APP_VER. Settings: switch `nfUpd` (Notifications) and row “ما الجديد” (About, `ACT.whatsNew`). New optional settings: `lastVer, updN, nfUpd`.
- **Back button.** Root cause: the APK had no `@capacitor/app`, and Capacitor core has no back handling (checked in `@capacitor/android` 6.2.3: only the App plugin calls `canGoBack/goBack`), so Back always closed the app. Changes:
  - `build-apk.yml` adds `@capacitor/app@6.0.3`. `afterBoot` registers `App.addListener('backButton')` → `backTop()` (top overlay; respects a dirty form's `_back`) else `backRoot(true)`.
  - Web/PWA: a guard history entry (`hguard`, pushed on pointerdown/keydown or before overlay entries) sits under the overlay entries; popstate with no overlay → `backRoot(false)`.
  - `backRoot`: archive → products, else the previous tab (`TS` stack kept by `go(t)`, deduped, max 12), else Home. On Home the first press shows “اضغط رجوع مرة أخرى للخروج”, a second press within 2.5 s exits (`App.exitApp` natively; on the web the guard isn't re-pushed, so the browser leaves).
- Verified: `tests/run.sh shots` green (e2e 42/42 incl. P1 overlay back, features 24/24: new F21 what's new, F22 web back, F23 native back with a mocked App plugin, F24 no JS errors), self-update, web auto-update, SW upgrade, no overflow. AR/EN screenshots of toast, notification center and the What's new page reviewed.
- Deployed 9.4.0; *Verify live site* run (id 42277102882) all PASS (version.json 9.4.0, bundle 338 KB).
- **Needs a new APK** for the back button (native plugin). The web part (what's new) arrives by self-update.

### 2026-11-06: v9.5.0 rebrand to KOPT X + new icon
- The owner sent a new icon (white K with a burgundy stroke on near-black, 1024²) and a wordmark “KOPT X — Business Manager”, and chose **icon + rename to KOPT X**.
- `icon-192.png` / `icon-512.png` regenerated from the owner's 1024² PNG (PIL LANCZOS). Used by the PWA, favicon/apple-touch, lock screen, settings store card, About, the invoice image, the APK launcher and the iOS icon (both workflows copy them).
- Visible name → **KOPT X**: `<title>`, meta description, manifest `name`/`short_name`, header (`#ttl` on Home = `KOPT <i class="tx">X</i>`, X in the `--burg` gradient), lock screen, About, More footer, default store name (`S.k.biz||'KOPT X'`) in invoice/WhatsApp text/daily summary/supplier order, invoice footer, biometric prompt titles, WebAuthn rp name/displayName (existing credentials still work: rpId unchanged), backup error text. APK/IPA `cap init "KOPT X"` (launcher label; needs a new APK build).
- **Kept on purpose (internal ids, do not rename):** appId `com.koptan.app`, IndexedDB `pbm`, `localStorage koptan.lang`, SW cache `koptan-v*`, backup field `app:'KOPTAN'`, update zip `koptan-<ver>.zip`, repo/URL `Koptan`, WebAuthn user name `koptan`. Changing the appId would stop APK updates.
- `CHANGES` entry 9.5.0. Verified: `tests/run.sh shots` green (e2e 42/42, features 24/24, self-update, web auto-update, SW upgrade, no overflow). One run hit a timeout in the SW-upgrade offline reopen; 3 isolated reruns + a full rerun passed (timing flake, not caused by this change). Screenshots of home (AR), lock (EN) and invoice reviewed. Deployed 9.5.0; *Verify live site* run 42301327527 all PASS (version.json 9.5.0; bundle 221 KB, smaller because the new icons are lighter).

### 2026-11-06: permanent APK signing key active + APK 9.5.0 build 10
- First *Create signing key* run failed at Preconditions: `KEYSTORE_PASSWORD` reached the job empty (secret not added as a repository Actions secret yet). After the owner added it, run 42302382819 succeeded and committed `signing/koptan.jks.enc` + `signing/fingerprint-sha256.txt` (SHA-256 `2E:37:B3:C1:54:CC:27:AD:35:91:FB:74:03:4E:1F:68:E4:F3:55:FE:ED:38:AB:FA:46:A7:34:72:1C:4B:E8:19`) to `claude/new-session-a3tcdh` (commit ea869e1).
- *Build APK* run #10 (42302437571) succeeded: 8 Capacitor plugins incl. `@capacitor/app@6.0.3`, `assembleRelease` signed with the permanent key, certificate SHA-256 matched the committed fingerprint. Release `v9.5.0-build-10` → https://github.com/Koptan919/Koptan/releases/download/v9.5.0-build-10/KOPTAN.apk (7.7 MB). Contains KOPT X name/icon, back-button fix, everything up to 9.5.0.
- The owner asked for the file to be called KOPTX: workflows now publish `KOPTX.apk` / `KOPTX.ipa` (iOS permission texts say KOPT X). Releases can't be edited from the session, so *Build APK* run #11 (42303138240) rebuilt it: release `v9.5.0-build-11` → https://github.com/Koptan919/Koptan/releases/download/v9.5.0-build-11/KOPTX.apk (7.7 MB), same permanent certificate (SHA-256 matched). Build 10 (`KOPTAN.apk`) is the same app; build 11 installs over it.
- The owner's installed APK is debug-signed, so this one install needs: backup → uninstall → install build 10 → restore. Every later release-signed APK installs as an update.

### 2026-11-06: v9.6.0 biometric option named after the device (face / fingerprint)
- The owner wanted to choose face or fingerprint. Not possible: Android's BiometricPrompt and iOS pick the method themselves (an app can't request face or fingerprint specifically). Agreed instead: name the option after what the phone uses.
- `extra.js`: `BIOT` / persisted `S.k.bioT` = `'face'|'finger'|'any'`. Native: `NativeBiometric.isAvailable().biometryType` 1,3 → finger; 2,4 → face; anything else (6 = multiple, 5 = iris) → any. Web: `webBioKind()` heuristic (iPhone with a screen of 812 px or more → face, other iPhone or Mac → finger, iPad and the rest → any). `bioName()` / `bioIcon()` (new Lucide `LU.face` = scan-face in core.js) drive the settings row title and subtitle, the lock-screen button (updated once `bioAvail` resolves), prompt subtitles and toasts. Unlocking itself is unchanged.
- Verified: new F25 (native mock, types 2/4/3/6: settings row, enable toast, lock button, unlock by the prompt), `tests/run.sh shots` green (e2e 42/42, features 25/25, self-update, SW upgrade, no overflow). F21 no longer hard-codes versions (it failed only because 9.3.1 dropped off the 3-item list). Screenshots of the face case reviewed. Web-layer only: works with APK build 10/11. Deployed 9.6.0; *Verify live site* run 42305901223 all PASS.

### 2026-11-07: v9.7.0 cart, off-device backup, customer statement, cash box, reports, variants, settings order
All new code is at the end of `extra.js` (section “v9.7”). Small hooks are in views.js (sale page button, `varHTML` on the product page) and more.js (settings order).
- **Cart** (`cartPage(pre)`, `ACT.cart`). Opened from the sale page button “إضافة منتج آخر لنفس الفاتورة” (it carries over product, qty, price and customer). Lines `{pid,qty,price}` with stepper, price and remove; add from a select or by barcode scan; order discount; received amount; payment method; customer; due date.
  - Save writes one `s` record per line (snapshot as before) sharing optional `o` (order id; only when 2+ lines). The order discount is split proportionally (last line takes the rounding rest). The received amount fills lines in order (`paid`).
  - The unpaid rest makes **one** debt with optional `oid`; `did` is set on the lines that are not fully paid.
  - `ordL(s)` returns the order's lines. Invoice: `invNo` gives all lines one number; `invInfo`, `invText` and `invImage` list every line (image +76 px per extra line, sums for subtotal and discount).
  - `returnSale` is wrapped for order lines: restores stock, lowers the shared debt by that line's unpaid part (deletes the debt if it reaches 0 and has no payments), and moves `d.sid` to a remaining line.
  - Money math is unchanged: each line goes through `sRev`/`prof`, `AGG` sums lines, and the debt is never profit.
- **Off-device backup:** `saveFile` is wrapped so backup files (`koptan-backup-*`) go to the share sheet (Drive, WhatsApp, Files) when the browser can share files (native already shared). Home shows an orange card “احفظ نسخة من بياناتك خارج الهاتف” when there is data and no backup for 7 days (`bkDue`). Settings row renamed “حفظ نسخة خارج الهاتف”.
- **Customer page:** “كشف حساب” (`cusStmt`: last 25 purchases, total, open debts, balance) and “تذكير بالدين” (`cusRem`, only if the customer owes) as WhatsApp links (the customer's number if valid, otherwise wa.me share).
- **Cash box** (`cashBox(a)`, `ACT.cashBox`, button in the daily summary sheet): sales received per method (`paid`, or `sRev` for old sales), debt payments in/out (counted as cash), cash vs other expenses, expected cash in the drawer, real count input → match / extra / missing, share text.
- **Reports:** `SUBS.rep.f` wrapped with `repMore()`: profit by category, top 5 customers, sales by weekday with the strongest day.
- **Variants:** “إضافة نوع (مقاس / لون)” in the product “more” sheet (`varPage`). It creates a separate product `"<base> — <label>"` that copies cost, supplier and photos (image ids are shared: `gcImgs` only deletes unreferenced ids), with its own qty and price. Optional fields `vg` (group = first product id), `vb` (base name), `vl` (label); the barcode is not copied. The product page shows variant chips (`varHTML`).
- **Settings order:** store card, then Data & backup, Security & privacy, Invoice, Currency & selling, Notifications, Language, Look & vibration, About.
- New optional fields: `s.o`, `d.oid`, `p.vg/vb/vl`. No schema change; old data and backups unaffected.
- Verified: new feature tests F26–F31 (cart math 5+16−1=20, paid split, one debt of 3, stock, one invoice number, taller 2-line invoice, return one line removes the debt; statement/reminder links; cash-box formula and difference; variant creation and chips; report sections; home backup card shown/hidden and settings order). `tests/run.sh shots`: e2e 42/42, features 31/31, self-update, web auto-update, SW upgrade, no overflow. One earlier full run had the feature suite time out at its very first page load (before any step); the suite alone passed 31/31 and the next full run passed (startup timing flake). Screenshots of cart (after fixing an overlap of qty and price at 360 px), settings, home card and cash box reviewed. Deployed 9.7.0; *Verify live site* run 42358931216 all PASS (bundle 231 KB). Web-layer only, no APK rebuild needed.

### 2026-11-07: v9.8.0 separate Backup page with a choice of method
- The owner wanted backup as its own section where you pick the method. New `SUBS.bk` (“النسخ الاحتياطي”, end of extra.js). It is opened from the home card (`data-act="bkOpen"`), Settings › Data & backup (one row replaces the old backup row and auto-backup switch) and the More menu (badge when a backup is overdue).
- The page has: a status card (last backup time or warning, record count); 4 methods (`ACT.bkGo`): Google Drive and WhatsApp (share sheet with a toast telling which app to pick; an app can't be preselected), save on the phone, quick in-app copy (`ACT.snapNow`); automatic backup frequency and reminder switch; restore from file; in-app snapshots list.
- “Save on the phone” uses `BKM='file'` read by a second `saveFile` wrapper. Natively it writes `Documents/KOPTX/<file>` with Filesystem (`DOCUMENTS`, recursive) and falls back to the original saveFile; on the web it downloads. `BKM` is reset after every run.
- Verified: new F32 (home card opens the page, 4 methods, the file method downloads `koptan-backup-*.json` and sets lastBk, the in-app copy increments `snapN`, auto-backup switch, restore button, settings row); F31 updated for `bkOpen`. Screenshots (AR/EN, 360 px) reviewed after letting the method descriptions wrap. Full `tests/run.sh shots`: e2e 42/42, features 32/32, self-update, SW upgrade, no overflow. Deployed 9.8.0; *Verify live site* run 42359658734 all PASS. Native Documents write not verified on a real phone.

### 2026-11-07: v9.9.0 simpler settings and More menu
- **Settings** are now a short list of categories under the store card. Each category opens its own page (`SUBS['set:<k>']`, keys `data sec inv cur nf look about`; end of extra.js).
  - The original `SUBS.set.f` from more.js is kept as `_setF0` and split by its `<h3 class="sh3">` headings at render time (`setParts()`). Category pages show the matching section(s); “Language & look” shows two. All rows, switches and their handlers are unchanged (`_setB0` is attached to each category page).
  - Each category row shows a live summary (`setSum`: last backup, lock/biometric, next invoice number, currency + rate, notifications on, language + vibration, version).
- **More menu** (`vMore`): three headed groups. Selling & tracking: reports, customers, expenses, suppliers, reorder. Organising: notifications, tasks, calendar. Data & settings: backup, data center, settings.
- Tests updated to open the right category (`openSub('set:<k>')`): e2e O1/R1, features F2/F11/F14/F20/F21/F25/F31/F32, upd.js. F31 now checks the 7 categories and that each page has content.
- Verified: full `tests/run.sh shots` gave e2e 42/42, self-update, web auto-update, SW upgrade, no overflow, features 31/32. F2 failed because its rate step re-opened `set:cur` while that page was still open under `set:nf` (`openSub` ignores an already-open page). The test now closes settings sub-pages first; the feature suite then passed 32/32. Screenshots (AR/EN, 360 px) of the settings list, a category page and the grouped More menu reviewed. Deployed 9.9.0; *Verify live site* run 42361297278 all PASS.

### 2026-11-07: v9.9.1 biometric row explains why it is unavailable
- The owner's phone (Android, looks like Realme/Oppo, running the APK) showed no biometric row in Security, and no button on the lock screen. Cause: `bioAvail()` returned '' and `bioRow()` hid the row silently. Also, `bio`/`bioId` are left out of backups on purpose, so a reinstall + restore turns the option off.
- Checked `@capgo/capacitor-native-biometric@6.0.4` (Android): `isAvailable` uses the deprecated `BiometricManager.canAuthenticate()` (= BIOMETRIC_WEAK) and returns `errorCode` (1 hardware unavailable or not present, 3 none enrolled, 0 other). `biometryType` only reflects PackageManager features. Weak face unlock is allowed if the OEM exposes it to BiometricPrompt; many (Oppo/Realme/Xiaomi) don't.
- Now `BIOE` keeps the reason (`none | hw | oldapk | web | unk`). The row stays visible with the reason and a “فحص مجددًا” button (`ACT.bioRe`). Biometrics are re-checked automatically when the app becomes visible again (after enrolling a fingerprint in the phone's settings).
- Test F33 (native mock: not enrolled → reason + re-check → switch; hardware reason; old APK without the plugin → KOPTX.apk hint).

---

## 8. Known issues / pending

- **APK signing is ACTIVE** (from build 10, 2026-11-06). `signing/` exists and must never be deleted, regenerated or replaced. The owner needs one last backup → uninstall → install → restore to move from the debug-signed app to build 10/11.
- APK minimum is now Android 6.0 (minSdk 23), required by the updater's dependencies.
- **Not verified on a real device:** Camera/gallery plugin flow, Filesystem/Share save, and the actual self-update download/apply inside the APK (only tested with a mocked plugin). If the native camera call fails with a non-cancel error, the code falls back to the file input.
- iOS IPA is unsigned and doesn't self-update (Capgo updater not added to iOS). Recommend the PWA on iOS.
- Arabic plural forms are simplified (singular for 1, plural otherwise).
- Avatars use the first letter of user names (data, not translated).
- Headless test browsers report few CPU cores, so `autoLite()` turns on performance mode. Set `S.k.lite=false` before taking design screenshots.
- Soft-keyboard input of Arabic digits on the lock screen isn't testable in Playwright (it inserts text with no key event). Irrelevant now that the keypad is used.
- **v9.1 native parts not verified on a real phone:** NativeBiometric prompt, LocalNotifications daily notification, camera barcode scanning inside the Android WebView (BarcodeDetector support in WebView is uncertain; manual entry is the fallback), invoice image sharing via the Share plugin.
- Native features (fingerprint, daily notification, native haptics) need an APK built after they were added (haptics: v9.2.0+). Web features arrive by self-update. Haptics on a real phone are not verified yet.
- Back button needs APK build 10+ (has `@capacitor/app`); older APKs keep closing on Back. Not yet confirmed on a real phone.
- The APK launcher name/icon change to KOPT X only with a new APK build; the web layer (header, invoice, icons inside the app) arrives by self-update.
- `tests/sw-upgrade.js` offline reopen can time out occasionally (seen once in 9.5.0); rerun before investigating.
- Cart, cash box, statement and variants (9.7.0) are verified in Chromium only, not on a real phone yet. Sharing the backup file to Drive/WhatsApp depends on the browser supporting file sharing (Android Chrome yes; desktop falls back to download).
- Test start can time out occasionally (features suite first `ready`, SW-upgrade offline reopen); rerun before investigating.
- Pending ideas: delta updates; iOS self-update; ML Kit barcode plugin if WebView lacks BarcodeDetector.

---

## 9. Build, test, deploy

### Test locally (needs Node + Playwright/Chromium; this cloud environment has them preinstalled)
```bash
tests/run.sh          # 42 e2e checks + self-update (mocked native) + 20 feature checks + SW upgrade from the pre-v9 app
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
- **Build APK** (`build-apk.yml`): Capacitor 6 + camera/filesystem/share + `@capgo/capacitor-updater@6.25.6`; forces `androidx.work 2.9.1`; minSdk 23; permissions CAMERA, READ_MEDIA_IMAGES, READ_EXTERNAL_STORAGE(≤32); icon replaced; `versionName` = `APP_VER`, `versionCode` = 100 + run number; release-signed if `KEYSTORE_*` secrets exist, otherwise debug. Release tag `v<ver>-build-<n>`; direct link `https://github.com/Koptan919/Koptan/releases/download/<tag>/KOPTX.apk`.
- **Build IPA** (`build-ipa.yml`): macOS, Capacitor iOS, Info.plist usage strings, unsigned `KOPTX.ipa`, tag `ios-v<ver>-build-<n>`.
- Rebuild native only when plugins or native config change. Web changes reach APK users through self-update.

---

## 10. Resuming in a new session
1. Read `CLAUDE.md`, then this file (§8 Known issues first).
2. `git log --oneline -10` and check the latest GitHub Actions runs (Build APK / Verify live site).
3. Run `tests/run.sh` to confirm a green baseline before you change anything.
4. Make the change → tests → release steps in CLAUDE.md → add an entry to §7 and update §8.
