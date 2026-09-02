#!/usr/bin/env bash
#
# Safely update a running anbar deployment: pulls the latest code, builds new
# images while the OLD containers keep serving traffic, then swaps them in.
#
# Why this can't wipe your data or bounce you back to first-run setup:
#   - It never runs `docker compose down -v`, `docker volume rm`, or anything
#     else that can delete a named volume. `docker compose up -d` / `build`
#     only ever touch containers and images, never volumes.
#   - It resolves the ACTUAL volume backing /data from the running container
#     via `docker inspect`, rather than assuming a name, and refuses to
#     proceed if it can't find one.
#   - It takes a full database backup (main file + WAL + SHM) before doing
#     anything else, while the backend is briefly stopped so the copy is
#     guaranteed consistent.
#   - It compares /api/setup/status before and after. That endpoint only
#     ever reports "needs_setup" if the seeded default-admin user exists —
#     which only happens on a truly empty database. If it flips from
#     complete to needs-setup, the script stops immediately and points you
#     at the backup it just took, rather than letting you walk into a
#     reset admin flow unknowingly.
#
# Usage: ./scripts/update.sh
# Override the URL it health-checks against with: APP_URL=http://host:port ./scripts/update.sh

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

COMPOSE="docker compose"
APP_URL="${APP_URL:-http://127.0.0.1:8410}"
BACKUP_DIR="./backups"
TS="$(date +%Y%m%d-%H%M%S)"
BACKUP_PATH="$BACKUP_DIR/anbar-pre-update-$TS.db"

log() { echo "==> $*"; }
warn() { echo "!! $*" >&2; }

if ! command -v docker >/dev/null 2>&1; then
  warn "docker not found on PATH."
  exit 1
fi

# Refuse to pull over local edits (e.g. a hand-tweaked docker-compose.yml or
# port mapping) rather than silently discarding or conflicting with them.
if [ -n "$(git status --porcelain)" ]; then
  warn "You have uncommitted changes in this repo:"
  git status --short
  warn "Commit or 'git stash' them first so 'git pull' doesn't conflict."
  exit 1
fi

mkdir -p "$BACKUP_DIR"

BACKEND_CID="$($COMPOSE ps -q backend 2>/dev/null || true)"
VOLUME_NAME=""

if [ -n "$BACKEND_CID" ]; then
  VOLUME_NAME="$(docker inspect "$BACKEND_CID" \
    --format '{{ range .Mounts }}{{ if eq .Destination "/data" }}{{ .Name }}{{ end }}{{ end }}')"

  if [ -z "$VOLUME_NAME" ]; then
    warn "Backend is running but no volume is mounted at /data. Refusing to update blind —"
    warn "this would mean the database isn't persisted at all. Check docker-compose.yml."
    exit 1
  fi
  log "Data volume: $VOLUME_NAME"

  PRE_STATUS="$(curl -sf "$APP_URL/api/setup/status" 2>/dev/null || echo '')"
  log "Current setup status: ${PRE_STATUS:-<unreachable>}"

  log "Backing up database (backend paused briefly for a consistent copy)..."
  $COMPOSE stop backend
  docker run --rm \
    -v "$VOLUME_NAME":/data:ro \
    -v "$(pwd)/$BACKUP_DIR":/backup \
    alpine sh -c '
      set -e
      [ -f /data/anbar.db ] || { echo "no database file found yet"; exit 0; }
      cp /data/anbar.db "/backup/anbar-pre-update-'"$TS"'.db"
      [ -f /data/anbar.db-wal ] && cp /data/anbar.db-wal "/backup/anbar-pre-update-'"$TS"'.db-wal" || true
      [ -f /data/anbar.db-shm ] && cp /data/anbar.db-shm "/backup/anbar-pre-update-'"$TS"'.db-shm" || true
    '
  $COMPOSE start backend

  if [ -f "$BACKUP_PATH" ]; then
    log "Backup saved: $BACKUP_PATH"
  else
    warn "No existing database file to back up (this looks like a first run) — continuing."
  fi
else
  log "No running backend found — nothing to back up yet, this looks like a first deploy."
  PRE_STATUS=""
fi

log "Waiting for backend to come back up before pulling..."
for _ in $(seq 1 30); do
  curl -sf "$APP_URL/api/health" >/dev/null 2>&1 && break
  sleep 1
done

log "Pulling latest code..."
git pull --ff-only

log "Building updated images (current containers keep serving traffic)..."
$COMPOSE build

log "Starting updated containers..."
$COMPOSE up -d

log "Waiting for the updated backend to come up..."
UP=0
for _ in $(seq 1 60); do
  if curl -sf "$APP_URL/api/health" >/dev/null 2>&1; then
    UP=1
    break
  fi
  sleep 1
done

if [ "$UP" -ne 1 ]; then
  warn "Backend did not come up healthy after the update."
  warn "Check logs with: $COMPOSE logs backend"
  [ -n "$VOLUME_NAME" ] && warn "Your data is untouched in volume: $VOLUME_NAME"
  [ -f "$BACKUP_PATH" ] && warn "Backup available at: $BACKUP_PATH"
  exit 1
fi

POST_STATUS="$(curl -sf "$APP_URL/api/setup/status")"
log "Post-update setup status: $POST_STATUS"

if echo "$POST_STATUS" | grep -q '"needs_setup":true' \
   && [ -n "$PRE_STATUS" ] && echo "$PRE_STATUS" | grep -q '"needs_setup":false'; then
  warn "Setup status flipped from complete to needs-setup — this means the users table"
  warn "looks empty, which should never happen when the volume is preserved. STOP."
  warn "Do not click through first-run setup. Restore from: ${BACKUP_PATH:-<no backup taken>}"
  exit 1
fi

log "Update complete — anbar is running the latest version with your existing data intact."
