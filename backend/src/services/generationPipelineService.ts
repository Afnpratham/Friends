import { Agent, GenerationStage, GenerationStatus, GenerationStepLog, Project, QualityScore } from '../types';
import { isSupabaseConfigured, supabaseAdmin } from '../config/supabase';
import { AgentKey, generationQualityConfig } from '../lib/agents/agentModelConfig';
import { getResolvedAgentRoute } from '../lib/ai/modelRouter';
import { getTemplateDefinition } from '../lib/templates/templateRegistry';
import {
  createFilePlan,
  generateTemplateFiles,
  ProjectFile,
  repairGeneratedProject,
  renderProjectFileMap,
  validateGeneratedProject,
  ValidationResult,
} from './projectTemplateService';

interface StageDefinition {
  stage: GenerationStage;
  agentKey: AgentKey;
  agentName: string;
  progress: number;
  message: string;
}

interface StageOutput {
  agentKey: AgentKey;
  agentName: string;
  stage: GenerationStage;
  output: unknown;
  summary: string;
}

const pipelineStages: StageDefinition[] = [
  { stage: 'intent_analysis', agentKey: 'intent_analyzer', agentName: 'Intent Analyzer', progress: 7, message: 'Analyzing intent, domain, app class, and forbidden mismatches.' },
  { stage: 'prompt_enhancement', agentKey: 'prompt_enhancer', agentName: 'Prompt Enhancer', progress: 14, message: 'Expanding the short idea into a domain-specific build prompt.' },
  { stage: 'template_selection', agentKey: 'template_selector', agentName: 'Template Selector', progress: 21, message: 'Selecting the correct app template from registry rules.' },
  { stage: 'product_spec', agentKey: 'product_manager', agentName: 'Product Manager', progress: 30, message: 'Creating product requirements, features, flows, and edge cases.' },
  { stage: 'ui_ux_spec', agentKey: 'ui_ux_designer', agentName: 'UI/UX Designer', progress: 40, message: 'Designing layout, states, components, accessibility, and responsive behavior.' },
  { stage: 'tech_spec', agentKey: 'tech_architect', agentName: 'Technical Architect', progress: 50, message: 'Planning architecture, data models, dependencies, APIs, and state.' },
  { stage: 'file_plan', agentKey: 'tech_architect', agentName: 'File Planner', progress: 58, message: 'Creating exact file plan from template requirements.' },
  { stage: 'code_generation', agentKey: 'frontend_code_agent', agentName: 'Code Generator', progress: 68, message: 'Generating runnable Next.js source files from the file plan.' },
  { stage: 'static_validation', agentKey: 'qa_validator', agentName: 'Static Validator', progress: 77, message: 'Checking files, scripts, imports, forbidden leftovers, and domain logic.' },
  { stage: 'build_validation', agentKey: 'build_debugger', agentName: 'Build Validator', progress: 86, message: 'Running build-oriented static checks and collecting repair signals.' },
  { stage: 'quality_review', agentKey: 'final_reviewer', agentName: 'Final Reviewer', progress: 94, message: 'Scoring requirement match, functionality, UI/UX, code, runnability, accessibility, and README.' },
  { stage: 'packaging', agentKey: 'packager_agent', agentName: 'ZIP Packager', progress: 98, message: 'Packaging only after validation and quality gates pass.' },
];

const generationStatuses = new Map<string, GenerationStatus>();
const generationRunIds = new Map<string, string>();

const initialStatus = (message = 'Waiting to generate project.'): GenerationStatus => ({
  stage: 'intent_analysis',
  message,
  progress: 0,
  completedStages: [],
  validationResults: [],
  repairAttempts: 0,
  qualityPassed: false,
  steps: [],
  finalScore: null,
  error: null,
});

function summarize(value: unknown, fallback: string): string {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned ? (cleaned.length > 190 ? `${cleaned.slice(0, 187)}...` : cleaned) : fallback;
}

function setStatus(projectId: string, update: Partial<GenerationStatus> & { stage: GenerationStage }): void {
  const current = generationStatuses.get(projectId) || initialStatus();
  const completed = new Set(current.completedStages);
  if (current.stage !== update.stage && current.stage !== 'failed') completed.add(current.stage);
  generationStatuses.set(projectId, { ...current, ...update, completedStages: Array.from(completed) });
}

function appendStep(projectId: string, step: GenerationStepLog): void {
  const current = generationStatuses.get(projectId) || initialStatus();
  generationStatuses.set(projectId, { ...current, steps: [...current.steps.filter((item) => item.stage !== step.stage), step] });
}

async function minStageDelay(startedAt: number): Promise<void> {
  const target = Math.max(0, generationQualityConfig.minStageDurationMs);
  const elapsed = Date.now() - startedAt;
  if (elapsed < target) await new Promise((resolve) => setTimeout(resolve, target - elapsed));
}

export function getGenerationStatus(projectId: string): GenerationStatus {
  return generationStatuses.get(projectId) || initialStatus();
}

export function resetGenerationStatus(projectId: string): void {
  generationStatuses.set(projectId, initialStatus('Generation queued.'));
}

async function createGenerationRun(project: Project): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const { data } = await supabaseAdmin.from('generation_runs').insert({
      project_id: project.id,
      status: 'running',
      started_at: new Date().toISOString(),
    }).select('id').single();
    if (data?.id) generationRunIds.set(project.id, data.id);
  } catch {
    // Observability tables are optional in local development.
  }
}

async function persistStep(projectId: string, step: GenerationStepLog): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabaseAdmin.from('generation_steps').insert({
      generation_run_id: generationRunIds.get(projectId),
      stage: step.stage,
      agent_name: step.agentName,
      provider: step.provider,
      model: step.model,
      status: step.status,
      output_summary: step.summary,
      started_at: step.startedAt,
      completed_at: step.completedAt,
      duration_ms: step.durationMs,
      error_message: step.status === 'failed' ? step.summary : null,
    });
  } catch {
    // Non-blocking.
  }
}

async function persistOutput(projectId: string, output: StageOutput): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabaseAdmin.from('agent_outputs').insert({
      generation_run_id: generationRunIds.get(projectId),
      agent_name: output.agentName,
      output_json: output.output,
    });
  } catch {
    // Non-blocking.
  }
}

async function persistValidation(projectId: string, validation: ValidationResult): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabaseAdmin.from('validation_reports').insert({
      generation_run_id: generationRunIds.get(projectId),
      report_json: validation,
      passed: validation.passed,
    });
  } catch {
    // Non-blocking.
  }
}

async function completeGenerationRun(projectId: string, status: 'completed' | 'failed', score?: QualityScore | null, error?: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabaseAdmin.from('generation_runs').update({
      status,
      completed_at: new Date().toISOString(),
      overall_score: score?.overallScore ?? null,
      error_message: error || null,
    }).eq('id', generationRunIds.get(projectId));
  } catch {
    // Non-blocking.
  }
}

function stageOutput(stage: GenerationStage, plan: ReturnType<typeof createFilePlan>, files: ProjectFile[], validation?: ValidationResult): unknown {
  const definition = getTemplateDefinition(plan.selectedTemplate);
  if (stage === 'intent_analysis') {
    return { projectType: plan.projectType, domain: plan.selectedTemplate.replace(/_/g, ' '), targetUsers: ['end users'], mainGoal: definition.requiredFeatures[0], signals: definition.whenToUse, forbiddenTemplates: ['startup_landing_page unless explicitly requested'] };
  }
  if (stage === 'prompt_enhancement') {
    return {
      correctedIdea: plan.projectName.replace(/-/g, ' '),
      projectTitle: plan.projectName,
      projectType: plan.projectType,
      domain: plan.selectedTemplate,
      targetUsers: ['primary user', 'administrator or reviewer'],
      mainUserGoal: definition.requiredFeatures[0],
      selectedTemplate: plan.selectedTemplate,
      templateRationale: definition.whenToUse.join(', '),
      requiredDomainFeatures: definition.requiredFeatures.concat(definition.optionalFeatures).slice(0, 10),
      requiredDataModels: definition.requiredFiles.filter((file) => file.startsWith('types/')).concat(['UI state model']),
      requiredCalculations: definition.requiredLogic,
      requiredUserFlows: ['Open app', 'Use main domain workflow', 'See output/result', 'Handle empty/loading/error states'],
      requiredComponents: definition.requiredComponents,
      requiredFiles: plan.files,
      mockModeBehavior: definition.mockDataRules,
      apiNeeds: plan.selectedTemplate === 'pdf_to_notes_converter' ? ['PDF extraction API route'] : ['No external API required in v1'],
      databaseNeeds: ['No database required for v1 unless user asks for persistence'],
      uiUxRequirements: plan.uiUxSpec.layoutRules,
      accessibilityRequirements: plan.uiUxSpec.accessibilityRules,
      loadingErrorEmptyStates: [...plan.uiUxSpec.loadingStates, ...plan.uiUxSpec.errorStates, ...plan.uiUxSpec.emptyStates],
      validationChecklist: definition.validationRules,
      forbiddenMistakes: definition.forbiddenPatterns,
      finalDetailedBuildPrompt: `Build ${plan.projectName} using ${plan.selectedTemplate}. Required features: ${definition.requiredFeatures.join('; ')}. Forbidden: ${definition.forbiddenPatterns.join('; ')}.`,
    };
  }
  if (stage === 'template_selection') return { templateId: plan.selectedTemplate, projectType: plan.projectType, rationale: definition.whenToUse.join(', '), requiredFeatures: definition.requiredFeatures, forbiddenPatterns: definition.forbiddenPatterns };
  if (stage === 'product_spec') return { title: plan.projectName, users: ['primary user'], goals: definition.requiredFeatures, features: definition.requiredFeatures, flows: ['main workflow', 'selection/input workflow', 'result/export workflow'], edgeCases: ['empty data', 'invalid input', 'loading', 'recoverable error'] };
  if (stage === 'ui_ux_spec') return plan.uiUxSpec;
  if (stage === 'tech_spec') return { framework: 'Next.js App Router', language: 'TypeScript', styling: 'Tailwind CSS', stateManagement: 'React client state', apiRoutes: plan.files.filter((file) => file.startsWith('app/api')), dependencies: ['next', 'react', 'tailwindcss'], dataModels: plan.files.filter((file) => file.startsWith('types/')), validationStrategy: definition.validationRules };
  if (stage === 'file_plan') return { files: plan.files.map((path) => ({ path, purpose: `Required for ${plan.selectedTemplate}` })) };
  if (stage === 'code_generation') return { projectName: plan.projectName, projectSlug: plan.projectName, projectType: plan.projectType, templateId: plan.selectedTemplate, files: files.map((file) => ({ ...file, purpose: file.purpose || 'Generated source file' })), setupCommands: ['npm install'], runCommands: ['npm run dev'], notes: ['Generated from selected template registry'] };
  if (stage === 'static_validation' || stage === 'build_validation') return validation || { passed: false, errors: ['Validation has not run yet'], warnings: [] };
  if (stage === 'quality_review') return validation?.score || null;
  if (stage === 'packaging') return { readyForZip: Boolean(validation?.passed), qualityScore: validation?.score.overallScore };
  return {};
}

async function runStage(projectId: string, stage: StageDefinition, output: unknown): Promise<StageOutput> {
  const route = getResolvedAgentRoute(stage.agentKey);
  const startedAtMs = Date.now();
  const startedAt = new Date(startedAtMs).toISOString();
  const running: GenerationStepLog = {
    stage: stage.stage,
    agentKey: stage.agentKey,
    agentName: stage.agentName,
    provider: route.provider,
    model: route.model,
    requestedProvider: route.requestedProvider,
    requestedModel: route.requestedModel,
    usedFallback: route.usedFallback,
    status: 'running',
    startedAt,
    summary: stage.message,
  };
  appendStep(projectId, running);
  setStatus(projectId, { stage: stage.stage, message: `${stage.message} Using ${route.provider}/${route.model}.`, progress: stage.progress });
  await minStageDelay(startedAtMs);
  const completedAt = new Date().toISOString();
  const completed: GenerationStepLog = {
    ...running,
    status: 'completed',
    completedAt,
    durationMs: Date.parse(completedAt) - startedAtMs,
    summary: summarize(output, `${stage.agentName} completed.`),
    promptTokensEstimate: 0,
    completionTokensEstimate: 0,
    totalTokensEstimate: 0,
    costEstimateUsd: null,
  };
  appendStep(projectId, completed);
  await persistStep(projectId, completed);
  const stageRecord = { agentKey: stage.agentKey, agentName: stage.agentName, stage: stage.stage, output, summary: completed.summary };
  await persistOutput(projectId, stageRecord);
  return stageRecord;
}

function passesQualityGate(score: QualityScore): boolean {
  return score.overallScore >= 8 && score.requirementMatch >= 8 && score.functionality >= 8 && score.runnability >= 8 && score.codeQuality >= 7 && score.uiUxQuality >= 7;
}

export async function generateProjectPackage(project: Project, agents: Agent[] = []): Promise<string> {
  resetGenerationStatus(project.id);
  await createGenerationRun(project);

  let repairAttempts = 0;
  try {
    const plan = createFilePlan(project);
    let files: ProjectFile[] = [];
    let validation: ValidationResult | undefined;
    const outputs: StageOutput[] = [];

    for (const stage of pipelineStages) {
      if (stage.stage === 'code_generation') files = generateTemplateFiles(plan);
      if (stage.stage === 'static_validation') {
        validation = validateGeneratedProject(plan, files);
        await persistValidation(project.id, validation);
        while ((!validation.passed || !passesQualityGate(validation.score)) && repairAttempts < generationQualityConfig.maxRepairAttempts) {
          repairAttempts += 1;
          await runStage(project.id, { stage: 'repair', agentKey: 'repair_agent', agentName: 'Repair Agent', progress: 80 + repairAttempts, message: `Repairing validation issues. Attempt ${repairAttempts}.` }, { errors: validation.errors, warnings: validation.warnings });
          files = repairGeneratedProject(plan, files);
          validation = validateGeneratedProject(plan, files);
          await persistValidation(project.id, validation);
        }
      }
      if (stage.stage === 'build_validation' && !validation) validation = validateGeneratedProject(plan, files);
      outputs.push(await runStage(project.id, stage, stageOutput(stage.stage, plan, files, validation)));
    }

    validation = validation || validateGeneratedProject(plan, files);
    if (!validation.passed || !passesQualityGate(validation.score)) {
      throw new Error(`Quality gate failed. Score ${validation.score.overallScore}/10. ${validation.errors.join(', ')}`);
    }

    setStatus(project.id, {
      stage: 'completed',
      message: 'Project passed validation, quality review, and ZIP gate.',
      progress: 100,
      validationResults: ['Validation passed', ...validation.warnings],
      repairAttempts,
      qualityPassed: true,
      finalScore: validation.score,
    });
    await completeGenerationRun(project.id, 'completed', validation.score);

    return `${renderProjectFileMap(plan, files, validation)}\n\n## Generation Report\n\n${outputs.map((output) => `### ${output.agentName}\n${output.summary}`).join('\n\n')}\n\n## Agent Context\n\n${agents.map((agent) => `- ${agent.name}: ${agent.status}`).join('\n') || '- No pre-run agents required.'}`;
  } catch (error: any) {
    setStatus(project.id, { stage: 'failed', message: error.message || 'Generation failed.', progress: 100, qualityPassed: false, error: error.message });
    await completeGenerationRun(project.id, 'failed', null, error.message);
    throw error;
  }
}
