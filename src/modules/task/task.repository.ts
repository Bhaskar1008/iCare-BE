import { BaseRepository } from '@/repository/base.repository';
import { Task } from '../../models/task.model';
import type { ITask } from '../../models/task.model';
import type { FilterQuery } from 'mongoose';
import logger from '@/common/utils/logger';

export class TaskRepository extends BaseRepository<ITask> {
  constructor() {
    super(Task);
  }

  public async findActiveTasks(
    limit: number = 100,
    skip: number = 0,
  ): Promise<ITask[]> {
    try {
      logger.debug('Finding active tasks', { limit, skip });
      const tasks = await this.find(
        {
          isArchived: false,
        },
        {
          limit,
          skip,
          sort: { createdAt: -1 },
        },
      );
      logger.debug('Active tasks found', { count: tasks.length, limit, skip });
      return tasks;
    } catch (error) {
      logger.error('Failed to find active tasks:', { error, limit, skip });
      throw error;
    }
  }

  public async findArchivedTasks(
    limit: number = 100,
    skip: number = 0,
  ): Promise<ITask[]> {
    try {
      logger.debug('Finding archived tasks', { limit, skip });
      const tasks = await this.find(
        {
          isArchived: true,
        },
        {
          limit,
          skip,
          sort: { createdAt: -1 },
        },
      );
      logger.debug('Archived tasks found', {
        count: tasks.length,
        limit,
        skip,
      });
      return tasks;
    } catch (error) {
      logger.error('Failed to find archived tasks:', { error, limit, skip });
      throw error;
    }
  }

  public async findTasksByTeamMember(teamMemberId: string): Promise<ITask[]> {
    try {
      logger.debug('Finding tasks by team member', { teamMemberId });
      const tasks = await this.find({
        teamMember: teamMemberId,
        isArchived: false,
      });
      logger.debug('Tasks found by team member', {
        teamMemberId,
        count: tasks.length,
      });
      return tasks;
    } catch (error) {
      logger.error('Failed to find tasks by team member:', {
        error,
        teamMemberId,
      });
      throw error;
    }
  }

  public async findWithPagination(
    filter: FilterQuery<ITask> = {},
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    tasks: ITask[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      logger.debug('Finding tasks with pagination', { filter, page, limit });

      const skip = (page - 1) * limit;
      const [tasks, total] = await Promise.all([
        this.find(filter, {
          limit,
          skip,
          sort: { createdAt: -1 },
        }),
        this.count(filter),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.debug('Tasks found with pagination', {
        count: tasks.length,
        total,
        page,
        totalPages,
      });

      return {
        tasks,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error('Failed to find tasks with pagination:', {
        error,
        filter,
        page,
        limit,
      });
      throw error;
    }
  }
}
