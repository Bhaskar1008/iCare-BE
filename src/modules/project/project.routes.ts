import { Router } from 'express';
import { ProjectController } from './project.controller';

const router = Router();
const projectController = new ProjectController();

// Create a new project
router.post('/', projectController.createProject.bind(projectController));

// Get all projects with pagination and filters
router.get('/', projectController.getProjects.bind(projectController));

// Get a specific project by ID
router.get('/:id', projectController.getProjectById.bind(projectController));

// Update a project
router.put('/:id', projectController.updateProject.bind(projectController));

// Delete a project
router.delete('/:id', projectController.deleteProject.bind(projectController));

export default router;
