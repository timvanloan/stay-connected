-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL,
  partner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generate unique 6-char alphanumeric invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Ensure invite_code is unique (retry on collision)
CREATE OR REPLACE FUNCTION ensure_unique_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    LOOP
      NEW.invite_code := generate_invite_code();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE invite_code = NEW.invite_code AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid));
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set invite_code on insert if empty
CREATE TRIGGER ensure_invite_code_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (NEW.invite_code IS NULL OR NEW.invite_code = '')
  EXECUTE FUNCTION ensure_unique_invite_code();

-- Create profile on signup (trigger on auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, invite_code)
  VALUES (NEW.id, generate_invite_code())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view partner profile"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR partner_id = auth.uid()
    OR id IN (SELECT partner_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- accept_invite RPC: link two users via invite code
CREATE OR REPLACE FUNCTION public.accept_invite(partner_invite_code TEXT)
RETURNS JSONB AS $$
DECLARE
  current_user_id UUID := auth.uid();
  partner_profile RECORD;
  my_profile RECORD;
BEGIN
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Find partner by invite code (excluding self)
  SELECT * INTO partner_profile
  FROM public.profiles
  WHERE invite_code = upper(trim(partner_invite_code))
    AND id != current_user_id
  LIMIT 1;

  IF partner_profile IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired partner code');
  END IF;

  -- Get current user's profile
  SELECT * INTO my_profile FROM public.profiles WHERE id = current_user_id;

  IF my_profile IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  -- Link both users (bidirectional)
  UPDATE public.profiles SET partner_id = partner_profile.id, updated_at = NOW() WHERE id = current_user_id;
  UPDATE public.profiles SET partner_id = current_user_id, updated_at = NOW() WHERE id = partner_profile.id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.accept_invite(TEXT) TO authenticated;
