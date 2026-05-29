'use client';

import { motion } from 'framer-motion';
import {
  Sparkles, Layout, Code2, ShieldCheck, Wrench, PackageCheck,
} from 'lucide-react';
import { FloatingBadge } from '@/components/ui/FloatingBadge';

const badges = [
  { icon: <Sparkles className="h-3.5 w-3.5" />, label: 'Prompt Enhancer' },
  { icon: <Layout className="h-3.5 w-3.5" />, label: 'Template Selector' },
  { icon: <Code2 className="h-3.5 w-3.5" />, label: 'Code Generator' },
  { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: 'Validator' },
  { icon: <Wrench className="h-3.5 w-3.5" />, label: 'Repair Agent' },
  { icon: <PackageCheck className="h-3.5 w-3.5" />, label: 'ZIP Export' },
];

export function FriendsHero() {
  return (
    <section className="relative pb-4 pt-10 sm:pt-14">
      {/* Eyebrow badge */}
      <motion.p
        className="mb-5 inline-flex rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-primary-hover"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        AI app and project builder
      </motion.p>

      {/* Title */}
      <motion.h2
        className="max-w-5xl font-display text-4xl font-black leading-[1.1] text-white sm:text-5xl lg:text-6xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        Build{' '}
        <span className="gradient-text-animated">complete apps</span>
        {' '}with your AI team.
      </motion.h2>

      {/* Subtitle */}
      <motion.p
        className="mt-5 max-w-3xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Describe any idea. FRIENDS enhances the prompt, designs the architecture,
        generates code, validates it, repairs issues, and exports a runnable project.
      </motion.p>

      {/* Floating badges */}
      <div className="mt-7 flex flex-wrap gap-2.5">
        {badges.map((badge, index) => (
          <FloatingBadge
            key={badge.label}
            icon={badge.icon}
            label={badge.label}
            delay={index}
          />
        ))}
      </div>
    </section>
  );
}
