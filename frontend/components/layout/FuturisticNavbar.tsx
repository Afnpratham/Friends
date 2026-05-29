'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FolderClock, LogOut, Plus, Settings, Sparkles } from 'lucide-react';
import { StatusPill } from '@/components/ui/StatusPill';
import { clearDemoSession, isDemoAuthenticated } from '@/lib/auth/demoAuth';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';

export function FuturisticNavbar() {
  const router = useRouter();
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    setDemoMode(isDemoAuthenticated());
  }, []);

  async function signOut() {
    clearDemoSession();
    if (hasSupabaseConfig) {
      await supabase.auth.signOut();
    }
    router.push('/');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#030014]/70 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Left: Logo + name */}
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 text-white shadow-glow-sm">
            <Sparkles className="h-4.5 w-4.5" />
            <div className="absolute inset-0 rounded-xl bg-primary/20 blur-md" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">FRIENDS</h1>
            <p className="hidden text-[10px] font-bold uppercase tracking-[0.16em] text-muted sm:block">
              Rapid Intelligent Execution
            </p>
          </div>
        </Link>

        {/* Center: Status */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-primary/30 hover:text-white">
            <Plus className="h-3.5 w-3.5" />
            New Project
          </Link>
          <a href="#recent-projects" className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-primary/30 hover:text-white">
            <FolderClock className="h-3.5 w-3.5" />
            Recent Projects
          </a>
          {demoMode ? <StatusPill label="Demo Mode" variant="processing" /> : <StatusPill label="Signed In" variant="online" />}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <StatusPill label={demoMode ? 'Demo' : 'Online'} variant={demoMode ? 'processing' : 'online'} className="md:hidden" />
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-muted transition-all duration-200 hover:border-primary/30 hover:text-white hover:bg-white/[0.08]"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={signOut}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-muted transition-all duration-200 hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-200"
            aria-label="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Gradient line at bottom */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </header>
  );
}
