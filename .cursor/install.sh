#!/usr/bin/env bash
#
# Idempotent repository bootstrap for the Cloud Agent environment.
# Runs after the source checkout (and whenever dependencies are refreshed).
# Installs the Docker engine (needed for the local Supabase stack), installs JS
# dependencies, and writes the local dev env file. Must terminate; the Docker
# daemon and Supabase/Next.js services are started by .cursor/start.sh.
set -euo pipefail
cd "$(dirname "$0")/.."

# ---------------------------------------------------------------------------
# 1. Docker engine (nested-container friendly)
# ---------------------------------------------------------------------------
# The default Cloud Agent base image has no Docker, so install it here. Cloud
# Agent VMs run inside a container, so Docker needs the fuse-overlayfs storage
# driver and legacy iptables for container networking. Package install +
# system config live here (once per pod); the daemon is started in start.sh.
if ! command -v dockerd >/dev/null 2>&1; then
  echo "[install] Installing Docker engine..."
  sudo apt-get update -y
  # DEBIAN_FRONTEND=noninteractive does NOT suppress dpkg's own conffile
  # prompts (e.g. fuse3's /etc/fuse.conf), which otherwise hang the boot-time
  # install forever. --force-confold/--force-confdef answer them automatically.
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
    -o Dpkg::Options::=--force-confold \
    -o Dpkg::Options::=--force-confdef \
    docker.io fuse-overlayfs uidmap
fi
sudo update-alternatives --set iptables /usr/sbin/iptables-legacy >/dev/null 2>&1 || true
sudo update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy >/dev/null 2>&1 || true
sudo mkdir -p /etc/docker
echo '{"storage-driver":"fuse-overlayfs"}' | sudo tee /etc/docker/daemon.json >/dev/null
sudo usermod -aG docker "$USER" >/dev/null 2>&1 || true

# ---------------------------------------------------------------------------
# 2. JS dependencies
# ---------------------------------------------------------------------------
echo "[install] Installing JS dependencies (npm ci)..."
npm ci

# ---------------------------------------------------------------------------
# 3. Local dev env file
# ---------------------------------------------------------------------------
# The local Supabase stack uses fixed, well-known demo credentials (see
# `npx supabase status`). Safe for local development only — never production.
if [ ! -f .env.local ]; then
  echo "[install] Writing .env.local for the local Supabase stack..."
  cat > .env.local <<'EOF'
# Local Supabase stack (see `npx supabase status`). Standard public local-dev
# demo keys — safe for local use only, never production.
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Turnstile captcha disabled locally (no site key -> widget not rendered).
NEXT_PUBLIC_TURNSTILE_SITE_KEY=

# service_role key for the account-deletion cron route (local only).
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Bearer token the purge cron expects locally.
CRON_SECRET=local-dev-cron-secret
EOF
fi

echo "[install] Done."
