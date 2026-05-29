/**
 * New Project Wizard — 4-step guided project creation.
 * Step 1: Choose workflow type
 * Step 2: Describe the project
 * Step 3: Answer clarifying questions
 * Step 4: Review & launch agents
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { projectsApi, clarifyApi, promptEnhancerApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Globe, Rocket, GraduationCap, Users, ArrowRight, ArrowLeft,
  Loader2, Sparkles, Check, ChevronRight, RefreshCcw, Wand2,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';

type WorkflowType = 'website' | 'startup' | 'student' | 'custom';

type PromptEnhancement = {
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
  finalEnhancedPrompt: string;
};

const workflows = [
  {
    type: 'website' as WorkflowType,
    icon: Globe,
    title: 'Website Builder',
    description: 'Build a complete website with code, UI/UX design, backend API, docs, and deployment guide.',
    agents: ['Product Manager', 'UI/UX Designer', 'Frontend Dev', 'Backend Dev', 'QA Tester', 'Docs Writer', 'Code Packager'],
    color: '#6366f1',
    gradient: 'from-indigo-500 to-purple-600',
    borderColor: 'border-indigo-500/20 hover:border-indigo-500/40',
    example: 'Build a study notes dashboard for uploaded course PDFs',
  },
  {
    type: 'startup' as WorkflowType,
    icon: Rocket,
    title: 'Startup Builder',
    description: 'Go from idea to investor-ready with market research, strategy, pitch deck, and risk analysis.',
    agents: ['Market Research', 'Business Strategist', 'Product Manager', 'Monetization', 'Brand Strategist', 'Pitch Deck', 'Risk Analyst', 'Code Packager'],
    color: '#06b6d4',
    gradient: 'from-cyan-500 to-blue-600',
    borderColor: 'border-cyan-500/20 hover:border-cyan-500/40',
    example: 'A platform connecting freelance tutors with K-12 students in rural India',
  },
  {
    type: 'student' as WorkflowType,
    icon: GraduationCap,
    title: 'Student Project',
    description: 'Get a unique project idea with full implementation plan, README, resume bullets, and viva Q&A.',
    agents: ['Idea Generator', 'System Designer', 'Code Planner', 'Docs Writer', 'Resume Builder', 'Viva Coach', 'Code Packager'],
    color: '#10b981',
    gradient: 'from-emerald-500 to-teal-600',
    borderColor: 'border-emerald-500/20 hover:border-emerald-500/40',
    example: 'Final year project for Computer Science using Machine Learning and React',
  },
  {
    type: 'custom' as WorkflowType,
    icon: Users,
    title: 'Custom Workflow',
    description: 'Build your own AI team. Define any roles, tasks, and expected outputs for maximum flexibility.',
    agents: ['Your Custom Agents'],
    color: '#f59e0b',
    gradient: 'from-orange-500 to-pink-600',
    borderColor: 'border-orange-500/20 hover:border-orange-500/40',
    example: 'I need a custom team for my unique project needs...',
  },
];

const stepLabels = ['Choose Workflow', 'Raw Idea', 'Enhance Prompt', 'Approve'];
const workflowTypes = workflows.map((workflow) => workflow.type);

const inputClasses =
  'w-full rounded-xl border border-white/[0.08] bg-[#020014]/60 px-4 py-3 text-sm text-white outline-none transition-all duration-300 placeholder:text-slate-600 focus:border-primary/40 focus:shadow-[0_0_20px_rgba(139,92,246,0.08)] focus:ring-2 focus:ring-primary/10';

export default function NewProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType | null>(
    workflowTypes.includes(searchParams.get('workflow') as WorkflowType)
      ? (searchParams.get('workflow') as WorkflowType)
      : null
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [enhancement, setEnhancement] = useState<PromptEnhancement | null>(null);
  const [enhancedPromptText, setEnhancedPromptText] = useState('');
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [creating, setCreating] = useState(false);

  // Auto-advance if workflow pre-selected
  useEffect(() => {
    if (selectedWorkflow) setStep(2);
  }, [selectedWorkflow]);

  const handleWorkflowSelect = (type: WorkflowType) => {
    setSelectedWorkflow(type);
    setStep(2);
  };

  const handleDescriptionNext = async () => {
    if (!selectedWorkflow) {
      toast.error('Please choose a workflow');
      setStep(1);
      return;
    }
    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in both the title and description');
      return;
    }
    await handleEnhancePrompt(false);
  };

  const getAnsweredClarifications = () =>
    questions
      .map((q, i) => ({ question: q, answer: answers[i] || 'No answer provided' }))
      .filter((qa) => qa.answer !== 'No answer provided');

  const handleEnhancePrompt = async (withClarifications: boolean) => {
    if (!selectedWorkflow) return;

    setEnhancing(true);
    const { data, error } = await promptEnhancerApi.enhance({
      title: title.trim(),
      workflow_type: selectedWorkflow,
      raw_prompt: description.trim(),
      clarifications: withClarifications ? getAnsweredClarifications() : [],
    });
    setEnhancing(false);

    if (error || !data) {
      toast.error(error || 'Failed to enhance prompt');
      return;
    }

    const result = data as any;
    if (result.needsClarification && !withClarifications) {
      const qs = result.clarifyingQuestions || [];
      setQuestions(qs);
      setAnswers(new Array(qs.length).fill(''));
      setStep(3);
      return;
    }

    const nextEnhancement = result.enhancement as PromptEnhancement;
    setEnhancement(nextEnhancement);
    setEnhancedPromptText(nextEnhancement.finalEnhancedPrompt);
    setEditingPrompt(false);
    setStep(4);
  };

  const handleAskClarifyingQuestions = async () => {
    if (!selectedWorkflow) return;
    setLoadingQuestions(true);
    const { data, error } = await clarifyApi.getQuestions({
      title: title.trim(),
      workflow_type: selectedWorkflow,
      description: enhancedPromptText || description.trim(),
    });
    setLoadingQuestions(false);

    if (error) {
      toast.error(error);
      return;
    }

    const qs = (data as any)?.questions || [];
    setQuestions(qs);
    setAnswers(new Array(qs.length).fill(''));
    setStep(3);
  };

  const handleCreate = async () => {
    if (!selectedWorkflow) {
      toast.error('Please choose a workflow');
      setStep(1);
      return;
    }

    setCreating(true);

    const clarifications = getAnsweredClarifications();
    const finalPrompt = enhancedPromptText.trim() || description.trim();

    const { data, error } = await projectsApi.create({
      title: enhancement?.projectTitle || title.trim(),
      workflow_type: selectedWorkflow,
      description: finalPrompt,
      raw_prompt: description.trim(),
      enhanced_prompt: finalPrompt,
      prompt_status: 'approved',
      clarifications,
    });

    if (error) {
      toast.error(error);
      setCreating(false);
      return;
    }

    const projectId = (data as any)?.id;
    if (!projectId) {
      toast.error('Project was created but no project ID was returned.');
      setCreating(false);
      return;
    }

    toast.success('Project created! Your AI team is ready.');
    router.push(`/dashboard/projects/${projectId}`);
  };

  const selectedWf = workflows.find((w) => w.type === selectedWorkflow);

  return (
    <div className="min-h-full p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">New Project</h1>
            <p className="text-sm text-slate-500">Set up your AI team and define what you want to build</p>
          </div>
        </div>
      </motion.div>

      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2">
        {stepLabels.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-shrink-0">
            <div className={`flex items-center gap-2 ${i + 1 <= step ? 'text-white' : 'text-slate-600'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i + 1 < step ? 'bg-primary text-white shadow-glow-sm' :
                i + 1 === step ? 'bg-primary text-white ring-2 ring-primary/30 shadow-glow-sm' :
                'border border-white/[0.08] text-slate-600'
              }`}>
                {i + 1 < step ? <Check size={12} /> : i + 1}
              </div>
              <span className="text-sm font-bold">{label}</span>
            </div>
            {i < stepLabels.length - 1 && (
              <ChevronRight size={14} className="text-slate-700 mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        {/* ── Step 1: Workflow Selection ── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-black text-white mb-2">Choose a Workflow</h2>
            <p className="text-slate-500 mb-6 text-sm">Select a template to get a pre-configured AI team, or build your own.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {workflows.map((wf) => (
                <motion.button
                  key={wf.type}
                  onClick={() => handleWorkflowSelect(wf.type)}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`rounded-[20px] border bg-white/[0.03] p-6 text-left backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.06] hover:shadow-glow-sm ${wf.borderColor}`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${wf.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                    <wf.icon size={22} className="text-white" />
                  </div>
                  <h3 className="text-white font-black mb-2">{wf.title}</h3>
                  <p className="text-slate-500 text-sm mb-4 leading-relaxed">{wf.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {wf.agents.slice(0, 4).map((agent) => (
                      <span key={agent} className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] font-bold text-slate-500">{agent}</span>
                    ))}
                    {wf.agents.length > 4 && (
                      <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] font-bold text-slate-500">+{wf.agents.length - 4}</span>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Describe Project ── */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {selectedWf && (
              <div className="flex items-center gap-3 mb-6 rounded-[18px] border border-white/[0.06] bg-white/[0.03] p-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedWf.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <selectedWf.icon size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-bold">{selectedWf.title}</p>
                  <p className="text-slate-500 text-sm">{selectedWf.agents.length} agents ready</p>
                </div>
              </div>
            )}

            <h2 className="text-xl font-black text-white mb-6">Describe Your Project</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Project Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Fitness App Landing Page"
                  className={inputClasses}
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">
                  Project Description
                  <span className="text-slate-600 font-normal ml-2">— be specific for better agent output</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={selectedWf?.example || 'Describe what you want to build...'}
                  className={`${inputClasses} resize-none`}
                  rows={5}
                  maxLength={1000}
                />
                <p className="text-slate-700 text-xs mt-1.5 text-right">{description.length}/1000</p>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <GradientButton variant="secondary" onClick={() => setStep(1)} icon={<ArrowLeft size={15} />}>
                Back
              </GradientButton>
              <GradientButton
                onClick={handleDescriptionNext}
                disabled={enhancing}
                className="flex-1"
                icon={enhancing ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
              >
                {enhancing ? 'Enhancing prompt...' : 'Enhance Prompt'}
              </GradientButton>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Clarifying Questions ── */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-black text-white mb-2">Clarifying Questions</h2>
            <p className="text-slate-500 mb-6 text-sm">Help your AI team understand the project better. Skip any you&apos;re unsure about.</p>

            {loadingQuestions ? (
              <GlassCard className="p-12 flex flex-col items-center gap-4" animate={false}>
                <Loader2 size={28} className="animate-spin text-primary" />
                <p className="text-slate-400 font-bold">Generating smart questions for your project...</p>
              </GlassCard>
            ) : (
              <div className="space-y-4">
                {questions.map((question, i) => (
                  <GlassCard key={i} className="p-5" animate={false}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 text-xs font-black text-primary border border-primary/25 mt-0.5">
                        {i + 1}
                      </div>
                      <p className="text-slate-200 font-bold leading-relaxed">{question}</p>
                    </div>
                    <textarea
                      value={answers[i] || ''}
                      onChange={(e) => {
                        const newAnswers = [...answers];
                        newAnswers[i] = e.target.value;
                        setAnswers(newAnswers);
                      }}
                      placeholder="Your answer (optional)..."
                      className={`${inputClasses} resize-none text-sm mt-2`}
                      rows={2}
                    />
                  </GlassCard>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <GradientButton variant="secondary" onClick={() => setStep(2)} icon={<ArrowLeft size={15} />}>
                Back
              </GradientButton>
              <GradientButton
                onClick={() => handleEnhancePrompt(true)}
                disabled={enhancing}
                className="flex-1"
                icon={enhancing ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
              >
                {enhancing ? 'Refining...' : 'Continue'}
              </GradientButton>
            </div>
          </motion.div>
        )}

        {/* ── Step 4: Enhanced Prompt Approval ── */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-black text-white mb-2">Enhanced Project Prompt</h2>
            <p className="text-slate-500 mb-6 text-sm">Review and edit what FRIENDS understood before any project generation starts.</p>

            <div className="space-y-4">
              <GlassCard className="p-5" animate={false}>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-600 mb-1.5">What you asked</p>
                <p className="text-slate-300 leading-relaxed text-sm">{description}</p>
              </GlassCard>

              {enhancement && (
                <>
                  <GlassCard className="p-5" glowColor="violet" animate={false}>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-primary/60 mb-1.5">What FRIENDS understood</p>
                    <h3 className="text-white font-black text-lg">{enhancement.projectTitle}</h3>
                    <p className="text-primary-hover text-sm mt-1 font-bold">{enhancement.projectType}</p>
                    <p className="text-slate-400 mt-3 leading-relaxed text-sm">{enhancement.mainGoal}</p>
                  </GlassCard>

                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      { title: 'Features to build', items: enhancement.requiredFeatures },
                      { title: 'Tech stack', items: [...enhancement.frontendRequirements, ...enhancement.backendRequirements.slice(0, 2)] },
                      { title: 'User flow', items: enhancement.userFlow },
                      { title: 'Files to generate', items: enhancement.requiredFiles.slice(0, 8) },
                    ].map((block) => (
                      <GlassCard key={block.title} className="p-4" animate={false}>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-600 mb-2.5">{block.title}</p>
                        <ul className="space-y-1.5 text-sm text-slate-400">
                          {block.items.map((item) => (
                            <li key={item} className="flex gap-2">
                              <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-primary/40" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </GlassCard>
                    ))}
                  </div>

                  <GlassCard className="p-4" animate={false}>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-warning/60 mb-2.5">Things FRIENDS must avoid</p>
                    <ul className="space-y-1.5 text-sm text-slate-400">
                      {enhancement.forbiddenMistakes.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-warning/40" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </GlassCard>
                </>
              )}

              <GlassCard className="p-5" animate={false}>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">Final prompt</p>
                  <button
                    onClick={() => setEditingPrompt(true)}
                    className="text-xs font-bold text-primary/60 hover:text-primary transition-colors"
                  >
                    Edit Prompt
                  </button>
                </div>
                <textarea
                  value={enhancedPromptText}
                  onChange={(event) => setEnhancedPromptText(event.target.value)}
                  readOnly={!editingPrompt}
                  className={`${inputClasses} min-h-[280px] resize-y font-mono text-xs leading-relaxed`}
                />
              </GlassCard>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <GradientButton variant="secondary" onClick={() => setStep(2)} icon={<ArrowLeft size={15} />}>
                Back
              </GradientButton>
              <GradientButton
                variant="secondary"
                onClick={() => handleEnhancePrompt(answers.some(Boolean))}
                disabled={enhancing}
                icon={enhancing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCcw size={15} />}
              >
                Regenerate
              </GradientButton>
              <GradientButton
                variant="secondary"
                onClick={handleAskClarifyingQuestions}
                disabled={loadingQuestions}
                icon={loadingQuestions ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
              >
                Clarify
              </GradientButton>
              <GradientButton
                onClick={handleCreate}
                disabled={creating || !enhancedPromptText.trim()}
                className="flex-1"
                icon={creating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              >
                {creating ? 'Creating project...' : 'Approve and Generate'}
              </GradientButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
