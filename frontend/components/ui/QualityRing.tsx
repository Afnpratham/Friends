'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type QualityRingProps = {
  score: number;
  size?: number;
  className?: string;
};

function getScoreColor(score: number) {
  if (score >= 95) return { stroke: '#22D3EE', text: 'text-accent', label: 'Excellent' };
  if (score >= 85) return { stroke: '#10B981', text: 'text-success', label: 'Great' };
  if (score >= 70) return { stroke: '#F59E0B', text: 'text-warning', label: 'Good' };
  return { stroke: '#EF4444', text: 'text-danger', label: 'Needs work' };
}

export function QualityRing({ score, size = 120, className }: QualityRingProps) {
  const [animatedOffset, setAnimatedOffset] = useState(283);
  const { stroke, text, label } = getScoreColor(score);

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (score / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedOffset(targetOffset), 100);
    return () => clearTimeout(timer);
  }, [targetOffset]);

  return (
    <div className={cn('relative flex flex-col items-center', className)}>
      <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
        {/* Background ring */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="6"
        />
        {/* Glow layer */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={animatedOffset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${stroke}60)` }}
          opacity="0.3"
        />
        {/* Main ring */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={animatedOffset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-2xl font-black', text)}>{score}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</span>
      </div>
    </div>
  );
}
