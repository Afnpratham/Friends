import { Check, Loader2 } from 'lucide-react';
import type { ProcessingState } from '@/types/notes';

const steps: Array<{ key: ProcessingState; label: string }> = [
  { key: 'uploading', label: 'Uploading PDF' },
  { key: 'extracting', label: 'Extracting text' },
  { key: 'generating', label: 'Generating notes' },
  { key: 'ready', label: 'Ready' },
];

const order: ProcessingState[] = ['idle', 'selected', 'uploading', 'extracting', 'generating', 'ready'];

type ProcessingStatusProps = {
  state: ProcessingState;
};

export function ProcessingStatus({ state }: ProcessingStatusProps) {
  if (state === 'idle' || state === 'selected' || state === 'error') {
    return null;
  }

  const currentIndex = order.indexOf(state);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-4">
        {steps.map((step) => {
          const stepIndex = order.indexOf(step.key);
          const complete = stepIndex < currentIndex || state === 'ready';
          const active = step.key === state;

          return (
            <div key={step.key} className="flex items-center gap-2 text-sm">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                  complete
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : active
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-400'
                }`}
              >
                {active && state !== 'ready' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              </span>
              <span className={active || complete ? 'font-semibold text-slate-900' : 'text-slate-500'}>{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
