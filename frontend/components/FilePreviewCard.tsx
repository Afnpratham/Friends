import { Clock, FileText } from 'lucide-react';
import { formatFileSize } from '@/lib/formatNotes';
import type { UploadedFileInfo } from '@/types/notes';

type FilePreviewCardProps = {
  fileInfo: UploadedFileInfo;
};

export function FilePreviewCard({ fileInfo }: FilePreviewCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-600">
          <FileText size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-950">{fileInfo.name}</p>
          <p className="mt-1 text-sm text-slate-500">{formatFileSize(fileInfo.size)} PDF</p>
          <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
            <Clock size={13} />
            Selected {new Date(fileInfo.uploadedAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
