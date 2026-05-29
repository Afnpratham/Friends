/**
 * Shared TypeScript types for the FRIENDS platform.
 * Used by both frontend and backend.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export type WorkflowType = 'website' | 'startup' | 'student' | 'custom';

export type ProjectStatus = 'draft' | 'running' | 'completed' | 'failed';

export type PromptStatus = 'draft' | 'enhanced' | 'approved' | 'generating' | 'completed';

export type AgentStatus = 'pending' | 'running' | 'completed' | 'failed';

export type ExportFormat = 'markdown' | 'pdf';

export type UserPlan = 'free' | 'pro' | 'team';

export type ProjectTemplateKey =
  | 'ambulance_tracker'
  | 'student_attendance_portal'
  | 'expense_tracker'
  | 'pdf_to_notes_converter'
  | 'bmi_calculator'
  | 'habit_tracker'
  | 'task_manager'
  | 'ecommerce_store'
  | 'startup_landing_page'
  | 'portfolio_website'
  | 'admin_dashboard'
  | 'generic_functional_app';

export type GeneratedProjectType = 'functional_web_app' | 'dashboard_app' | 'landing_page' | 'website';

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

// ─── Database Models ──────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: UserPlan;
  credits_used: number;
  openai_api_key?: string | null; // user's own AI provider key (stored encrypted)
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  workflow_type: WorkflowType;
  description: string;
  raw_prompt?: string | null;
  enhanced_prompt?: string | null;
  prompt_status?: PromptStatus | null;
  prompt_enhancement?: PromptEnhancement | null;
  status: ProjectStatus;
  clarifications: ClarificationQA[] | null;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  project_id: string;
  name: string;
  role: string;
  task: string;
  expected_output: string;
  status: AgentStatus;
  output: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CompiledOutput {
  id: string;
  project_id: string;
  content: string;
  approved_by_user: boolean;
  created_at: string;
}

export interface Export {
  id: string;
  project_id: string;
  format: ExportFormat;
  file_url: string | null;
  created_at: string;
}

// ─── Request / Response Types ─────────────────────────────────────────────────

export interface ClarificationQA {
  question: string;
  answer: string;
}

export interface CreateProjectRequest {
  title: string;
  workflow_type: WorkflowType;
  description: string;
  raw_prompt?: string | null;
  enhanced_prompt?: string | null;
  prompt_status?: PromptStatus | null;
  prompt_enhancement?: PromptEnhancement;
  clarifications?: ClarificationQA[];
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  raw_prompt?: string | null;
  enhanced_prompt?: string | null;
  prompt_status?: PromptStatus | null;
  status?: ProjectStatus;
  prompt_enhancement?: PromptEnhancement | null;
  clarifications?: ClarificationQA[];
}

export interface CreateAgentRequest {
  name: string;
  role: string;
  task: string;
  expected_output: string;
  order_index?: number;
}

export interface UpdateAgentRequest {
  name?: string;
  role?: string;
  task?: string;
  expected_output?: string;
  order_index?: number;
  status?: AgentStatus;
  output?: string;
}

export interface ExecuteAgentsRequest {
  api_key?: string; // user's AI provider key (optional - falls back to platform key or mock)
}

export interface ClarifyingQuestionsRequest {
  title: string;
  workflow_type: WorkflowType;
  description: string;
}

export interface ClarifyingQuestionsResponse {
  questions: string[];
}

export interface PromptEnhancement {
  projectTitle: string;
  projectType: string;
  targetUsers: string[];
  mainGoal: string;
  requiredFeatures: string[];
  optionalFeatures: string[];
  frontendRequirements: string[];
  backendRequirements: string[];
  databaseRequirements: string[];
  aiRequirements: string[];
  mockModeBehavior: string[];
  userFlow: string[];
  requiredComponents: string[];
  requiredFiles: string[];
  validationChecklist: string[];
  forbiddenMistakes: string[];
  domainSpecificRequirements?: string[];
  selectedTemplate?: ProjectTemplateKey;
  requiredCalculations?: string[];
  requiredData?: string[];
  finalEnhancedPrompt: string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

// ─── Agent Template Types ─────────────────────────────────────────────────────

export interface AgentTemplate {
  name: string;
  role: string;
  task: string;
  expected_output: string;
  order_index: number;
}

export interface WorkflowTemplate {
  type: WorkflowType;
  label: string;
  description: string;
  icon: string;
  agents: AgentTemplate[];
}
