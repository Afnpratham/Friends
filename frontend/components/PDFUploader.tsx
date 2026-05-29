'use client';

import { useRef, useState } from 'react';
import { FileUp, Loader2, RefreshCw, Wand2 } from 'lucide-react';
import { formatFileSize } from '@/lib/formatNotes';
import type { UploadedFileInfo } from '@/types/notes';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

type PDFUploaderProps = {
  file: File | null;
  loading: boolean;
  onFileSelected: (file: File, info: UploadedFileInfo) => void;
  onGenerate: () => void;
  onReset: () => void;
  onError: (message: string) => void;
};

export function PDFUploader({ file, loading, onFileSelected, onGenerate, onReset, onError }: PDFUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function validateAndSelect(candidate: File | undefined) {
    if (!candidate) {
      onError('No file selected. Choose a PDF and try again.');
      return;
    }

    if (candidate.type !== 'application/pdf' && !candidate.name.toLowerCase().endsWith('.pdf')) {
      onError('Only PDF files are accepted.');
      return;
    }

    if (candidate.size > MAX_FILE_SIZE) {
      onError('File is too large. Please upload a PDF under 10MB.');
      return;
    }

    onFileSelected(candidate, {
      name: candidate.name,
      size: candidate.size,
      type: candidate.type || 'application/pdf',
      uploadedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="application/pdf,.pdf"
        onChange={(event) => validateAndSelect(event.target.files?.[0])}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          validateAndSelect(event.dataTransfer.files?.[0]);
        }}
        className={`flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition ${
          dragging ? 'border-slate-950 bg-slate-50' : 'border-slate-300 bg-slate-50/70 hover:border-slate-500'
        }`}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm">
          <FileUp size={24} />
        </span>
        <span className="mt-4 text-base font-bold text-slate-950">Drop a PDF here or browse</span>
        <span className="mt-2 text-sm text-slate-500">Maximum file size: {formatFileSize(MAX_FILE_SIZE)}</span>
      </button>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onGenerate}
          disabled={!file || loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? <Loader2 size={17} className="animate-spin" /> : <Wand2 size={17} />}
          Generate Notes
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
        >
          <RefreshCw size={16} />
          Reset
        </button>
      </div>
    </div>
  );
}
