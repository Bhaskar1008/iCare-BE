import { ModuleConfigModel } from '@/models/module-config.model';
import type { IModuleConfig } from '@/models/module-config.model';
import logger from '@/common/utils/logger';
import { Types } from 'mongoose';

interface DispositionSubEntry {
  name: string;
  bucket: string;
}

interface DispositionEntry {
  name: string;
  subDispositions: DispositionSubEntry[];
}

interface ProgressValue {
  dispositions: DispositionEntry[];
  displayName: string;
  values: ProgressValue[];
}

interface LeadProgressField {
  fieldName: string;
  values: ProgressValue[];
}

export class LeadStatusService {
  /**
   * Determines the lead status bucket based on progress, disposition, and subDisposition
   * by looking up the configuration in the module config
   */
  public async determineLeadStatus(
    projectId: string,
    moduleId: string,
    progress: string,
    disposition?: string,
    subDisposition?: string,
  ): Promise<string | null> {
    try {
      logger.debug('Determining lead status', {
        projectId,
        moduleId,
        progress,
        disposition,
        subDisposition,
      });

      // Fetch the module configuration
      const config = await this.getModuleConfig(projectId, moduleId);
      if (!config) {
        logger.warn('Module configuration not found', { projectId, moduleId });
        return null;
      }

      // Find the leadProgressDisposition field in the configuration
      const leadProgressField = this.findLeadProgressField(config);
      if (!leadProgressField) {
        logger.warn(
          'leadProgressDisposition field not found in module config',
          {
            configName: config.configName,
          },
        );
        return null;
      }

      // Find the matching progress value
      const progressValue = this.findMatchingProgressValue(
        leadProgressField,
        progress,
      );
      if (!progressValue) {
        logger.warn('No matching progress value found', { progress });
        return null;
      }

      // Find the matching disposition and subDisposition
      const bucket = this.findMatchingDispositionBucket(
        progressValue,
        disposition,
        subDisposition,
      );

      logger.debug('Lead status determination result', {
        progress,
        disposition,
        subDisposition,
        bucket,
      });

      return bucket;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error determining lead status:', {
        error: err.message,
        stack: err.stack,
        projectId,
        moduleId,
        progress,
        disposition,
        subDisposition,
      });
      return null;
    }
  }

  /**
   * Fetches the module configuration from the database
   */
  private async getModuleConfig(
    projectId: string,
    moduleId: string,
  ): Promise<IModuleConfig | null> {
    try {
      // Try to find project-specific configuration first
      let config = await ModuleConfigModel.findOne({
        projectId: new Types.ObjectId(projectId),
        moduleId: new Types.ObjectId(moduleId),
        isDeleted: false,
      });

      // If no project-specific config, try to find global config for this module
      config ??= await ModuleConfigModel.findOne({
        moduleId: new Types.ObjectId(moduleId),
        projectId: { $exists: false },
        isDeleted: false,
      });

      return config;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error fetching module config:', {
        error: err.message,
        stack: err.stack,
        projectId,
        moduleId,
      });
      return null;
    }
  }

  /**
   * Finds the leadProgressDisposition field in the module configuration
   */
  private findLeadProgressField(
    config: IModuleConfig,
  ): LeadProgressField | null {
    return (
      config.fields.find(
        field => field.fieldName === 'leadProgressDisposition',
      ) ?? null
    );
  }

  /**
   * Finds the matching progress value in the leadProgressDisposition field
   */
  private findMatchingProgressValue(
    leadProgressField: LeadProgressField,
    progress: string,
  ): ProgressValue | null {
    // Look for a value where displayName matches the progress
    return (
      leadProgressField.values.find(value => value.displayName === progress) ??
      null
    );
  }

  /**
   * Finds the matching disposition and subDisposition in the progress value's dispositions array
   */
  private findMatchingDispositionBucket(
    progressValue: ProgressValue,
    disposition?: string,
    subDisposition?: string,
  ): string | null {
    // If no disposition provided, return null
    if (!disposition) {
      return null;
    }

    // Check if dispositions exists and is an array
    if (!Array.isArray(progressValue.dispositions)) {
      return null;
    }

    // Find the matching disposition entry
    const matchingDisposition = progressValue.dispositions.find(
      entry => entry.name === disposition,
    );

    if (!matchingDisposition) {
      logger.warn('No matching disposition found', { disposition });
      return null;
    }

    // Check if subDispositions exists and is an array
    if (!Array.isArray(matchingDisposition.subDispositions)) {
      return null;
    }

    // Find the matching subDisposition entry
    const matchingSubDisposition = matchingDisposition.subDispositions.find(
      entry => {
        if (subDisposition) {
          return entry.name === subDisposition;
        }
        // If no subDisposition provided, match the first entry or empty name
        return !entry.name || entry.name === '';
      },
    );

    if (!matchingSubDisposition) {
      logger.warn('No matching subDisposition found', { subDisposition });
      return null;
    }

    // Return the bucket
    return matchingSubDisposition.bucket ?? null;
  }
}
