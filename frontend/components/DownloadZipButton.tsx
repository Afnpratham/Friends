'use client';

import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { downloadZip } from '@/lib/export/createZip';

type DownloadZipButtonProps = {
  files: Record<string, string>;
  projectName: string;
  disabled?: boolean;
};

export function DownloadZipButton({ files, projectName, disabled = false }: DownloadZipButtonProps) {
  function handleDownload() {
    if (disabled) return;
    const slug = projectName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    downloadZip(files, `${slug || 'friends-project'}.zip`);
  }

  return (
    <motion.button
      type="button"
      onClick={handleDownload}
      disabled={disabled}
      className="inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-primary-deep to-indigo px-6 py-3.5 text-sm font-black text-white shadow-glow-primary transition-all duration-300 hover:from-primary hover:to-accent hover:shadow-glow-primary-lg disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:shadow-none sm:w-auto"
      whileHover={disabled ? undefined : { scale: 1.02, y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
    >
      <Download className="h-4 w-4" />
      Download ZIP
    </motion.button>
  );
}
