# KOPTAN · مدير أعمالي — instructions for Claude

Offline-first personal business manager (stock, sales, expenses, debts, suppliers). Vanilla JS, no build step, no framework.
Ships as: a PWA on GitHub Pages (https://koptan919.github.io/Koptan/), an Android APK (Capacitor 6, self-updating), and an unsigned iOS IPA.
**Read [PROJECT_MEMORY.md](PROJECT_MEMORY.md) before changing anything** — it has the architecture, data model, design system, history and known issues.

## Golden rules
- **Never break user data.** Storage is IndexedDB `pbm` v5, stores `p s e l t d sp k img`. Do not rename stores, fields or ids. New fields must be optional with defaults. Old backups (v4 format, no checksum) must still import.
- Past sales are snapshots (`name`, `uc` unit cost, `rate`). Never recompute history from current products; deleting a product must not change past profit.
- Debts are never added to profit (no double counting). All money math goes through `AGG`, `prof`, `sRev`, `uc` in `core.js`.
- Every UI string goes through `L('Arabic source')` and needs an English entry in `i18n.js`. Use logical CSS (`inset-inline-*`, `margin-inline-*`) so RTL and LTR both work.
- Keep the Titanium × Burgundy Liquid Glass look (tokens at the top of `app.css`). Keep `.lite` (performance mode) working: no live `backdrop-filter` there.
- **APK signing key is permanent.** `signing/koptan.jks.enc` (AES-256, password = secret `KEYSTORE_PASSWORD`) + `signing/fingerprint-sha256.txt`. Never delete, regenerate or replace them. A new key means no APK can install over the user's app again. Never print or log the password.
- Performance: derived data goes through `memo()` (invalidated by `DV`, bumped in `put`/`del`). Format numbers/dates with the cached `NF0/NF2/DF` and only for rows actually shown. No live `backdrop-filter` on cards (only floating layers).
- Make the smallest change that does the job. Don't reformat or restructure files you aren't changing.

## Layout
`index.html` shell · `app.css` design system · `i18n.js` EN dictionary · `core.js` state/storage/format/UI primitives/images/native bridge · `views.js` home, chart, products, sales, debts, expenses · `more.js` suppliers, notifications, data center, settings, reports, tasks, calendar, search, quick add, updater, render + boot · `extra.js` invoices, barcode, biometric, auto backup, daily summary, reorder, customers, goal · `fonts/` bundled Tajawal · `sw.js` service worker · `tools/publish-web.sh` · `tests/` · `.github/workflows/`.

## Releasing a change (all steps, in order)
1. Bump `APP_VER` in `core.js`, `?v=NNN` in `index.html` (all 5 scripts + css) + `Q` in `sw.js`, cache name `V` in `sw.js`, `version` in `manifest.json`.
2. `node --check core.js views.js more.js extra.js i18n.js sw.js`, then confirm every Arabic string has an EN entry (see PROJECT_MEMORY.md › Testing).
3. `tests/run.sh` must pass (42 e2e + 20 feature checks + self-update + SW upgrade). For performance work run `node tests/perf.js` before and after. Use `tests/run.sh shots` for UI changes and look at the screenshots.
4. Commit on the working branch and push.
5. Deploy: check out `gh-pages` in a worktree, run `tools/publish-web.sh <worktree>`, commit, push. This also publishes `version.json` + `koptan-<ver>.zip`, which installed APKs download as their update.
6. Run the `Verify live site` workflow and read its log. Only claim success if every line says PASS.
7. Rebuild the APK/IPA (workflows `Build APK` / `Build IPA`) only when native code or plugins change. Build APK signs with the permanent key and fails if the signature doesn't match the fingerprint.

## After every task
Update **PROJECT_MEMORY.md**: add a dated entry under *Development log* (what changed, how it was verified), and update *Known issues / pending*. Only record things you actually verified.
