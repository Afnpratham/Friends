export type AgentKey =
  | 'intent_analyzer'
  | 'prompt_enhancer'
  | 'template_selector'
  | 'product_manager'
  | 'ui_ux_designer'
  | 'tech_architect'
  | 'frontend_code_agent'
  | 'backend_code_agent'
  | 'qa_validator'
  | 'repair_agent'
  | 'build_debugger'
  | 'documentation_agent'
  | 'final_reviewer'
  | 'packager_agent';

export type AiProvider = 'gemini' | 'ollama' | 'openai' | 'anthropic' | 'groq' | 'mock';

export interface AgentModelRoute {
  provider: AiProvider;
  model: string;
}

export const agentModelConfig: Record<AgentKey, AgentModelRoute> = {
  intent_analyzer: {
    provider: 'gemini',
    model: 'gemini-2.5-flash',
  },
  prompt_enhancer: {
    provider: 'gemini',
    model: 'gemini-2.5-pro',
  },
  template_selector: {
    provider: 'gemini',
    model: 'gemini-2.5-pro',
  },
  product_manager: {
    provider: 'gemini',
    model: 'gemini-2.5-pro',
  },
  ui_ux_designer: {
    provider: 'gemini',
    model: 'gemini-2.5-pro',
  },
  tech_architect: {
    provider: 'gemini',
    model: 'gemini-2.5-pro',
  },
  frontend_code_agent: {
    provider: 'gemini',
    model: 'gemini-2.5-pro',
  },
  backend_code_agent: {
    provider: 'gemini',
    model: 'gemini-2.5-pro',
  },
  qa_validator: {
    provider: 'gemini',
    model: 'gemini-2.5-pro',
  },
  repair_agent: {
    provider: 'gemini',
    model: 'gemini-2.5-pro',
  },
  build_debugger: {
    provider: 'gemini',
    model: 'gemini-2.5-pro',
  },
  documentation_agent: {
    provider: 'gemini',
    model: 'gemini-2.5-flash',
  },
  final_reviewer: {
    provider: 'gemini',
    model: 'gemini-2.5-pro',
  },
  packager_agent: {
    provider: 'gemini',
    model: 'gemini-2.5-flash',
  },
};

export const generationQualityConfig = {
  fallbackProvider: (process.env.AI_FALLBACK_PROVIDER || 'mock') as AiProvider,
  maxRepairAttempts: Number(process.env.MAX_REPAIR_ATTEMPTS || 3),
  minimumQualityScore: Number(process.env.MINIMUM_QUALITY_SCORE || 8),
  minStageDurationMs: Number(process.env.MIN_STAGE_DURATION_MS || 1500),
  mockModeEnabled: process.env.AI_PROVIDER_DEFAULT === 'mock' || process.env.AI_PROVIDER === 'mock',
};
