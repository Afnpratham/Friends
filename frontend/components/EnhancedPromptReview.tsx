'use client';

import { motion } from 'framer-motion';
import {
  Check, RefreshCcw, Wand2, FileCode2, Layers, Globe,
  ListChecks, FolderTree, ShieldAlert,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import type { EnhancedPrompt } from '@/lib/generation/pipeline';

type EnhancedPromptReviewProps = {
  rawPrompt: string;
  enhancedPrompt: EnhancedPrompt;
  editablePrompt: string;
  onEditPrompt: (value: string) => void;
  onRegenerate: () => void;
  onApprove: () => void;
};

const infoBlockIcons: Record<string, React.ReactNode> = {
  'Raw prompt': <FileCode2 className="h-4 w-4 text-primary" />,
  'Detected project type': <Layers className="h-4 w-4 text-accent" />,
  'Selected template': <Globe className="h-4 w-4 text-accent-pink" />,
  'Required features': <ListChecks className="h-4 w-4 text-success" />,
  'Required files': <FolderTree className="h-4 w-4 text-accent" />,
  'Forbidden mistakes': <ShieldAlert className="h-4 w-4 text-warning" />,
};

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function EnhancedPromptReview({
  rawPrompt,
  enhancedPrompt,
  editablePrompt,
  onEditPrompt,
  onRegenerate,
  onApprove,
}: EnhancedPromptReviewProps) {
  return (
    <GlassCard className="p-5 sm:p-6" glowColor="cyan">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-success">
            Approval screen
          </p>
          <h2 className="mt-1 text-lg font-black text-white">Review enhanced prompt</h2>
        </div>
        <span className="rounded-full border border-success/25 bg-success/10 px-3 py-1 text-xs font-black text-success">
          {enhancedPrompt.selectedTemplate.id}
        </span>
      </div>

      {/* Info blocks — split layout */}
      <motion.div
        className="grid gap-3 lg:grid-cols-2"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
      >
        <InfoBlock title="Raw prompt" items={[rawPrompt]} />
        <InfoBlock
          title="Detected project type"
          items={[enhancedPrompt.intentProjectType, enhancedPrompt.domain]}
        />
        <InfoBlock
          title="Selected template"
          items={[enhancedPrompt.selectedTemplate.id, enhancedPrompt.selectedTemplate.description]}
        />
        <InfoBlock title="Required features" items={enhancedPrompt.domainSpecificFeatures} />
        <InfoBlock title="Required files" items={enhancedPrompt.requiredFiles} />
        <InfoBlock title="Forbidden mistakes" items={enhancedPrompt.forbiddenMistakes} />
      </motion.div>

      {/* Editable enhanced prompt */}
      <div className="mt-5 rounded-2xl border border-white/[0.06] bg-[#030014]/50 p-4">
        <label className="mb-2 block text-sm font-black text-slate-200">Enhanced prompt</label>
        <textarea
          value={editablePrompt}
          onChange={(event) => onEditPrompt(event.target.value)}
          className="min-h-[260px] w-full resize-y rounded-xl border border-white/[0.06] bg-[#030014]/80 p-4 font-mono text-xs leading-6 text-slate-300 outline-none transition-all duration-300 focus:border-primary/40 focus:shadow-[0_0_30px_rgba(139,92,246,0.06)] focus:ring-2 focus:ring-primary/10"
        />
      </div>

      {/* Action buttons */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <GradientButton
          variant="secondary"
          onClick={() => onEditPrompt(editablePrompt)}
          icon={<Wand2 className="h-4 w-4" />}
        >
          Edit Enhanced Prompt
        </GradientButton>
        <GradientButton
          variant="secondary"
          onClick={onRegenerate}
          icon={<RefreshCcw className="h-4 w-4" />}
        >
          Regenerate
        </GradientButton>
        <GradientButton
          onClick={onApprove}
          icon={<Check className="h-4 w-4" />}
          className="flex-1"
        >
          Approve and Generate
        </GradientButton>
      </div>
    </GlassCard>
  );
}

function InfoBlock({ title, items }: { title: string; items: string[] }) {
  const icon = infoBlockIcons[title] || null;
  return (
    <motion.div
      className="rounded-2xl border border-white/[0.06] bg-[#030014]/40 p-4"
      variants={staggerItem}
    >
      <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-white">
        {icon}
        {title}
      </h3>
      <ul className="space-y-2 text-sm leading-6 text-slate-400">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-primary/60" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
