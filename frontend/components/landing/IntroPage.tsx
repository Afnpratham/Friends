'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight, Brain, Code2, FileArchive, Layers3, Palette,
  Rocket, ScanSearch, ShieldCheck, Sparkles, Terminal, Wand2,
  Wrench, Zap, ChevronRight, Download, CheckCircle2, Cpu,
  LayoutDashboard, Network,
} from 'lucide-react';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { StatusPill } from '@/components/ui/StatusPill';

/* ─── Data ──────────────────────────────────────────────────────────────── */

const pipelineStages = [
  { icon: Brain, label: 'Intent Analysis', color: '#8B5CF6' },
  { icon: Sparkles, label: 'Prompt Enhancement', color: '#A78BFA' },
  { icon: Layers3, label: 'Template Selection', color: '#6366F1' },
  { icon: ScanSearch, label: 'Product Spec', color: '#818CF8' },
  { icon: Palette, label: 'UI/UX Spec', color: '#D946EF' },
  { icon: Cpu, label: 'Tech Spec', color: '#22D3EE' },
  { icon: LayoutDashboard, label: 'File Planning', color: '#06B6D4' },
  { icon: Code2, label: 'Code Generation', color: '#10B981' },
  { icon: ShieldCheck, label: 'Validation', color: '#34D399' },
  { icon: Wrench, label: 'Repair', color: '#F59E0B' },
  { icon: Zap, label: 'Quality Review', color: '#EAB308' },
  { icon: FileArchive, label: 'ZIP Packaging', color: '#22D3EE' },
];

const agentCards = [
  { icon: Wand2, title: 'Prompt Enhancer', desc: 'Transforms rough ideas into structured, detailed build prompts.', model: 'gemini-flash', color: '#8B5CF6' },
  { icon: ScanSearch, title: 'Product Architect', desc: 'Designs product specs, user flows, and architecture.', model: 'gemini-flash', color: '#6366F1' },
  { icon: Palette, title: 'UI/UX Designer', desc: 'Plans interface layouts, component trees, and design systems.', model: 'gemini-flash', color: '#D946EF' },
  { icon: Code2, title: 'Frontend Engineer', desc: 'Generates complete source code with all required files.', model: 'gemini-flash', color: '#22D3EE' },
  { icon: ShieldCheck, title: 'Validator', desc: 'Checks file structure, imports, logic, and build output.', model: 'gemini-flash', color: '#10B981' },
  { icon: Wrench, title: 'Repair Agent', desc: 'Automatically fixes validation errors and missing pieces.', model: 'gemini-flash', color: '#F59E0B' },
];

const trustPills = [
  '12-stage pipeline',
  'Template-aware',
  'Validation + repair',
  'ZIP export',
];

const terminalLines = [
  { text: '> analyzing prompt...', delay: 0 },
  { text: '> intent: functional web app', delay: 0.6 },
  { text: '> selecting template: nextjs-dashboard', delay: 1.2 },
  { text: '> generating 14 files...', delay: 1.8 },
  { text: '> running validation checks...', delay: 2.4 },
  { text: '> ✓ all checks passed', delay: 3.0 },
  { text: '> quality score: 94/100', delay: 3.4 },
  { text: '> packaging ZIP...', delay: 3.8 },
  { text: '> ✓ export ready', delay: 4.2 },
];

const processSteps = [
  { num: '01', title: 'Describe your idea', desc: 'Type any app concept — FRIENDS understands intent, domain, and scope.', icon: Terminal, color: '#8B5CF6' },
  { num: '02', title: 'FRIENDS generates & validates', desc: '12-stage pipeline: enhance, plan, code, validate, repair — automatically.', icon: Network, color: '#22D3EE' },
  { num: '03', title: 'Download runnable project', desc: 'Get a complete ZIP with source code, configs, and documentation.', icon: Download, color: '#10B981' },
];

/* ─── Animations ────────────────────────────────────────────────────────── */

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

/* ─── Gradient link styles (replaces nesting Link > Button) ─── */

const gradientLinkPrimary =
  'inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-primary-deep to-indigo px-8 py-4 text-base font-bold text-white shadow-glow-primary transition-all duration-300 hover:shadow-glow-primary-lg hover:from-primary hover:to-accent hover:scale-[1.02] active:scale-[0.98]';

const gradientLinkSecondary =
  'inline-flex items-center justify-center gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-3.5 text-sm font-bold text-slate-200 transition-all duration-300 hover:border-primary/25 hover:bg-white/[0.06] hover:text-white';

const glassSignIn =
  'rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-sm font-bold text-slate-300 transition-all duration-300 hover:border-primary/25 hover:bg-white/[0.06] hover:text-white hover:shadow-glow-sm';

/* ═══════════════════════════════════════════════════════════════════════════ */

export function IntroPage() {
  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <AnimatedBackground />

      <div className="relative z-10">
        {/* ═══ Navbar ═══ */}
        <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#020014]/60 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
            <Link href="/" className="group flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 shadow-neon-violet transition-all duration-500 group-hover:shadow-glow-primary-lg">
                <Sparkles className="h-5 w-5 text-white" />
                <div className="absolute inset-0 rounded-xl bg-primary/25 blur-xl opacity-60 animate-pulse-glow" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight">FRIENDS</h1>
                <p className="hidden text-[9px] font-bold uppercase tracking-[0.14em] text-muted sm:block">
                  Rapid Intelligent Execution
                </p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <StatusPill label="Builder Online" variant="online" className="hidden sm:flex" />
              <Link href="/signin" className={glassSignIn}>
                Sign In
              </Link>
              <Link href="/signup" className={gradientLinkPrimary.replace('px-8 py-4 text-base', 'px-5 py-2.5 text-sm')}>
                <ArrowRight className="h-4 w-4" />
                Get Started
              </Link>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
        </nav>

        {/* ═══ Hero ═══ */}
        <section className="mx-auto max-w-7xl px-4 pt-16 pb-8 sm:px-6 lg:pt-24 lg:pb-12">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            {/* Left — text */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.1 } } }}
            >
              {/* Eyebrow */}
              <motion.div variants={fadeUp} className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/[0.08] px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-violet-200 shadow-glow-sm">
                <ScanSearch className="h-3.5 w-3.5" />
                AI app and project builder
              </motion.div>

              {/* Title */}
              <motion.h2
                variants={fadeUp}
                className="max-w-[640px] font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl"
              >
                Build{' '}
                <span className="relative inline-block">
                  <span className="gradient-text-animated">complete apps</span>
                  <span
                    className="absolute -inset-x-4 -inset-y-2 -z-10 rounded-2xl opacity-30 blur-2xl"
                    style={{ background: 'linear-gradient(135deg, #8B5CF6, #22D3EE)' }}
                  />
                </span>
                {' '}with your AI team.
              </motion.h2>

              {/* Subtitle */}
              <motion.p
                variants={fadeUp}
                className="mt-6 max-w-[540px] text-base leading-7 text-slate-400 sm:text-lg sm:leading-8"
              >
                Describe any idea. FRIENDS enhances your prompt, designs the architecture,
                generates code, validates it, repairs issues, and exports a runnable project.
              </motion.p>

              {/* CTA Row — uses <a> links, not nested buttons */}
              <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/signup" className={gradientLinkPrimary}>
                  <Rocket className="h-4 w-4" />
                  Launch Builder
                </Link>
                <Link
                  href="/signin"
                  className="group inline-flex items-center justify-center gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-3.5 text-sm font-bold text-slate-200 transition-all duration-300 hover:border-accent/25 hover:bg-accent/[0.04] hover:text-white hover:shadow-glow-accent"
                >
                  <Terminal className="h-4 w-4 text-accent" />
                  View Demo Pipeline
                  <ChevronRight className="h-3.5 w-3.5 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                </Link>
              </motion.div>

              {/* Trust pills */}
              <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-2.5">
                {trustPills.map((pill) => (
                  <span
                    key={pill}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[11px] font-bold text-slate-500"
                  >
                    <CheckCircle2 className="h-3 w-3 text-primary/50" />
                    {pill}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — Holographic pipeline module */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 30, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              {/* Outer glow */}
              <div className="absolute -inset-3 rounded-[32px] bg-gradient-to-br from-primary/15 via-transparent to-accent/10 blur-2xl" />

              <div className="relative rounded-[28px] border border-white/[0.10] bg-white/[0.03] p-5 shadow-glass-lg backdrop-blur-xl sm:p-6">
                {/* Scanline */}
                <div className="absolute inset-0 rounded-[28px] overflow-hidden pointer-events-none">
                  <div className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-scanline" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">
                      Execution Pipeline
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5 font-bold">12-stage generation system</p>
                  </div>
                  <StatusPill label="Ready" variant="online" />
                </div>

                {/* Stages */}
                <div className="space-y-2">
                  {pipelineStages.map((stage, index) => (
                    <motion.div
                      key={stage.label}
                      className={`group relative flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-all duration-300 ${
                        index === 0
                          ? 'border-primary/30 bg-primary/[0.08] shadow-glow-sm'
                          : 'border-white/[0.05] bg-white/[0.02] hover:border-white/[0.10] hover:bg-white/[0.04]'
                      }`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.04 }}
                    >
                      {/* Number cube */}
                      <span
                        className="flex h-6 w-6 flex-none items-center justify-center rounded-md text-[10px] font-black"
                        style={{
                          background: `${stage.color}15`,
                          border: `1px solid ${stage.color}30`,
                          color: stage.color,
                          boxShadow: index === 0 ? `0 0 12px ${stage.color}20` : 'none',
                        }}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      {/* Icon */}
                      <stage.icon
                        className="h-3.5 w-3.5 flex-none"
                        style={{ color: index === 0 ? stage.color : '#475569' }}
                      />

                      {/* Label */}
                      <span className={`text-sm font-bold ${index === 0 ? 'text-white' : 'text-slate-500'}`}>
                        {stage.label}
                      </span>

                      {/* Status dot */}
                      <span className="ml-auto">
                        {index === 0 ? (
                          <span className="h-2 w-2 rounded-full bg-primary inline-block animate-pulse" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-700 inline-block" />
                        )}
                      </span>

                      {/* Connecting line */}
                      {index < pipelineStages.length - 1 && (
                        <div
                          className="absolute -bottom-[5px] left-[22px] h-[6px] w-px"
                          style={{ background: index === 0 ? `${stage.color}40` : 'rgba(255,255,255,0.04)' }}
                        />
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Provider chip */}
                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-600">
                  <Cpu className="h-3 w-3 text-accent/50" />
                  <span>Provider: Mock</span>
                  <span className="mx-1 text-slate-800">|</span>
                  <span>Model: gemini-mock</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══ Holographic Preview Terminal ═══ */}
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <motion.div
            className="relative mx-auto max-w-3xl"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Glow */}
            <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-br from-accent/10 via-primary/5 to-transparent blur-3xl" />

            <div className="relative rounded-[24px] border border-white/[0.08] bg-[#020014]/80 shadow-glass-lg backdrop-blur-xl overflow-hidden">
              {/* Title bar */}
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/40" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/40" />
                <span className="ml-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
                  FRIENDS Terminal — Project Generation
                </span>
              </div>

              {/* Terminal content */}
              <div className="p-5 font-mono text-xs leading-6">
                {terminalLines.map((line) => (
                  <motion.p
                    key={line.text}
                    className={line.text.includes('✓') ? 'text-emerald-400' : 'text-slate-400'}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: line.delay * 0.5, duration: 0.3 }}
                  >
                    {line.text}
                  </motion.p>
                ))}

                {/* Blinking cursor */}
                <span className="inline-block h-4 w-1.5 bg-primary/70 animate-pulse mt-1" />
              </div>

              {/* Bottom bar — project output */}
              <div className="border-t border-white/[0.06] bg-white/[0.02] px-5 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-success/25 bg-success/10 px-3 py-1 text-[10px] font-bold text-success">
                    ✓ Validation Passed
                  </span>
                  <span className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[10px] font-bold text-accent">
                    Score: 94/100
                  </span>
                  <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary-hover">
                    14 files
                  </span>
                  <span className="ml-auto rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                    <Download className="h-3 w-3" />
                    Download ZIP
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ═══ Process — From Idea to ZIP ═══ */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-3">How it works</p>
            <h2 className="font-display text-3xl font-black sm:text-4xl">
              From idea to{' '}
              <span className="gradient-text-animated">runnable ZIP</span>
            </h2>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-3">
            {processSteps.map((step, index) => (
              <motion.div
                key={step.num}
                className="group relative rounded-[24px] border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-white/[0.12] hover:shadow-glow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black mb-4"
                  style={{
                    background: `${step.color}12`,
                    border: `1px solid ${step.color}25`,
                    color: step.color,
                  }}
                >
                  {step.num}
                </span>

                <step.icon className="h-5 w-5 mb-3" style={{ color: step.color }} />
                <h3 className="text-lg font-black text-white mb-2">{step.title}</h3>
                <p className="text-sm leading-6 text-slate-500">{step.desc}</p>

                {index < processSteps.length - 1 && (
                  <div className="hidden md:block absolute right-0 top-1/2 translate-x-[calc(50%+10px)] -translate-y-1/2">
                    <ChevronRight className="h-5 w-5 text-slate-700" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* ═══ AI Agent Team ═══ */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-hover mb-3">Your AI team</p>
            <h2 className="font-display text-3xl font-black sm:text-4xl">
              Six specialized agents,{' '}
              <span className="gradient-text-animated">one seamless workflow</span>
            </h2>
            <p className="mt-4 text-base text-slate-500 max-w-xl mx-auto">
              Each agent handles a distinct phase of the generation pipeline, working together to produce production-quality output.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
          >
            {agentCards.map((agent) => (
              <motion.div
                key={agent.title}
                variants={fadeUp}
                className="group relative rounded-[22px] border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-white/[0.12] hover:shadow-glow-sm"
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl mb-4 transition-shadow duration-500 group-hover:shadow-glow-sm"
                  style={{
                    background: `${agent.color}12`,
                    border: `1px solid ${agent.color}25`,
                  }}
                >
                  <agent.icon className="h-5 w-5" style={{ color: agent.color }} />
                </div>

                <h3 className="text-base font-black text-white mb-1.5">{agent.title}</h3>
                <p className="text-sm leading-6 text-slate-500 mb-4">{agent.desc}</p>

                <div className="flex items-center gap-2.5">
                  <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    {agent.model}
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-success/60 animate-pulse" />
                    Ready
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ═══ Footer CTA ═══ */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <motion.div
            className="relative overflow-hidden rounded-[28px] border border-primary/15 bg-gradient-to-br from-primary/[0.06] via-white/[0.02] to-accent/[0.04] p-8 text-center sm:p-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />

            <div className="relative z-10">
              <h2 className="font-display text-3xl font-black sm:text-4xl mb-4">
                Ready to build with{' '}
                <span className="gradient-text-animated">FRIENDS</span>?
              </h2>
              <p className="text-base text-slate-400 max-w-lg mx-auto mb-8">
                Create your workspace and start generating complete, runnable projects in minutes.
              </p>
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link href="/signup" className={gradientLinkPrimary}>
                  <Rocket className="h-4 w-4" />
                  Get Started Free
                </Link>
                <Link href="/signin" className={gradientLinkSecondary}>
                  Sign In
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ═══ Footer ═══ */}
        <footer className="border-t border-white/[0.04] py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm font-black text-white">FRIENDS</span>
                <span className="text-[10px] text-slate-700 font-bold">© 2025</span>
              </div>
              <p className="text-xs text-slate-700 font-bold">
                Framework for Rapid Intelligent Execution, Networking, Design, and Strategy
              </p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
