-- Lets a user disconnect from their partner. Regenerates the acting user's
-- invite_code so an old code (leaked, guessed, or just shared too widely)
-- stops working once they unpair.

CREATE OR REPLACE FUNCTION public.unpair_partner()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  my_profile RECORD;
  updated_profile RECORD;
BEGIN
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO my_profile FROM public.profiles WHERE id = current_user_id;

  IF my_profile IS NULL OR my_profile.partner_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are not currently paired');
  END IF;

  UPDATE public.profiles
  SET partner_id = NULL, updated_at = NOW()
  WHERE id = my_profile.partner_id;

  -- invite_code set to NULL so ensure_invite_code_trigger regenerates a fresh one
  UPDATE public.profiles
  SET partner_id = NULL, invite_code = NULL, updated_at = NOW()
  WHERE id = current_user_id
  RETURNING * INTO updated_profile;

  RETURN jsonb_build_object('success', true, 'invite_code', updated_profile.invite_code);
END;
$$;

GRANT EXECUTE ON FUNCTION public.unpair_partner() TO authenticated;
