/**
 * Settings page — profile info, Gemini API key, plan info.
 */

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { isDemoAuthenticated } from '@/lib/auth/demoAuth';
import { toast } from 'sonner';
import { Key, User, CreditCard, Eye, EyeOff, Save, Loader2, ExternalLink, Shield, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const demoAuthenticated = isDemoAuthenticated();
    setIsDemo(demoAuthenticated);

    if (demoAuthenticated) {
      setProfile({ email: 'demo@friends.dev', plan: 'demo' });
      setFullName('Demo User');
      return;
    }

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile({ ...data, email: user.email });
        setFullName(data.full_name || '');
        setApiKey(data.openai_api_key ? '••••••••••••••••••••••••' : '');
      }
    }
    load();
  }, []);

  const handleSaveProfile = async () => {
    if (isDemo) {
      toast.success('Demo mode — profile saved locally');
      return;
    }
    setSavingProfile(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to save profile');
    } else {
      toast.success('Profile updated!');
    }
    setSavingProfile(false);
  };

  const handleSaveApiKey = async () => {
    if (isDemo) {
      toast.info('Demo mode — API key not saved');
      return;
    }
    if (apiKey.startsWith('•')) {
      toast.info('Enter a new key to update it');
      return;
    }
    if (!apiKey.startsWith('AIza')) {
      toast.error('Gemini API keys start with "AIza"');
      return;
    }

    setSavingKey(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ openai_api_key: apiKey })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to save API key');
    } else {
      toast.success('API key saved!');
      setApiKey('••••••••••••••••••••••••');
    }
    setSavingKey(false);
  };

  const inputClasses =
    'w-full rounded-xl border border-white/[0.08] bg-[#020014]/60 px-4 py-3 text-sm text-white outline-none transition-all duration-300 placeholder:text-slate-600 focus:border-primary/40 focus:shadow-[0_0_20px_rgba(139,92,246,0.08)] focus:ring-2 focus:ring-primary/10';

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Settings</h1>
              <p className="text-sm text-slate-500">Manage your profile and API configuration</p>
            </div>
          </div>
        </motion.div>

        {/* Profile section */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-6 mb-5" glowColor="violet" animate={false}>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                <User size={15} className="text-primary" />
              </div>
              <h2 className="text-white font-black">Profile</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className={inputClasses}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  className={`${inputClasses} opacity-50 cursor-not-allowed`}
                  disabled
                />
                <p className="text-slate-700 text-xs mt-1.5">Email cannot be changed</p>
              </div>
              <GradientButton
                onClick={handleSaveProfile}
                disabled={savingProfile}
                icon={savingProfile ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              >
                Save Profile
              </GradientButton>
            </div>
          </GlassCard>
        </motion.div>

        {/* API Key */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-6 mb-5" glowColor="cyan" animate={false}>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent/20 bg-accent/10">
                <Key size={15} className="text-accent" />
              </div>
              <h2 className="text-white font-black">Gemini API Key</h2>
            </div>
            <p className="text-slate-500 text-sm mb-5">
              Add your Google Gemini API key to run agents. Your key is stored securely.{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary-hover hover:text-white transition-colors"
              >
                Get a free key <ExternalLink size={11} />
              </a>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">API Key</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className={`${inputClasses} pl-11 pr-12 font-mono text-sm`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors"
                    aria-label={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="text-slate-700 text-xs mt-1.5">
                  Recommended: gemini-2.0-flash (fast & free tier)
                </p>
              </div>
              <GradientButton
                onClick={handleSaveApiKey}
                disabled={savingKey}
                variant="secondary"
                icon={savingKey ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              >
                Save API Key
              </GradientButton>
            </div>
          </GlassCard>
        </motion.div>

        {/* Plan */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-6" glowColor="none" animate={false}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-warning/20 bg-warning/10">
                <CreditCard size={15} className="text-warning" />
              </div>
              <h2 className="text-white font-black">Plan</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-bold capitalize">{isDemo ? 'Demo' : (profile?.plan || 'Free')} Plan</p>
                <p className="text-slate-500 text-sm mt-1">Full access to all workflow templates and agents.</p>
              </div>
              <span className="rounded-full border border-success/25 bg-success/10 px-3 py-1 text-xs font-bold text-success">
                Active
              </span>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
