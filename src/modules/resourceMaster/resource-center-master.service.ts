import { ResourceCenterMasterRepository } from './resource-center-master.repository';
import type { CreateResourceCenterMasterDto } from './dto/create-resource-center-master.dto';
import type { UpdateResourceCenterMasterDto } from './dto/update-resource-center-master.dto';
import type { IResourceCenterMaster } from '@/models/resource-center-master.model';
import type { IResourceCenterMasterService } from './interfaces/resource-center-master.interface';
import logger from '@/common/utils/logger';

export class ResourceCenterMasterService
  implements IResourceCenterMasterService
{
  private resourceCenterMasterRepository: ResourceCenterMasterRepository;

  constructor() {
    this.resourceCenterMasterRepository = new ResourceCenterMasterRepository();
  }

  async createResourceCenterMaster(
    data: CreateResourceCenterMasterDto,
  ): Promise<IResourceCenterMaster> {
    try {
      logger.debug('Creating resource center master', {
        resourceCategoryName: data.resourceCategoryName,
      });

      // Generate unique categoryId
      const categoryId = await this.generateCategoryId();

      // Create the data with generated categoryId
      const createData = {
        ...data,
        categoryId,
      };

      const resourceCenterMaster =
        await this.resourceCenterMasterRepository.createResourceCenterMaster(
          createData,
        );
      return resourceCenterMaster;
    } catch (error) {
      logger.error('Failed to create resource center master:', { error, data });
      throw error;
    }
  }

  async getAllResourceCenterMasters(): Promise<IResourceCenterMaster[]> {
    try {
      logger.debug('Fetching all resource center masters');
      const resourceCenterMasters =
        await this.resourceCenterMasterRepository.getAllResourceCenterMasters();
      return resourceCenterMasters;
    } catch (error) {
      logger.error('Failed to fetch all resource center masters:', { error });
      throw error;
    }
  }

  async updateResourceCenterMaster(
    id: string,
    data: UpdateResourceCenterMasterDto,
  ): Promise<IResourceCenterMaster | null> {
    try {
      logger.debug('Updating resource center master', { id });

      // If categoryId is being updated, check if it already exists
      if (data.categoryId) {
        const categoryIdExists =
          await this.resourceCenterMasterRepository.findCategoryIdExists(
            data.categoryId,
          );
        if (categoryIdExists) {
          throw new Error(`Category ID '${data.categoryId}' already exists`);
        }
      }

      const resourceCenterMaster =
        await this.resourceCenterMasterRepository.updateResourceCenterMaster(
          id,
          data,
        );
      return resourceCenterMaster;
    } catch (error) {
      logger.error('Failed to update resource center master:', {
        error,
        id,
        data,
      });
      throw error;
    }
  }

  async generateCategoryId(): Promise<string> {
    try {
      logger.debug('Generating category ID');

      let categoryId: string;
      let attempts = 0;
      const maxAttempts = 10;

      do {
        // Generate 4 random digits
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        categoryId = `RCMAS${randomDigits}`;
        attempts++;

        if (attempts > maxAttempts) {
          throw new Error(
            'Failed to generate unique category ID after maximum attempts',
          );
        }
      } while (
        await this.resourceCenterMasterRepository.findCategoryIdExists(
          categoryId,
        )
      );

      logger.debug('Generated unique category ID', { categoryId });
      return categoryId;
    } catch (error) {
      logger.error('Failed to generate category ID:', { error });
      throw error;
    }
  }
}
