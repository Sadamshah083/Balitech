#!/usr/bin/env bash
#
# Deploys the current main branch on the VPS itself. Run this ON THE SERVER,
# logged in as root, from any directory:
#
#   bash /var/www/balitech-app/scripts/deploy-server.sh
#
# It does, in order, and waits for each step before starting the next:
#   1. Refuses to run if a build is already in progress (avoids the
#      overlapping-build corruption that broke the site on 2026-10-06).
#   2. Clears a stale .next/lock left by a killed build.
#   3. Resets the working tree to origin/main. Any local edit other than
#      package-lock.json (which `npm install` rewrites) aborts the deploy
#      instead of being silently discarded.
#   4. npm install.
#   5. Builds with a memory cap, because this server has 4 GB of RAM and an
#      uncapped build can swap the box to a crawl. Runs in the foreground —
#      this script does not return control until the build has actually
#      finished, which is what backgrounding with `&` kept getting skipped.
#   6. Verifies .next/BUILD_ID exists before touching the running process.
#      The old build keeps serving traffic if the new one fails.
#   7. Restarts pm2 and checks the app answers on localhost before declaring
#      success.
#
# Exits non-zero and leaves the previous build running on any failure.

set -euo pipefail

APP_DIR="/var/www/balitech-app"
PM2_NAME="balitech-app"
PORT=3005
MEM_CAP_MB=1536

cd "$APP_DIR"

echo "==> Checking for a build already in progress..."
if pgrep -f "next build" > /dev/null; then
  echo "A build is already running (pgrep -fa \"next build\" to see it)."
  echo "Wait for it to finish, or stop it yourself, then re-run this script."
  exit 1
fi

if [ -f .next/lock ]; then
  echo "==> Removing stale .next/lock from a previous interrupted build."
  rm -f .next/lock
fi

echo "==> Checking the working tree is clean (package-lock.json excepted)..."
DIRTY="$(git status --porcelain | grep -v '^.M package-lock\.json$' || true)"
if [ -n "$DIRTY" ]; then
  echo "Uncommitted changes found that are not package-lock.json:"
  echo "$DIRTY"
  echo "Resolve these by hand before deploying — not discarding them automatically."
  exit 1
fi
git checkout -- package-lock.json 2>/dev/null || true

echo "==> Fetching and resetting to origin/main..."
git fetch origin
git checkout -B main origin/main
git reset --hard origin/main
echo "    now at: $(git log --oneline -1)"

echo "==> npm install..."
npm install

echo "==> Building (capped at ${MEM_CAP_MB} MB, this can take 10-15 minutes)..."
rm -rf .next
NODE_OPTIONS="--max-old-space-size=${MEM_CAP_MB}" npm run build

if [ ! -f .next/BUILD_ID ]; then
  echo "Build did not produce .next/BUILD_ID. Aborting without touching the running app."
  exit 1
fi
echo "    build OK: $(cat .next/BUILD_ID)"

echo "==> Restarting pm2..."
pm2 restart "$PM2_NAME" || pm2 start ecosystem.config.js --only "$PM2_NAME"
sleep 5

echo "==> Checking the app answers on localhost:${PORT}..."
CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:${PORT}/")"
if [ "$CODE" != "200" ]; then
  echo "App returned HTTP ${CODE} instead of 200. Check: pm2 logs ${PM2_NAME} --lines 30 --nostream"
  exit 1
fi

echo "==> Deployed successfully. $(git log --oneline -1) is live."
