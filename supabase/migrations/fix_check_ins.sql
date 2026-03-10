-- Fix check_ins table: ensure correct schema
DROP TABLE IF EXISTS public.check_ins CASCADE;

CREATE TABLE public.check_ins (
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

ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own check_ins"
  ON public.check_ins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view partner check_ins"
  ON public.check_ins FOR SELECT
  USING (
    user_id IN (
      SELECT partner_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own check_ins"
  ON public.check_ins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own check_ins"
  ON public.check_ins FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
