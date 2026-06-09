ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS meet_link text;
