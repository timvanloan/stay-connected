-- Check-ins table: one per user per calendar day
CREATE TABLE IF NOT EXISTS public.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  primary_feeling TEXT NOT NULL CHECK (primary_feeling IN ('Happy', 'Sad', 'Angry', 'Afraid')),
  secondary_feeling TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, check_in_date)
);

-- RLS
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- Users can view own check-ins
CREATE POLICY "Users can view own check_ins"
  ON public.check_ins FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view partner's check-ins (via profiles.partner_id)
CREATE POLICY "Users can view partner check_ins"
  ON public.check_ins FOR SELECT
  USING (
    user_id IN (
      SELECT partner_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Users can insert own check-ins
CREATE POLICY "Users can insert own check_ins"
  ON public.check_ins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own check-ins
CREATE POLICY "Users can update own check_ins"
  ON public.check_ins FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
