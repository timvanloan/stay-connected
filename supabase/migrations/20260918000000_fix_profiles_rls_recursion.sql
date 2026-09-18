-- Fix infinite recursion in profiles/check_ins RLS and harden the signup trigger.
--
-- 1. The "Users can view partner profile" SELECT policy sub-queried
--    public.profiles inside its own USING clause, so Postgres recursed while
--    evaluating it ("infinite recursion detected in policy for relation
--    profiles"). That also poisoned check_ins reads, whose partner policy
--    sub-queried profiles. Both are rewritten to use a SECURITY DEFINER helper
--    that reads profiles with RLS bypassed, breaking the cycle.
--
-- 2. public.handle_new_user() called generate_invite_code() without a fixed
--    search_path, so the auth.users insert trigger failed ("function
--    generate_invite_code() does not exist") and aborted signup on a clean DB.
--    Pinning search_path = public resolves the reference.

-- Helper: the caller's partner_id, read with RLS bypassed to avoid recursion.
CREATE OR REPLACE FUNCTION public.current_user_partner_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT partner_id FROM public.profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.current_user_partner_id() TO authenticated;

-- Non-recursive partner-visibility policy for profiles.
DROP POLICY IF EXISTS "Users can view partner profile" ON public.profiles;
CREATE POLICY "Users can view partner profile"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR partner_id = auth.uid()
    OR id = public.current_user_partner_id()
  );

-- Non-recursive partner-visibility policy for check_ins.
DROP POLICY IF EXISTS "Users can view partner check_ins" ON public.check_ins;
CREATE POLICY "Users can view partner check_ins"
  ON public.check_ins FOR SELECT
  USING (user_id = public.current_user_partner_id());

-- Harden the signup trigger so it can resolve generate_invite_code().
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, invite_code)
  VALUES (NEW.id, generate_invite_code())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block signup; /pair recreates the profile if the insert fails.
  RETURN NEW;
END;
$$;
