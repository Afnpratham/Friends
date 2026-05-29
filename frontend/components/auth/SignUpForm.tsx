'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Loader2, PlayCircle, Mail, Lock, User } from 'lucide-react';
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

const benefits = [
  'Multi-agent project generation',
  'Prompt enhancement & intent analysis',
  'Intelligent template selection',
  'Code validation & repair',
  'Runnable ZIP export',
];

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
        // Stay on the sign-up form if the optional auth provider is unreachable.
      });
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (!hasSupabaseConfig) {
      setError('Supabase is not configured. Use demo mode to continue.');
      return;
    }

    setLoading(true);
    try {
      const { error: signUpError } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        }),
        'Account creation timed out. Check your Supabase settings or use demo mode.',
      );

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      router.replace('/dashboard');
      router.refresh();
    } catch (signUpError) {
      setError(signUpError instanceof Error ? signUpError.message : 'Account creation failed. Please try again.');
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

  const sideContent = (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-primary-hover">
          What you get
        </p>
        <ul className="space-y-2.5">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2.5 text-sm text-slate-400">
              <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-primary/60" />
              {benefit}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const inputClasses =
    'w-full rounded-xl border border-white/[0.08] bg-[#020014]/60 py-3 text-sm text-white outline-none transition-all duration-300 placeholder:text-slate-600 focus:border-primary/40 focus:shadow-[0_0_20px_rgba(139,92,246,0.08)] focus:ring-2 focus:ring-primary/10';

  return (
    <AuthShell
      title="Create your FRIENDS workspace"
      subtitle="Start generating complete apps, dashboards, AI tools, and startup projects with your AI team."
      sideContent={sideContent}
    >
      <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.04] p-6 shadow-glass-lg backdrop-blur-xl sm:p-7">
        {/* Card header */}
        <div className="mb-6">
          <h2 className="text-xl font-black text-white">Create account</h2>
          <p className="mt-1 text-sm text-slate-500">Set up your AI workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <label htmlFor="signup-name" className="block text-sm font-bold text-slate-300">
              Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
              <input
                id="signup-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                className={`${inputClasses} pl-11 pr-4`}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="signup-email" className="block text-sm font-bold text-slate-300">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
              <input
                id="signup-email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`${inputClasses} pl-11 pr-4`}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="signup-password" className="block text-sm font-bold text-slate-300">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
              <input
                id="signup-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Min 8 characters"
                className={`${inputClasses} pl-11 pr-12`}
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

          {/* Confirm password */}
          <div className="space-y-2">
            <label htmlFor="signup-confirm" className="block text-sm font-bold text-slate-300">
              Confirm password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
              <input
                id="signup-confirm"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repeat password"
                className={`${inputClasses} pl-11 pr-4`}
                required
              />
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

          {/* Submit */}
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
            Create Account
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
          Already have an account?{' '}
          <Link href="/signin" className="font-bold text-primary-hover transition-colors hover:text-white">
            Sign In
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
