# KOPTAN · مدير أعمالي — Project memory

> Detailed, persistent context for future development sessions. The concise rules are in [CLAUDE.md](CLAUDE.md).
> Last updated: 2026-11-05 · App version **9.0.1** · Owner: Koptan919 (Arabic-speaking; replies to the owner in Arabic).

---

## 1. What the app is

A personal, single-user business manager for a small seller (Lebanon: USD + LBP, country code 961):
products & stock, sales (incl. partial payment → debt), expenses (incl. recurring), debts owed to / by the user with payments,
suppliers, notifications, reports, tasks, calendar, backups. **All data stays on the device** (IndexedDB) and the app works offline.

### Distribution
| Channel | Where | Updates |
|---|---|---|
| PWA (main) | https://koptan919.github.io/Koptan/ — branch `gh-pages` | Automatic: network-first `index.html`, versioned assets, SW cache `koptan-v<ver>` |
| Android APK | GitHub Releases `v<ver>-build-<n>` (workflow *Build APK*) | **Self-update** (from 9.0.1): downloads `version.json` + `koptan-<ver>.zip` from the live site via `@capgo/capacitor-updater` (manual mode), applies on next launch or via “Update now”; auto-rollback if the bundle fails to call `notifyAppReady` |
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
- `p` product: `id,name,cat,cost,ship,extra,price,qty,min,sold,fav,arch,created,updated,imgs[],img,link,notes,pdate,adate,sid,supplier,phone,wa`. Unit cost `uc = cost+ship+extra`. `supplier/phone/wa` are a mirror of the linked supplier (kept in sync by `syncSp`).
- `s` sale: `id,pid,name,qty,price,disc,uc,rate,date,note,paid,pay,did?,cust?`. Snapshot: never recomputed.
- `e` expense: `id,amt(USD),cur,orig,rate,cat,pay,note,notes,date,pid,sid,img,rec(''|w|m),next,src?` (children of recurring expenses carry `src`).
- `d` debt: `id,who,phone,type(in=owed to me|out=I owe),amt,cur(USD|LBP),rate,date,due,reason,notes,pid,sid,img,arch,created,pays[{id,amt,date,note,settle}]`.
- `sp` supplier: `id,name,phone,wa,link,addr,img,notes,created`.
- `t` task `{id,title,due,done}` · `l` activity log `{id,m,d}` (messages stored in **Arabic**, translated on display via `LOGP`/`logTxt`).
- `k`: record `k` = settings (`KDEF` in core.js: `cur,rate,hide,pin(sha256 'pbm'+pin),vib,anim,cc,hp,srt,lastBk,lang,lite,nfStock,nfDebt,nfBk,nr[],nd[],nt{},chr,chm,supMig,supBak`); record `dr` = unsaved new-product draft; record `prebak-v8` = safety copy from the v8 supplier migration.
- `img`: `{id:'i…', full:Blob, th:Blob, t}`; referenced by id from products/expenses/debts/suppliers/draft.

### Backup format
v5 (current): `{app:'KOPTAN', v:5, ver, at, counts, sum, sp,p,s,e,l,t,d,k,imgs:[{id,full:dataURL}]}`, where `sum` = SHA-256 of `JSON.stringify({sp,p,s,e,l,t,d,k,imgs})` in that key order. PIN is excluded from backups. Import checks JSON validity, structure, per-record validity, checksum (ok / bad / none = legacy) and image data, then shows a preview (file vs. current counts) and asks twice before replacing. Rollback restores the previous data if anything throws. Legacy v4 files (old app, no `app`/`sum`) import fine.

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

---

## 8. Known issues / pending

- **APK signing:** builds use the runner's throwaway **debug key** (no `KEYSTORE_*` secrets configured), so a newly built APK cannot install over an older one. Users must back up → uninstall → install → restore once. Self-update (9.0.1+) avoids this for web-layer changes. Pending: a fixed release key. The workflow already supports secrets `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`; the owner has to add them in the repo's GitHub settings.
- APK minimum is now Android 6.0 (minSdk 23), required by the updater's dependencies.
- **Not verified on a real device:** Camera/gallery plugin flow, Filesystem/Share save, and the actual self-update download/apply inside the APK (only tested with a mocked plugin). If the native camera call fails with a non-cancel error, the code falls back to the file input.
- iOS IPA is unsigned and doesn't self-update (Capgo updater not added to iOS). Recommend the PWA on iOS.
- Google Fonts need network on first load; the APK uses system fonts when offline.
- Arabic plural forms are simplified (singular for 1, plural otherwise).
- Avatars use the first letter of user names (data, not translated).
- Pending ideas (not requested yet): bundle the font locally; delta updates; iOS self-update.

---

## 9. Build, test, deploy

### Test locally (needs Node + Playwright/Chromium; this cloud environment has them preinstalled)
```bash
tests/run.sh          # 42 e2e checks + self-update (mocked native) + SW upgrade from the pre-v9 app
tests/run.sh shots    # + screenshots of every screen (320/412 ar, 360 en) and horizontal-overflow check
node --check core.js views.js more.js i18n.js sw.js
# translation coverage (prints missing keys; must be empty):
node -e "global.window={};require('./i18n.js');const fs=require('fs');const k=new Set();for(const f of ['core.js','views.js','more.js'])for(const m of fs.readFileSync(f,'utf8').matchAll(/'((?:[^'\\\\\n]|\\\\.)*)'/g))if(/[؀-ۿ]/.test(m[1]))k.add(m[1]);console.log([...k].filter(x=>!(x in window.EN)))"
```
The e2e seeds data **with the old app's own functions** (`tests/fixtures/v8`) on the same origin, then opens the new app. That proves data compatibility. It covers: chart math vs `AGG`, FAB, product add with photo + optional link, supplier links (tel/wa/link/map), credit sale = one debt and single profit, expenses, debts/payments, supplier merge after confirm, delete + undo + permanent delete (history unchanged, image GC), archive, notifications (read, multi-delete, persistence, deep link, delete all), backup/restore (own, tampered, broken, legacy v4), settings persistence, Android back button, PIN, EN with no untranslated text, RTL restore, reload persistence, zero JS errors.

### Deploy the PWA + Android update bundle
```bash
git fetch origin gh-pages && git worktree add /tmp/ghp gh-pages   # or reuse an existing checkout
tools/publish-web.sh /tmp/ghp
cd /tmp/ghp && git add -A && git commit -m "Deploy KOPTAN vX.Y.Z" && git push origin gh-pages
```
Then run the **Verify live site** workflow (GitHub Actions → `verify-pages.yml`, dispatch on the working branch) and read the log. The cloud sandbox can't reach `*.github.io` directly.

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
