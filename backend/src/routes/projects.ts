import { Router } from 'express';
import {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController';
import { listAgents, createAgent } from '../controllers/agentController';
import {
  executeAgents,
  getExecutionStatus,
} from '../controllers/executeController';
import {
  compileProject,
  getCompiledOutput,
  approveCompiledOutput,
  getProjectGenerationStatus,
  exportMarkdown,
  exportSourceZip,
} from '../controllers/exportController';

const router = Router();

// ── Project CRUD ───────────────────────────────────────────────────────────
router.get('/', listProjects);
router.post('/', createProject);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

// ── Agents (nested under project) ─────────────────────────────────────────
router.get('/:id/agents', listAgents);
router.post('/:id/agents', createAgent);

// ── Execution ──────────────────────────────────────────────────────────────
router.post('/:id/execute', executeAgents);
router.get('/:id/status', getExecutionStatus);

// ── Compilation ────────────────────────────────────────────────────────────
router.post('/:id/compile', compileProject);
router.get('/:id/generation-status', getProjectGenerationStatus);
router.get('/:id/compiled', getCompiledOutput);
router.post('/:id/approve', approveCompiledOutput);

// ── Export ─────────────────────────────────────────────────────────────────
router.post('/:id/export/markdown', exportMarkdown);
router.post('/:id/export/source-zip', exportSourceZip);

export default router;
