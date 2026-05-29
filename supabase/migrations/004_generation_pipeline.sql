-- FRIENDS staged generation pipeline persistence.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS selected_template TEXT,
  ADD COLUMN IF NOT EXISTS project_type TEXT,
  ADD COLUMN IF NOT EXISTS quality_score JSONB;

CREATE TABLE IF NOT EXISTS public.generation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  overall_score NUMERIC,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS public.generation_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_run_id UUID REFERENCES public.generation_runs(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  provider TEXT,
  model TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  input_summary TEXT,
  output_summary TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS public.agent_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_run_id UUID REFERENCES public.generation_runs(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  output_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.validation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_run_id UUID REFERENCES public.generation_runs(id) ON DELETE CASCADE,
  report_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  passed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.model_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_run_id UUID REFERENCES public.generation_runs(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  provider TEXT,
  model TEXT,
  prompt_tokens INTEGER,
  output_tokens INTEGER,
  estimated_cost NUMERIC,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generation_runs_project_id ON public.generation_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_generation_steps_run_id ON public.generation_steps(generation_run_id);
CREATE INDEX IF NOT EXISTS idx_agent_outputs_run_id ON public.agent_outputs(generation_run_id);
CREATE INDEX IF NOT EXISTS idx_validation_reports_run_id ON public.validation_reports(generation_run_id);
CREATE INDEX IF NOT EXISTS idx_model_usage_logs_run_id ON public.model_usage_logs(generation_run_id);

NOTIFY pgrst, 'reload schema';
