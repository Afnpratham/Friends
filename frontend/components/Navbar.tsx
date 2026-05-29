import { FileText } from 'lucide-react';

export function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-base font-bold text-slate-950">PDF Notes</p>
            <p className="text-xs text-slate-500">Real content extraction</p>
          </div>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          Text-based PDFs
        </span>
      </div>
    </header>
  );
}
