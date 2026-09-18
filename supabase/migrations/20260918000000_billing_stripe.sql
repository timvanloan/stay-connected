-- Stripe billing fields for paid launch.
-- Written only by the webhook / service role (authenticated UPDATE is revoked).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_customer_id_uidx
  ON public.profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_subscription_id_uidx
  ON public.profiles (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

COMMENT ON COLUMN public.profiles.subscription_status IS
  'Stripe subscription status: active, trialing, past_due, canceled, unpaid, incomplete, etc.';
