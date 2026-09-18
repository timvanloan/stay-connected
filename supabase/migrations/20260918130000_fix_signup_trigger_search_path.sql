-- Harden the signup trigger so it can resolve generate_invite_code().
--
-- public.handle_new_user() (from the initial schema) calls generate_invite_code()
-- without a fixed search_path, so the auth.users insert trigger fails
-- ("function generate_invite_code() does not exist") and aborts signup on a
-- clean database. The repo's fix_signup_trigger.sql addresses this but the
-- Supabase CLI skips it (its name lacks a <timestamp>_ prefix), so replicate the
-- fix here with search_path pinned. Runs after the multi-friend migration.
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
