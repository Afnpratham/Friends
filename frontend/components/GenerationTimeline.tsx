'use client';

import { motion } from 'framer-motion';
import {
  CheckCircle2, Circle, Loader2,
  Brain, Sparkles, Layout, FileText, Palette, Cpu,
  FolderTree, Code2, ShieldCheck, Wrench, Star, PackageCheck,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { generationStages, type GenerationStage } from '@/lib/generation/pipeline';

type GenerationTimelineProps = {
  activeStage: GenerationStage | null;
  completedStages: GenerationStage[];
};

const stageIcons: Record<GenerationStage, React.ReactNode> = {
  'Intent analysis': <Brain className="h-4 w-4" />,
  'Prompt enhancement': <Sparkles className="h-4 w-4" />,
  'Template selection': <Layout className="h-4 w-4" />,
  'Product spec': <FileText className="h-4 w-4" />,
  'UI/UX spec': <Palette className="h-4 w-4" />,
  'Tech spec': <Cpu className="h-4 w-4" />,
  'File planning': <FolderTree className="h-4 w-4" />,
  'Code generation': <Code2 className="h-4 w-4" />,
  'Validation': <ShieldCheck className="h-4 w-4" />,
  'Repair': <Wrench className="h-4 w-4" />,
  'Quality review': <Star className="h-4 w-4" />,
  'Packaging ZIP': <PackageCheck className="h-4 w-4" />,
};

export function GenerationTimeline({ activeStage, completedStages }: GenerationTimelineProps) {
  return (
    <GlassCard className="p-5 sm:p-6" glowColor="violet">
      <div className="mb-5">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-hover">
          Generation progress
        </p>
        <h2 className="mt-1 text-lg font-black text-white">FRIENDS execution timeline</h2>
      </div>

      {/* Vertical timeline */}
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute left-[17px] top-0 bottom-0 w-px bg-gradient-to-b from-primary/30 via-primary/15 to-white/[0.04]" />

        <div className="space-y-2">
          {generationStages.map((stage, index) => {
            const complete = completedStages.includes(stage);
            const active = activeStage === stage;

            return (
              <motion.div
                key={stage}
                className={`relative flex items-center gap-4 rounded-xl border px-4 py-3 transition-all duration-300 ${
                  complete
                    ? 'border-success/20 bg-success/[0.06]'
                    : active
                      ? 'border-primary/35 bg-primary/[0.08] shadow-glow-sm'
                      : 'border-white/[0.04] bg-white/[0.02]'
                }`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
              >
                {/* Icon */}
                <div
                  className={`relative z-10 flex h-[35px] w-[35px] flex-none items-center justify-center rounded-lg ${
                    complete
                      ? 'bg-success/15 text-success'
                      : active
                        ? 'bg-primary/15 text-primary animate-pulse-glow'
                        : 'bg-white/[0.04] text-slate-600'
                  }`}
                >
                  {complete ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : active ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    stageIcons[stage] || <Circle className="h-4 w-4" />
                  )}
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-sm font-bold ${
                      complete
                        ? 'text-success'
                        : active
                          ? 'text-primary-hover'
                          : 'text-slate-600'
                    }`}
                  >
                    {stage}
                  </span>
                </div>

                {/* Status badge */}
                {complete && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-success/70">
                    Done
                  </span>
                )}
                {active && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary/70 animate-pulse">
                    Running
                  </span>
                )}

                {/* Active shimmer overlay */}
                {active && (
                  <div className="absolute inset-0 rounded-xl animate-shimmer pointer-events-none" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}
