'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Loader2, PlayCircle, Mail, Lock } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { GradientButton } from '@/components/ui/GradientButton';
import { isDemoAuthenticated, startDemoSession } from '@/lib/auth/demoAuth';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';

const AUTH_REQUEST_TIMEOUT_MS = 10000;

function withTimeout<T>(promise: Promise<T>, message: string) {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), AUTH_REQUEST_TIMEOUT_MS);
    }),
  ]);
}

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isDemoAuthenticated()) {
      router.replace('/dashboard');
      return;
    }
    if (!hasSupabaseConfig) return;
    withTimeout(supabase.auth.getSession(), 'Session check timed out. Please try again.')
      .then(({ data: { session } }) => {
        if (session) router.replace('/dashboard');
      })
      .catch(() => {
        // Stay on the sign-in form if the optional auth provider is unreachable.
      });
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!hasSupabaseConfig) {
      setError('Supabase is not configured. Use demo mode to continue.');
      return;
    }

    setLoading(true);
    try {
      const { error: signInError } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        'Sign in timed out. Check your Supabase settings or use demo mode.',
      );

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.replace('/dashboard');
      router.refresh();
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function continueDemo() {
    setLoading(true);
    startDemoSession();
    router.replace('/dashboard');
    router.refresh();
  }

  return (
    <AuthShell
      title="Welcome back to FRIENDS"
      subtitle="Enter your AI software lab and continue building runnable projects."
    >
      {/* Glass card */}
      <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.04] p-6 shadow-glass-lg backdrop-blur-xl sm:p-7">
        {/* Card header */}
        <div className="mb-6">
          <h2 className="text-xl font-black text-white">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">Access your workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="signin-email" className="block text-sm font-bold text-slate-300">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
              <input
                id="signin-email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/[0.08] bg-[#020014]/60 py-3 pl-11 pr-4 text-sm text-white outline-none transition-all duration-300 placeholder:text-slate-600 focus:border-primary/40 focus:shadow-[0_0_20px_rgba(139,92,246,0.08)] focus:ring-2 focus:ring-primary/10"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="signin-password" className="block text-sm font-bold text-slate-300">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
              <input
                id="signin-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/[0.08] bg-[#020014]/60 py-3 pl-11 pr-12 text-sm text-white outline-none transition-all duration-300 placeholder:text-slate-600 focus:border-primary/40 focus:shadow-[0_0_20px_rgba(139,92,246,0.08)] focus:ring-2 focus:ring-primary/10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 transition-colors hover:text-slate-300"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.p
              className="rounded-xl border border-danger/20 bg-danger/[0.06] px-4 py-3 text-sm font-bold text-red-200"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.p>
          )}

          {/* Sign In button */}
          <GradientButton
            type="submit"
            fullWidth
            disabled={loading}
            icon={
              loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )
            }
          >
            Sign In
          </GradientButton>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">or</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        </div>

        {/* Demo button */}
        <motion.button
          type="button"
          onClick={continueDemo}
          className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-accent/20 bg-accent/[0.04] px-5 py-3 text-sm font-bold text-accent transition-all duration-300 hover:border-accent/35 hover:bg-accent/[0.08] hover:shadow-glow-accent"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <PlayCircle className="h-4 w-4" />
          Continue as Demo
        </motion.button>

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-slate-500">
          New to FRIENDS?{' '}
          <Link href="/signup" className="font-bold text-primary-hover transition-colors hover:text-white">
            Create an account
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
