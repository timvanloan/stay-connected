# Supabase production guide

Use this when deploying or debugging production vs local schema drift.

## Pre-launch dashboard checklist

These live in the Supabase dashboard, not the repo — nothing in code can set
them for you. Walk through all of these before opening signups beyond your
own testing.

- [ ] **Authentication → Attack Protection → Bot and Abuse Protection**: Turnstile enabled, secret key pasted in and matches the Cloudflare site whose **site key** is your `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
- [ ] **Authentication → Attack Protection → Leaked Password Protection**: turned on (rejects known-breached passwords at signup/reset).
- [ ] **Authentication → Providers → Email → Confirm email**: turned on, so unverified addresses can't create working accounts. Confirm the signup flow in `app/signup/page.tsx` still behaves — Supabase will hold the session until confirmed when this is on.
- [ ] **Authentication → Providers → Email → Minimum password length**: raise from the default 6 to at least 8, and update `minLength`/copy in `app/signup/page.tsx:87` and `app/auth/update-password/page.tsx:8` to match.
- [ ] **Authentication → URL Configuration**: **Site URL** set to your real production domain; **Redirect URLs** includes that domain's `/auth/callback` (plus `http://localhost:3000/auth/callback` for local dev only — remove any stray preview-deployment wildcards before launch).
- [ ] **Authentication → Rate Limits**: review the defaults for sign-in/sign-up/OTP against expected traffic; the app has no additional layer beyond Supabase's own limits + Turnstile + the `accept_invite` rate limit in [`20260331120000_security_partner_lock_and_rate_limit.sql`](./migrations/20260331120000_security_partner_lock_and_rate_limit.sql).
- [ ] **Database → Backups**: confirm point-in-time recovery or daily backups are enabled on the plan you're using — this is real user data now, not a personal sandbox.
- [ ] **Project Settings → API**: confirm the `service_role` key used by `SUPABASE_SERVICE_ROLE_KEY` (see "Account deletion cron" below) is set only in Vercel's server environment, never in `.env.local.example` or any client-exposed var.

## Migration checklist (prod parity)

Apply every migration you have **not** yet run, in **filename timestamp order** (oldest first). From this repo’s `migrations/` folder:

| File | Purpose |
|------|---------|
| `20250217000000_initial_schema.sql` | `profiles`, invite codes, RLS, `accept_invite` |
| `fix_check_ins.sql` | Recreates `check_ins` (destructive if re-run; usually early prod only) |
| `fix_signup_trigger.sql` | Signup / profile trigger fixes |
| `20250310000000_check_ins.sql` | `check_ins` if not created by `fix_check_ins` (avoid duplicate creates) |
| `20260310000000_primary_feeling_fear.sql` | **`Fear` primary feeling** — updates `Afraid`→`Fear`, fixes `CHECK` constraint |
| `20260330000000_check_ins_partner_appreciation.sql` | Adds `partner_appreciation` column |
| `20260331120000_security_partner_lock_and_rate_limit.sql` | Revokes direct `profiles` UPDATE; rate-limits `accept_invite` |
| `20260811000000_check_ins_note_length.sql` | Caps `note` / `partner_appreciation` at 1000 chars |
| `20260811000100_account_deletion.sql` | `deletion_requested_at` + `request_account_deletion` / `cancel_account_deletion` RPCs |
| `20260811000200_unpair_partner.sql` | `unpair_partner` RPC — disconnects both profiles, regenerates the caller's invite code |

**CLI:** `npx supabase link --project-ref <ref>` then `npx supabase db push`  
**Manual:** Supabase Dashboard → SQL Editor → paste each file’s contents and run.

If your project was created with `fix_check_ins.sql` (CHECK allows `Afraid` only), you **must** run `20260310000000_primary_feeling_fear.sql` or the app will error when users pick **Fear**.

---

## Hotfix: `check_ins_primary_feeling_check` / Fear not saving

**Symptom:** Error like  
`new row for relation "check_ins" violates check constraint "check_ins_primary_feeling_check"`  
when the user selects **Fear**.

**Cause:** Database still allows `Afraid` but the app sends `Fear`.

**Fix:** Run the full contents of  
[`migrations/20260310000000_primary_feeling_fear.sql`](./migrations/20260310000000_primary_feeling_fear.sql)  
in the SQL Editor (safe to run once; re-running `ADD CONSTRAINT` may error if already applied—then verify only).

**Verify:**

```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.check_ins'::regclass
  AND conname = 'check_ins_primary_feeling_check';
```

You should see `Fear` in the `CHECK`, not `Afraid`.

---

## Account deletion cron

`app/api/cron/purge-deleted-accounts` hard-deletes accounts 14 days after
`request_account_deletion()` was called (see Settings page). It runs daily via
`vercel.json` → `crons`. Requires two env vars in Vercel (Project → Settings →
Environment Variables), **not** in `.env.local.example`'s public section:

- `SUPABASE_SERVICE_ROLE_KEY` — Project Settings → API → `service_role` key. Server-only, bypasses RLS. Never expose to the client.
- `CRON_SECRET` — any random string (`openssl rand -hex 32`); Vercel sends it as `Authorization: Bearer $CRON_SECRET` automatically once set.

Vercel Cron on the Hobby plan is limited to once/day, which matches the
schedule already in `vercel.json` (`0 3 * * *`).

---

## Sign-in or captcha issues (new browsers)

1. **App-side Turnstile (recommended when captcha is required)**  
   - Create a **Turnstile** site in Cloudflare and add the **secret** in Supabase → Authentication → Attack Protection (same as Supabase docs).  
   - Set **`NEXT_PUBLIC_TURNSTILE_SITE_KEY`** in Vercel (and `.env.local`) to the **site key**.  
   - Redeploy: login, sign-up, and forgot-password will show the widget and send `captchaToken` to Supabase.  
   - If this env var is **unset**, no widget is shown (use only when captcha is enabled in Supabase).

2. **Authentication → Attack Protection / Bot / Captcha**  
   If Turnstile is enabled: confirm **site key** and **secret** match Cloudflare + Supabase, and allowed **hostnames** include your production URL (and `localhost` for dev).  
   **Tip:** Temporarily disable captcha to confirm it is the cause, then re-enable with correct keys.

3. **Authentication → URL configuration**  
   **Site URL** and **Redirect URLs** must include every origin users use (e.g. `https://your-app.vercel.app`, custom domain, `http://localhost:3000`).

4. **Safari / strict privacy**  
   Prefer first-party navigation to your app (HTTPS, not embedded in a third-party iframe). Session cookies can be blocked in cross-site contexts.

---

## Future: “Move DB” to Vercel Postgres (spike / scope)

**Vercel Postgres** (often Neon) is **only PostgreSQL**. It does **not** replace:

- Supabase **Auth** (`auth.users`, JWTs, email/password flows)
- **`auth.uid()` in RLS** and PostgREST-style access from the anon key
- **Triggers** on `auth.users` (e.g. profile creation)

A real migration is a **replatform**, not a `pg_dump` only:

1. Choose **Auth** (Auth.js, Clerk, Better Auth, etc.) and session model.  
2. Model **`profiles` / `check_ins`** in an ORM (Drizzle/Prisma) against Neon.  
3. Reimplement **authorization** (RLS rules as application checks or Neon-specific JWT).  
4. Replace **pairing** (`accept_invite`) with server logic or RPC on Neon.  
5. **Export** data (`pg_dump` / CSV), **import**, then cut traffic and decommission Supabase.

Treat this as a **separate project** from schema hotfixes above; estimate days–weeks for parity.
