'use client';

import { motion } from 'framer-motion';
import { Sparkles, Terminal, Command } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import type { ProjectType } from '@/lib/templates/templateRegistry';

const workflowTypes: ProjectType[] = [
  'Auto-detect',
  'Website',
  'Functional Web App',
  'Dashboard',
  'AI Tool',
  'Startup Builder',
  'Student Project',
];

const placeholderExamples = [
  'Build an ambulance tracker',
  'Make an expense tracker',
  'Create a PDF notes converter',
  'Build a student attendance portal',
];

type PromptInputProps = {
  rawPrompt: string;
  selectedType: ProjectType;
  onPromptChange: (prompt: string) => void;
  onTypeChange: (type: ProjectType) => void;
  onEnhance: () => void;
  canEnhance: boolean;
};

export function PromptInput({
  rawPrompt,
  selectedType,
  onPromptChange,
  onTypeChange,
  onEnhance,
  canEnhance,
}: PromptInputProps) {
  return (
    <GlassCard className="p-5 sm:p-6" glowColor="violet">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
            <Terminal className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">
              Project idea
            </p>
            <h2 className="text-lg font-black text-white">Tell FRIENDS what to build</h2>
          </div>
        </div>
        <Sparkles className="h-5 w-5 text-primary/60" />
      </div>

      {/* Example chips */}
      <div className="mb-3 flex flex-wrap gap-2">
        {placeholderExamples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => onPromptChange(example)}
            className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-muted transition-all duration-200 hover:border-primary/25 hover:bg-primary/5 hover:text-slate-200"
          >
            {example}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={rawPrompt}
          onChange={(event) => onPromptChange(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault();
              if (canEnhance) onEnhance();
            }
          }}
          className="min-h-[180px] w-full resize-y rounded-2xl border border-white/[0.08] bg-[#030014]/60 p-4 text-base leading-7 text-white outline-none transition-all duration-300 placeholder:text-slate-600 focus:border-primary/40 focus:shadow-[0_0_30px_rgba(139,92,246,0.08)] focus:ring-2 focus:ring-primary/10"
          placeholder="Describe any app, website, dashboard, AI tool, or startup idea..."
          aria-label="Project idea prompt"
        />
      </div>

      {/* Workflow type selector */}
      <div className="mt-4">
        <p className="mb-2.5 text-sm font-bold text-slate-300">Workflow / project type</p>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 xl:grid-cols-7">
          {workflowTypes.map((type) => (
            <motion.button
              key={type}
              type="button"
              onClick={() => onTypeChange(type)}
              className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-bold transition-all duration-200 ${
                selectedType === type
                  ? 'border-primary/50 bg-primary/20 text-white shadow-glow-sm'
                  : 'border-white/[0.06] bg-white/[0.03] text-slate-400 hover:border-primary/25 hover:bg-white/[0.06] hover:text-slate-200'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {type}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <GradientButton
          onClick={onEnhance}
          disabled={!canEnhance}
          icon={<Sparkles className="h-4 w-4" />}
          className="sm:w-auto"
          fullWidth
        >
          Enhance Prompt
        </GradientButton>
        <span className="hidden items-center gap-1.5 text-xs font-medium text-slate-600 sm:flex">
          <Command className="h-3 w-3" />
          <span>+ Enter to enhance</span>
        </span>
      </div>
    </GlassCard>
  );
}
