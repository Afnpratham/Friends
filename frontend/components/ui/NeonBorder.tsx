import { cn } from '@/lib/utils';

type NeonBorderProps = {
  children: React.ReactNode;
  className?: string;
  color?: 'violet' | 'cyan' | 'pink';
};

const borderColors = {
  violet: 'border-primary/30 shadow-[inset_0_0_20px_rgba(139,92,246,0.06),0_0_25px_rgba(139,92,246,0.1)]',
  cyan: 'border-accent/30 shadow-[inset_0_0_20px_rgba(34,211,238,0.06),0_0_25px_rgba(34,211,238,0.1)]',
  pink: 'border-accent-pink/30 shadow-[inset_0_0_20px_rgba(217,70,239,0.06),0_0_25px_rgba(217,70,239,0.1)]',
};

export function NeonBorder({ children, className, color = 'violet' }: NeonBorderProps) {
  return (
    <div
      className={cn(
        'rounded-[24px] border animate-border-glow',
        borderColors[color],
        className,
      )}
    >
      {children}
    </div>
  );
}
