#!/usr/bin/env bash
#
# Idempotent repository bootstrap for the Cloud Agent environment.
# Runs after the source checkout. Keep it terminating and side-effect free
# beyond installing JS deps and writing the local dev env file — the Docker /
# Supabase runtime is brought up by .cursor/start.sh on every boot.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "[install] Installing JS dependencies (npm ci)..."
npm ci

# The local Supabase stack uses fixed, well-known demo credentials (see
# `npx supabase status`). These are safe for local development only — never
# production. Generate .env.local if a developer has not supplied their own.
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
