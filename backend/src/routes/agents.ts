import { Router } from 'express';
import { updateAgent, deleteAgent } from '../controllers/agentController';
import { executeSingleAgent } from '../controllers/executeController';

const router = Router();

router.put('/:id', updateAgent);
router.delete('/:id', deleteAgent);
router.post('/:id/execute', executeSingleAgent);

export default router;
