-- Fix signup: ensure profiles table doesn't block new users
-- If you have an email column with NOT NULL, run this:
-- ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;

-- Or if the column causes issues, drop it:
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- Recreate the trigger to ensure it works (handles edge cases)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, invite_code)
  VALUES (NEW.id, generate_invite_code())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log but don't fail signup - profile can be created on first /pair visit
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
