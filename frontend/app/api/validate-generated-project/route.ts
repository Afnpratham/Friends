import { execFile } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { NextResponse } from 'next/server';

const execFileAsync = promisify(execFile);

type ValidateRequest = {
  generationRunId?: string;
  files?: Record<string, string>;
};

type CommandEnv = {
  NODE_ENV?: 'development' | 'production' | 'test';
};

function safeOutputPath(root: string, filePath: string) {
  const normalized = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const outputPath = path.join(root, normalized);

  if (!outputPath.startsWith(root)) {
    throw new Error(`Unsafe generated file path: ${filePath}`);
  }

  return outputPath;
}

async function runCommand(command: string, args: string[], cwd: string, env: CommandEnv = {}) {
  const { stdout, stderr } = await execFileAsync(command, args, {
    cwd,
    env: {
      NODE_ENV: env.NODE_ENV ?? 'development',
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      TMPDIR: process.env.TMPDIR,
      ...env,
    },
    timeout: 120_000,
    maxBuffer: 1024 * 1024 * 8,
  });

  return `${stdout}\n${stderr}`.trim();
}

export async function POST(request: Request) {
  const payload = (await request.json()) as ValidateRequest;

  if (!payload.generationRunId || !payload.files || Object.keys(payload.files).length === 0) {
    return NextResponse.json({ ok: false, log: 'Missing generationRunId or generated files.' }, { status: 400 });
  }

  const projectRoot = path.join(tmpdir(), 'friends-generated-builds', payload.generationRunId);

  try {
    await rm(projectRoot, { recursive: true, force: true });
    await mkdir(projectRoot, { recursive: true });

    for (const [filePath, content] of Object.entries(payload.files)) {
      if (filePath === 'FRIENDS_GENERATION_SPEC.md') continue;
      const outputPath = safeOutputPath(projectRoot, filePath);
      await mkdir(path.dirname(outputPath), { recursive: true });
      await writeFile(outputPath, content, 'utf8');
    }

    const installLog = await runCommand('npm', ['install'], projectRoot);
    const buildLog = await runCommand('npm', ['run', 'build'], projectRoot, { NODE_ENV: 'production' });

    return NextResponse.json({
      ok: true,
      log: [installLog, buildLog].filter(Boolean).join('\n'),
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      log: error instanceof Error ? error.message : 'Generated project build failed.',
    });
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
}
