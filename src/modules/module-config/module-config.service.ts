import { ModuleConfigRepository } from './module-config.repository';
import type { CreateModuleConfigDto } from './dto/create-module-config.dto';
import type { UpdateModuleConfigDto } from './dto/update-module-config.dto';
import type { ModuleConfigResponseDto } from './dto/module-config-response.dto';
import type { IModuleConfig } from '@/models/module-config.model';
import { DatabaseValidationException } from '@/common/exceptions/database.exception';
import { ModuleModel } from '@/models/module.model';
import { ProjectModel } from '@/models/project.model';
import { Types } from 'mongoose';
import logger from '@/common/utils/logger';
import type {
  IModuleConfigService,
  IModuleConfigRepository,
} from './interfaces/module-config.interface';
import type { FilterQuery } from 'mongoose';

export class ModuleConfigService implements IModuleConfigService {
  private moduleConfigRepository: IModuleConfigRepository;

  constructor() {
    this.moduleConfigRepository = new ModuleConfigRepository();
  }

  public async createModuleConfig(
    data: CreateModuleConfigDto,
  ): Promise<ModuleConfigResponseDto> {
    try {
      logger.debug('Creating module config', { data });

      // Validate module exists
      await this.validateModuleExists(data.moduleId);

      // Validate project exists if provided
      if (data.projectId) {
        await this.validateProjectExists(data.projectId);
      }

      // Check if config with same name already exists for this module and project
      const existingConfig =
        await this.moduleConfigRepository.findByModuleIdAndConfigName(
          data.moduleId,
          data.configName,
          data.projectId,
        );

      if (existingConfig) {
        throw new DatabaseValidationException(
          `Configuration with name '${data.configName}' already exists for this module${data.projectId ? ' and project' : ''}`,
        );
      }

      const configData = {
        moduleId: new Types.ObjectId(data.moduleId),
        projectId: data.projectId
          ? new Types.ObjectId(data.projectId)
          : undefined,
        configName: data.configName,
        description: data.description,
        fields: data.fields,
        metadata: data.metadata,
      };

      const config = await this.moduleConfigRepository.create(configData);
      logger.info('Module config created successfully', {
        id: config._id,
        moduleId: config.moduleId,
        projectId: config.projectId,
        configName: config.configName,
      });

      return this.mapToResponseDto(config);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create module config:', {
        error: err.message,
        stack: err.stack,
        data,
      });
      throw error;
    }
  }

  private async validateModuleExists(moduleId: string): Promise<void> {
    const module = await ModuleModel.findById(moduleId);
    if (!module || module.isDeleted) {
      throw new DatabaseValidationException('Module not found or deleted');
    }
  }

  private async validateProjectExists(projectId: string): Promise<void> {
    const project = await ProjectModel.findById(projectId);
    if (!project || project.isDeleted) {
      throw new DatabaseValidationException('Project not found or deleted');
    }
  }

  public async getModuleConfigById(
    id: string,
  ): Promise<ModuleConfigResponseDto | null> {
    try {
      logger.debug('Getting module config by ID', { id });
      const config = await this.moduleConfigRepository.findById(id);

      if (!config || config.isDeleted) {
        logger.debug('Module config not found or deleted', { id });
        return null;
      }

      logger.debug('Module config found by ID', {
        id,
        configName: config.configName,
      });
      return this.mapToResponseDto(config);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get module config by ID:', {
        error: err.message,
        stack: err.stack,
        id,
      });
      throw error;
    }
  }

  public async getModuleConfigsByModuleId(
    moduleId: string,
  ): Promise<ModuleConfigResponseDto[]> {
    try {
      logger.debug('Getting module configs by module ID', { moduleId });
      const configs =
        await this.moduleConfigRepository.findByModuleId(moduleId);

      logger.debug('Module configs found by module ID', {
        moduleId,
        count: configs.length,
      });
      return configs.map(config => this.mapToResponseDto(config));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get module configs by module ID:', {
        error: err.message,
        stack: err.stack,
        moduleId,
      });
      throw error;
    }
  }

  public async getModuleConfigsByProjectId(
    projectId: string,
  ): Promise<ModuleConfigResponseDto[]> {
    try {
      logger.debug('Getting module configs by project ID', { projectId });
      const configs =
        await this.moduleConfigRepository.findByProjectId(projectId);

      logger.debug('Module configs found by project ID', {
        projectId,
        count: configs.length,
      });
      return configs.map(config => this.mapToResponseDto(config));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get module configs by project ID:', {
        error: err.message,
        stack: err.stack,
        projectId,
      });
      throw error;
    }
  }

  public async getModuleConfigsByModuleIdAndProjectId(
    moduleId: string,
    projectId?: string,
  ): Promise<ModuleConfigResponseDto[]> {
    try {
      logger.debug('Getting module configs by module ID and project ID', {
        moduleId,
        projectId,
      });
      const configs =
        await this.moduleConfigRepository.findByModuleIdAndProjectId(
          moduleId,
          projectId,
        );

      logger.debug('Module configs found by module ID and project ID', {
        moduleId,
        projectId,
        count: configs.length,
      });
      return configs.map(config => this.mapToResponseDto(config));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(
        'Failed to get module configs by module ID and project ID:',
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

  public async getModuleConfigByModuleIdAndName(
    moduleId: string,
    configName: string,
    projectId?: string,
  ): Promise<ModuleConfigResponseDto | null> {
    try {
      logger.debug('Getting module config by module ID and name', {
        moduleId,
        configName,
        projectId,
      });

      const config =
        await this.moduleConfigRepository.findByModuleIdAndConfigName(
          moduleId,
          configName,
          projectId,
        );

      if (!config) {
        logger.debug('Module config not found', {
          moduleId,
          configName,
          projectId,
        });
        return null;
      }

      logger.debug('Module config found by module ID and name', {
        moduleId,
        configName,
        projectId,
        id: config._id,
      });
      return this.mapToResponseDto(config);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get module config by module ID and name:', {
        error: err.message,
        stack: err.stack,
        moduleId,
        configName,
        projectId,
      });
      throw error;
    }
  }

  public async getAllModuleConfigs(
    filter: FilterQuery<IModuleConfig> = {},
  ): Promise<ModuleConfigResponseDto[]> {
    try {
      logger.debug('Getting all module configs', { filter });
      const configs = await this.moduleConfigRepository.findAll(filter);

      logger.debug('All module configs retrieved', {
        count: configs.length,
      });
      return configs.map(config => this.mapToResponseDto(config));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get all module configs:', {
        error: err.message,
        stack: err.stack,
        filter,
      });
      throw error;
    }
  }

  public async updateModuleConfig(
    id: string,
    data: UpdateModuleConfigDto,
  ): Promise<ModuleConfigResponseDto | null> {
    try {
      logger.debug('Updating module config', { id, data });

      const existingConfig = await this.moduleConfigRepository.findById(id);
      if (!existingConfig || existingConfig.isDeleted) {
        logger.debug('Module config not found for update', { id });
        return null;
      }

      // If configName is being changed, check for uniqueness
      if (data.configName && data.configName !== existingConfig.configName) {
        // Convert moduleId to string safely
        const moduleId =
          typeof existingConfig.moduleId === 'object' &&
          existingConfig.moduleId !== null
            ? (
                existingConfig.moduleId as { _id: Types.ObjectId }
              )._id.toString()
            : (existingConfig.moduleId as unknown as string);

        // Convert projectId to string safely if it exists
        const projectId =
          typeof existingConfig.projectId === 'object' &&
          existingConfig.projectId !== null
            ? (
                existingConfig.projectId as { _id: Types.ObjectId }
              )._id.toString()
            : (existingConfig.projectId as unknown as string);

        const conflictingConfig =
          await this.moduleConfigRepository.findByModuleIdAndConfigName(
            moduleId,
            data.configName,
            projectId,
          );

        if (conflictingConfig && conflictingConfig._id.toString() !== id) {
          throw new DatabaseValidationException(
            `Configuration with name '${data.configName}' already exists for this module${projectId ? ' and project' : ''}`,
          );
        }
      }

      const updatedConfig = await this.moduleConfigRepository.update(id, data);

      if (!updatedConfig) {
        logger.debug('Module config not found after update', { id });
        return null;
      }

      logger.info('Module config updated successfully', {
        id,
        configName: updatedConfig.configName,
      });
      return this.mapToResponseDto(updatedConfig);
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

  public async deleteModuleConfig(id: string): Promise<boolean> {
    try {
      logger.debug('Deleting module config', { id });

      const config = await this.moduleConfigRepository.findById(id);
      if (!config || config.isDeleted) {
        logger.debug('Module config not found for deletion', { id });
        return false;
      }

      const deleted = await this.moduleConfigRepository.delete(id);

      logger.info('Module config deleted successfully', {
        id,
        deleted,
      });
      return deleted;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to delete module config:', {
        error: err.message,
        stack: err.stack,
        id,
      });
      throw error;
    }
  }

  private mapToResponseDto(config: IModuleConfig): ModuleConfigResponseDto {
    // Handle populated moduleId field
    const moduleInfo = config.moduleId as unknown;
    let moduleName: string | undefined;

    if (moduleInfo && typeof moduleInfo === 'object' && 'name' in moduleInfo) {
      const module = moduleInfo as { name: string };
      moduleName = module.name;
    }

    // Handle populated projectId field
    const projectInfo = config.projectId as unknown;
    let projectId: string | undefined;
    let projectName: string | undefined;

    if (
      projectInfo &&
      typeof projectInfo === 'object' &&
      '_id' in projectInfo
    ) {
      const project = projectInfo as { _id: string; projectName?: string };
      projectId = project._id.toString();
      projectName = project.projectName;
    } else if (config.projectId) {
      projectId =
        typeof config.projectId === 'object' && config.projectId !== null
          ? (config.projectId as { _id: Types.ObjectId })._id.toString()
          : (config.projectId as unknown as string);
    }

    return {
      _id: config._id.toString(),
      moduleId:
        typeof config.moduleId === 'object' && config.moduleId._id
          ? config.moduleId._id.toString()
          : (config.moduleId as unknown as string),
      moduleName,
      projectId,
      projectName,
      configName: config.configName,
      description: config.description,
      fields: config.fields,
      metadata: config.metadata,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }
}
