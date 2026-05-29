'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type GradientButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit';
  fullWidth?: boolean;
};

const variants = {
  primary:
    'bg-gradient-to-r from-primary-deep to-indigo text-white shadow-glow-primary hover:shadow-glow-primary-lg hover:from-primary hover:to-accent',
  secondary:
    'bg-white/[0.05] border border-white/[0.10] text-slate-200 hover:border-primary/40 hover:bg-primary/10 hover:text-white',
  ghost:
    'bg-transparent text-muted hover:text-white hover:bg-white/[0.06]',
};

const disabledClasses =
  'disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:hover:from-slate-700 disabled:hover:to-slate-700';

export function GradientButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  icon,
  className,
  type = 'button',
  fullWidth = false,
}: GradientButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2.5 rounded-2xl px-6 py-3.5 text-sm font-bold transition-all duration-300',
        variants[variant],
        disabledClasses,
        fullWidth && 'w-full',
        className,
      )}
      whileHover={disabled ? undefined : { scale: 1.02, y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
    >
      {icon && <span className="flex-none">{icon}</span>}
      {children}
    </motion.button>
  );
}
