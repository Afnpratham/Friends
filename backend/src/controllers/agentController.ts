/**
 * Agent Controller
 * Handles CRUD operations for agents within a project.
 */

import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { CreateAgentRequest, UpdateAgentRequest } from '../types';
import { v4 as uuidv4 } from 'uuid';

/** GET /api/projects/:id/agents */
export async function listAgents(req: Request, res: Response): Promise<void> {
  try {
    const { id: projectId } = req.params;

    // Verify project ownership
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', req.user!.id)
      .single();

    if (projectError || !project) {
      res.status(404).json({ data: null, error: 'Project not found' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    res.json({ data, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
}

/** POST /api/projects/:id/agents */
export async function createAgent(req: Request, res: Response): Promise<void> {
  try {
    const { id: projectId } = req.params;
    const body: CreateAgentRequest = req.body;

    if (!body.name || !body.role || !body.task) {
      res.status(400).json({ data: null, error: 'name, role, and task are required' });
      return;
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .eq('user_id', req.user!.id)
      .single();

    if (projectError || !project) {
      res.status(404).json({ data: null, error: 'Project not found' });
      return;
    }

    // Get current max order_index
    const { data: existingAgents } = await supabaseAdmin
      .from('agents')
      .select('order_index')
      .eq('project_id', projectId)
      .order('order_index', { ascending: false })
      .limit(1);

    const maxIndex = existingAgents?.[0]?.order_index ?? -1;

    const { data, error } = await supabaseAdmin
      .from('agents')
      .insert({
        id: uuidv4(),
        project_id: projectId,
        name: body.name,
        role: body.role,
        task: body.task,
        expected_output: body.expected_output || '',
        order_index: body.order_index ?? maxIndex + 1,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ data, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
}

/** PUT /api/agents/:id */
export async function updateAgent(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const body: UpdateAgentRequest = req.body;

    // Verify ownership via project join
    const { data: agent, error: fetchError } = await supabaseAdmin
      .from('agents')
      .select('id, project_id, projects!inner(user_id)')
      .eq('id', id)
      .single();

    if (fetchError || !agent) {
      res.status(404).json({ data: null, error: 'Agent not found' });
      return;
    }

    const project = (agent as any).projects;
    if (project?.user_id !== req.user!.id) {
      res.status(403).json({ data: null, error: 'You do not have access to this agent' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('agents')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ data, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
}

/** DELETE /api/agents/:id */
export async function deleteAgent(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const { data: agent, error: fetchError } = await supabaseAdmin
      .from('agents')
      .select('id, projects!inner(user_id)')
      .eq('id', id)
      .single();

    if (fetchError || !agent) {
      res.status(404).json({ data: null, error: 'Agent not found' });
      return;
    }

    const project = (agent as any).projects;
    if (project?.user_id !== req.user!.id) {
      res.status(403).json({ data: null, error: 'You do not have access to this agent' });
      return;
    }

    const { error } = await supabaseAdmin.from('agents').delete().eq('id', id);

    if (error) throw error;
    res.json({ data: { deleted: true }, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
}
