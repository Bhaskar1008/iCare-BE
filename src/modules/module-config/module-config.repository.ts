import { BaseRepository } from '@/repository/base.repository';
import {
  ModuleConfigModel,
  type IModuleConfig,
} from '@/models/module-config.model';
import type { FilterQuery } from 'mongoose';
import logger from '@/common/utils/logger';
import type { IModuleConfigRepository } from './interfaces/module-config.interface';
import { Types } from 'mongoose';

export class ModuleConfigRepository
  extends BaseRepository<IModuleConfig>
  implements IModuleConfigRepository
{
  constructor() {
    super(ModuleConfigModel);
  }

  public async findByModuleId(moduleId: string): Promise<IModuleConfig[]> {
    try {
      logger.debug('Finding module configs by module ID', { moduleId });
      const result = await this.model
        .find({
          moduleId: new Types.ObjectId(moduleId),
          isDeleted: false,
        })
        .populate('moduleId', 'name code description')
        .populate('projectId', 'projectName projectCode')
        .sort({ createdAt: -1 })
        .exec();

      logger.debug('Module configs found by module ID', {
        moduleId,
        count: result.length,
      });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find module configs by module ID:', {
        error: err.message,
        stack: err.stack,
        moduleId,
      });
      throw error;
    }
  }

  public async findByProjectId(projectId: string): Promise<IModuleConfig[]> {
    try {
      logger.debug('Finding module configs by project ID', { projectId });
      const result = await this.model
        .find({
          projectId: new Types.ObjectId(projectId),
          isDeleted: false,
        })
        .populate('moduleId', 'name code description')
        .populate('projectId', 'projectName projectCode')
        .sort({ createdAt: -1 })
        .exec();

      logger.debug('Module configs found by project ID', {
        projectId,
        count: result.length,
      });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find module configs by project ID:', {
        error: err.message,
        stack: err.stack,
        projectId,
      });
      throw error;
    }
  }

  public async findByModuleIdAndProjectId(
    moduleId: string,
    projectId?: string,
  ): Promise<IModuleConfig[]> {
    try {
      logger.debug('Finding module configs by module ID and project ID', {
        moduleId,
        projectId,
      });

      const filter: FilterQuery<IModuleConfig> = {
        moduleId: new Types.ObjectId(moduleId),
        isDeleted: false,
      };

      if (projectId) {
        filter.projectId = new Types.ObjectId(projectId);
      }

      const result = await this.model
        .find(filter)
        .populate('moduleId', 'name code description')
        .populate('projectId', 'projectName projectCode')
        .sort({ createdAt: -1 })
        .exec();

      logger.debug('Module configs found by module ID and project ID', {
        moduleId,
        projectId,
        count: result.length,
      });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(
        'Failed to find module configs by module ID and project ID:',
        {
          error: err.message,
          stack: err.stack,
          moduleId,
          projectId,
        },
      );
      throw error;
    }
  }

  public async findByModuleIdAndConfigName(
    moduleId: string,
    configName: string,
    projectId?: string,
  ): Promise<IModuleConfig | null> {
    try {
      logger.debug('Finding module config by module ID and config name', {
        moduleId,
        configName,
        projectId,
      });

      const filter: FilterQuery<IModuleConfig> = {
        moduleId: new Types.ObjectId(moduleId),
        configName,
        isDeleted: false,
      };

      if (projectId) {
        filter.projectId = new Types.ObjectId(projectId);
      }

      const result = await this.model
        .findOne(filter)
        .populate('moduleId', 'name code description')
        .populate('projectId', 'projectName projectCode')
        .exec();

      logger.debug('Module config found by module ID and config name', {
        moduleId,
        configName,
        projectId,
        found: !!result,
      });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(
        'Failed to find module config by module ID and config name:',
        {
          error: err.message,
          stack: err.stack,
          moduleId,
          configName,
          projectId,
        },
      );
      throw error;
    }
  }

  public async findAll(
    filter: FilterQuery<IModuleConfig> = {},
  ): Promise<IModuleConfig[]> {
    try {
      logger.debug('Finding all module configs', { filter });
      const baseFilter = { ...filter, isDeleted: false };

      const result = await this.model
        .find(baseFilter)
        .populate('moduleId', 'name code description')
        .populate('projectId', 'projectName projectCode')
        .sort({ createdAt: -1 })
        .exec();

      logger.debug('All module configs found', {
        count: result.length,
      });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find all module configs:', {
        error: err.message,
        stack: err.stack,
        filter,
      });
      throw error;
    }
  }

  public async update(
    id: string,
    data: Partial<IModuleConfig>,
  ): Promise<IModuleConfig | null> {
    try {
      logger.debug('Updating module config', { id, data });

      const result = await this.model
        .findByIdAndUpdate(id, data, { new: true, runValidators: true })
        .populate('moduleId', 'name code description')
        .populate('projectId', 'projectName projectCode')
        .exec();

      logger.debug('Module config updated', {
        id,
        updated: !!result,
      });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to update module config:', {
        error: err.message,
        stack: err.stack,
        id,
        data,
      });
      throw error;
    }
  }

  public async delete(id: string): Promise<boolean> {
    try {
      logger.debug('Soft deleting module config', { id });

      const result = await this.model.findByIdAndUpdate(
        id,
        { isDeleted: true, deletedAt: new Date() },
        { new: true },
      );

      logger.debug('Module config soft deleted', {
        id,
        deleted: !!result,
      });
      return !!result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to soft delete module config:', {
        error: err.message,
        stack: err.stack,
        id,
      });
      throw error;
    }
  }
}
