'use client';

import { motion } from 'framer-motion';
import { FileCode2, ShieldCheck, FolderTree, CheckCircle2, XCircle } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { QualityRing } from '@/components/ui/QualityRing';
import { DownloadZipButton } from '@/components/DownloadZipButton';
import type { GeneratedProject } from '@/lib/generation/pipeline';

type GeneratedProjectPreviewProps = {
  project: GeneratedProject;
};

export function GeneratedProjectPreview({ project }: GeneratedProjectPreviewProps) {
  const fileNames = Object.keys(project.files);

  return (
    <GlassCard className="p-5 sm:p-6" glowColor="cyan">
      {/* Header with quality ring */}
      <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">
            Generated output
          </p>
          <h2 className="mt-1.5 text-2xl font-black text-white">{project.projectName}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-0.5 text-xs font-bold text-primary-hover">
              {project.selectedTemplate.id}
            </span>
            <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-0.5 text-xs font-medium text-muted">
              {fileNames.length} files
            </span>
            <span
              className={`rounded-full border px-3 py-0.5 text-xs font-bold ${
                project.validationStatus === 'passed'
                  ? 'border-success/25 bg-success/10 text-success'
                  : 'border-danger/25 bg-danger/10 text-danger'
              }`}
            >
              {project.validationStatus === 'passed' ? 'Validated' : 'Needs repair'}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-600">Run ID: {project.generationRunId}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <QualityRing score={project.qualityScore} size={110} />
        </motion.div>
      </div>

      {/* Project preview card */}
      <motion.div
        className="mb-5 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.06] to-accent/[0.04] p-5"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary/70">
          Project preview
        </p>
        <h3 className="mt-2 text-xl font-black text-white">{project.preview.title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">{project.preview.subtitle}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {project.preview.bullets.map((bullet) => (
            <div
              key={bullet}
              className="rounded-xl border border-white/[0.06] bg-[#030014]/40 px-4 py-3 text-sm font-bold text-slate-300"
            >
              {bullet}
            </div>
          ))}
        </div>
      </motion.div>

      {/* File tree + Validation */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* File list */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#030014]/40 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-white">
            <FolderTree className="h-4 w-4 text-accent" />
            File tree
          </h3>
          <div className="grid gap-1.5 max-h-[280px] overflow-y-auto pr-1">
            {fileNames.map((fileName) => (
              <div
                key={fileName}
                className="flex items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2"
              >
                <FileCode2 className="h-3.5 w-3.5 flex-none text-primary/50" />
                <code className="text-xs text-slate-400 font-mono truncate">{fileName}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Validation report */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#030014]/40 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-white">
            <ShieldCheck className="h-4 w-4 text-success" />
            Validation report
          </h3>
          <ul className="space-y-2 max-h-[280px] overflow-y-auto pr-1 text-sm leading-6">
            {project.validationReport.map((item) => {
              const isError = item.startsWith('Error:');
              return (
                <li key={item} className="flex gap-2">
                  {isError ? (
                    <XCircle className="mt-0.5 h-4 w-4 flex-none text-danger" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-success/70" />
                  )}
                  <span className={isError ? 'text-danger/80' : 'text-slate-400'}>
                    {item}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Download section */}
      <div className="mt-5 rounded-2xl border border-accent/15 bg-accent/[0.04] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-black text-white">Export project</h3>
            <p className="mt-1 text-sm text-slate-500">
              Standalone runnable project. Does not overwrite the FRIENDS builder.
            </p>
          </div>
          <DownloadZipButton
            files={project.files}
            projectName={project.projectName}
            disabled={!project.exportReady}
          />
        </div>
      </div>
    </GlassCard>
  );
}
