/**
 * Execute Controller
 * Handles running agents sequentially, updating their status in real-time.
 * Also handles generating clarifying questions.
 */

import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { runAgent } from '../services/agentService';
import { generateClarifyingQuestions } from '../services/geminiService';
import { enhanceUserPrompt } from '../services/promptEnhancerService';
import { Agent, Project } from '../types';

/**
 * POST /api/projects/:id/execute
 * Runs all pending/failed agents for a project sequentially.
 * Updates agent status in the database as they run.
 */
export async function executeAgents(req: Request, res: Response): Promise<void> {
  try {
    const { id: projectId } = req.params;
    const { api_key: userApiKey } = req.body;

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

    if (project.status === 'running') {
      res.status(409).json({ data: null, error: 'Agents are already running for this project' });
      return;
    }

    // Fetch agents sorted by order
    const { data: agents, error: agentsError } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    if (agentsError || !agents || agents.length === 0) {
      res.status(400).json({ data: null, error: 'No agents found for this project' });
      return;
    }

    // Mark project as running
    await supabaseAdmin
      .from('projects')
      .update({ status: 'running', prompt_status: 'generating', updated_at: new Date().toISOString() })
      .eq('id', projectId);

    // Get user's Gemini key from profile if not provided in request
    let apiKey = userApiKey;
    if (!apiKey) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('openai_api_key')
        .eq('id', req.user!.id)
        .single();
      apiKey = profile?.openai_api_key || null;
    }

    // Respond immediately — execution happens asynchronously
    res.json({
      data: { message: 'Execution started', project_id: projectId, agent_count: agents.length },
      error: null,
    });

    // ── Run agents sequentially (non-blocking after response) ──
    const previousOutputs: { role: string; output: string }[] = [];

    for (const agent of agents) {
      // Skip already completed agents
      if (agent.status === 'completed') {
        if (agent.output) {
          previousOutputs.push({ role: agent.role, output: agent.output });
        }
        continue;
      }

      try {
        // Mark agent as running
        await supabaseAdmin
          .from('agents')
          .update({ status: 'running', updated_at: new Date().toISOString() })
          .eq('id', agent.id);

        // Run the agent
        const output = await runAgent(agent as Agent, project as Project, previousOutputs, apiKey);

        // Mark agent as completed
        await supabaseAdmin
          .from('agents')
          .update({
            status: 'completed',
            output,
            updated_at: new Date().toISOString(),
          })
          .eq('id', agent.id);

        previousOutputs.push({ role: agent.role, output });
      } catch (agentError: any) {
        console.error(`Agent ${agent.name} failed:`, agentError);

        // Mark agent as failed
        await supabaseAdmin
          .from('agents')
          .update({
            status: 'failed',
            output: `Error: ${agentError.message}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', agent.id);
      }
    }

    // Update project status based on results
    const { data: finalAgents } = await supabaseAdmin
      .from('agents')
      .select('status')
      .eq('project_id', projectId);

    const hasFailures = finalAgents?.some((a) => a.status === 'failed');
    const allCompleted = finalAgents?.every((a) => a.status === 'completed' || a.status === 'failed');

    if (allCompleted) {
      await supabaseAdmin
        .from('projects')
        .update({
          status: hasFailures ? 'failed' : 'completed',
          prompt_status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);
    }
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
}

/**
 * POST /api/agents/:id/execute
 * Re-runs a single agent (useful for retrying failed agents).
 */
export async function executeSingleAgent(req: Request, res: Response): Promise<void> {
  try {
    const { id: agentId } = req.params;
    const { api_key: userApiKey } = req.body;

    // Get agent with its project
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('*, projects!inner(*)')
      .eq('id', agentId)
      .eq('projects.user_id', req.user!.id)
      .single();

    if (agentError || !agent) {
      res.status(404).json({ data: null, error: 'Agent not found' });
      return;
    }

    const project = (agent as any).projects;

    // Get previous outputs from completed agents with lower order_index
    const { data: previousAgents } = await supabaseAdmin
      .from('agents')
      .select('role, output')
      .eq('project_id', agent.project_id)
      .eq('status', 'completed')
      .lt('order_index', agent.order_index);

    const previousOutputs = (previousAgents || [])
      .filter((a) => a.output)
      .map((a) => ({ role: a.role, output: a.output! }));

    // Get user's Gemini API key
    let apiKey = userApiKey;
    if (!apiKey) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('openai_api_key')
        .eq('id', req.user!.id)
        .single();
      apiKey = profile?.openai_api_key || null;
    }

    // Mark as running
    await supabaseAdmin
      .from('agents')
      .update({ status: 'running', updated_at: new Date().toISOString() })
      .eq('id', agentId);

    res.json({ data: { message: 'Agent execution started', agent_id: agentId }, error: null });

    // Run async
    try {
      const output = await runAgent(agent as Agent, project as Project, previousOutputs, apiKey);
      await supabaseAdmin
        .from('agents')
        .update({ status: 'completed', output, updated_at: new Date().toISOString() })
        .eq('id', agentId);
    } catch (runError: any) {
      await supabaseAdmin
        .from('agents')
        .update({
          status: 'failed',
          output: `Error: ${runError.message}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agentId);
    }
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
}

/**
 * GET /api/projects/:id/status
 * Returns the current execution status of a project and all its agents.
 */
export async function getExecutionStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id: projectId } = req.params;

    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('id, status, updated_at')
      .eq('id', projectId)
      .eq('user_id', req.user!.id)
      .single();

    if (!project) {
      res.status(404).json({ data: null, error: 'Project not found' });
      return;
    }

    const { data: agents } = await supabaseAdmin
      .from('agents')
      .select('id, name, role, status, order_index, updated_at')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    const total = agents?.length || 0;
    const completed = agents?.filter((a) => a.status === 'completed').length || 0;
    const failed = agents?.filter((a) => a.status === 'failed').length || 0;
    const running = agents?.filter((a) => a.status === 'running').length || 0;

    res.json({
      data: {
        project_status: project?.status,
        agents,
        progress: { total, completed, failed, running, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 },
      },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
}

/**
 * POST /api/clarify
 * Generates clarifying questions for a project description.
 */
export async function getClarifyingQuestions(req: Request, res: Response): Promise<void> {
  try {
    const { title, workflow_type, description } = req.body;

    if (!title || !workflow_type || !description) {
      res.status(400).json({ data: null, error: 'title, workflow_type, and description are required' });
      return;
    }

    // Get user's API key
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('openai_api_key')
      .eq('id', req.user!.id)
      .single();

    const questions = await generateClarifyingQuestions(
      title,
      workflow_type,
      description,
      profile?.openai_api_key || null
    );

    res.json({ data: { questions }, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
}

/**
 * POST /api/enhance-prompt
 * Converts a raw project idea into a structured software requirement prompt.
 */
export async function enhanceProjectPrompt(req: Request, res: Response): Promise<void> {
  try {
    const { title, workflow_type, raw_prompt, clarifications } = req.body;

    if (!workflow_type || !raw_prompt) {
      res.status(400).json({ data: null, error: 'workflow_type and raw_prompt are required' });
      return;
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('openai_api_key')
      .eq('id', req.user!.id)
      .single();

    const result = await enhanceUserPrompt({
      title,
      rawPrompt: raw_prompt,
      workflowType: workflow_type,
      clarifications: clarifications || [],
      userApiKey: profile?.openai_api_key || null,
    });

    res.json({ data: result, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
}
