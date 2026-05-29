/**
 * Export Controller
 * Handles compiling project outputs and generating exports.
 */

import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { generateMarkdownExport } from '../services/exportService';
import { buildSourceZip } from '../services/packageService';
import { generateProjectPackage, getGenerationStatus } from '../services/generationPipelineService';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/projects/:id/compile
 * Runs the Compiler Agent to synthesize all agent outputs.
 */
export async function compileProject(req: Request, res: Response): Promise<void> {
  try {
    const { id: projectId } = req.params;

    // Fetch project
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', req.user!.id)
      .single();

    if (projectError || !project) {
      res.status(404).json({ data: null, error: 'Project not found' });
      return;
    }

    // Fetch all completed agents
    const { data: agents, error: agentsError } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    if (agentsError) throw agentsError;

    const completedAgents = (agents || []).filter((a) => a.status === 'completed' && a.output);

    // The upgraded staged generator can build directly from the approved prompt.
    // Completed legacy agent outputs are used as extra context when present, but
    // they are no longer required before source generation.

    // Send immediate response
    res.json({ data: { message: 'Compilation started', project_id: projectId }, error: null });

    // Run compiler async
    try {
      const compiledContent = await generateProjectPackage(project, completedAgents);

      // Save compiled output
      await supabaseAdmin.from('compiled_outputs').insert({
        id: uuidv4(),
        project_id: projectId,
        content: compiledContent,
        approved_by_user: false,
      });
    } catch (compileError: any) {
      console.error('Compilation failed:', compileError);
    }
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
}

/**
 * GET /api/projects/:id/generation-status
 * Returns the current staged source generation status.
 */
export async function getProjectGenerationStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id: projectId } = req.params;

    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', req.user!.id)
      .single();

    if (!project) {
      res.status(404).json({ data: null, error: 'Project not found' });
      return;
    }

    res.json({ data: getGenerationStatus(projectId), error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
}

/**
 * GET /api/projects/:id/compiled
 * Returns the latest compiled output for a project.
 */
export async function getCompiledOutput(req: Request, res: Response): Promise<void> {
  try {
    const { id: projectId } = req.params;

    // Verify ownership
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', req.user!.id)
      .single();

    if (!project) {
      res.status(404).json({ data: null, error: 'Project not found' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('compiled_outputs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    res.json({ data, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
}

/**
 * POST /api/projects/:id/approve
 * Sets human approval on the compiled output.
 */
export async function approveCompiledOutput(req: Request, res: Response): Promise<void> {
  try {
    const { id: projectId } = req.params;

    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', req.user!.id)
      .single();

    if (!project) {
      res.status(404).json({ data: null, error: 'Project not found' });
      return;
    }

    const { data: compiled, error: fetchError } = await supabaseAdmin
      .from('compiled_outputs')
      .select('id')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !compiled) {
      res.status(404).json({ data: null, error: 'No compiled output found' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('compiled_outputs')
      .update({ approved_by_user: true })
      .eq('id', compiled.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ data, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
}

/**
 * POST /api/projects/:id/export/markdown
 * Generates and returns a Markdown file for download.
 */
export async function exportMarkdown(req: Request, res: Response): Promise<void> {
  try {
    const { id: projectId } = req.params;

    // Fetch all necessary data
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', req.user!.id)
      .single();

    if (!project) {
      res.status(404).json({ data: null, error: 'Project not found' });
      return;
    }

    const { data: agents } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    const { data: compiled } = await supabaseAdmin
      .from('compiled_outputs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!compiled) {
      res.status(400).json({ data: null, error: 'No compiled output available. Compile the project first.' });
      return;
    }

    const markdown = generateMarkdownExport(project, compiled, agents || []);
    const filename = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.md`;

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(markdown);
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
}

/**
 * POST /api/projects/:id/export/source-zip
 * Generates and returns a runnable source-code ZIP.
 */
export async function exportSourceZip(req: Request, res: Response): Promise<void> {
  try {
    const { id: projectId } = req.params;

    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', req.user!.id)
      .single();

    if (!project) {
      res.status(404).json({ data: null, error: 'Project not found' });
      return;
    }

    const { data: agents } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    const { data: compiled } = await supabaseAdmin
      .from('compiled_outputs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!compiled) {
      res.status(400).json({ data: null, error: 'No compiled output available. Compile the project first.' });
      return;
    }

    const { buffer, filename } = await buildSourceZip(project, compiled, agents || []);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err: any) {
    res.status(422).json({ data: null, error: err.message });
  }
}
