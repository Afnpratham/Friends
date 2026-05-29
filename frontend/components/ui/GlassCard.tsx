'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type GlassCardProps = {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'violet' | 'cyan' | 'emerald' | 'pink' | 'none';
  hoverable?: boolean;
  animate?: boolean;
  as?: 'div' | 'section' | 'article';
};

const glowMap = {
  violet: 'hover:border-primary/35 hover:shadow-glow-sm',
  cyan: 'hover:border-accent/35 hover:shadow-glow-accent',
  emerald: 'hover:border-success/35 hover:shadow-glow-success',
  pink: 'hover:border-accent-pink/35 hover:shadow-glow-pink',
  none: '',
};

export function GlassCard({
  children,
  className,
  glowColor = 'violet',
  hoverable = false,
  animate = true,
  as: Tag = 'div',
}: GlassCardProps) {
  const Component = animate ? motion[Tag] : Tag;

  const baseClasses = cn(
    'rounded-[24px] border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl shadow-glass-lg',
    hoverable && 'transition-all duration-300 hover:-translate-y-0.5',
    hoverable && glowMap[glowColor],
    className,
  );

  if (animate) {
    return (
      <Component
        className={baseClasses}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {children}
      </Component>
    );
  }

  return <Tag className={baseClasses}>{children}</Tag>;
}
