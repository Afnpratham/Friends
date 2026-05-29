/**
 * Project Detail Page
 * Shows all agents, their status, and provides execute/compile controls.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { projectsApi, agentsApi } from '@/lib/api';
import { getWorkflowInfo, getStatusColor, timeAgo } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Play, RotateCcw, ChevronRight, Plus, Trash2,
  Loader2, CheckCircle2, XCircle, Clock, Zap, FileText,
  ArrowLeft, Eye, Edit3, Save, X
} from 'lucide-react';

function AgentStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed': return <CheckCircle2 size={16} className="text-emerald-400" />;
    case 'failed': return <XCircle size={16} className="text-red-400" />;
    case 'running': return <Loader2 size={16} className="text-indigo-400 animate-spin" />;
    default: return <Clock size={16} className="text-slate-500" />;
  }
}

export default function ProjectDetailClient({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [savingAgent, setSavingAgent] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [agentForm, setAgentForm] = useState({
    name: '',
    role: '',
    task: '',
    expected_output: '',
  });

  const loadProject = useCallback(async () => {
    if (!projectId) {
      setLoadError('Missing project ID.');
      return;
    }

    const { data, error } = await projectsApi.get(projectId);
    if (error || !data) {
      const message = error || 'Project not found';
      setLoadError(message);
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load project', { projectId, error });
      }
      return;
    }
    const p = data as any;
    setProject(p);
    setAgents(p.agents || []);
    setLoadError(null);
  }, [projectId]);

  useEffect(() => {
    loadProject().finally(() => setLoading(false));
  }, [loadProject]);

  // Poll status when running
  useEffect(() => {
    if (project?.status !== 'running') return;

    const interval = setInterval(async () => {
      const { data, error } = await projectsApi.getStatus(projectId);
      if (error && process.env.NODE_ENV === 'development') {
        console.error('Failed to refresh project status', { projectId, error });
      }
      if (data) {
        const s = data as any;
        setAgents(s.agents || []);
        if (s.project_status !== 'running') {
          clearInterval(interval);
          setExecuting(false);
          await loadProject();
          if (s.project_status === 'completed') {
            toast.success('All agents completed! Review outputs below.');
          }
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [project?.status, projectId, loadProject]);

  const handleExecute = async () => {
    setExecuting(true);
    const { error } = await projectsApi.execute(projectId);
    if (error) {
      toast.error(error);
      setExecuting(false);
      return;
    }
    toast.success('Agents are running! This may take a few minutes...');
    setProject((p: any) => ({ ...p, status: 'running' }));
  };

  const handleDeleteAgent = async (agentId: string) => {
    const { error } = await agentsApi.delete(agentId);
    if (error) { toast.error(error); return; }
    setAgents((prev) => prev.filter((a) => a.id !== agentId));
    toast.success('Agent removed');
  };

  const handleRetryAgent = async (agentId: string) => {
    const { error } = await agentsApi.execute(agentId);
    if (error) { toast.error(error); return; }
    toast.success('Agent re-running...');
  };

  const resetAgentForm = () => {
    setEditingAgentId(null);
    setAgentForm({ name: '', role: '', task: '', expected_output: '' });
    setShowAgentForm(false);
  };

  const handleStartEditAgent = (agent: any) => {
    setEditingAgentId(agent.id);
    setAgentForm({
      name: agent.name || '',
      role: agent.role || '',
      task: agent.task || '',
      expected_output: agent.expected_output || '',
    });
    setShowAgentForm(true);
  };

  const handleSaveAgent = async () => {
    if (!agentForm.name.trim() || !agentForm.role.trim() || !agentForm.task.trim()) {
      toast.error('Agent name, role, and task are required');
      return;
    }

    setSavingAgent(true);
    const payload = {
      name: agentForm.name.trim(),
      role: agentForm.role.trim(),
      task: agentForm.task.trim(),
      expected_output: agentForm.expected_output.trim(),
    };
    const result = editingAgentId
      ? await agentsApi.update(editingAgentId, payload)
      : await agentsApi.create(projectId, payload);

    setSavingAgent(false);
    if (result.error || !result.data) {
      toast.error(result.error || 'Unable to save agent');
      return;
    }

    const savedAgent = result.data as any;
    setAgents((prev) =>
      editingAgentId
        ? prev.map((agent) => (agent.id === editingAgentId ? savedAgent : agent))
        : [...prev, savedAgent]
    );
    resetAgentForm();
    toast.success(editingAgentId ? 'Agent updated' : 'Agent added');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (loadError || !project) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-6">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div className="glass-card p-8 text-center">
          <XCircle size={28} className="text-red-400 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-white mb-2">Project unavailable</h1>
          <p className="text-slate-400 text-sm mb-5">
            {loadError || 'This project could not be loaded. It may have been deleted or you may not have access.'}
          </p>
          <button onClick={() => router.refresh()} className="btn-secondary text-sm">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const wf = getWorkflowInfo(project.workflow_type);
  const completedCount = agents.filter((a) => a.status === 'completed').length;
  const progress = agents.length > 0 ? Math.round((completedCount / agents.length) * 100) : 0;
  const allDone = agents.length > 0 && agents.every((a) => a.status === 'completed' || a.status === 'failed');
  const isRunning = project.status === 'running' || executing;
  const enhancedPrompt = project.enhanced_prompt || project.description || '';
  const rawPrompt = project.raw_prompt || '';

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Back */}
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-6">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
          <div className="text-3xl">{wf.emoji}</div>
          <div>
            <h1 className="text-2xl font-black text-white">{project.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-slate-400 text-sm">{wf.label}</span>
              <span className="text-slate-700">•</span>
              <span className="text-slate-500 text-sm">{timeAgo(project.created_at)}</span>
              <span className={getStatusColor(project.status)}>{project.status}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {allDone && (
            <Link href={`/dashboard/projects/${projectId}/output`} className="btn-secondary flex items-center gap-2 text-sm">
              <Eye size={16} /> View Output
            </Link>
          )}
          {!isRunning && (
            <button
              onClick={handleExecute}
              disabled={agents.length === 0}
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <Play size={16} />
              {completedCount > 0 ? 'Re-run Agents' : 'Run All Agents'}
            </button>
          )}
          {isRunning && (
            <div className="btn-secondary flex items-center gap-2 text-sm cursor-not-allowed">
              <Loader2 size={16} className="animate-spin" /> Running...
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {enhancedPrompt && (
        <div className="glass-card p-5 mb-6">
          <p className="text-slate-400 text-sm mb-1">Enhanced Requirement Prompt</p>
          <p className="text-slate-200">{enhancedPrompt}</p>
          {rawPrompt && rawPrompt !== enhancedPrompt && (
            <div className="mt-4 border-t border-slate-800 pt-4">
              <p className="text-slate-500 text-sm mb-1">Original idea</p>
              <p className="text-slate-400 text-sm">{rawPrompt}</p>
            </div>
          )}
        </div>
      )}

      {/* Progress bar */}
      {(isRunning || completedCount > 0) && agents.length > 0 && (
        <div className="glass-card p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-400 text-sm">Agent Progress</p>
            <p className="text-white font-bold">{completedCount}/{agents.length} completed</p>
          </div>
          <div className="progress-bar">
            <motion.div
              className="progress-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-indigo-400 text-xs mt-2">{progress}%</p>
        </div>
      )}

      {/* Agents section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">AI Agents ({agents.length})</h2>
        {project.workflow_type === 'custom' && !isRunning && (
          <button
            onClick={() => {
              setShowAgentForm(true);
              setEditingAgentId(null);
              setAgentForm({ name: '', role: '', task: '', expected_output: '' });
            }}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Plus size={16} /> Add Agent
          </button>
        )}
      </div>

      {showAgentForm && project.workflow_type === 'custom' && (
        <div className="glass-card p-5 mb-4">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              value={agentForm.name}
              onChange={(event) => setAgentForm((form) => ({ ...form, name: event.target.value }))}
              placeholder="Agent name"
              className="input-base"
              maxLength={80}
            />
            <input
              type="text"
              value={agentForm.role}
              onChange={(event) => setAgentForm((form) => ({ ...form, role: event.target.value }))}
              placeholder="Role"
              className="input-base"
              maxLength={80}
            />
          </div>
          <textarea
            value={agentForm.task}
            onChange={(event) => setAgentForm((form) => ({ ...form, task: event.target.value }))}
            placeholder="Task for this agent"
            className="input-base resize-none mb-4"
            rows={3}
          />
          <textarea
            value={agentForm.expected_output}
            onChange={(event) => setAgentForm((form) => ({ ...form, expected_output: event.target.value }))}
            placeholder="Expected output format"
            className="input-base resize-none"
            rows={2}
          />
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button onClick={handleSaveAgent} disabled={savingAgent} className="btn-primary flex items-center justify-center gap-2 text-sm">
              {savingAgent ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {editingAgentId ? 'Save Agent' : 'Add Agent'}
            </button>
            <button onClick={resetAgentForm} className="btn-secondary flex items-center justify-center gap-2 text-sm">
              <X size={16} /> Cancel
            </button>
          </div>
        </div>
      )}

      {agents.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <p className="text-slate-400 mb-4">No agents found for this project.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card p-5"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-700 mt-0.5">
                  {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <AgentStatusIcon status={agent.status} />
                    <h3 className="text-white font-semibold">{agent.name}</h3>
                    <span className="badge-muted text-xs">{agent.role}</span>
                    <span className={`${getStatusColor(agent.status)} ml-auto`}>{agent.status}</span>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">{agent.task}</p>

                  {agent.status === 'completed' && agent.output && (
                    <Link
                      href={`/dashboard/projects/${projectId}/output#agent-${agent.id}`}
                      className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-xs mt-2 transition-colors"
                    >
                      <FileText size={12} /> View Output
                    </Link>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {agent.status === 'failed' && (
                    <button
                      onClick={() => handleRetryAgent(agent.id)}
                      className="btn-ghost p-1.5 text-xs flex items-center gap-1"
                      title="Retry"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                  {project.workflow_type === 'custom' && (
                    <>
                      <button
                        onClick={() => handleStartEditAgent(agent)}
                        className="btn-ghost p-1.5 text-slate-500 hover:text-indigo-300"
                        title="Edit agent"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteAgent(agent.id)}
                        className="btn-ghost p-1.5 text-red-500/60 hover:text-red-400"
                        title="Delete agent"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Compile CTA */}
      {allDone && completedCount > 0 && !project.compiled_output && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card mt-6 p-6 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.1))' }}
        >
          <Zap size={28} className="text-indigo-400 mx-auto mb-3" />
          <h3 className="text-white font-bold mb-2">Agents complete! Ready to compile?</h3>
          <p className="text-slate-400 text-sm mb-4">
            The Compiler Agent will synthesize all outputs into one final project document.
          </p>
          <Link href={`/dashboard/projects/${projectId}/output`} className="btn-primary inline-flex items-center gap-2">
            View & Compile Output <ChevronRight size={16} />
          </Link>
        </motion.div>
      )}
    </div>
  );
}
