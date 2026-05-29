-- Ensure Prompt Enhancer columns exist on databases that already ran earlier migrations.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS raw_prompt TEXT,
  ADD COLUMN IF NOT EXISTS enhanced_prompt TEXT,
  ADD COLUMN IF NOT EXISTS prompt_status TEXT DEFAULT 'draft';

NOTIFY pgrst, 'reload schema';
