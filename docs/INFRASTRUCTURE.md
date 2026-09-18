# Infrastructure decision — paid launch

## Decision (2026-09-18)

**Stay on Supabase** (Auth + Postgres + PostgREST/RLS) for launch and early
paid customers. Host the Next.js app on Vercel. Do **not** migrate the database
to Vercel Postgres / Neon as a prerequisite for charging.

Rationale (see also the tradeoff plan):

- The app depends on Supabase Auth, `auth.uid()` RLS, and client PostgREST —
  not Postgres alone. A “move DB to Vercel” is a multi-week replatform.
- Paying customers care about backups, account deletion, privacy accuracy, and
  uptime more than which vendor owns Postgres.
- Time before launch should go to production hardening, Stripe, ToS/privacy, and
  support — not an Auth rewrite.

**Rejected for launch:** DB-only move to Neon while keeping Supabase Auth
(split-brain JWT/`auth.uid()` bridging; high ops cost, low benefit).

## Stack for paid launch

| Concern | Vendor |
| --- | --- |
| App hosting + cron | Vercel |
| Auth + database + RLS | Supabase |
| Payments | Stripe |
| Bot protection (optional) | Cloudflare Turnstile |

Before taking payment: complete the dashboard checklist and **paid backups /
PITR** in [`supabase/PRODUCTION.md`](../supabase/PRODUCTION.md).

## When to revisit a Neon / Auth exit

Revisit a full exit (Neon + Auth.js or Clerk + server-only DB access) only when
**one or more** of these is true:

1. **Cost or limits** — Supabase invoice or plan limits materially constrain the
   product after real paid usage.
2. **Compliance / data plane** — a customer or regulator requires a different
   region, DPA, or data residency Supabase cannot meet on the plan you need.
3. **Architecture** — you deliberately want no browser anon key and are ready
   to rewrite all `.from` / `.rpc` / Auth call sites.
4. **CI / branching** — Neon-style DB branching becomes a hard requirement for
   how you ship preview environments.
5. **Pre-users preference** — you have **zero** production users and prefer the
   Neon stack long-term; then a full exit is cheaper *now* than after signup
   (password hashes generally do not transfer; cutover often forces resets).

Until then, treat migration as a separate project, not a launch blocker. Default
future stack if you do exit: **Neon + Auth.js (or Clerk) + Drizzle + Route
Handlers** — no client DB key.

## Related docs

- Production Auth/DB checklist: [`supabase/PRODUCTION.md`](../supabase/PRODUCTION.md)
- Setup and migrations: [`README.md`](../README.md)
