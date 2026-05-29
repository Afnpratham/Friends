import { AlertCircle } from 'lucide-react';

type ErrorStateProps = {
  message: string;
};

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-800">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 shrink-0" size={20} />
        <div>
          <h2 className="font-bold">Could not generate notes</h2>
          <p className="mt-1 text-sm leading-6">{message}</p>
        </div>
      </div>
    </div>
  );
}
