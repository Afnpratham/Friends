/**
 * Project Controller
 * Handles CRUD operations for projects.
 */

import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { CreateProjectRequest, UpdateProjectRequest } from '../types';
import { getWorkflowAgents } from '../services/agentService';
import { v4 as uuidv4 } from 'uuid';

const updatableProjectFields = [
  'title',
  'description',
  'raw_prompt',
  'enhanced_prompt',
  'prompt_status',
  'status',
  'clarifications',
] as const;

function normalizeWorkflowType(value: string): 'website' | 'startup' | 'student' | 'custom' | null {
  const normalized = value.toLowerCase();
  const aliases: Record<string, 'website' | 'startup' | 'student' | 'custom'> = {
    website: 'website',
    website_builder: 'website',
    app_builder: 'website',
    startup: 'startup',
    startup_builder: 'startup',
    student: 'student',
    student_project: 'student',
    student_project_builder: 'student',
    custom: 'custom',
    custom_agents: 'custom',
    custom_workflow: 'custom',
  };

  return aliases[normalized] || null;
}

/** GET /api/projects — List all projects for the authenticated user */
export async function listProjects(req: Request, res: Response): Promise<void> {
  try {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ data, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
}

/** POST /api/projects — Create a new project */
export async function createProject(req: Request, res: Response): Promise<void> {
  try {
    const body: CreateProjectRequest = req.body;

    if (!body.title || !body.workflow_type || !body.description) {
      res.status(400).json({ data: null, error: 'title, workflow_type, and description are required' });
      return;
    }

    const workflowType = normalizeWorkflowType(body.workflow_type);
    if (!workflowType) {
      res.status(400).json({ data: null, error: 'Unsupported workflow_type' });
      return;
    }

    const projectId = uuidv4();
    const rawPrompt = body.raw_prompt ?? body.description;
    const enhancedPrompt = body.enhanced_prompt ?? body.description;
    const promptStatus = body.prompt_status ?? (body.enhanced_prompt ? 'approved' : 'draft');

    // Create the project
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert({
        id: projectId,
        user_id: req.user!.id,
        title: body.title,
        workflow_type: workflowType,
        description: enhancedPrompt,
        raw_prompt: rawPrompt,
        enhanced_prompt: enhancedPrompt,
        prompt_status: promptStatus,
        clarifications: body.clarifications || null,
        status: 'draft',
      })
      .select()
      .single();

    if (projectError) throw projectError;

    // Auto-seed agents for non-custom workflows
    if (workflowType !== 'custom') {
      const agentTemplates = getWorkflowAgents(workflowType);

      if (agentTemplates.length > 0) {
        const agents = agentTemplates.map((t) => ({
          id: uuidv4(),
          project_id: projectId,
          name: t.name,
          role: t.role,
          task: t.task,
          expected_output: t.expected_output,
          order_index: t.order_index,
          status: 'pending',
        }));

        const { error: agentsError } = await supabaseAdmin.from('agents').insert(agents);
        if (agentsError) throw agentsError;
      }
    }

    const { data: seededAgents } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    res.status(201).json({ data: { ...project, agents: seededAgents || [] }, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
}

/** GET /api/projects/:id — Get a single project with its agents */
export async function getProject(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (projectError || !project) {
      res.status(404).json({ data: null, error: 'Project not found' });
      return;
    }

    // Get agents
    const { data: agents, error: agentsError } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('project_id', id)
      .order('order_index', { ascending: true });

    if (agentsError) throw agentsError;

    // Get compiled output if it exists
    const { data: compiled } = await supabaseAdmin
      .from('compiled_outputs')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    res.json({ data: { ...project, agents, compiled_output: compiled }, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
}

/** PUT /api/projects/:id — Update a project */
export async function updateProject(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const body: UpdateProjectRequest = req.body;
    const updates = updatableProjectFields.reduce<Record<string, unknown>>((acc, field) => {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        acc[field] = body[field as keyof UpdateProjectRequest];
      }
      return acc;
    }, {});

    if (typeof updates.enhanced_prompt === 'string') {
      updates.description = updates.enhanced_prompt;
    }

    const { data, error } = await supabaseAdmin
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ data, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
}

/** DELETE /api/projects/:id — Delete a project */
export async function deleteProject(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id);

    if (error) throw error;
    res.json({ data: { deleted: true }, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
}
