import { Router } from 'express';
import type { RequestHandler } from 'express';
import { TaskController } from './task.controller';

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management endpoints
 */

const router = Router();
const taskController = new TaskController();

/**
 * @swagger
 * /api/task:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               teamMember:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user UUIDs
 *               taskDescription:
 *                 type: string
 *               priorityType:
 *                 type: string
 *                 enum: [high, medium, low]
 *               dueReminder:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Task created successfully
 */
router.post(
  '/',
  taskController.createTask.bind(taskController) as unknown as RequestHandler,
);

/**
 * @swagger
 * /api/task:
 *   put:
 *     summary: Update an existing task
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               teamMember:
 *                 type: array
 *                 items:
 *                   type: string
 *               taskDescription:
 *                 type: string
 *               priorityType:
 *                 type: string
 *                 enum: [high, medium, low]
 *               dueReminder:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Task updated successfully
 */
router.put(
  '/',
  taskController.updateTask.bind(taskController) as unknown as RequestHandler,
);

/**
 * @swagger
 * /api/task:
 *   patch:
 *     summary: Archive a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task archived successfully
 */
router.patch(
  '/',
  taskController.archiveTask.bind(taskController) as unknown as RequestHandler,
);

/**
 * @swagger
 * /api/task:
 *   get:
 *     summary: Get list of tasks
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: isArchived
 *         schema:
 *           type: boolean
 *         description: Filter for archived tasks
 *     responses:
 *       200:
 *         description: List of tasks retrieved successfully
 */
router.get(
  '/',
  taskController.getTasks.bind(taskController) as unknown as RequestHandler,
);

/**
 * @swagger
 * /api/task/teamMembers:
 *   get:
 *     summary: Get list of team members
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: List of team members retrieved successfully
 */
router.get(
  '/teamMembers',
  taskController.getTeamMembers.bind(
    taskController,
  ) as unknown as RequestHandler,
);

export default router;
