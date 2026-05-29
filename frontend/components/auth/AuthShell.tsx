'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Code2, ShieldCheck, Wrench, PackageCheck, Zap, Layout } from 'lucide-react';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { FloatingBadge } from '@/components/ui/FloatingBadge';

const featureBadges = [
  { icon: <Sparkles className="h-3.5 w-3.5" />, label: 'Prompt Enhancer' },
  { icon: <Layout className="h-3.5 w-3.5" />, label: 'Template Selector' },
  { icon: <Code2 className="h-3.5 w-3.5" />, label: 'Code Generator' },
  { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: 'Validator' },
  { icon: <Wrench className="h-3.5 w-3.5" />, label: 'Repair Agent' },
  { icon: <PackageCheck className="h-3.5 w-3.5" />, label: 'ZIP Export' },
];

type AuthShellProps = {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  showFeatures?: boolean;
  sideContent?: React.ReactNode;
};

export function AuthShell({ children, title, subtitle, showFeatures = true, sideContent }: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <AnimatedBackground />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Navbar */}
        <nav className="border-b border-white/[0.06] bg-[#020014]/60 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 shadow-glow-sm transition-all duration-300 group-hover:shadow-glow-primary">
                <Sparkles className="h-4 w-4" />
                <div className="absolute inset-0 rounded-xl bg-primary/20 blur-md opacity-50" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight">FRIENDS</span>
                <p className="hidden text-[9px] font-bold uppercase tracking-[0.14em] text-muted sm:block">
                  AI App Builder
                </p>
              </div>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-sm font-bold text-slate-400 transition-all duration-200 hover:border-primary/25 hover:bg-white/[0.06] hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Home
            </Link>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </nav>

        {/* Content */}
        <section className="flex flex-1 items-center justify-center px-4 py-10">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-12 lg:flex-row lg:items-start lg:gap-16">

            {/* Left: Brand panel */}
            <motion.div
              className="hidden w-full max-w-md flex-shrink-0 lg:block"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              {/* Glowing logo mark */}
              <div className="relative mb-8 inline-flex">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 shadow-neon-violet">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <div className="absolute -inset-3 rounded-3xl bg-primary/10 blur-2xl" />
              </div>

              <h2 className="font-display text-3xl font-black leading-tight text-white xl:text-4xl">
                {title}
              </h2>
              <p className="mt-3 max-w-sm text-base leading-7 text-slate-400">
                {subtitle}
              </p>

              {/* Feature badges */}
              {showFeatures && (
                <div className="mt-8 flex flex-wrap gap-2">
                  {featureBadges.map((badge, index) => (
                    <FloatingBadge
                      key={badge.label}
                      icon={badge.icon}
                      label={badge.label}
                      delay={index}
                    />
                  ))}
                </div>
              )}

              {/* Side content (e.g. stats for signup) */}
              {sideContent && <div className="mt-8">{sideContent}</div>}

              {/* Decorative stats */}
              <div className="mt-10 flex gap-6">
                {[
                  { value: '6+', label: 'Templates' },
                  { value: '12', label: 'Pipeline stages' },
                  { value: 'ZIP', label: 'Export format' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-black text-white">{stat.value}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: Form card */}
            <motion.div
              className="w-full max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              {/* Mobile-only header */}
              <div className="mb-6 text-center lg:hidden">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 shadow-glow-sm">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">
                  FRIENDS access
                </p>
                <h1 className="mt-2 font-display text-2xl font-black">{title}</h1>
                <p className="mt-2 text-sm leading-6 text-slate-400">{subtitle}</p>
              </div>

              {children}
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
}
