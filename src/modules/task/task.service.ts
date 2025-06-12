import type { ITask } from '../../models/task.model';
import type { CreateTaskDto } from './dto/create-task.dto';
import { TaskType } from './enums/task.enum';
import { AgentModel } from '@/models/agent.model';
import { TaskRepository } from './task.repository';
import logger from '@/common/utils/logger';
import mongoose, { type PipelineStage } from 'mongoose';

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

  private buildHierarchyLookupStage(): PipelineStage {
    return {
      $lookup: {
        from: 'hierarchies',
        localField: 'channelId',
        foreignField: 'channelId',
        as: 'hierarchy',
      },
    };
  }

  private buildChannelMatchStage(channelId: string): PipelineStage {
    return {
      $match: {
        channelId: new mongoose.Types.ObjectId(channelId),
        isDeleted: false,
      },
    };
  }

  private buildFacetStage(): PipelineStage {
    return {
      $facet: {
        matchedAgentHierarchyOrder: [
          {
            $project: {
              currentHierarchyOrder: 1,
            },
          },
        ],
        allAgents: [
          {
            $lookup: {
              from: 'hierarchies',
              localField: 'channelId',
              foreignField: 'channelId',
              as: 'hierarchy',
            },
          },
          { $unwind: '$hierarchy' },
          {
            $match: {
              isDeleted: false,
            },
          },
        ],
      },
    };
  }

  private buildFilterStages(): PipelineStage[] {
    return [
      {
        $project: {
          currentHierarchyOrder: {
            $arrayElemAt: [
              '$matchedAgentHierarchyOrder.currentHierarchyOrder',
              0,
            ],
          },
          allAgents: 1,
        },
      },
      {
        $project: {
          agents: {
            $filter: {
              input: '$allAgents',
              as: 'agent',
              cond: {
                $lte: [
                  '$$agent.hierarchy.hierarchyOrder',
                  '$currentHierarchyOrder',
                ],
              },
            },
          },
        },
      },
      { $unwind: '$agents' },
      { $replaceRoot: { newRoot: '$agents' } },
    ];
  }

  private buildUserLookupStage(): PipelineStage {
    return {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userId',
        pipeline: [
          {
            $project: {
              firstName: 1,
              lastName: 1,
              email: 1,
            },
          },
        ],
      },
    };
  }

  private buildChannelLookupStage(): PipelineStage {
    return {
      $lookup: {
        from: 'channels',
        localField: 'channelId',
        foreignField: '_id',
        as: 'channelId',
        pipeline: [
          {
            $project: {
              channelName: 1,
            },
          },
        ],
      },
    };
  }

  private buildDesignationLookupStage(): PipelineStage {
    return {
      $lookup: {
        from: 'designations',
        localField: 'designationId',
        foreignField: '_id',
        as: 'designationId',
        pipeline: [
          {
            $project: {
              designationName: 1,
            },
          },
        ],
      },
    };
  }

  private buildUnwindAndSortStages(): PipelineStage[] {
    return [
      {
        $unwind: { path: '$userId', preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: '$channelId', preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: '$designationId', preserveNullAndEmptyArrays: true },
      },
      {
        $sort: { createdAt: -1 },
      },
    ];
  }

  private buildPopulationStages(): PipelineStage[] {
    return [
      this.buildUserLookupStage(),
      this.buildChannelLookupStage(),
      this.buildDesignationLookupStage(),
      ...this.buildUnwindAndSortStages(),
    ];
  }

  private buildSearchMatchStage(searchQuery?: string): PipelineStage | null {
    if (!searchQuery || searchQuery.trim() === '') {
      return null;
    }

    const searchRegex = new RegExp(searchQuery.trim(), 'i');
    return {
      $match: {
        $or: [
          { firstName: { $regex: searchRegex } },
          { lastName: { $regex: searchRegex } },
          {
            $expr: {
              $regexMatch: {
                input: {
                  $concat: ['$firstName', ' ', '$lastName'],
                },
                regex: searchRegex,
              },
            },
          },
        ],
      },
    };
  }

  async getTeamMembers(
    channelId: string,
    searchQuery?: string,
  ): Promise<unknown[]> {
    try {
      logger.debug(
        'Getting team members for channel with hierarchy filtering',
        { channelId, searchQuery },
      );

      // Build the aggregation pipeline using helper methods
      const pipeline: PipelineStage[] = [
        this.buildHierarchyLookupStage(),
        { $unwind: '$hierarchy' },
        this.buildChannelMatchStage(channelId),
        {
          $set: {
            currentHierarchyOrder: '$hierarchy.hierarchyOrder',
          },
        },
        this.buildFacetStage(),
        ...this.buildFilterStages(),
        ...this.buildPopulationStages(),
      ];

      // Add search filter if provided
      const searchStage = this.buildSearchMatchStage(searchQuery);
      if (searchStage) {
        pipeline.push(searchStage);
      }

      const agents = await AgentModel.aggregate(pipeline);

      logger.debug('Team members found with hierarchy filtering', {
        channelId,
        searchQuery,
        count: agents.length,
      });

      return agents as unknown[];
    } catch (error) {
      logger.error('Failed to get team members:', { error, channelId });
      throw error;
    }
  }
}
