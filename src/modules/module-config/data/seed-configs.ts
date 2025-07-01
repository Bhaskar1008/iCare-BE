import { ModuleModel } from '@/models/module.model';
import { ModuleConfigModel } from '@/models/module-config.model';
import { ProjectModel } from '@/models/project.model';
import { activityTrackerConfig } from './activity-tracker-config';
import type { Types } from 'mongoose';
import logger from '@/common/utils/logger';

export async function seedModuleConfigurations(): Promise<void> {
  try {
    logger.info('Starting module configuration seeding...');

    // Find the Activity Tracker module
    const activityTrackerModule = await ModuleModel.findOne({
      code: 'ACTIVITY_TRACKER',
    });

    if (!activityTrackerModule) {
      logger.warn('Activity Tracker module not found, skipping config seeding');
      return;
    }

    // Get all active projects
    const projects = await ProjectModel.find({
      projectStatus: 'active',
      isDeleted: false,
    });

    if (projects.length === 0) {
      logger.info(
        'No active projects found, creating global configuration only',
      );

      // Check if global config already exists
      const existingGlobalConfig = await ModuleConfigModel.findOne({
        moduleId: activityTrackerModule._id,
        projectId: { $exists: false },
        configName: activityTrackerConfig.configName,
      });

      if (!existingGlobalConfig) {
        // Create global configuration (without project ID)
        const globalConfigData = {
          ...activityTrackerConfig,
          moduleId: activityTrackerModule._id,
        };

        await ModuleConfigModel.create(globalConfigData);
        logger.info(
          'Global Activity Tracker configuration seeded successfully',
        );
      } else {
        logger.info(
          'Global Activity Tracker configuration already exists, skipping',
        );
      }
    } else {
      logger.info(
        `Found ${projects.length} active projects, creating configurations...`,
      );

      // Create configurations for each project
      for (const project of projects) {
        // Check if config already exists for this project
        const existingConfig = await ModuleConfigModel.findOne({
          moduleId: activityTrackerModule._id,
          projectId: project._id,
          configName: activityTrackerConfig.configName,
        });

        if (!existingConfig) {
          // Create project-specific configuration
          const configData = {
            ...activityTrackerConfig,
            moduleId: activityTrackerModule._id,
            projectId: project._id,
          };

          await ModuleConfigModel.create(configData);
          logger.info(
            `Activity Tracker configuration seeded for project ${project.projectName}`,
          );
        } else {
          logger.info(
            `Activity Tracker configuration already exists for project ${project.projectName}, skipping`,
          );
        }
      }
    }

    logger.info('Module configuration seeding completed');
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to seed module configurations:', {
      error: err.message,
      stack: err.stack,
    });
    throw err;
  }
}

export async function createActivityTrackerModule(): Promise<Types.ObjectId | null> {
  try {
    // Check if module already exists
    const existingModule = await ModuleModel.findOne({
      code: 'ACTIVITY_TRACKER',
    });

    if (existingModule) {
      logger.info('Activity Tracker module already exists');
      return existingModule._id as unknown as Types.ObjectId;
    }

    // Create the module
    const module = await ModuleModel.create({
      name: 'Activity Tracker',
      code: 'ACTIVITY_TRACKER',
      description: 'Track activities like meetings, calls, emails, and visits',
      defaultConfig: {},
      isActive: true,
      isCore: true,
      version: '1.0.0',
      permissions: [
        'activity.view',
        'activity.create',
        'activity.edit',
        'activity.delete',
      ],
    });

    logger.info('Activity Tracker module created successfully', {
      id: module._id,
    });
    return module._id as unknown as Types.ObjectId;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to create Activity Tracker module:', {
      error: err.message,
      stack: err.stack,
    });
    return null;
  }
}
