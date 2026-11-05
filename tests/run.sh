#!/usr/bin/env bash
# Runs the KOPTAN browser test suite against the working tree.
#   tests/run.sh            → e2e (42 checks) + Android self-update + service-worker upgrade
#   tests/run.sh shots      → also screenshots every screen at 320/412 (ar) and 360 (en) + overflow check
# Needs Node and Playwright with Chromium (require('playwright') must resolve).
# The "old" site is the pre-v9 app (tests/fixtures/v8) — used to seed data in the original
# schema and prove the new version reads it unchanged.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="${WORK:-$(mktemp -d)}"
mkdir -p "$WORK/site/old" "$WORK/shots"
cp "$ROOT"/tests/fixtures/v8/* "$WORK/site/old/"
cp "$ROOT"/icon-192.png "$ROOT"/icon-512.png "$WORK/site/old/"
ln -sfn "$ROOT" "$WORK/site/new"
(cd "$WORK/site" && exec python3 -m http.server 8123 >/dev/null 2>&1) &
SRV=$!
trap 'kill $SRV 2>/dev/null || true' EXIT
sleep 1
cd "$ROOT/tests"
node e2e.js "$WORK/shots"
node upd.js
SITE="$WORK/site" node sw-upgrade.js
if [ "${1:-}" = "shots" ]; then node shots2.js "$WORK/shots"; fi
echo "Screenshots: $WORK/shots"
