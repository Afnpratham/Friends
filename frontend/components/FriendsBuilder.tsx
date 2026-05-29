'use client';

import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Blocks, History, Network, Zap, Clock, Layers, ArrowRight } from 'lucide-react';
import { FriendsHero } from '@/components/FriendsHero';
import { ModelStatusBar } from '@/components/ModelStatusBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { EnhancedPromptReview } from '@/components/EnhancedPromptReview';
import { GeneratedProjectPreview } from '@/components/GeneratedProjectPreview';
import { GenerationTimeline } from '@/components/GenerationTimeline';
import { PromptInput } from '@/components/PromptInput';
import {
  createGenerationRunId,
  enhancePrompt,
  generateProject,
  generationStages,
  type EnhancedPrompt,
  type GeneratedProject,
  type GenerationStage,
} from '@/lib/generation/pipeline';
import { templateRegistry, type ProjectType } from '@/lib/templates/templateRegistry';

const starterProjects: string[] = [];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export function FriendsBuilder() {
  const activeRunRef = useRef<string | null>(null);
  const timeoutRef = useRef<number[]>([]);

  const [rawPrompt, setRawPrompt] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('Auto-detect');
  const [currentGenerationRunId, setCurrentGenerationRunId] = useState<string | null>(null);
  const [enhancedPromptState, setEnhancedPrompt] = useState<EnhancedPrompt | null>(null);
  const [editablePrompt, setEditablePrompt] = useState('');
  const [completedStages, setCompletedStages] = useState<GenerationStage[]>([]);
  const [activeStage, setActiveStage] = useState<GenerationStage | null>(null);
  const [currentProjectPreview, setCurrentProjectPreview] = useState<GeneratedProject | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [recentProjects, setRecentProjects] = useState<string[]>(starterProjects);

  const canEnhance = rawPrompt.trim().length > 8;

  function clearScheduledStages() {
    timeoutRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutRef.current = [];
  }

  function resetGenerationState(options: { clearRawPrompt?: boolean } = {}) {
    clearScheduledStages();
    activeRunRef.current = null;
    setCurrentGenerationRunId(null);
    setEnhancedPrompt(null);
    setEditablePrompt('');
    setCompletedStages([]);
    setActiveStage(null);
    setCurrentProjectPreview(null);
    setErrors([]);
    if (options.clearRawPrompt) setRawPrompt('');
  }

  function handlePromptChange(prompt: string) {
    setRawPrompt(prompt);
    resetGenerationState();
  }

  function handleEnhance() {
    if (!canEnhance) return;

    resetGenerationState();
    const generationRunId = createGenerationRunId();
    activeRunRef.current = generationRunId;
    setCurrentGenerationRunId(generationRunId);

    const nextEnhancedPrompt = enhancePrompt(rawPrompt.trim(), projectType, generationRunId);
    setEnhancedPrompt(nextEnhancedPrompt);
    setEditablePrompt(nextEnhancedPrompt.finalPrompt);
    setCompletedStages(['Intent analysis', 'Prompt enhancement', 'Template selection']);
    setActiveStage(null);
  }

  function handleRegenerate() {
    handleEnhance();
  }

  function handleApprove() {
    if (!enhancedPromptState || !currentGenerationRunId) return;

    const generationRunId = currentGenerationRunId;
    activeRunRef.current = generationRunId;

    const reviewedPrompt: EnhancedPrompt = {
      ...enhancedPromptState,
      generationRunId,
      finalPrompt: editablePrompt,
    };

    setEnhancedPrompt(reviewedPrompt);
    setCurrentProjectPreview(null);
    setCompletedStages([]);
    setErrors([]);

    generationStages.forEach((stage, index) => {
      const timeoutId = window.setTimeout(() => {
        if (activeRunRef.current !== generationRunId) return;
        setActiveStage(stage);
        setCompletedStages(generationStages.slice(0, index));
      }, index * 150);
      timeoutRef.current.push(timeoutId);
    });

    const finishTimeout = window.setTimeout(async () => {
      if (activeRunRef.current !== generationRunId) return;
      const project = generateProject(reviewedPrompt);
      if (project.generationRunId !== activeRunRef.current) return;

      const pendingProject: GeneratedProject = {
        ...project,
        exportReady: false,
        validationStatus: project.validationStatus === 'failed' ? 'failed' : 'pending',
        validationReport: [
          ...project.validationReport,
          'Running npm install and npm run build before enabling ZIP export.',
        ],
      };

      setCurrentProjectPreview(pendingProject);
      setErrors(project.validationStatus === 'failed' ? project.validationReport.filter((item) => item.startsWith('Error:')) : []);
      setRecentProjects((current) => [project.projectName, ...current.filter((item) => item !== project.projectName)].slice(0, 5));
      setCompletedStages([...generationStages]);
      setActiveStage(null);

      if (project.validationStatus === 'failed') return;

      try {
        const response = await fetch('/api/validate-generated-project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            generationRunId,
            files: project.files,
          }),
        });
        const result = (await response.json()) as { ok: boolean; log?: string };

        if (activeRunRef.current !== generationRunId) return;

        if (result.ok) {
          setCurrentProjectPreview({
            ...project,
            exportReady: true,
            validationStatus: 'passed',
            validationReport: [
              ...project.validationReport,
              'npm install completed for generated project.',
              'npm run build completed successfully for generated project.',
            ],
          });
          setErrors([]);
          return;
        }

        const buildLog = result.log ?? 'Generated project build failed.';
        setCurrentProjectPreview({
          ...project,
          exportReady: false,
          validationStatus: 'failed',
          validationReport: [...project.validationReport, `Error: ${buildLog}`],
        });
        setErrors([buildLog]);
      } catch (error) {
        if (activeRunRef.current !== generationRunId) return;
        const message = error instanceof Error ? error.message : 'Generated project build validation failed.';
        setCurrentProjectPreview({
          ...project,
          exportReady: false,
          validationStatus: 'failed',
          validationReport: [...project.validationReport, `Error: ${message}`],
        });
        setErrors([message]);
      }
    }, generationStages.length * 150 + 180);

    timeoutRef.current.push(finishTimeout);
  }

  const visibleProject =
    currentProjectPreview && currentProjectPreview.generationRunId === currentGenerationRunId
      ? currentProjectPreview
      : null;

  const stats = useMemo(
    () => [
      { label: 'Templates', value: templateRegistry.length.toString(), icon: Blocks, color: 'text-primary' },
      { label: 'Stages', value: generationStages.length.toString(), icon: Network, color: 'text-accent' },
      { label: 'Exports', value: 'ZIP', icon: Zap, color: 'text-accent-pink' },
    ],
    [],
  );

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Model status bar */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <ModelStatusBar />
        </motion.div>

        {/* Hero */}
        <FriendsHero />

        {/* Stats bar */}
        <motion.div
          className="mt-6 mb-8 grid grid-cols-3 gap-3 sm:flex sm:gap-4"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 backdrop-blur-sm"
              variants={fadeUp}
            >
              <stat.icon className={`h-4 w-4 flex-none ${stat.color}`} />
              <div>
                <p className="text-lg font-black text-white leading-none">{stat.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  {stat.label}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main content grid */}
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          {/* Left column */}
          <div className="space-y-6">
            <PromptInput
              rawPrompt={rawPrompt}
              selectedType={projectType}
              onPromptChange={handlePromptChange}
              onTypeChange={setProjectType}
              onEnhance={handleEnhance}
              canEnhance={canEnhance}
            />

            {enhancedPromptState && enhancedPromptState.generationRunId === currentGenerationRunId ? (
              <EnhancedPromptReview
                rawPrompt={rawPrompt}
                enhancedPrompt={enhancedPromptState}
                editablePrompt={editablePrompt}
                onEditPrompt={setEditablePrompt}
                onRegenerate={handleRegenerate}
                onApprove={handleApprove}
              />
            ) : null}

            <GenerationTimeline activeStage={activeStage} completedStages={completedStages} />

            {errors.length > 0 ? (
              <motion.section
                className="rounded-2xl border border-danger/20 bg-danger/[0.06] p-5 text-sm font-bold text-red-200"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {errors.map((error) => (
                  <p key={error}>{error}</p>
                ))}
              </motion.section>
            ) : null}

            {visibleProject ? <GeneratedProjectPreview project={visibleProject} /> : null}
          </div>

          {/* Right sidebar */}
          <aside className="space-y-6">
            {/* Recent projects */}
            <div id="recent-projects">
            <GlassCard className="p-5" glowColor="cyan">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                  <History className="h-4 w-4 text-accent" />
                </div>
                <h2 className="text-base font-black text-white">Recent projects</h2>
              </div>
              <div className="space-y-2">
                {recentProjects.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/[0.08] bg-[#030014]/40 px-4 py-5 text-center">
                    <Clock className="mx-auto mb-2 h-5 w-5 text-slate-700" />
                    <p className="text-sm font-bold text-slate-600">
                      Generated project history will appear here
                    </p>
                  </div>
                ) : null}
                {recentProjects.map((project) => (
                  <motion.button
                    key={project}
                    type="button"
                    className="group flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-[#030014]/40 px-4 py-3 text-left text-sm font-bold text-slate-400 transition-all duration-200 hover:border-primary/25 hover:bg-primary/[0.04] hover:text-white"
                    whileHover={{ x: 2 }}
                  >
                    <span className="truncate">{project}</span>
                    <ArrowRight className="h-3.5 w-3.5 flex-none text-slate-700 transition-colors group-hover:text-primary" />
                  </motion.button>
                ))}
              </div>
            </GlassCard>
            </div>

            {/* Architecture info */}
            <GlassCard className="p-5" glowColor="violet">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Layers className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-base font-black text-white">Architecture</h2>
              </div>
              <p className="text-sm leading-6 text-slate-500">
                FRIENDS is the builder platform. Generated projects are isolated file maps,
                previewed separately, and exported as ZIP files. They never overwrite this homepage.
              </p>
              {currentGenerationRunId ? (
                <motion.div
                  className="mt-4 rounded-xl border border-white/[0.06] bg-[#030014]/60 px-4 py-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Current run
                  </p>
                  <p className="font-mono text-xs text-primary/70 break-all">
                    {currentGenerationRunId}
                  </p>
                </motion.div>
              ) : null}
            </GlassCard>
          </aside>
        </div>
      </div>
    </>
  );
}
