'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderOpen, Settings, LogOut, Sparkles,
  Menu, X, Plus, ChevronRight, Loader2,
} from 'lucide-react';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { StatusPill } from '@/components/ui/StatusPill';
import { isDemoAuthenticated, clearDemoSession } from '@/lib/auth/demoAuth';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/projects', icon: FolderOpen, label: 'Projects' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

const AUTH_CHECK_TIMEOUT_MS = 4000;

async function getSupabaseSessionWithTimeout() {
  return Promise.race([
    supabase.auth.getSession(),
    new Promise<null>((resolve) => {
      window.setTimeout(() => resolve(null), AUTH_CHECK_TIMEOUT_MS);
    }),
  ]);
}

function Sidebar({ isDemo, onClose }: { isDemo: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (isDemo) {
      setUserEmail('demo@friends.dev');
      return;
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email || '');
    });
  }, [isDemo]);

  const handleSignOut = async () => {
    if (isDemo) {
      clearDemoSession();
    } else {
      await supabase.auth.signOut();
    }
    router.push('/');
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-white/[0.06] bg-[#020014]/90 backdrop-blur-2xl">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 shadow-glow-sm transition-all duration-300 group-hover:shadow-glow-primary">
            <Sparkles className="h-4 w-4 text-white" />
            <div className="absolute inset-0 rounded-xl bg-primary/20 blur-md opacity-40" />
          </div>
          <div>
            <span className="text-base font-black text-white">FRIENDS</span>
            <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted">AI Builder</p>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors md:hidden" aria-label="Close menu">
            <X size={18} />
          </button>
        )}
      </div>

      {/* New Project CTA */}
      <div className="px-4 mb-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 w-full rounded-xl bg-gradient-to-r from-primary-deep to-indigo px-4 py-2.5 text-sm font-bold text-white shadow-glow-sm transition-all duration-300 hover:shadow-glow-primary"
        >
          <Plus size={15} />
          New Project
        </Link>
      </div>

      {/* Status indicators */}
      <div className="px-4 mb-4 flex flex-col gap-2">
        <StatusPill label="AI Builder Online" variant="online" className="text-[10px]" />
        {isDemo && <StatusPill label="Demo Mode" variant="processing" className="text-[10px]" />}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                active
                  ? 'bg-primary/[0.12] border border-primary/25 text-white shadow-glow-sm'
                  : 'text-slate-500 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <item.icon size={17} />
              {item.label}
              {active && <ChevronRight size={13} className="ml-auto text-primary/60" />}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-white/[0.06] px-4 py-4">
        <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-xl">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #22D3EE)' }}
          >
            {userEmail.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-300 text-sm font-bold truncate">{userEmail || '...'}</p>
            <p className="text-slate-700 text-[10px] font-bold uppercase tracking-wider">
              {isDemo ? 'Demo' : 'Free Plan'}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-red-400 hover:bg-red-500/[0.06] transition-all w-full"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAccess() {
      const demoAuthenticated = isDemoAuthenticated();
      if (demoAuthenticated) {
        if (!mounted) return;
        setIsDemo(true);
        setAllowed(true);
        setChecking(false);
        return;
      }

      if (hasSupabaseConfig) {
        const sessionResult = await getSupabaseSessionWithTimeout();
        if (!mounted) return;
        if (sessionResult?.data?.session) {
          setAllowed(true);
          setChecking(false);
          return;
        }
      }

      router.replace('/signin');
      if (!mounted) return;
      setChecking(false);
    }

    checkAccess();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (checking) {
    return (
      <main className="relative flex min-h-screen items-center justify-center bg-[#020014] text-white">
        <AnimatedBackground />
        <div className="relative z-10 flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-6 py-4 text-sm font-bold text-slate-300 backdrop-blur-xl shadow-glass-lg">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Initializing workspace...
        </div>
      </main>
    );
  }

  if (!allowed) return null;

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#020014]">
      <AnimatedBackground />

      {/* Desktop sidebar */}
      <div className="relative z-10 hidden md:flex flex-shrink-0">
        <Sidebar isDemo={isDemo} />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="md:hidden fixed inset-0 z-50 flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <motion.div
              className="relative z-10"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            >
              <Sidebar isDemo={isDemo} onClose={() => setSidebarOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="relative z-10 flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-4 border-b border-white/[0.06] bg-[#020014]/70 px-4 py-3 backdrop-blur-xl">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white transition-colors" aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="relative flex h-7 w-7 items-center justify-center rounded-lg border border-primary/30 bg-primary/15 shadow-glow-sm">
              <Sparkles size={12} className="text-white" />
            </div>
            <span className="font-black text-white text-sm">FRIENDS</span>
          </div>
          <StatusPill label="Online" variant="online" className="ml-auto text-[10px]" />
        </div>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
