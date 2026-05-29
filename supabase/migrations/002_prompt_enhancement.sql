-- Prompt Enhancer / Requirement Refiner persistence.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS raw_prompt TEXT,
  ADD COLUMN IF NOT EXISTS enhanced_prompt TEXT,
  ADD COLUMN IF NOT EXISTS prompt_status TEXT DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS prompt_enhancement JSONB;

NOTIFY pgrst, 'reload schema';
