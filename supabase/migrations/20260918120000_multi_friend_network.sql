-- Multi-friend network: friendships graph, display names, appreciation targets.
-- Cap: max 10 people in a connected component. Visibility: direct friends only.
-- Mode: component size 2 = couple, >= 3 = group.

CREATE TABLE IF NOT EXISTS public.friendships (
  user_low UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_high UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_low, user_high),
  CONSTRAINT friendships_ordered CHECK (user_low < user_high)
);

CREATE INDEX IF NOT EXISTS friendships_user_low_idx ON public.friendships (user_low);
CREATE INDEX IF NOT EXISTS friendships_user_high_idx ON public.friendships (user_high);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = user_low OR auth.uid() = user_high);

-- No direct INSERT/UPDATE/DELETE for clients; SECURITY DEFINER RPCs only.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT;

ALTER TABLE public.check_ins
  ADD COLUMN IF NOT EXISTS appreciation_target_type TEXT,
  ADD COLUMN IF NOT EXISTS appreciation_target_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.check_ins
  DROP CONSTRAINT IF EXISTS check_ins_appreciation_target_type_check;

ALTER TABLE public.check_ins
  ADD CONSTRAINT check_ins_appreciation_target_type_check
  CHECK (
    appreciation_target_type IS NULL
    OR appreciation_target_type IN ('partner', 'person', 'group')
  );

-- Backfill friendships from legacy partner_id pairs
INSERT INTO public.friendships (user_low, user_high)
SELECT LEAST(p.id, p.partner_id), GREATEST(p.id, p.partner_id)
FROM public.profiles p
WHERE p.partner_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Clear legacy pairing column (kept for now; app stops reading it)
UPDATE public.profiles SET partner_id = NULL WHERE partner_id IS NOT NULL;

-- Mark existing appreciations as partner-targeted when present
UPDATE public.check_ins
SET appreciation_target_type = 'partner'
WHERE partner_appreciation IS NOT NULL
  AND appreciation_target_type IS NULL;

CREATE OR REPLACE FUNCTION public.are_friends(a UUID, b UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE f.user_low = LEAST(a, b) AND f.user_high = GREATEST(a, b)
  );
$$;

-- BFS over friendships: all user ids in the connected component
CREATE OR REPLACE FUNCTION public.connection_component_ids(start_id UUID)
RETURNS UUID[]
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  result UUID[] := ARRAY[start_id];
  frontier UUID[] := ARRAY[start_id];
  next_frontier UUID[];
  neighbor UUID;
  i INT;
BEGIN
  IF start_id IS NULL THEN
    RETURN ARRAY[]::UUID[];
  END IF;

  LOOP
    next_frontier := ARRAY[]::UUID[];
    FOR i IN 1..COALESCE(array_length(frontier, 1), 0) LOOP
      FOR neighbor IN
        SELECT CASE
          WHEN f.user_low = frontier[i] THEN f.user_high
          ELSE f.user_low
        END
        FROM public.friendships f
        WHERE f.user_low = frontier[i] OR f.user_high = frontier[i]
      LOOP
        IF NOT (neighbor = ANY (result)) THEN
          result := result || neighbor;
          next_frontier := next_frontier || neighbor;
        END IF;
      END LOOP;
    END LOOP;
    EXIT WHEN COALESCE(array_length(next_frontier, 1), 0) = 0;
    frontier := next_frontier;
  END LOOP;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.connection_component_size(start_id UUID)
RETURNS INT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(array_length(public.connection_component_ids(start_id), 1), 0);
$$;

CREATE OR REPLACE FUNCTION public.get_my_network()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  component_ids UUID[];
  component_size INT;
  mode TEXT;
  friends JSONB;
BEGIN
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  component_ids := public.connection_component_ids(current_user_id);
  component_size := COALESCE(array_length(component_ids, 1), 1);

  IF component_size <= 1 THEN
    mode := 'solo';
  ELSIF component_size = 2 THEN
    mode := 'couple';
  ELSE
    mode := 'group';
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'display_name', COALESCE(NULLIF(trim(p.display_name), ''), 'Friend'),
      'invite_code', p.invite_code
    )
    ORDER BY COALESCE(NULLIF(trim(p.display_name), ''), 'Friend')
  ), '[]'::jsonb)
  INTO friends
  FROM public.profiles p
  WHERE p.id IN (
    SELECT CASE
      WHEN f.user_low = current_user_id THEN f.user_high
      ELSE f.user_low
    END
    FROM public.friendships f
    WHERE f.user_low = current_user_id OR f.user_high = current_user_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'mode', mode,
    'component_size', component_size,
    'max_size', 10,
    'friends', friends,
    'display_name', (
      SELECT display_name FROM public.profiles WHERE id = current_user_id
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_network() TO authenticated;

CREATE OR REPLACE FUNCTION public.update_display_name(new_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  cleaned TEXT;
BEGIN
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  cleaned := trim(new_name);
  IF cleaned IS NULL OR cleaned = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Display name is required');
  END IF;
  IF char_length(cleaned) > 40 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Display name must be 40 characters or fewer');
  END IF;

  UPDATE public.profiles
  SET display_name = cleaned, updated_at = NOW()
  WHERE id = current_user_id;

  RETURN jsonb_build_object('success', true, 'display_name', cleaned);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_display_name(TEXT) TO authenticated;

-- Replace accept_invite: multi-friend + component size cap
CREATE OR REPLACE FUNCTION public.accept_invite(partner_invite_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  friend_profile RECORD;
  my_profile RECORD;
  recent_count INT;
  my_component UUID[];
  their_component UUID[];
  union_size INT;
  low_id UUID;
  high_id UUID;
  overlapping BOOLEAN;
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

  SELECT * INTO friend_profile
  FROM public.profiles
  WHERE invite_code = upper(trim(partner_invite_code))
    AND id != current_user_id
  LIMIT 1;

  IF friend_profile IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invite code');
  END IF;

  SELECT * INTO my_profile FROM public.profiles WHERE id = current_user_id;

  IF my_profile IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  IF public.are_friends(current_user_id, friend_profile.id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are already connected with this person');
  END IF;

  my_component := public.connection_component_ids(current_user_id);
  their_component := public.connection_component_ids(friend_profile.id);

  SELECT EXISTS (
    SELECT 1 FROM unnest(my_component) AS x(id)
    WHERE x.id = ANY (their_component)
  ) INTO overlapping;

  IF overlapping THEN
    union_size := COALESCE(array_length(my_component, 1), 0);
  ELSE
    union_size := COALESCE(array_length(my_component, 1), 0)
      + COALESCE(array_length(their_component, 1), 0);
  END IF;

  IF union_size > 10 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'That connection would exceed the group limit of 10 people'
    );
  END IF;

  low_id := LEAST(current_user_id, friend_profile.id);
  high_id := GREATEST(current_user_id, friend_profile.id);

  INSERT INTO public.friendships (user_low, user_high)
  VALUES (low_id, high_id)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_invite(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.remove_friend(friend_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  updated_invite TEXT;
BEGIN
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF friend_id IS NULL OR friend_id = current_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid friend');
  END IF;

  IF NOT public.are_friends(current_user_id, friend_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are not connected with this person');
  END IF;

  DELETE FROM public.friendships
  WHERE user_low = LEAST(current_user_id, friend_id)
    AND user_high = GREATEST(current_user_id, friend_id);

  -- Rotate invite code so old shared codes stop working for the actor
  UPDATE public.profiles
  SET invite_code = NULL, updated_at = NOW()
  WHERE id = current_user_id
  RETURNING invite_code INTO updated_invite;

  RETURN jsonb_build_object('success', true, 'invite_code', updated_invite);
END;
$$;

GRANT EXECUTE ON FUNCTION public.remove_friend(UUID) TO authenticated;

-- Keep unpair_partner as a thin wrapper for the sole friend (couples UX)
CREATE OR REPLACE FUNCTION public.unpair_partner()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  only_friend UUID;
BEGIN
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT CASE
    WHEN f.user_low = current_user_id THEN f.user_high
    ELSE f.user_low
  END INTO only_friend
  FROM public.friendships f
  WHERE f.user_low = current_user_id OR f.user_high = current_user_id
  LIMIT 2;

  IF only_friend IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are not currently connected');
  END IF;

  -- If more than one friend, require remove_friend
  IF (
    SELECT COUNT(*) FROM public.friendships f
    WHERE f.user_low = current_user_id OR f.user_high = current_user_id
  ) > 1 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You have multiple connections. Remove friends individually.'
    );
  END IF;

  RETURN public.remove_friend(only_friend);
END;
$$;

GRANT EXECUTE ON FUNCTION public.unpair_partner() TO authenticated;

-- RLS: profiles — view own + direct friends
DROP POLICY IF EXISTS "Users can view partner profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view friend profiles" ON public.profiles;

CREATE POLICY "Users can view friend profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR public.are_friends(auth.uid(), id)
  );

-- RLS: check_ins — view own + direct friends
DROP POLICY IF EXISTS "Users can view partner check_ins" ON public.check_ins;
DROP POLICY IF EXISTS "Users can view friend check_ins" ON public.check_ins;

CREATE POLICY "Users can view friend check_ins"
  ON public.check_ins FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.are_friends(auth.uid(), user_id)
  );
