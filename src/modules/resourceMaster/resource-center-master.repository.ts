import { BaseRepository } from '@/repository/base.repository';
import {
  ResourceCenterMasterModel,
  type IResourceCenterMaster,
} from '@/models/resource-center-master.model';
import type { CreateResourceCenterMasterDto } from './dto/create-resource-center-master.dto';
import type { UpdateResourceCenterMasterDto } from './dto/update-resource-center-master.dto';
import type { IResourceCenterMasterRepository } from './interfaces/resource-center-master.interface';
import logger from '@/common/utils/logger';
import mongoose from 'mongoose';

export class ResourceCenterMasterRepository
  extends BaseRepository<IResourceCenterMaster>
  implements IResourceCenterMasterRepository
{
  constructor() {
    super(ResourceCenterMasterModel);
  }

  async createResourceCenterMaster(
    data: CreateResourceCenterMasterDto & { categoryId: string },
  ): Promise<IResourceCenterMaster> {
    try {
      logger.debug('Creating resource center master', {
        categoryId: data.categoryId,
      });

      const resourceCenterMaster = new ResourceCenterMasterModel({
        ...data,
        createdAt: new Date(),
        createdBy: data.createdBy
          ? new mongoose.Types.ObjectId(data.createdBy)
          : undefined,
      });

      return await resourceCenterMaster.save();
    } catch (error) {
      logger.error('Failed to create resource center master:', { error, data });
      throw error;
    }
  }

  async getAllResourceCenterMasters(): Promise<IResourceCenterMaster[]> {
    try {
      logger.debug('Fetching all resource center masters');
      return await ResourceCenterMasterModel.find({ isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .exec();
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

      const updateData: any = {
        ...data,
        updatedAt: new Date(),
      };

      if (data.updatedBy) {
        updateData.updatedBy = new mongoose.Types.ObjectId(data.updatedBy);
      }

      return await ResourceCenterMasterModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true },
      );
    } catch (error) {
      logger.error('Failed to update resource center master:', {
        error,
        id,
        data,
      });
      throw error;
    }
  }

  async findCategoryIdExists(categoryId: string): Promise<boolean> {
    try {
      logger.debug('Checking if category ID exists', { categoryId });
      const existing = await ResourceCenterMasterModel.findOne({
        categoryId: { $regex: new RegExp(`^${categoryId}$`) },
        isDeleted: { $ne: true },
      });
      return !!existing;
    } catch (error) {
      logger.error('Failed to check category ID existence:', {
        error,
        categoryId,
      });
      throw error;
    }
  }
}
