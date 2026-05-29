'use client';

import { Cpu, Zap, Layers } from 'lucide-react';

export function ModelStatusBar() {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-xs font-bold text-muted">
        <Cpu className="h-3.5 w-3.5 text-primary" />
        <span>Provider:</span>
        <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-primary-hover">
          Mock
        </span>
      </div>
      <div className="hidden h-3 w-px bg-white/10 sm:block" />
      <div className="flex items-center gap-2 text-xs font-bold text-muted">
        <Zap className="h-3.5 w-3.5 text-accent" />
        <span>Model:</span>
        <span className="rounded-md border border-accent/20 bg-accent/10 px-2 py-0.5 text-accent">
          gemini-mock
        </span>
      </div>
      <div className="hidden h-3 w-px bg-white/10 sm:block" />
      <div className="flex items-center gap-2 text-xs font-bold text-muted">
        <Layers className="h-3.5 w-3.5 text-accent-pink" />
        <span>Pipeline:</span>
        <span className="text-slate-300">12 stages</span>
      </div>
    </div>
  );
}
