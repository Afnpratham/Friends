import { cn } from '@/lib/utils';

type StatusPillProps = {
  label: string;
  variant?: 'online' | 'processing' | 'error' | 'idle';
  className?: string;
};

const dotColors = {
  online: 'bg-success',
  processing: 'bg-primary',
  error: 'bg-danger',
  idle: 'bg-muted',
};

const pillBg = {
  online: 'bg-success/10 border-success/25 text-success',
  processing: 'bg-primary/10 border-primary/25 text-primary-hover',
  error: 'bg-danger/10 border-danger/25 text-danger',
  idle: 'bg-white/[0.04] border-white/10 text-muted',
};

export function StatusPill({ label, variant = 'idle', className }: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold',
        pillBg[variant],
        className,
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          dotColors[variant],
          (variant === 'online' || variant === 'processing') && 'animate-pulse',
        )}
      />
      {label}
    </span>
  );
}
