import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merges Tailwind classes safely. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format date to readable string */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Format date to relative time (e.g. "2 hours ago") */
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

/** Get status color classes */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed': return 'badge-success';
    case 'running': return 'badge-primary';
    case 'failed': return 'badge-danger';
    case 'pending': return 'badge-muted';
    case 'draft': return 'badge-muted';
    default: return 'badge-muted';
  }
}

/** Get workflow display info */
export function getWorkflowInfo(type: string): { label: string; emoji: string; color: string } {
  switch (type) {
    case 'website': return { label: 'Website Builder', emoji: '🌐', color: '#6366f1' };
    case 'startup': return { label: 'Startup Builder', emoji: '🚀', color: '#06b6d4' };
    case 'student': return { label: 'Student Project', emoji: '🎓', color: '#10b981' };
    case 'custom': return { label: 'Custom Workflow', emoji: '⚙️', color: '#f59e0b' };
    default: return { label: type, emoji: '📋', color: '#94a3b8' };
  }
}

/** Truncate text to a max length */
export function truncate(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/** Download a blob as a file */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
