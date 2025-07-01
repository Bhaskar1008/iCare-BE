import {
  ResourceCenterTagModel,
  type IResourceCenterTag,
} from '@/models/resource-center-tag.model';
import {
  ResourceCenterModel,
  type IResourceCenter,
} from '@/models/resource-center.model';
import {
  ResourceCenterDocumentModel,
  type IResourceCenterDocument,
} from '@/models/resource-center-document.model';
import type { CreateTagDto } from './dto/create-tag.dto';
import type { CreateResourceCenterDto } from './dto/create-resource-center.dto';
import type { UpdateResourceCenterDto } from './dto/update-resource-center.dto';
import type { CreateResourceCenterDocumentDto } from './dto/create-resource-center-document.dto';
import type { UpdateResourceCenterDocumentDto } from './dto/update-resource-center-document.dto';
import logger from '@/common/utils/logger';
import mongoose from 'mongoose';

export class ResourceCenterRepository {
  async createTag(data: CreateTagDto): Promise<IResourceCenterTag> {
    try {
      logger.debug('Creating resource center tag', { tagName: data.tagName });

      const tag = new ResourceCenterTagModel(data);

      return await tag.save();
    } catch (error) {
      logger.error('Failed to create resource center tag:', { error, data });
      throw error;
    }
  }

  async findTagByName(tagName: string): Promise<IResourceCenterTag | null> {
    try {
      logger.debug('Finding tag by name', { tagName });
      return await ResourceCenterTagModel.findOne({ tagName });
    } catch (error) {
      logger.error('Failed to find tag by name:', { error, tagName });
      throw error;
    }
  }

  async getAllTags(): Promise<IResourceCenterTag[]> {
    try {
      logger.debug('Fetching all resource center tags');
      return await ResourceCenterTagModel.find().sort({ createdAt: -1 });
    } catch (error) {
      logger.error('Failed to fetch all resource center tags:', { error });
      throw error;
    }
  }

  async findTagById(id: string): Promise<IResourceCenterTag | null> {
    try {
      logger.debug('Finding tag by ID', { id });
      return await ResourceCenterTagModel.findById(id);
    } catch (error) {
      logger.error('Failed to find tag by ID:', { error, id });
      throw error;
    }
  }

  // Resource Center methods
  async createResourceCenter(
    data: CreateResourceCenterDto,
  ): Promise<IResourceCenter> {
    try {
      logger.debug('Creating resource center', { title: data.title });

      // Normalize subCategory to uppercase
      const normalizedSubCategory = data.subCategory.map(category =>
        category.toUpperCase(),
      );

      const resourceCenter = new ResourceCenterModel({
        ...data,
        subCategory: normalizedSubCategory,
        channelId: data.channelId.map(channel => ({
          channelId: new mongoose.Types.ObjectId(channel.channelId),
          channelName: channel.channelName,
        })),
        resourceCategory: new mongoose.Types.ObjectId(data.resourceCategory),
        tags: data.tags.map(tag => ({
          tagName: tag.tagName,
          tagId: new mongoose.Types.ObjectId(tag.tagId),
        })),
        roles: data.roles.map(role => ({
          roleId: new mongoose.Types.ObjectId(role.roleId),
          roleName: role.roleName,
        })),
        updatedBy: data.updatedBy
          ? new mongoose.Types.ObjectId(data.updatedBy)
          : undefined,
        createdBy: data.createdBy
          ? new mongoose.Types.ObjectId(data.createdBy)
          : undefined,
        files: data.files ?? [],
      });

      return await resourceCenter.save();
    } catch (error) {
      logger.error('Failed to create resource center:', { error, data });
      throw error;
    }
  }

  async updateResourceCenter(
    id: string,
    data: UpdateResourceCenterDto,
  ): Promise<IResourceCenter | null> {
    try {
      logger.debug('Updating resource center', { id });

      const updateData: any = {
        ...data,
        updatedAt: new Date(),
      };

      if (data.channelId) {
        updateData.channelId = data.channelId.map(channel => ({
          channelId: new mongoose.Types.ObjectId(channel.channelId),
          channelName: channel.channelName,
        }));
      }

      if (data.resourceCategory) {
        updateData.resourceCategory = new mongoose.Types.ObjectId(
          data.resourceCategory,
        );
      }

      if (data.subCategory) {
        // Normalize subCategory to uppercase
        updateData.subCategory = data.subCategory.map(category =>
          category.toUpperCase(),
        );
      }

      if (data.tags) {
        updateData.tags = data.tags.map(tag => ({
          tagName: tag.tagName,
          tagId: new mongoose.Types.ObjectId(tag.tagId),
        }));
      }

      if (data.roles) {
        updateData.roles = data.roles.map(role => ({
          roleId: new mongoose.Types.ObjectId(role.roleId),
          roleName: role.roleName,
        }));
      }

      if (data.updatedBy) {
        updateData.updatedBy = new mongoose.Types.ObjectId(data.updatedBy);
      }

      // Handle files update: replace or update items by _id if provided
      if (data.files && Array.isArray(data.files) && data.files.length > 0) {
        // Fetch the current resource center document
        const resourceCenterDoc = await ResourceCenterModel.findById(id);
        if (resourceCenterDoc && Array.isArray(resourceCenterDoc.files)) {
          // Check if any file in the update has an _id
          const hasFileWithId = data.files.some(file => file._id);

          if (hasFileWithId) {
            // Update only files that have _id (existing files)
            for (const fileUpdate of data.files) {
              if (fileUpdate._id) {
                // Try to find the index of the file by _id
                const fileIndex = resourceCenterDoc.files.findIndex(
                  (file: any) => String(file._id) === String(fileUpdate._id),
                );
                if (fileIndex !== -1) {
                  // Update only if file exists
                  resourceCenterDoc.files[fileIndex] = {
                    ...resourceCenterDoc.files[fileIndex],
                    s3Key: fileUpdate.s3Key,
                    s3Link: fileUpdate.s3Link,
                    documentFormat: fileUpdate.documentFormat,
                    isActive: fileUpdate.isActive,
                  };
                }
              }
            }
          } else {
            // No files have _id, replace the entire files array
            resourceCenterDoc.files = data.files;
          }

          // Update all other fields on the document
          Object.assign(resourceCenterDoc, updateData);

          await resourceCenterDoc.save();
          // Return the updated document
          return resourceCenterDoc;
        } else {
          // If no existing document, fallback to default update
          updateData.files = data.files;
        }
      }

      return await ResourceCenterModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true },
      );
    } catch (error) {
      logger.error('Failed to update resource center:', { error, id, data });
      throw error;
    }
  }

  async getAllResourceCenters(): Promise<any[]> {
    try {
      logger.debug('Fetching all resource centers');
      const resourceCenters = await ResourceCenterModel.find().sort({
        createdAt: -1,
      });

      // Fetch documents for each resource center
      const resourceCentersWithDocuments = await Promise.all(
        resourceCenters.map(async resourceCenter => {
          const documents = await ResourceCenterDocumentModel.find({
            documentId: resourceCenter.documentId,
          });

          return {
            ...resourceCenter.toObject(),
            documents,
          };
        }),
      );

      return resourceCentersWithDocuments;
    } catch (error) {
      logger.error('Failed to fetch all resource centers:', { error });
      throw error;
    }
  }

  async getResourceCenterById(id: string): Promise<IResourceCenter | null> {
    try {
      logger.debug('Finding resource center by ID', { id });
      // Return the Mongoose document directly
      return await ResourceCenterModel.findById(id);
    } catch (error) {
      logger.error('Failed to find resource center by ID:', { error, id });
      throw error;
    }
  }

  async getResourceCentersByFilters(
    tag?: string,
    contentType?: string,
  ): Promise<any[]> {
    try {
      logger.debug('Fetching resource centers by filters', {
        tag,
        contentType,
      });

      const query: Record<string, any> = {};

      if (tag) {
        query['tags.tagName'] = tag;
      }

      const resourceCenters = await ResourceCenterModel.find(query).sort({
        createdAt: -1,
      });

      // If contentType is specified and not 'all', filter by subCategory
      let filteredResourceCenters = resourceCenters;
      if (contentType && contentType !== 'all') {
        filteredResourceCenters = resourceCenters.filter(rc =>
          rc.subCategory.some(
            category => category.toLowerCase() === contentType.toLowerCase(),
          ),
        );
      }

      // Fetch documents for each resource center
      const resourceCentersWithDocuments = await Promise.all(
        filteredResourceCenters.map(async resourceCenter => {
          const documents = await ResourceCenterDocumentModel.find({
            documentId: resourceCenter.documentId,
          });

          return {
            ...resourceCenter.toObject(),
            documents,
          };
        }),
      );

      return resourceCentersWithDocuments;
    } catch (error) {
      logger.error('Failed to fetch resource centers by filters:', {
        error,
        tag,
        contentType,
      });
      throw error;
    }
  }

  async getResourceCentersForAgents(
    tag?: string,
    contentType?: string,
    roleId?: string,
    channelId?: string,
    resourceCategory?: string,
    projectId?: string,
    skip: number = 0,
    limit: number = 10,
  ): Promise<{ data: any[]; total: number }> {
    try {
      logger.debug('Fetching resource centers for agents by filters', {
        tag,
        contentType,
        roleId,
        channelId,
        resourceCategory,
        projectId,
        skip,
        limit,
      });

      const query: Record<string, any> = {
        isActive: true,
        publish: 'publish',
      };

      if (tag) {
        query['tags.tagName'] = tag;
      }

      // Add roleId filter if provided
      if (roleId) {
        query['roles.roleId'] = new mongoose.Types.ObjectId(roleId);
      }

      // Add channelId filter if provided - check if channelId exists in the channelId array
      if (channelId) {
        query['channelId.channelId'] = new mongoose.Types.ObjectId(channelId);
      }

      // Add resourceCategory filter if provided
      if (resourceCategory) {
        query['resourceCategory'] = new mongoose.Types.ObjectId(
          resourceCategory,
        );
      }

      // Add projectId filter if provided
      if (projectId) {
        query['projectId'] = new mongoose.Types.ObjectId(projectId);
      }

      // Get total count first
      const total = await ResourceCenterModel.countDocuments(query);

      // Get paginated results
      const resourceCenters = await ResourceCenterModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // If contentType is specified and not 'all', filter by subCategory
      let filteredResourceCenters = resourceCenters;
      if (contentType && contentType !== 'all') {
        filteredResourceCenters = resourceCenters.filter(rc =>
          rc.subCategory.some(
            category => category.toLowerCase() === contentType.toLowerCase(),
          ),
        );
      }

      // Fetch documents for each resource center
      const resourceCentersWithDocuments = await Promise.all(
        filteredResourceCenters.map(async resourceCenter => {
          const documents = await ResourceCenterDocumentModel.find({
            documentId: resourceCenter.documentId,
          });

          return {
            ...resourceCenter.toObject(),
            documents,
          };
        }),
      );

      return {
        data: resourceCentersWithDocuments,
        total,
      };
    } catch (error) {
      logger.error('Failed to fetch resource centers for agents by filters:', {
        error,
        tag,
        contentType,
        roleId,
        channelId,
        resourceCategory,
        projectId,
        skip,
        limit,
      });
      throw error;
    }
  }

  // Resource Center Document methods
  async createResourceCenterDocument(
    data: CreateResourceCenterDocumentDto,
    s3Key: string,
    s3Link: string,
  ): Promise<IResourceCenterDocument> {
    try {
      logger.debug('Creating resource center document', {
        documentId: data.documentId,
      });

      const document = new ResourceCenterDocumentModel({
        ...data,
        documentId: data.documentId,
        s3Key,
        s3Link,
        updatedBy: data.updatedBy
          ? new mongoose.Types.ObjectId(data.updatedBy)
          : undefined,
        createdBy: data.createdBy
          ? new mongoose.Types.ObjectId(data.createdBy)
          : undefined,
      });

      return await document.save();
    } catch (error) {
      logger.error('Failed to create resource center document:', {
        error,
        data,
      });
      throw error;
    }
  }

  async updateResourceCenterDocument(
    id: string,
    data: UpdateResourceCenterDocumentDto,
    s3Key: string,
    s3Link: string,
  ): Promise<IResourceCenterDocument | null> {
    try {
      logger.debug('Updating resource center document', { id });

      const updateData: any = {
        ...data,
        s3Key,
        s3Link,
        updatedAt: new Date(),
      };

      if (data.updatedBy) {
        updateData.updatedBy = new mongoose.Types.ObjectId(data.updatedBy);
      }

      return await ResourceCenterDocumentModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true },
      );
    } catch (error) {
      logger.error('Failed to update resource center document:', {
        error,
        id,
        data,
      });
      throw error;
    }
  }

  async getResourceCenterWithDocuments(
    resourceCenterId: string,
    projectId?: string,
  ): Promise<any> {
    try {
      logger.debug('Fetching resource center with documents', {
        resourceCenterId,
        projectId,
      });

      const query: Record<string, any> = {
        _id: resourceCenterId,
      };

      // Add projectId filter if provided
      if (projectId) {
        query['projectId'] = new mongoose.Types.ObjectId(projectId);
      }

      const resourceCenter = await ResourceCenterModel.findOne(query);
      if (!resourceCenter) {
        return null;
      }

      const documents = await ResourceCenterDocumentModel.find({
        documentId: resourceCenter.documentId,
      });

      return {
        ...resourceCenter.toObject(),
        documents,
      };
    } catch (error) {
      logger.error('Failed to fetch resource center with documents:', {
        error,
        resourceCenterId,
        projectId,
      });
      throw error;
    }
  }
}
