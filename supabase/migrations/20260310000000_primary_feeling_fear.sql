-- Rename primary feeling Afraid -> Fear for check_ins
UPDATE public.check_ins SET primary_feeling = 'Fear' WHERE primary_feeling = 'Afraid';

ALTER TABLE public.check_ins DROP CONSTRAINT IF EXISTS check_ins_primary_feeling_check;

ALTER TABLE public.check_ins
  ADD CONSTRAINT check_ins_primary_feeling_check
  CHECK (primary_feeling IN ('Happy', 'Sad', 'Angry', 'Fear'));
