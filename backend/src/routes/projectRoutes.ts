import { Router } from 'express';
import projectController from '../controllers/projectController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public endpoint
router.get('/public/:apiKey/config', projectController.getPublicConfig.bind(projectController));

// Protected endpoints
router.post('/', authenticate, projectController.createProject.bind(projectController));
router.get('/', authenticate, projectController.getProjects.bind(projectController));
router.get('/:id', authenticate, projectController.getProject.bind(projectController));
router.put('/:id', authenticate, projectController.updateProject.bind(projectController));
router.delete('/:id', authenticate, projectController.deleteProject.bind(projectController));

export default router;
