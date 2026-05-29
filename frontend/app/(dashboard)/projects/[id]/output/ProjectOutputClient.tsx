/**
 * Project Output Page
 * Shows individual agent outputs, approval gate, compiled output, and export options.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { projectsApi } from '@/lib/api';
import type { GenerationStatus } from '@/lib/api';
import { getWorkflowInfo, downloadBlob, timeAgo } from '@/lib/utils';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft, FileText, CheckCircle2, Loader2,
  ChevronDown, ChevronUp, Zap, Check, FileDown, Sparkles, Copy, Archive
} from 'lucide-react';

function extractHtmlApp(markdown: string): string | null {
  const match = markdown.match(/(?:```|~~~)html\s*([\s\S]*?)(?:```|~~~)/i);
  return match?.[1]?.trim() || null;
}

function toFileName(title: string): string {
  return `${title || 'website-app'}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'website-app';
}

function AgentOutputCard({ agent, index }: { agent: any; index: number }) {
  const [expanded, setExpanded] = useState(false);

  if (agent.status !== 'completed' || !agent.output) return null;

  return (
    <motion.div
      id={`agent-${agent.id}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="glass-card overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center gap-4 text-left hover:bg-white/2 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
          style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-white font-semibold">{agent.name}</h3>
            <span className="badge-muted text-xs">{agent.role}</span>
            <CheckCircle2 size={14} className="text-emerald-400 ml-1" />
          </div>
          <p className="text-slate-500 text-xs truncate">{agent.task}</p>
        </div>
        <div className="flex-shrink-0">
          {expanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0 border-t border-slate-800">
              <div className="markdown-output mt-4 max-h-[500px] overflow-y-auto pr-2">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {agent.output}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ProjectOutputClient({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [compiledOutput, setCompiledOutput] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [approved, setApproved] = useState(false);
  const [outputsApproved, setOutputsApproved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null);

  const loadData = useCallback(async () => {
    if (!projectId) {
      setLoadError('Missing project ID.');
      return;
    }

    const { data, error } = await projectsApi.get(projectId);
    if (error || !data) {
      setLoadError(error || 'Project not found');
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load project output', { projectId, error });
      }
      return;
    }

    if (data) {
      const p = data as any;
      setProject(p);
      setAgents(p.agents || []);
      setCompiledOutput(p.compiled_output);
      setApproved(p.compiled_output?.approved_by_user || false);
      setOutputsApproved(Boolean(p.compiled_output));
      setLoadError(null);
    }
  }, [projectId]);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const handleCompile = async () => {
    setCompiling(true);
    setGenerationStatus(null);
    const previousCompiledId = compiledOutput?.id;
    const { error } = await projectsApi.compile(projectId);
    if (error) { toast.error(error); setCompiling(false); return; }

    toast.success('Generation pipeline started...');

    const interval = setInterval(async () => {
      const statusResult = await projectsApi.getGenerationStatus(projectId);
      if (statusResult.data) {
        const status = statusResult.data as GenerationStatus;
        setGenerationStatus(status);
        if (status.stage === 'failed') {
          clearInterval(interval);
          setCompiling(false);
          toast.error(status.error || status.message || 'Generation failed quality checks. Please refine the prompt or try again.');
          return;
        }
      }

      const { data } = await projectsApi.getCompiled(projectId);
      if (data && (!previousCompiledId || (data as any).id !== previousCompiledId)) {
        setCompiledOutput(data);
        setApproved(Boolean((data as any).approved_by_user));
        clearInterval(interval);
        setCompiling(false);
        const finalStatus = await projectsApi.getGenerationStatus(projectId);
        if (finalStatus.data) setGenerationStatus(finalStatus.data as GenerationStatus);
        toast.success('Generation complete. ZIP is ready!');
      }
    }, 1500);

    setTimeout(() => {
      clearInterval(interval);
      setCompiling(false);
    }, 180000);
  };

  const handleApproveOutputs = () => {
    setOutputsApproved(true);
    toast.success('Agent outputs approved. Compiler is ready.');
  };

  const handleApproveFinalOutput = async () => {
    const { error } = await projectsApi.approve(projectId);
    if (error) { toast.error(error); return; }
    setApproved(true);
    toast.success('Final output approved!');
  };

  const handleCopyOutput = async () => {
    if (!compiledOutput?.content) return;
    await navigator.clipboard.writeText(compiledOutput.content);
    toast.success('Final output copied');
  };

  const handleExportMarkdown = async () => {
    setExporting(true);
    const result = await projectsApi.exportMarkdown(projectId);
    if (result.error) { toast.error(result.error); setExporting(false); return; }
    downloadBlob(result.blob!, result.filename || 'project.md');
    setExporting(false);
    toast.success('Markdown exported!');
  };

  const handleDownloadHtml = () => {
    const html = extractHtmlApp(compiledOutput?.content || '');
    if (!html) {
      toast.error('No complete HTML app was found in the compiled output.');
      return;
    }

    downloadBlob(new Blob([html], { type: 'text/html' }), `${toFileName(project?.title)}.html`);
    toast.success('HTML app downloaded');
  };

  const handleDownloadZip = async () => {
    if (!compiledOutput?.content) return;
    if (generationStatus && !generationStatus.qualityPassed) {
      toast.error('ZIP is not ready until validation passes.');
      return;
    }

    setExporting(true);
    const result = await projectsApi.exportSourceZip(projectId);
    if (result.error || !result.blob) {
      toast.error(result.error || 'ZIP export failed. Regenerate the project and try again.');
      setExporting(false);
      return;
    }

    try {
      downloadBlob(result.blob, result.filename || `${toFileName(project?.title)}.zip`);
      toast.success('Project ZIP downloaded');
    } catch {
      toast.error('ZIP download failed. Try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 size={24} className="animate-spin text-indigo-400" /></div>;
  }

  if (loadError || !project) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <Link href={`/dashboard/projects/${projectId}`} className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-6">
          <ArrowLeft size={16} /> Back to Project
        </Link>
        <div className="glass-card p-8 text-center">
          <FileText size={28} className="text-slate-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-white mb-2">Output unavailable</h1>
          <p className="text-slate-400 text-sm">{loadError || 'This project output could not be loaded.'}</p>
        </div>
      </div>
    );
  }

  const completedAgents = agents.filter((a) => a.status === 'completed' && a.output);
  const wf = getWorkflowInfo(project?.workflow_type || '');
  const canExportZip = Boolean(compiledOutput?.content && (!generationStatus || generationStatus.qualityPassed));
  const stageLabels: Array<{ key: GenerationStatus['stage']; label: string }> = [
    { key: 'intent_analysis', label: 'Intent analysis' },
    { key: 'prompt_enhancement', label: 'Prompt enhancement' },
    { key: 'template_selection', label: 'Template selection' },
    { key: 'product_spec', label: 'Product spec' },
    { key: 'ui_ux_spec', label: 'UI/UX spec' },
    { key: 'tech_spec', label: 'Tech spec' },
    { key: 'file_plan', label: 'File plan' },
    { key: 'code_generation', label: 'Code generation' },
    { key: 'static_validation', label: 'Static validation' },
    { key: 'repair', label: 'Repair' },
    { key: 'build_validation', label: 'Build validation' },
    { key: 'quality_review', label: 'Quality review' },
    { key: 'packaging', label: 'Packaging ZIP' },
    { key: 'completed', label: 'ZIP ready' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <Link href={`/dashboard/projects/${projectId}`} className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /> Back to Project
        </Link>
        {compiledOutput && (
          <div className="flex flex-wrap items-center gap-3">
              <button onClick={handleCopyOutput} className="btn-secondary text-sm flex items-center gap-2">
                <Copy size={16} /> Copy
              </button>
              <button onClick={handleCompile} disabled={compiling} className="btn-secondary text-sm flex items-center gap-2">
                {compiling ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                Regenerate
              </button>
            <button onClick={handleDownloadZip} disabled={exporting || !canExportZip} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50">
                <Archive size={16} /> Export Full Source Code ZIP
            </button>
            {project.workflow_type === 'website' && (
              <button onClick={handleDownloadHtml} className="btn-secondary text-sm flex items-center gap-2">
                <FileDown size={16} /> HTML
              </button>
            )}
            <button onClick={handleExportMarkdown} disabled={exporting} className="btn-secondary text-sm flex items-center gap-2">
              <FileText size={16} /> Export Documentation Only
            </button>
          </div>
        )}
      </div>

      {/* Title */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{wf.emoji}</span>
          <h1 className="text-2xl font-black text-white">{project?.title}</h1>
        </div>
        <p className="text-slate-400 text-sm">{completedAgents.length} agent outputs ready</p>
      </div>

      {/* Agent output cards */}
      <h2 className="text-lg font-bold text-white mb-4">Individual Agent Outputs</h2>
      <div className="space-y-3 mb-8">
        {completedAgents.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-slate-400">No completed agent outputs yet. Run agents from the project page first.</p>
            <Link href={`/dashboard/projects/${projectId}`} className="btn-primary inline-flex items-center gap-2 mt-4 text-sm">
              <ArrowLeft size={16} /> Go to Project
            </Link>
          </div>
        ) : (
          completedAgents.map((agent, i) => (
            <AgentOutputCard key={agent.id} agent={agent} index={i} />
          ))
        )}
      </div>

      {/* Approval gate + Compile */}
      {completedAgents.length > 0 && (
        <div className="glass-card p-6 mb-6"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(6,182,212,0.05))' }}>
          <h2 className="text-lg font-bold text-white mb-2">Human Approval Gate</h2>
          <p className="text-slate-400 text-sm mb-5">
            Review the agent outputs above. Once you&apos;re happy, approve and run the Compiler Agent to get your final downloadable project package.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            {!outputsApproved ? (
              <button onClick={handleApproveOutputs} className="btn-secondary flex items-center gap-2 flex-1 justify-center">
                <Check size={16} className="text-emerald-400" /> Approve Agent Outputs
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-emerald-400"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <CheckCircle2 size={16} /> Outputs Approved
              </div>
            )}

            {!compiledOutput ? (
              <button
                onClick={handleCompile}
                disabled={compiling || !outputsApproved}
                className="btn-primary flex items-center gap-2 flex-1 justify-center disabled:opacity-50"
              >
                {compiling ? (
                  <><Loader2 size={16} className="animate-spin" /> Compiling...</>
                ) : (
                  <><Zap size={16} /> Run Compiler Agent</>
                )}
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* Compiled output */}
      {(compiledOutput || compiling) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card overflow-hidden"
        >
          <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold">
                  {project.workflow_type === 'website' ? 'Complete App Output' : 'Compiled Final Output'}
                </h2>
                {compiledOutput && <p className="text-slate-500 text-xs">{timeAgo(compiledOutput.created_at)}</p>}
              </div>
            </div>
            {compiledOutput && (
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={handleCompile} disabled={compiling} className="btn-ghost text-xs flex items-center gap-1.5">
                  {compiling ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                  Regenerate
                </button>
                {!approved && (
                  <button onClick={handleApproveFinalOutput} className="btn-ghost text-xs flex items-center gap-1.5">
                    <Check size={14} /> Approve
                  </button>
                )}
                <button onClick={handleCopyOutput} className="btn-ghost text-xs flex items-center gap-1.5">
                  <Copy size={14} /> Copy
                </button>
                <button onClick={handleDownloadZip} disabled={exporting || !canExportZip} className="btn-ghost text-xs flex items-center gap-1.5 disabled:opacity-50">
                  <Archive size={14} /> ZIP
                </button>
                {project.workflow_type === 'website' && (
                  <button onClick={handleDownloadHtml} className="btn-ghost text-xs flex items-center gap-1.5">
                    <FileDown size={14} /> HTML
                  </button>
                )}
                <button onClick={handleExportMarkdown} disabled={exporting} className="btn-ghost text-xs flex items-center gap-1.5">
                  <FileText size={14} /> MD
                </button>
              </div>
            )}
          </div>

          {compiling ? (
            <div className="p-12 flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
                <Sparkles size={20} className="text-white animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-slate-300 font-medium">{generationStatus?.message || 'Starting generation pipeline...'}</p>
                <p className="mt-1 text-xs text-slate-500">{generationStatus?.progress || 0}% complete</p>
              </div>
              <div className="h-2 w-full max-w-xl overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${generationStatus?.progress || 4}%` }}
                />
              </div>
              <div className="grid w-full gap-2 text-sm text-slate-500 sm:grid-cols-2">
                {stageLabels.map((stage) => {
                  const completed = generationStatus?.completedStages?.includes(stage.key) || generationStatus?.stage === 'completed';
                  const active = generationStatus?.stage === stage.key;
                  return (
                    <span
                      key={stage.key}
                      className={`rounded-lg border px-3 py-2 ${
                        completed
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                          : active
                            ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300'
                            : 'border-slate-800'
                      }`}
                    >
                      {completed ? '✓ ' : active ? '• ' : ''}
                      {stage.label}
                    </span>
                  );
                })}
              </div>
              {generationStatus?.validationResults?.length ? (
                <div className="w-full max-w-xl rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">
                  <p className="mb-2 font-bold text-slate-200">Validation results</p>
                  {generationStatus.validationResults.map((item) => (
                    <p key={item}>- {item}</p>
                  ))}
                  <p className="mt-2 text-xs text-slate-500">Repair attempts: {generationStatus.repairAttempts}</p>
                </div>
              ) : null}
              <div className="loading-dots flex gap-2 mt-2">
                <span /><span /><span />
              </div>
            </div>
          ) : compiledOutput ? (
            <div className="p-6">
              {generationStatus?.qualityPassed && (
                <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                  Validation passed. ZIP ready.
                </div>
              )}
              {generationStatus && !generationStatus.qualityPassed && generationStatus.stage !== 'completed' && (
                <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
                  ZIP export is locked until quality validation passes.
                </div>
              )}
              <div className="markdown-output max-h-[600px] overflow-y-auto pr-2">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {compiledOutput.content}
                </ReactMarkdown>
              </div>
            </div>
          ) : null}
        </motion.div>
      )}
    </div>
  );
}
