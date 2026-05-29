import JSZip from 'jszip';
import { Agent, CompiledOutput, Project } from '../types';
import {
  createFilePlan,
  repairGeneratedProject,
  validateGeneratedProject,
} from './projectTemplateService';

export interface ProjectFile {
  path: string;
  content: string;
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'friends-project'
  );
}

function normalizePath(path: string): string | null {
  const cleaned = path.replace(/\\/g, '/').replace(/^\/+/, '').trim();

  if (!cleaned) return null;
  if (cleaned.includes('..')) return null;
  if (cleaned.startsWith('/') || cleaned.startsWith('.git/')) return null;
  if (cleaned.length > 180) return null;

  return cleaned;
}

function dedupeFiles(files: ProjectFile[]): ProjectFile[] {
  const map = new Map<string, string>();

  for (const file of files) {
    const path = normalizePath(file.path);
    if (!path) continue;
    if (typeof file.content !== 'string') continue;
    map.set(path, file.content);
  }

  return Array.from(map, ([path, content]) => ({ path, content }));
}

export function extractProjectFileMap(markdown: string): ProjectFile[] {
  const candidates: string[] = [];
  const fencePattern = /(?:```|~~~)json\s*([\s\S]*?)(?:```|~~~)/gi;
  let match: RegExpExecArray | null;

  while ((match = fencePattern.exec(markdown))) {
    candidates.push(match[1].trim());
  }

  candidates.push(...extractBalancedJsonCandidates(markdown));
  candidates.push(markdown.trim());

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed?.files)) {
        return dedupeFiles(parsed.files);
      }
    } catch {
      // Try the next candidate.
    }
  }

  return [];
}

function extractBalancedJsonCandidates(text: string): string[] {
  const candidates: string[] = [];
  const starts: number[] = [];
  let index = text.indexOf('"files"');

  while (index !== -1) {
    const start = text.lastIndexOf('{', index);
    if (start !== -1) starts.push(start);
    index = text.indexOf('"files"', index + 7);
  }

  for (const start of starts) {
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < text.length; i += 1) {
      const char = text[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === '{') depth += 1;
      if (char === '}') depth -= 1;

      if (depth === 0) {
        candidates.push(text.slice(start, i + 1));
        break;
      }
    }
  }

  return candidates;
}

function hasFile(files: ProjectFile[], path: string): boolean {
  return files.some((file) => file.path === path);
}

function getFile(files: ProjectFile[], path: string): ProjectFile | undefined {
  return files.find((file) => file.path === path);
}

function hasSourceFile(files: ProjectFile[]): boolean {
  return files.some((file) =>
    /\.(tsx|ts|jsx|js|css|html)$/.test(file.path) &&
    !file.path.endsWith('.config.js') &&
    !file.path.endsWith('.config.ts')
  );
}

export function validateSourcePackage(files: ProjectFile[]): string[] {
  const errors: string[] = [];
  const packageJson = getFile(files, 'package.json');
  const usesNext = packageJson?.content.includes('"next"') ?? true;

  if (!packageJson) errors.push('package.json is missing');
  if (!hasFile(files, 'README.md')) errors.push('README.md is missing');
  if (!hasSourceFile(files)) errors.push('at least one source code file is required');
  if (!hasFile(files, 'app/page.tsx') && !hasFile(files, 'pages/index.tsx')) {
    errors.push('app/page.tsx or pages/index.tsx is missing');
  }

  if (usesNext) {
    for (const path of [
      'next.config.js',
      'tsconfig.json',
      'tailwind.config.ts',
      'postcss.config.js',
      'app/layout.tsx',
      'app/globals.css',
    ]) {
      if (!hasFile(files, path)) errors.push(`${path} is missing`);
    }
  }

  return errors;
}

function agentSummaryMarkdown(agents: Agent[]): string {
  return agents
    .filter((agent) => agent.status === 'completed' && agent.output)
    .sort((a, b) => a.order_index - b.order_index)
    .map(
      (agent) => `## ${agent.name} - ${agent.role}

**Task:** ${agent.task}

${agent.output}
`
    )
    .join('\n---\n');
}

export async function buildSourceZip(
  project: Project,
  compiled: CompiledOutput,
  agents: Agent[]
): Promise<{ buffer: Buffer; filename: string; files: ProjectFile[] }> {
  let files = extractProjectFileMap(compiled.content);
  const plan = createFilePlan(project);
  let validation = validateGeneratedProject(plan, files);
  let repairAttempts = 0;

  while (!validation.passed && repairAttempts < 3) {
    repairAttempts += 1;
    files = repairGeneratedProject(plan, files);
    validation = validateGeneratedProject(plan, files);
  }

  const validationErrors = [...validateSourcePackage(files), ...validation.errors];

  if (validationErrors.length > 0) {
    throw new Error(
      repairAttempts >= 3
        ? 'Generation failed quality checks. Please refine the prompt or try again.'
        : `Source package is incomplete: ${validationErrors.join(', ')}. Regenerate the project so the Code Packager can create runnable source files.`
    );
  }

  const root = plan.projectName || slugify(project.title);
  const zip = new JSZip();

  for (const file of files) {
    zip.file(`${root}/${file.path}`, file.content);
  }

  zip.file(`${root}/docs/optional-generation-report.md`, compiled.content);
  zip.file(`${root}/docs/AGENT_OUTPUTS.md`, agentSummaryMarkdown(agents));
  zip.file(`${root}/validation-report.json`, JSON.stringify(validation, null, 2));
  zip.file(`${root}/quality-score.json`, JSON.stringify(validation.score, null, 2));

  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  return { buffer, filename: `${root}.zip`, files };
}
