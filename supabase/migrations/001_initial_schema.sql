-- ─────────────────────────────────────────────────────────────────────────────
-- FRIENDS Platform — Initial Database Schema
-- Run this in your Supabase SQL Editor or via CLI:
--   supabase db push
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- PROFILES TABLE
-- Extends Supabase's built-in auth.users table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  plan        TEXT        NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
  credits_used INTEGER    NOT NULL DEFAULT 0,
  openai_api_key TEXT,   -- User's own AI provider key (stored as plaintext in v1; encrypt in prod)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: Users can only see/edit their own profile
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────────────────
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, plan, credits_used)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    'free',
    0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- PROJECTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  workflow_type   TEXT        NOT NULL CHECK (workflow_type IN ('website', 'startup', 'student', 'custom')),
  description     TEXT        NOT NULL DEFAULT '',
  raw_prompt      TEXT,
  enhanced_prompt TEXT,
  prompt_status   TEXT        DEFAULT 'draft'
                              CHECK (prompt_status IN ('draft', 'enhanced', 'approved', 'generating', 'completed')),
  prompt_enhancement JSONB,
  status          TEXT        NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft', 'running', 'completed', 'failed')),
  clarifications  JSONB,      -- Array of {question, answer} objects
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: Users can only CRUD their own projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own projects"
  ON public.projects FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

-- ─────────────────────────────────────────────────────────────────────────────
-- AGENTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agents (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  role            TEXT        NOT NULL,
  task            TEXT        NOT NULL DEFAULT '',
  expected_output TEXT        NOT NULL DEFAULT '',
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  output          TEXT,       -- Raw markdown output from the agent
  order_index     INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: Users can manage agents of their own projects
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage agents of own projects"
  ON public.agents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = public.agents.project_id
        AND public.projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = public.agents.project_id
        AND public.projects.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agents_project_id ON public.agents(project_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON public.agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_order ON public.agents(project_id, order_index);

-- ─────────────────────────────────────────────────────────────────────────────
-- COMPILED OUTPUTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.compiled_outputs (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  content           TEXT        NOT NULL DEFAULT '',  -- Final compiled markdown
  approved_by_user  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.compiled_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage compiled outputs of own projects"
  ON public.compiled_outputs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = public.compiled_outputs.project_id
        AND public.projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = public.compiled_outputs.project_id
        AND public.projects.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_compiled_outputs_project_id ON public.compiled_outputs(project_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- EXPORTS TABLE (for tracking export history)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exports (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  format      TEXT        NOT NULL CHECK (format IN ('markdown', 'pdf')),
  file_url    TEXT,       -- Optional: URL if stored in Supabase Storage
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage exports of own projects"
  ON public.exports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = public.exports.project_id
        AND public.projects.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- UPDATED_AT TRIGGER (auto-update timestamps)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
