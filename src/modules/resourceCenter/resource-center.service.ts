import { ResourceCenterRepository } from './resource-center.repository';
import type { CreateTagDto } from './dto/create-tag.dto';
import type { TagResponseDto } from './dto/tag-response.dto';
import type { CreateResourceCenterDto } from './dto/create-resource-center.dto';
import type { UpdateResourceCenterDto } from './dto/update-resource-center.dto';
import type { CreateResourceCenterDocumentDto } from './dto/create-resource-center-document.dto';
import type { UpdateResourceCenterDocumentDto } from './dto/update-resource-center-document.dto';
import type { IResourceCenterTag } from '@/models/resource-center-tag.model';
import type { IResourceCenter } from '@/models/resource-center.model';
import type { IResourceCenterDocument } from '@/models/resource-center-document.model';
import logger from '@/common/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DuplicateResourceException } from '@/common/exceptions/duplicate-resource.exception';
import { ResourceCenterEmailTemplates } from '@/emailTemplates/resource-center.templates';

export class ResourceCenterService {
  private resourceCenterRepository: ResourceCenterRepository;
  private s3Client: S3Client;

  constructor() {
    this.resourceCenterRepository = new ResourceCenterRepository();
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION ?? 'ap-southeast-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
      },
      endpoint: 'https://s3.ap-southeast-1.amazonaws.com',
      forcePathStyle: false,
    });
  }

  async createTag(data: CreateTagDto): Promise<TagResponseDto> {
    try {
      logger.debug('Creating resource center tag', { tagName: data.tagName });

      // Validate input
      if (!data.tagName || typeof data.tagName !== 'string') {
        throw new Error('Tag name is required and must be a string');
      }

      // Trim whitespace and validate
      const trimmedTagName = data.tagName.trim();
      if (trimmedTagName.length === 0) {
        throw new Error('Tag name cannot be empty');
      }

      // Check for duplicate tag name with exact case-sensitive matching
      const existingTag =
        await this.resourceCenterRepository.findTagByName(trimmedTagName);

      if (existingTag) {
        // Create a custom error with specific message and status code
        throw new DuplicateResourceException(
          `Tag with name '${trimmedTagName}' already exists`,
        );
      }

      // Create tag with trimmed name
      const tagData = { ...data, tagName: trimmedTagName };
      const tag = await this.resourceCenterRepository.createTag(tagData);
      return this.mapToResponseDto(tag);
    } catch (error) {
      logger.error('Failed to create resource center tag:', { error, data });
      throw error;
    }
  }

  async getAllTags(): Promise<TagResponseDto[]> {
    try {
      logger.debug('Fetching all resource center tags');
      const tags = await this.resourceCenterRepository.getAllTags();
      return tags.map(tag => this.mapToResponseDto(tag));
    } catch (error) {
      logger.error('Failed to fetch all resource center tags:', { error });
      throw error;
    }
  }

  async getTagById(id: string): Promise<TagResponseDto | null> {
    try {
      logger.debug('Fetching resource center tag by ID', { id });
      const tag = await this.resourceCenterRepository.findTagById(id);
      return tag ? this.mapToResponseDto(tag) : null;
    } catch (error) {
      logger.error('Failed to fetch resource center tag by ID:', { error, id });
      throw error;
    }
  }

  // Resource Center methods
  async createResourceCenter(
    data: CreateResourceCenterDto,
  ): Promise<IResourceCenter> {
    try {
      logger.debug('Creating resource center', { title: data.title });

      // Generate UUID for documentId if not provided
      data.documentId ??= uuidv4();

      const resourceCenter =
        await this.resourceCenterRepository.createResourceCenter(data);
      return resourceCenter;
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
      const resourceCenter =
        await this.resourceCenterRepository.updateResourceCenter(id, data);
      return resourceCenter;
    } catch (error) {
      logger.error('Failed to update resource center:', { error, id, data });
      throw error;
    }
  }

  async getAllResourceCenters(): Promise<any[]> {
    try {
      logger.debug('Fetching all resource centers');
      const resourceCenters =
        await this.resourceCenterRepository.getAllResourceCenters();
      return resourceCenters;
    } catch (error) {
      logger.error('Failed to fetch all resource centers:', { error });
      throw error;
    }
  }

  async getResourceCenterById(id: string): Promise<any> {
    try {
      logger.debug('Fetching resource center by ID', { id });
      const resourceCenter =
        await this.resourceCenterRepository.getResourceCenterById(id);
      return resourceCenter;
    } catch (error) {
      logger.error('Failed to fetch resource center by ID:', { error, id });
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
      const resourceCenters =
        await this.resourceCenterRepository.getResourceCentersByFilters(
          tag,
          contentType,
        );
      return resourceCenters;
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
      const result =
        await this.resourceCenterRepository.getResourceCentersForAgents(
          tag,
          contentType,
          roleId,
          channelId,
          resourceCategory,
          projectId,
          skip,
          limit,
        );
      return result;
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

  // S3 Upload method
  private async uploadFileToS3(
    file: Express.Multer.File,
  ): Promise<{ s3Key: string; s3Link: string }> {
    try {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'video/mp4',
      ];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new Error(
          'Invalid file type. Only PDF, PNG, JPG, and MP4 are allowed',
        );
      }

      // Get file extension
      const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
      if (!fileExtension) {
        throw new Error('Invalid file name');
      }

      // Generate unique s3Key
      const uniqueId = uuidv4();
      const s3Key = `${uniqueId}.${fileExtension}`;

      // Check if bucket name is configured
      const bucketName = process.env.AWS_S3_BUCKET;
      if (!bucketName) {
        throw new Error('AWS_S3_BUCKET environment variable is not configured');
      }

      // Log S3 configuration for debugging
      logger.debug('S3 Configuration', {
        bucketName,
        region: process.env.AWS_REGION,
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
        endpoint: this.s3Client.config.endpoint?.toString(),
      });

      logger.debug('Attempting S3 upload', {
        bucketName,
        s3Key,
        fileSize: file.size,
        contentType: file.mimetype,
      });

      // Upload to S3
      const uploadParams = {
        Bucket: bucketName,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      try {
        await this.s3Client.send(new PutObjectCommand(uploadParams));
        logger.debug('File uploaded to S3 successfully', { s3Key, bucketName });
      } catch (error) {
        logger.error('Failed to upload file to S3:', {
          error,
          s3Key,
          bucketName,
          region: process.env.AWS_REGION,
          hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
          hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
        });
        throw new Error(
          `Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }

      // Construct the S3 URL
      const s3Link = `https://${bucketName}.s3.ap-southeast-1.amazonaws.com/${s3Key}`;

      return { s3Key, s3Link };
    } catch (error) {
      logger.error('Failed to upload file to S3:', { error });
      throw error;
    }
  }

  // Resource Center Document methods
  async createResourceCenterDocument(
    data: CreateResourceCenterDocumentDto,
    file: Express.Multer.File,
  ): Promise<IResourceCenterDocument> {
    try {
      logger.debug('Creating resource center document', {
        resourceCenterId: data.documentId,
      });

      // Get the documentId from the resource center
      if (!data.documentId) {
        throw new Error(
          'documentId is required to create a resource center document',
        );
      }

      const resourceCenter =
        await this.resourceCenterRepository.getResourceCenterById(
          data.documentId,
        );
      if (!resourceCenter) {
        throw new Error('Resource center not found');
      }

      const documentId = resourceCenter.documentId;

      // Handle documentType - convert to array if it's a single value
      let documentTypeArray: string[];
      if (Array.isArray(data.documentType)) {
        documentTypeArray = data.documentType;
      } else if (typeof data.documentType === 'string') {
        documentTypeArray = [data.documentType];
      } else {
        throw new Error(
          'documentType is required and must be a string or array',
        );
      }

      // Normalize documentType to uppercase
      const normalizedDocumentType = documentTypeArray.map(type =>
        type.toUpperCase(),
      );

      // Validate document types
      const allowedTypes = ['VIDEOS', 'PDF', 'ARTICLE', 'INFOGRAPHICS'];
      for (const type of normalizedDocumentType) {
        if (!allowedTypes.includes(type)) {
          throw new Error(
            `Invalid document type: ${type}. Allowed types are: ${allowedTypes.join(', ')}`,
          );
        }
      }

      // Extract documentFormat from file extension
      const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
      if (!fileExtension) {
        throw new Error('Invalid file name - no extension found');
      }

      // Validate documentFormat
      const allowedFormats = ['pdf', 'png', 'jpg', 'mp4'];
      if (!allowedFormats.includes(fileExtension)) {
        throw new Error(
          `Invalid file format: ${fileExtension}. Allowed formats are: ${allowedFormats.join(', ')}`,
        );
      }

      // Create updated data with normalized documentType and extracted documentFormat
      const updatedData = {
        ...data,
        documentId, // Use the documentId from resource center
        documentType: normalizedDocumentType,
        documentFormat: fileExtension,
      };

      // Upload file to S3
      const { s3Key, s3Link } = await this.uploadFileToS3(file);

      const document =
        await this.resourceCenterRepository.createResourceCenterDocument(
          updatedData,
          s3Key,
          s3Link,
        );
      return document;
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
    file: Express.Multer.File,
  ): Promise<IResourceCenterDocument | null> {
    try {
      logger.debug('Updating resource center document', { id });

      // Normalize documentType to uppercase if provided
      const updatedData = { ...data };
      if (data.documentType) {
        // Handle documentType - convert to array if it's a single value
        let documentTypeArray: string[];
        if (Array.isArray(data.documentType)) {
          documentTypeArray = data.documentType;
        } else if (typeof data.documentType === 'string') {
          documentTypeArray = [data.documentType];
        } else {
          throw new Error('documentType must be a string or array');
        }

        const normalizedDocumentType = documentTypeArray.map(type =>
          type.toUpperCase(),
        );

        // Validate document types
        const allowedTypes = ['VIDEOS', 'PDF', 'ARTICLE', 'INFOGRAPHICS'];
        for (const type of normalizedDocumentType) {
          if (!allowedTypes.includes(type)) {
            throw new Error(
              `Invalid document type: ${type}. Allowed types are: ${allowedTypes.join(', ')}`,
            );
          }
        }

        updatedData.documentType = normalizedDocumentType;
      }

      // Extract documentFormat from file extension
      const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
      if (!fileExtension) {
        throw new Error('Invalid file name - no extension found');
      }

      // Validate documentFormat
      const allowedFormats = ['pdf', 'png', 'jpg', 'mp4'];
      if (!allowedFormats.includes(fileExtension)) {
        throw new Error(
          `Invalid file format: ${fileExtension}. Allowed formats are: ${allowedFormats.join(', ')}`,
        );
      }

      updatedData.documentFormat = fileExtension;

      // Upload new file to S3
      const { s3Key, s3Link } = await this.uploadFileToS3(file);

      const document =
        await this.resourceCenterRepository.updateResourceCenterDocument(
          id,
          updatedData,
          s3Key,
          s3Link,
        );
      return document;
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
      const resourceCenter =
        await this.resourceCenterRepository.getResourceCenterWithDocuments(
          resourceCenterId,
          projectId,
        );
      return resourceCenter;
    } catch (error) {
      logger.error('Failed to fetch resource center with documents:', {
        error,
        resourceCenterId,
        projectId,
      });
      throw error;
    }
  }

  async sendShareableLink(emails: string[], link: string): Promise<void> {
    try {
      logger.debug('Sending shareable link emails', {
        emailsCount: emails.length,
        link,
      });

      // Await the email sending so this method is truly async
      await ResourceCenterEmailTemplates.sendShareableLinkEmail(emails, link);
      logger.info('Resource center shareable link emails sent successfully', {
        emailsCount: emails.length,
        link,
      });
    } catch (error) {
      logger.error('Failed to send resource center shareable link emails:', {
        error,
        emails,
        link,
      });
      throw error;
    }
  }

  private mapToResponseDto(tag: IResourceCenterTag): TagResponseDto {
    return {
      _id: (tag._id as string).toString(),
      tagName: tag.tagName,
      updatedBy: tag.updatedBy,
      updatedAt: tag.updatedAt,
      createdBy: tag.createdBy,
      createdAt: tag.createdAt,
    };
  }
}
