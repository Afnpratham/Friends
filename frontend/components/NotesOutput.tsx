'use client';

import { Check, Clipboard, Download, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { formatNotesAsMarkdown } from '@/lib/formatNotes';
import type { NotesResult } from '@/types/notes';
import { NotesSectionCard } from './NotesSectionCard';

type NotesOutputProps = {
  result: NotesResult;
  originalFileName: string;
  onReset: () => void;
};

function ListBlock({ items }: { items: string[] }) {
  if (!items.length) {
    return <p className="text-slate-500">Nothing was clearly identified in the extracted text.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function NotesOutput({ result, originalFileName, onReset }: NotesOutputProps) {
  const [copied, setCopied] = useState(false);

  const markdown = formatNotesAsMarkdown(result);
  const providerLabel = result.provider === 'gemini' ? 'Generated using Gemini' : 'Generated using Mock Mode';

  async function copyNotes() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function downloadMarkdown() {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notes-${originalFileName.replace(/\.pdf$/i, '')}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                result.provider === 'gemini' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
              }`}
            >
              {providerLabel}
            </span>
            <h2 className="mt-3 text-2xl font-black text-slate-950">{result.documentTitle}</h2>
            <p className="mt-2 text-sm text-slate-500">
              {result.wordCount} words · estimated {result.pageEstimate} {result.pageEstimate === 1 ? 'page' : 'pages'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyNotes}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              {copied ? <Check size={16} /> : <Clipboard size={16} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={downloadMarkdown}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-800"
            >
              <Download size={16} />
              Download MD
            </button>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw size={16} />
              Upload another
            </button>
          </div>
        </div>
      </div>

      <NotesSectionCard title="Summary">
        <p>{result.summary}</p>
      </NotesSectionCard>
      <NotesSectionCard title="Key Points">
        <ListBlock items={result.keyPoints} />
      </NotesSectionCard>
      <NotesSectionCard title="Important Sections">
        <ListBlock items={result.importantSections} />
      </NotesSectionCard>
      <NotesSectionCard title="Definitions / Terms">
        <ListBlock items={result.definitions} />
      </NotesSectionCard>
      <NotesSectionCard title="Possible Questions">
        <ListBlock items={result.examQuestions} />
      </NotesSectionCard>
      <NotesSectionCard title="Revision Actions">
        <ListBlock items={result.revisionActions} />
      </NotesSectionCard>
      <details className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer text-base font-bold text-slate-950">Source Preview</summary>
        <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-sm leading-6 text-slate-100">
          {result.sourcePreview}
        </pre>
      </details>
    </div>
  );
}
