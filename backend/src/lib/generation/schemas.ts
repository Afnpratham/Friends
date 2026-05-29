import { z } from 'zod';

export const GenerationStageSchema = z.enum([
  'intent_analysis',
  'prompt_enhancement',
  'template_selection',
  'product_spec',
  'ui_ux_spec',
  'tech_spec',
  'file_plan',
  'code_generation',
  'static_validation',
  'repair',
  'build_validation',
  'quality_review',
  'packaging',
  'completed',
  'failed',
]);

export const IntentAnalysisSchema = z.object({
  projectType: z.string(),
  domain: z.string(),
  targetUsers: z.array(z.string()),
  mainGoal: z.string(),
  signals: z.array(z.string()),
  forbiddenTemplates: z.array(z.string()),
});

export const EnhancedPromptSchema = z.object({
  correctedIdea: z.string(),
  projectTitle: z.string(),
  projectType: z.string(),
  domain: z.string(),
  targetUsers: z.array(z.string()),
  mainUserGoal: z.string(),
  selectedTemplate: z.string(),
  templateRationale: z.string(),
  requiredDomainFeatures: z.array(z.string()).min(8),
  requiredDataModels: z.array(z.string()).min(2),
  requiredCalculations: z.array(z.string()),
  requiredUserFlows: z.array(z.string()),
  requiredComponents: z.array(z.string()).min(5),
  requiredFiles: z.array(z.string()),
  mockModeBehavior: z.array(z.string()),
  apiNeeds: z.array(z.string()),
  databaseNeeds: z.array(z.string()),
  uiUxRequirements: z.array(z.string()),
  accessibilityRequirements: z.array(z.string()),
  loadingErrorEmptyStates: z.array(z.string()),
  validationChecklist: z.array(z.string()).min(3),
  forbiddenMistakes: z.array(z.string()).min(5),
  finalDetailedBuildPrompt: z.string(),
});

export const TemplateSelectionSchema = z.object({
  templateId: z.string(),
  projectType: z.string(),
  rationale: z.string(),
  requiredFeatures: z.array(z.string()),
  forbiddenPatterns: z.array(z.string()),
});

export const ProductSpecSchema = z.object({
  title: z.string(),
  users: z.array(z.string()),
  goals: z.array(z.string()),
  features: z.array(z.string()),
  flows: z.array(z.string()),
  edgeCases: z.array(z.string()),
});

export const UiUxSpecSchema = z.object({
  designStyle: z.string(),
  colorPalette: z.array(z.string()),
  typography: z.string(),
  layoutSystem: z.string(),
  spacingRules: z.array(z.string()),
  componentList: z.array(z.string()),
  responsiveRules: z.array(z.string()),
  accessibilityRules: z.array(z.string()),
  emptyStates: z.array(z.string()),
  loadingStates: z.array(z.string()),
  errorStates: z.array(z.string()),
  microInteractions: z.array(z.string()),
  dashboardPattern: z.string().optional(),
  mobileLayout: z.string(),
  desktopLayout: z.string(),
});

export const TechSpecSchema = z.object({
  framework: z.string(),
  language: z.string(),
  styling: z.string(),
  stateManagement: z.string(),
  apiRoutes: z.array(z.string()),
  dependencies: z.array(z.string()),
  dataModels: z.array(z.string()),
  validationStrategy: z.array(z.string()),
});

export const FilePlanSchema = z.object({
  files: z.array(z.object({ path: z.string(), purpose: z.string() })),
});

export const GeneratedProjectSchema = z.object({
  projectName: z.string(),
  projectSlug: z.string(),
  projectType: z.string(),
  templateId: z.string(),
  files: z.array(z.object({ path: z.string(), content: z.string(), purpose: z.string() })).min(8),
  setupCommands: z.array(z.string()),
  runCommands: z.array(z.string()),
  notes: z.array(z.string()),
});

export const ValidationReportSchema = z.object({
  passed: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  checks: z.array(z.string()),
});

export const RepairPlanSchema = z.object({
  changedFiles: z.array(z.object({ path: z.string(), content: z.string(), reason: z.string() })),
  deletedFiles: z.array(z.string()),
  summary: z.string(),
});

export const QualityReviewSchema = z.object({
  requirementMatch: z.number().min(0).max(10),
  functionality: z.number().min(0).max(10),
  uiUxQuality: z.number().min(0).max(10),
  codeQuality: z.number().min(0).max(10),
  runnability: z.number().min(0).max(10),
  accessibility: z.number().min(0).max(10),
  readmeQuality: z.number().min(0).max(10),
  overallScore: z.number().min(0).max(10),
  issues: z.array(z.string()),
  improvementSuggestions: z.array(z.string()),
});

export type IntentAnalysis = z.infer<typeof IntentAnalysisSchema>;
export type EnhancedPrompt = z.infer<typeof EnhancedPromptSchema>;
export type TemplateSelection = z.infer<typeof TemplateSelectionSchema>;
export type UiUxSpec = z.infer<typeof UiUxSpecSchema>;
export type QualityReview = z.infer<typeof QualityReviewSchema>;
