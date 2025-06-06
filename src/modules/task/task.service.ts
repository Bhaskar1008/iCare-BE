import type { ITask } from '../../models/task.model';
import type { CreateTaskDto } from './dto/create-task.dto';
import { TaskType } from './enums/task.enum';
import { UserModel, type IUser } from '@/models/user.model';
import { TaskRepository } from './task.repository';
import logger from '@/common/utils/logger';

export class TaskService {
  private taskRepository: TaskRepository;

  constructor() {
    this.taskRepository = new TaskRepository();
  }

  async createTask(
    createTaskDto: CreateTaskDto,
    userId: string,
  ): Promise<ITask> {
    try {
      logger.debug('Creating new task', { userId });
      return await this.taskRepository.create({
        ...createTaskDto,
        taskType: TaskType.TODO,
        teamMember: createTaskDto.teamMember,
        createdBy: userId,
        createdAt: new Date(),
      });
    } catch (error) {
      logger.error('Failed to create task:', { error, userId });
      throw error;
    }
  }

  async updateTask(
    taskId: string,
    updateData: Partial<CreateTaskDto>,
    userId: string,
  ): Promise<ITask | null> {
    try {
      logger.debug('Updating task', { taskId, userId });
      const task = await this.taskRepository.findById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      return await this.taskRepository.updateById(taskId, {
        ...updateData,
        teamMember: updateData.teamMember,
        updatedBy: userId,
        updatedAt: new Date(),
      });
    } catch (error) {
      logger.error('Failed to update task:', { error, taskId, userId });
      throw error;
    }
  }

  async archiveTask(taskId: string, userId: string): Promise<ITask | null> {
    try {
      logger.debug('Archiving task', { taskId, userId });
      const task = await this.taskRepository.findById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      return await this.taskRepository.updateById(taskId, {
        isArchived: true,
        updatedBy: userId,
        updatedAt: new Date(),
        taskType: TaskType.ARCHIVE,
      });
    } catch (error) {
      logger.error('Failed to archive task:', { error, taskId, userId });
      throw error;
    }
  }

  async getTasks(isArchived?: boolean): Promise<ITask[]> {
    try {
      logger.debug('Getting tasks', { isArchived });
      return isArchived
        ? await this.taskRepository.findArchivedTasks()
        : await this.taskRepository.findActiveTasks();
    } catch (error) {
      logger.error('Failed to get tasks:', { error, isArchived });
      throw error;
    }
  }

  async getTeamMembers(): Promise<Partial<IUser>[]> {
    try {
      logger.debug('Getting team members');
      return await UserModel.find({ isActive: true, isDeleted: false })
        .select('firstName lastName email')
        .sort({ createdAt: -1 })
        .lean();
    } catch (error) {
      logger.error('Failed to get team members:', { error });
      throw error;
    }
  }
}
