'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type FloatingBadgeProps = {
  icon: React.ReactNode;
  label: string;
  delay?: number;
  className?: string;
};

export function FloatingBadge({ icon, label, delay = 0, className }: FloatingBadgeProps) {
  return (
    <motion.div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-bold text-slate-300 backdrop-blur-xl',
        className,
      )}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.3 + delay * 0.1, duration: 0.5, ease: 'easeOut' }}
    >
      <span className="flex-none text-primary">{icon}</span>
      {label}
    </motion.div>
  );
}
