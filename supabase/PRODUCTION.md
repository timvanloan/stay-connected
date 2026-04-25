# Supabase production guide

Use this when deploying or debugging production vs local schema drift.

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
