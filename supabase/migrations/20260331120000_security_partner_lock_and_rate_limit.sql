-- Harden pairing: block direct client updates to profiles.partner_id; rate-limit accept_invite.

-- 1. Attempt log (only written by SECURITY DEFINER accept_invite)
CREATE TABLE IF NOT EXISTS public.accept_invite_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.accept_invite_attempts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS accept_invite_attempts_user_time_idx
  ON public.accept_invite_attempts (user_id, attempted_at DESC);

COMMENT ON TABLE public.accept_invite_attempts IS
  'Rate-limit data for accept_invite; not exposed to clients via RLS.';

-- 2. Replace accept_invite: search_path fixed, rate limit, pairing rules
CREATE OR REPLACE FUNCTION public.accept_invite(partner_invite_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  partner_profile RECORD;
  my_profile RECORD;
  recent_count INT;
BEGIN
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  DELETE FROM public.accept_invite_attempts
  WHERE user_id = current_user_id
    AND attempted_at < NOW() - INTERVAL '1 hour';

  SELECT COUNT(*)::INT INTO recent_count
  FROM public.accept_invite_attempts
  WHERE user_id = current_user_id
    AND attempted_at > NOW() - INTERVAL '1 hour';

  IF recent_count >= 30 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Too many attempts. Try again in a few minutes.'
    );
  END IF;

  INSERT INTO public.accept_invite_attempts (user_id) VALUES (current_user_id);

  SELECT * INTO partner_profile
  FROM public.profiles
  WHERE invite_code = upper(trim(partner_invite_code))
    AND id != current_user_id
  LIMIT 1;

  IF partner_profile IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired partner code');
  END IF;

  SELECT * INTO my_profile FROM public.profiles WHERE id = current_user_id;

  IF my_profile IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  IF my_profile.partner_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are already paired with someone');
  END IF;

  IF partner_profile.partner_id IS NOT NULL AND partner_profile.partner_id IS DISTINCT FROM current_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'That partner is already paired with someone else');
  END IF;

  UPDATE public.profiles SET partner_id = partner_profile.id, updated_at = NOW() WHERE id = current_user_id;
  UPDATE public.profiles SET partner_id = current_user_id, updated_at = NOW() WHERE id = partner_profile.id;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_invite(TEXT) TO authenticated;

-- 3. Clients cannot set partner_id directly; only this RPC can (via SECURITY DEFINER)
REVOKE UPDATE ON public.profiles FROM authenticated;
REVOKE UPDATE ON public.profiles FROM anon;
