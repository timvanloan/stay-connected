#!/usr/bin/env bash
#
# Per-boot runtime bring-up for the Cloud Agent environment.
# Starts the Docker daemon and the local Supabase stack. Must be idempotent and
# must return once services are ready — the Next.js dev server runs separately
# as the `next-dev` terminal (see .cursor/environment.json). Docker itself is
# installed by .cursor/install.sh.
set -euo pipefail
cd "$(dirname "$0")/.."

# ---------------------------------------------------------------------------
# 1. Docker daemon
# ---------------------------------------------------------------------------
if ! docker info >/dev/null 2>&1; then
  echo "[start] Starting Docker daemon..."
  sudo mkdir -p /etc/docker
  echo '{"storage-driver":"fuse-overlayfs"}' | sudo tee /etc/docker/daemon.json >/dev/null
  sudo bash -c 'nohup dockerd >/var/log/dockerd.log 2>&1 &'
  for _ in $(seq 1 60); do
    if sudo docker info >/dev/null 2>&1; then break; fi
    sleep 1
  done
fi
# Let the current user reach the daemon socket without sudo.
sudo chmod 666 /var/run/docker.sock 2>/dev/null || true

# ---------------------------------------------------------------------------
# 2. Supabase local stack (Postgres, Auth, PostgREST, Studio, Mailpit)
# ---------------------------------------------------------------------------
# `supabase status` exits non-zero when the stack is down; only start it then.
# On first boot this applies every timestamped migration in supabase/migrations
# (including 20260918000000_fix_profiles_rls_recursion.sql, which repairs the
# signup trigger and the recursive profiles/check_ins RLS policies).
if ! npx --yes supabase status >/dev/null 2>&1; then
  echo "[start] Starting Supabase local stack (first boot pulls images)..."
  npx --yes supabase start
fi

echo "[start] Environment ready. App: http://localhost:3000  Supabase API: http://127.0.0.1:54321  Studio: http://127.0.0.1:54323"
