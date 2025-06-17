import { Router } from 'express';
import { ModuleController } from './module.controller';

const router = Router();
const moduleController = new ModuleController();

// Create a new module
router.post('/', moduleController.createModule.bind(moduleController));

// Get all modules with pagination and filters
router.get('/', moduleController.getModules.bind(moduleController));

// Get a specific module by ID
router.get('/:id', moduleController.getModuleById.bind(moduleController));

// Update a module
router.put('/:id', moduleController.updateModule.bind(moduleController));

// Delete a module
router.delete('/:id', moduleController.deleteModule.bind(moduleController));

export default router;
