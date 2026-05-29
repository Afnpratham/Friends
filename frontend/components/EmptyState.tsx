import { FileUp } from 'lucide-react';

type EmptyStateProps = {
  selected: boolean;
};

export function EmptyState({ selected }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <FileUp size={24} />
      </div>
      <h2 className="mt-4 text-lg font-bold text-slate-950">
        {selected ? 'Ready to generate notes' : 'Upload a PDF to begin'}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        {selected
          ? 'Click Generate Notes to extract text from the selected PDF and build structured notes.'
          : 'Choose a text-based PDF under 10MB. The app will reject unreadable scanned files instead of faking notes.'}
      </p>
    </div>
  );
}
