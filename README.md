# Stay Connected

A private app for couples and small friend circles to stay emotionally connected.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **UI:** Tailwind CSS, Shadcn UI, Framer Motion
- **Backend/Auth:** Supabase (stay for launch — see [docs/INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md))
- **Payments:** Stripe
- **Hosting:** Vercel

## Setup

### Prerequisites

- Node.js 20+ (required for Next.js 15)
- A Supabase project

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy `.env.local.example` to `.env.local`
3. Add your Supabase URL and anon key:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run database migrations

```bash
npx supabase db push
```

Or run migrations manually in the Supabase SQL Editor (run **all** files in `supabase/migrations/` in chronological order, or paste each new migration when you pull updates).

### Production checklist (Supabase)

Full step-by-step (migration order, **Fear** hotfix, captcha troubleshooting,
paid launch gate, Vercel Postgres scope): **[supabase/PRODUCTION.md](supabase/PRODUCTION.md)**.

**Infrastructure decision (stay on Supabase for paid launch):**  
**[docs/INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md)**.

Quick reference — ensure these have been applied on production:

| Migration | Why it matters |
|-----------|----------------|
| `20260310000000_primary_feeling_fear.sql` | App uses **`Fear`**; without it, check-ins error on the `check_ins_primary_feeling_check` constraint. |
| `20260330000000_check_ins_partner_appreciation.sql` | Adds `partner_appreciation` column used by the dashboard form. |
| `20260331120000_security_partner_lock_and_rate_limit.sql` | Locks direct `profiles` updates; rate-limits pairing RPC. |

If **Fear** still fails after deploy, run the SQL in `20260310000000_primary_feeling_fear.sql` in the SQL Editor and verify with the query in [supabase/PRODUCTION.md](supabase/PRODUCTION.md).

### Security (database)

After applying `20260331120000_security_partner_lock_and_rate_limit.sql`:

- **`profiles`:** Authenticated users can no longer `UPDATE` rows directly (so `partner_id` cannot be set from the client). Pairing only happens through the `accept_invite` RPC (runs with elevated privileges).
- **`accept_invite`:** Rate-limited to **30 attempts per user per rolling hour**; rejects pairing if you or the other person are already linked to someone else.

Keep the **service role** key server-side only; never expose it in the browser or a public repo.

### 4. Configure Supabase Auth

In Supabase Dashboard → Authentication → URL Configuration:

- **Site URL:** `http://localhost:3000` (or your production URL)
- **Redirect URLs:** Add `http://localhost:3000/auth/callback` (used for email confirmation and password reset). For production, add `https://your-domain.com/auth/callback` as well.

Password reset sends users through that callback to `/auth/update-password`; no extra redirect URL is required if the query stays on `/auth/callback`.

If Supabase **Attack Protection** requires a captcha, set **`NEXT_PUBLIC_TURNSTILE_SITE_KEY`** (see `.env.local.example`) and add the matching **secret** in the Supabase dashboard. See **[supabase/PRODUCTION.md](supabase/PRODUCTION.md)** (Sign-in or captcha issues) for the full checklist.

### 5. Run the app

```bash
npm run dev
```

## Features

- **Auth:** Sign up and log in with email/password; forgot-password flow to reset via email
- **Profile:** Auto-created on signup with a unique 6-digit invite code and optional display name
- **Friends:** Connect with up to 10 people in a group; couples mode (2) keeps partner prompts; group mode (3+) lets you appreciate a person or the whole group
- **Check-in first:** Submit today's check-in before seeing friends' pulses (direct friends only)
- **Protected routes:** `/dashboard`, `/pair`, and `/settings` require authentication
- **Billing:** Stripe subscription checkout + customer portal (`/pricing`, Settings)
- **Pulse wheel:** Interactive emotion selector (Happy, Sad, Angry, Fear + sub-feelings)
- **Check-ins:** Log how you feel each day; see friends' check-ins when unlocked

### Stripe (paid launch)

1. Create a Product + recurring Price in the Stripe Dashboard; copy the `price_…` id.
2. Set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`,
   `STRIPE_WEBHOOK_SECRET`, and `NEXT_PUBLIC_APP_URL` (see `.env.local.example`).
3. Apply migration `20260918000000_billing_stripe.sql`.
4. Point a Stripe webhook at `/api/stripe/webhook` for:
   `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`,
   `invoice.payment_failed`.
5. Optional: set `REQUIRE_SUBSCRIPTION=true` to send unsigned-up-for-plan users
   from `/dashboard` to `/pricing`.

- [ ] Migration `20260918120000_multi_friend_network.sql` applied (friendships,
      display names, multi-friend invite/remove). Existing `partner_id` pairs
      are backfilled into `friendships` automatically.

Before charging real customers, complete the **Paid launch gate** in
[supabase/PRODUCTION.md](supabase/PRODUCTION.md) (especially Supabase backups).