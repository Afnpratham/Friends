/**
 * Projects list page — shows all user projects with search and filters.
 */

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { projectsApi } from '@/lib/api';
import { getWorkflowInfo, getStatusColor, timeAgo } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Plus, Search, Folder, ArrowRight, Trash2, Clock,
  Loader2, FolderOpen, Sparkles,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    projectsApi.list().then(({ data }) => {
      setProjects((data as any) || []);
      setLoading(false);
    });
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const { error } = await projectsApi.delete(id);
    if (error) { toast.error(error); return; }
    setProjects((prev) => prev.filter((p) => p.id !== id));
    toast.success('Project deleted');
  };

  const filtered = projects.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.status === filter || p.workflow_type === filter;
    return matchSearch && matchFilter;
  });

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'running', label: 'Running' },
    { value: 'completed', label: 'Completed' },
    { value: 'website', label: '🌐 Website' },
    { value: 'startup', label: '🚀 Startup' },
    { value: 'student', label: '🎓 Student' },
    { value: 'custom', label: '⚙️ Custom' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/25 bg-accent/10">
            <FolderOpen className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Projects</h1>
            <p className="text-sm text-slate-500">{projects.length} projects in your workspace</p>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-primary-deep to-indigo px-6 py-3.5 text-sm font-bold text-white shadow-glow-primary transition-all duration-300 hover:shadow-glow-primary-lg hover:from-primary hover:to-accent"
        >
          <Plus size={15} />
          New Project
        </Link>
      </motion.div>

      {/* Search + filters */}
      <motion.div
        className="flex flex-col sm:flex-row gap-3 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/[0.08] bg-[#020014]/60 py-3 pl-11 pr-4 text-sm text-white outline-none transition-all duration-300 placeholder:text-slate-600 focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-bold transition-all duration-200 ${
                filter === f.value
                  ? 'border-primary/30 bg-primary/[0.12] text-white shadow-glow-sm'
                  : 'border-white/[0.06] bg-white/[0.03] text-slate-500 hover:border-primary/20 hover:text-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Project list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 text-slate-400">
            <Loader2 size={20} className="animate-spin text-primary" />
            <span className="text-sm font-bold">Loading projects...</span>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-12 text-center" animate={false}>
          <Folder size={32} className="text-slate-700 mx-auto mb-4" />
          {search || filter !== 'all' ? (
            <>
              <p className="text-slate-400 mb-3 font-bold">No projects match your search</p>
              <button
                onClick={() => { setSearch(''); setFilter('all'); }}
                className="text-primary-hover text-sm font-bold hover:text-white transition-colors"
              >
                Clear filters
              </button>
            </>
          ) : (
            <>
              <p className="text-slate-400 mb-5 font-bold">No projects yet. Create your first one!</p>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-primary-deep to-indigo px-6 py-3.5 text-sm font-bold text-white shadow-glow-primary transition-all duration-300 hover:shadow-glow-primary-lg hover:from-primary hover:to-accent"
              >
                <Plus size={15} />
                New Project
              </Link>
            </>
          )}
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filtered.map((project, i) => {
            const wf = getWorkflowInfo(project.workflow_type);
            return (
              <motion.div
                key={project.id}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: i * 0.04 }}
                className="group flex items-center gap-4 rounded-[20px] border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-glow-sm"
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] text-xl">
                  {wf.emoji}
                </div>

                <Link href={`/dashboard/projects/${project.id}`} className="flex-1 min-w-0">
                  <h3 className="text-white font-bold truncate group-hover:text-primary-hover transition-colors">
                    {project.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-slate-600 text-xs font-bold">{wf.label}</span>
                    <span className="text-slate-800 text-xs">•</span>
                    <span className="flex items-center gap-1 text-slate-600 text-xs">
                      <Clock size={10} /> {timeAgo(project.created_at)}
                    </span>
                    <span className={getStatusColor(project.status)}>{project.status}</span>
                  </div>
                  {project.description && (
                    <p className="text-slate-700 text-xs mt-1 truncate">{project.description}</p>
                  )}
                </Link>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleDelete(project.id, project.title)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-red-500/[0.08] hover:text-red-400"
                    aria-label="Delete project"
                  >
                    <Trash2 size={14} />
                  </button>
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:text-primary"
                  >
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
