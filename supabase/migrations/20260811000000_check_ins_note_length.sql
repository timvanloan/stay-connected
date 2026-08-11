-- Cap free-text fields so a single check-in can't be used to dump unbounded data.
ALTER TABLE public.check_ins
  ADD CONSTRAINT check_ins_note_length CHECK (char_length(note) <= 1000);

ALTER TABLE public.check_ins
  ADD CONSTRAINT check_ins_partner_appreciation_length CHECK (char_length(partner_appreciation) <= 1000);
