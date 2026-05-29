/**
 * API client for communicating with the FRIENDS backend.
 * Automatically attaches the Supabase JWT to all requests.
 */

import { hasSupabaseConfig, supabase, supabaseSetupError } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export type PromptStatus = 'draft' | 'enhanced' | 'approved' | 'generating' | 'completed';

export type GenerationStage =
  | 'intent_analysis'
  | 'prompt_enhancement'
  | 'template_selection'
  | 'product_spec'
  | 'ui_ux_spec'
  | 'tech_spec'
  | 'file_plan'
  | 'code_generation'
  | 'static_validation'
  | 'repair'
  | 'build_validation'
  | 'quality_review'
  | 'packaging'
  | 'completed'
  | 'failed';

export interface GenerationStepLog {
  agentName: string;
  agentKey: string;
  stage: GenerationStage;
  provider: string;
  model: string;
  requestedProvider?: string;
  requestedModel?: string;
  usedFallback?: boolean;
  startedAt: string;
  completedAt?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  summary: string;
  durationMs?: number;
  promptTokensEstimate?: number;
  completionTokensEstimate?: number;
  totalTokensEstimate?: number;
  costEstimateUsd?: number | null;
}

export interface QualityScore {
  requirementMatch: number;
  functionality: number;
  uiUxQuality: number;
  codeQuality: number;
  runnability: number;
  accessibility: number;
  readmeQuality: number;
  overallScore: number;
  issues?: string[];
  improvementSuggestions?: string[];
}

export interface GenerationStatus {
  stage: GenerationStage;
  message: string;
  progress: number;
  completedStages: GenerationStage[];
  validationResults: string[];
  repairAttempts: number;
  qualityPassed: boolean;
  steps: GenerationStepLog[];
  finalScore?: QualityScore | null;
  error?: string | null;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  workflow_type: string;
  description: string;
  raw_prompt?: string | null;
  enhanced_prompt?: string | null;
  prompt_status?: PromptStatus | null;
  status: string;
  clarifications?: Array<{ question: string; answer: string }> | null;
  created_at: string;
  updated_at: string;
}

/**
 * Generic fetch wrapper that attaches auth headers.
 */
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    if (!hasSupabaseConfig) {
      return { data: null, error: supabaseSetupError };
    }

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    const json = await res.json().catch(() => ({ data: null, error: `HTTP ${res.status}` }));

    if (!res.ok) {
      return { data: null, error: json.error || `HTTP ${res.status}` };
    }

    return { data: json.data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Network error' };
  }
}

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  getMe: () => apiFetch('/api/auth/me'),
};

// ─── Projects ─────────────────────────────────────────────────────────────
export const projectsApi = {
  list: () => apiFetch<Project[]>('/api/projects'),
  get: (id: string) => apiFetch<Project & { agents?: any[]; compiled_output?: any }>(`/api/projects/${id}`),
  create: (data: Partial<Project>) => apiFetch<Project>('/api/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Project>) => apiFetch<Project>(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch(`/api/projects/${id}`, { method: 'DELETE' }),

  // Execution
  execute: (id: string, apiKey?: string) =>
    apiFetch(`/api/projects/${id}/execute`, { method: 'POST', body: JSON.stringify({ api_key: apiKey }) }),
  getStatus: (id: string) => apiFetch(`/api/projects/${id}/status`),

  // Compilation
  compile: (id: string) => apiFetch(`/api/projects/${id}/compile`, { method: 'POST' }),
  getGenerationStatus: (id: string) => apiFetch<GenerationStatus>(`/api/projects/${id}/generation-status`),
  getCompiled: (id: string) => apiFetch(`/api/projects/${id}/compiled`),
  approve: (id: string) => apiFetch(`/api/projects/${id}/approve`, { method: 'POST' }),

  // Export
  exportMarkdown: async (id: string) => {
    if (!hasSupabaseConfig) {
      return { blob: null, filename: null, error: supabaseSetupError };
    }

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const res = await fetch(`${API_URL}/api/projects/${id}/export/markdown`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const json = await res.json();
      return { blob: null, error: json.error };
    }

    const blob = await res.blob();
    const filename = res.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'export.md';
    return { blob, filename, error: null };
  },
  exportSourceZip: async (id: string) => {
    if (!hasSupabaseConfig) {
      return { blob: null, filename: null, error: supabaseSetupError };
    }

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const res = await fetch(`${API_URL}/api/projects/${id}/export/source-zip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      return { blob: null, filename: null, error: json.error };
    }

    const blob = await res.blob();
    const filename = res.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'source.zip';
    return { blob, filename, error: null };
  },
};

// ─── Agents ───────────────────────────────────────────────────────────────
export const agentsApi = {
  list: (projectId: string) => apiFetch(`/api/projects/${projectId}/agents`),
  create: (projectId: string, data: any) =>
    apiFetch(`/api/projects/${projectId}/agents`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    apiFetch(`/api/agents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch(`/api/agents/${id}`, { method: 'DELETE' }),
  execute: (id: string, apiKey?: string) =>
    apiFetch(`/api/agents/${id}/execute`, { method: 'POST', body: JSON.stringify({ api_key: apiKey }) }),
};

// ─── Clarify ──────────────────────────────────────────────────────────────
export const clarifyApi = {
  getQuestions: (data: { title: string; workflow_type: string; description: string }) =>
    apiFetch('/api/clarify', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const promptEnhancerApi = {
  enhance: (data: {
    title: string;
    workflow_type: string;
    raw_prompt: string;
    clarifications?: Array<{ question: string; answer: string }>;
  }) =>
    apiFetch('/api/enhance-prompt', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
