#!/usr/bin/env bash
#
# Per-boot runtime bring-up for the Cloud Agent environment.
# Starts the Docker daemon (nested-container friendly) and the local Supabase
# stack, then applies the repository's documented signup-trigger repair.
# Must be idempotent and must return once services are ready — the Next.js dev
# server runs separately as a `terminals` entry.
set -euo pipefail
cd "$(dirname "$0")/.."

# ---------------------------------------------------------------------------
# 1. Docker daemon
# ---------------------------------------------------------------------------
# Cloud Agent VMs run inside a container, so Docker needs the fuse-overlayfs
# storage driver and legacy iptables for container networking to work.
if ! docker info >/dev/null 2>&1; then
  echo "[start] Starting Docker daemon..."
  sudo update-alternatives --set iptables /usr/sbin/iptables-legacy >/dev/null 2>&1 || true
  sudo update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy >/dev/null 2>&1 || true
  sudo mkdir -p /etc/docker
  echo '{"storage-driver":"fuse-overlayfs"}' | sudo tee /etc/docker/daemon.json >/dev/null
  sudo bash -c 'nohup dockerd >/var/log/dockerd.log 2>&1 &'
  for _ in $(seq 1 60); do
    if sudo docker info >/dev/null 2>&1; then break; fi
    sleep 1
  done
fi
# Let the ubuntu user reach the daemon socket without sudo.
sudo chmod 666 /var/run/docker.sock 2>/dev/null || true

# ---------------------------------------------------------------------------
# 2. Supabase local stack (Postgres, Auth, PostgREST, Studio, Mailpit)
# ---------------------------------------------------------------------------
# `supabase status` exits non-zero when the stack is down; only start it then.
# On first boot this applies every timestamped migration in supabase/migrations
# (including 20260918000000_fix_profiles_rls_recursion.sql, which repairs the
# signup trigger and the recursive profiles/check_ins RLS policies).
if ! npx --yes supabase status >/dev/null 2>&1; then
  echo "[start] Starting Supabase local stack..."
  npx --yes supabase start
fi

echo "[start] Environment ready. Supabase API: http://127.0.0.1:54321  Studio: http://127.0.0.1:54323"
