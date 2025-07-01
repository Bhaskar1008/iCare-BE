import {
  createActivityTrackerModule,
  seedModuleConfigurations,
} from './seed-configs';
import logger from '@/common/utils/logger';

export async function seedModuleConfigData(): Promise<void> {
  try {
    logger.info('Starting module and configuration seeding process...');

    // First create the Activity Tracker module if it doesn't exist
    const moduleId = await createActivityTrackerModule();

    if (!moduleId) {
      logger.warn(
        'Failed to create Activity Tracker module, skipping config seeding',
      );
      return;
    }

    // Then seed the configurations
    await seedModuleConfigurations();

    logger.info('Module and configuration seeding completed successfully');
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to seed module and configuration data:', {
      error: err.message,
      stack: err.stack,
    });
  }
}
