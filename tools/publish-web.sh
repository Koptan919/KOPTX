#!/usr/bin/env bash
# Copies the web app into a GitHub Pages checkout and builds the Android update bundle.
# Usage: tools/publish-web.sh <gh-pages-dir>
set -euo pipefail
SRC="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:?gh-pages directory required}"
FILES="index.html sw.js manifest.json app.css i18n.js core.js views.js more.js extra.js icon-192.png icon-512.png"
VER=$(sed -n "s/^const APP_VER='\([0-9.]*\)'.*/\1/p" "$SRC/core.js")
[ -n "$VER" ] || { echo "APP_VER not found" >&2; exit 1; }
for f in $FILES; do cp "$SRC/$f" "$OUT/$f"; done
mkdir -p "$OUT/fonts" && cp "$SRC"/fonts/* "$OUT/fonts/"
rm -f "$OUT"/koptan-*.zip
(cd "$SRC" && zip -q -X -r "$OUT/koptan-$VER.zip" $FILES fonts)
printf '{"version":"%s","zip":"https://koptan919.github.io/Koptan/koptan-%s.zip"}\n' "$VER" "$VER" > "$OUT/version.json"
echo "published $VER"
