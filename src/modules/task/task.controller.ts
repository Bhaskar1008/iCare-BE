import type { Request, Response } from 'express';
import { TaskService } from './task.service';
import type { CreateTaskDto } from './dto/create-task.dto';
import { HTTP_STATUS } from '@/common/constants/http-status.constants';
import { BaseController } from '@/controllers/base.controller';

interface ErrorWithMessage {
  message: string;
}

export class TaskController extends BaseController {
  private taskService: TaskService;

  constructor() {
    super();
    this.taskService = new TaskService();
  }

  async createTask(
    req: Request<unknown, unknown, CreateTaskDto>,
    res: Response,
  ) {
    try {
      const task = await this.taskService.createTask(req.body, 'system');
      this.sendCreated(res, task, 'Task created successfully');
    } catch (error) {
      const err = error as ErrorWithMessage;
      this.sendError(
        res,
        'Failed to create the todo.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  async updateTask(
    req: Request<unknown, unknown, Partial<CreateTaskDto>>,
    res: Response,
  ) {
    try {
      const taskId = req.query.taskId as string;
      const task = await this.taskService.updateTask(
        taskId,
        req.body,
        'system',
      );
      this.sendUpdated(res, task, 'Successfully updated the todo.');
    } catch (error) {
      const err = error as ErrorWithMessage;
      this.sendError(
        res,
        'Failed to update the todo.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  async archiveTask(req: Request, res: Response) {
    try {
      const taskId = req.query.taskId as string;
      const task = await this.taskService.archiveTask(taskId, 'system');
      this.sendUpdated(res, task, 'Successfully archived the todo.');
    } catch (error) {
      const err = error as ErrorWithMessage;
      this.sendError(
        res,
        'Failed to archive the todo.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  async getTasks(req: Request, res: Response) {
    try {
      const isArchived = req.query.isArchived === 'true';
      const tasks = await this.taskService.getTasks(isArchived);
      this.sendSuccess(res, tasks, 'Successfully fetched the todo list.');
    } catch (error) {
      const err = error as ErrorWithMessage;
      this.sendError(
        res,
        'Failed to get all the todos.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  async getTeamMembers(req: Request, res: Response) {
    try {
      const members = await this.taskService.getTeamMembers();
      this.sendSuccess(res, members, 'Successfully fetched the memebers.');
    } catch (error) {
      const err = error as ErrorWithMessage;
      this.sendError(
        res,
        'Failed to get all the todos.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }
}
