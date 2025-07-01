import type { Request, Response } from 'express';
import { ResourceCenterService } from './resource-center.service';
import type { CreateTagDto } from './dto/create-tag.dto';
import type { CreateResourceCenterDto } from './dto/create-resource-center.dto';
import type { UpdateResourceCenterDto } from './dto/update-resource-center.dto';
import type { CreateResourceCenterDocumentDto } from './dto/create-resource-center-document.dto';
import type { UpdateResourceCenterDocumentDto } from './dto/update-resource-center-document.dto';
import type { ResourceCenterShareableLinkDto } from './dto/shareable-link.dto';
import { HTTP_STATUS } from '@/common/constants/http-status.constants';
import { BaseController } from '@/controllers/base.controller';
import logger from '@/common/utils/logger';
import { DuplicateResourceException } from '@/common/exceptions/duplicate-resource.exception';

interface ErrorWithMessage {
  message: string;
}

export class ResourceCenterController extends BaseController {
  private resourceCenterService: ResourceCenterService;

  constructor() {
    super();
    this.resourceCenterService = new ResourceCenterService();
  }

  async createTag(req: Request<unknown, unknown, CreateTagDto>, res: Response) {
    try {
      logger.debug('Creating resource center tag', {
        tagName: req.body.tagName,
      });

      const tag = await this.resourceCenterService.createTag(req.body);
      this.sendCreated(res, tag, 'Tag created successfully');
    } catch (error) {
      const err = error as ErrorWithMessage & {
        statusCode?: number;
        isDuplicateError?: boolean;
      };
      logger.error('Failed to create resource center tag:', {
        error: err.message,
        body: req.body,
      });

      // Handle duplicate tag error specifically
      if (
        error instanceof DuplicateResourceException ||
        err.isDuplicateError ||
        err.message.includes('already exists')
      ) {
        this.sendError(res, err.message, HTTP_STATUS.CONFLICT, err);
        return;
      }

      // Handle validation errors
      if (
        err.message.includes('required') ||
        err.message.includes('cannot be empty')
      ) {
        this.sendError(res, err.message, HTTP_STATUS.BAD_REQUEST, err);
        return;
      }

      this.sendError(
        res,
        'Failed to create tag.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  async getAllTags(req: Request, res: Response) {
    try {
      logger.debug('Fetching all resource center tags');

      const tags = await this.resourceCenterService.getAllTags();
      this.sendSuccess(res, tags, 'Successfully fetched all tags.');
    } catch (error) {
      const err = error as ErrorWithMessage;
      logger.error('Failed to fetch resource center tags:', {
        error: err.message,
      });
      this.sendError(
        res,
        'Failed to fetch tags.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  async getTagById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      logger.debug('Fetching resource center tag by ID', { id });

      const tag = await this.resourceCenterService.getTagById(id);

      if (!tag) {
        this.sendNotFound(res, 'Tag not found');
        return;
      }

      this.sendSuccess(res, tag, 'Successfully fetched tag.');
    } catch (error) {
      const err = error as ErrorWithMessage;
      logger.error('Failed to fetch resource center tag by ID:', {
        error: err.message,
        id: req.params.id,
      });
      this.sendError(
        res,
        'Failed to fetch tag.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  // Resource Center methods
  async createResourceCenter(
    req: Request<unknown, unknown, CreateResourceCenterDto>,
    res: Response,
  ) {
    try {
      logger.debug('Creating resource center', {
        title: req.body.title,
      });

      // Extract projectId from current user header
      const currentUserHeader = req.headers.currentuser as string;
      if (currentUserHeader) {
        const currentUser = JSON.parse(currentUserHeader);
        if (currentUser.projectId) {
          req.body.projectId = currentUser.projectId;
        }
      }

      const resourceCenter =
        await this.resourceCenterService.createResourceCenter(req.body);
      this.sendCreated(
        res,
        resourceCenter,
        'Resource center created successfully',
      );
    } catch (error) {
      const err = error as ErrorWithMessage;
      logger.error('Failed to create resource center:', {
        error: err.message,
        body: req.body,
      });

      this.sendError(
        res,
        'Failed to create resource center.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  async updateResourceCenter(
    req: Request<
      { resourceCenterId: string },
      unknown,
      UpdateResourceCenterDto
    >,
    res: Response,
  ) {
    try {
      const { resourceCenterId } = req.params;
      logger.debug('Updating resource center', { resourceCenterId });

      // Extract projectId from current user header
      const currentUserHeader = req.headers.currentuser as string;
      if (currentUserHeader) {
        const currentUser = JSON.parse(currentUserHeader);
        if (currentUser.projectId) {
          req.body.projectId = currentUser.projectId;
        }
      }

      // Handle file uploads if present
      let filesArray = req.body.files;
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        // Upload each file to S3 and build the files array
        const uploadedFiles = await Promise.all(
          req.files.map(async file => {
            const { s3Key, s3Link } =
              await this.resourceCenterService['uploadFileToS3'](file);
            const fileExtension =
              file.originalname.split('.').pop()?.toLowerCase() ?? '';
            return {
              s3Key,
              s3Link,
              documentFormat: fileExtension,
              isActive: true,
            };
          }),
        );
        // If files were also sent as JSON metadata, merge them
        if (Array.isArray(filesArray) && filesArray.length > 0) {
          filesArray = [...filesArray, ...uploadedFiles];
        } else {
          filesArray = uploadedFiles;
        }
      }

      // Only set files array if it was provided or uploaded
      if (filesArray !== undefined) {
        req.body.files = filesArray;
      }
      const resourceCenter =
        await this.resourceCenterService.updateResourceCenter(
          resourceCenterId,
          req.body,
        );

      if (!resourceCenter) {
        this.sendNotFound(res, 'Resource center not found');
        return;
      }

      this.sendUpdated(
        res,
        resourceCenter,
        'Resource center updated successfully',
      );
    } catch (error) {
      const err = error as ErrorWithMessage;
      logger.error('Failed to update resource center:', {
        error: err.message,
        resourceCenterId: req.params.resourceCenterId,
        body: req.body,
      });

      this.sendError(
        res,
        'Failed to update resource center.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  async getAllResourceCenters(req: Request, res: Response) {
    try {
      logger.debug('Fetching all resource centers');

      const resourceCenters =
        await this.resourceCenterService.getAllResourceCenters();
      this.sendSuccess(
        res,
        resourceCenters,
        'Successfully fetched all resource centers.',
      );
    } catch (error) {
      const err = error as ErrorWithMessage;
      logger.error('Failed to fetch resource centers:', {
        error: err.message,
      });
      this.sendError(
        res,
        'Failed to fetch resource centers.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  async getResourceCentersByFilters(req: Request, res: Response) {
    try {
      const { tag, contentType } = req.query;
      logger.debug('Fetching resource centers by filters', {
        tag,
        contentType,
      });

      const resourceCenters =
        await this.resourceCenterService.getResourceCentersByFilters(
          tag as string,
          contentType as string,
        );

      this.sendSuccess(
        res,
        resourceCenters,
        'Successfully fetched filtered resource centers.',
      );
    } catch (error) {
      const err = error as ErrorWithMessage;
      logger.error('Failed to fetch filtered resource centers:', {
        error: err.message,
        query: req.query,
      });
      this.sendError(
        res,
        'Failed to fetch filtered resource centers.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  async getResourceCentersForAgents(req: Request, res: Response) {
    try {
      const { tag, contentType, resourceCategory, skip, limit } = req.query;

      // Extract roleId, channelId, and projectId from current user header
      let roleId: string | undefined;
      let channelId: string | undefined;
      let projectId: string | undefined;
      try {
        const currentUserHeader = req.headers.currentuser as string;
        if (currentUserHeader) {
          const currentUser = JSON.parse(currentUserHeader);
          roleId = currentUser.roleId;
          channelId = currentUser.channelId;
          projectId = currentUser.projectId;
        }
      } catch (error) {
        logger.warn('Failed to parse current user header:', error);
      }

      // Parse pagination parameters with defaults
      const skipValue = parseInt(skip as string) || 0;
      const limitValue = parseInt(limit as string) || 10;

      logger.debug('Fetching resource centers for agents by filters', {
        tag,
        contentType,
        resourceCategory,
        roleId,
        channelId,
        projectId,
        skip: skipValue,
        limit: limitValue,
      });

      const result =
        await this.resourceCenterService.getResourceCentersForAgents(
          tag as string,
          contentType as string,
          roleId,
          channelId,
          resourceCategory as string,
          projectId,
          skipValue,
          limitValue,
        );

      this.sendSuccess(
        res,
        {
          data: result.data,
          total: result.total,
          skip: skipValue,
          limit: limitValue,
        },
        'Successfully fetched filtered resource centers for agents.',
      );
    } catch (error) {
      const err = error as ErrorWithMessage;
      logger.error('Failed to fetch filtered resource centers for agents:', {
        error: err.message,
        query: req.query,
      });
      this.sendError(
        res,
        'Failed to fetch filtered resource centers for agents.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  async getResourceCenterWithDocuments(req: Request, res: Response) {
    try {
      const { resourceCenterId } = req.params;
      logger.debug('Fetching resource center with documents', {
        resourceCenterId,
      });

      // Extract projectId from current user header
      let projectId: string | undefined;
      try {
        const currentUserHeader = req.headers.currentuser as string;
        if (currentUserHeader) {
          const currentUser = JSON.parse(currentUserHeader);
          projectId = currentUser.projectId;
        }
      } catch (error) {
        logger.warn('Failed to parse current user header:', error);
      }

      const result =
        await this.resourceCenterService.getResourceCenterWithDocuments(
          resourceCenterId,
          projectId,
        );

      if (!result) {
        this.sendNotFound(res, 'Resource center not found');
        return;
      }

      this.sendSuccess(
        res,
        result,
        'Successfully fetched resource center with documents.',
      );
    } catch (error) {
      const err = error as ErrorWithMessage;
      logger.error('Failed to fetch resource center with documents:', {
        error: err.message,
        resourceCenterId: req.params.resourceCenterId,
      });
      this.sendError(
        res,
        'Failed to fetch resource center with documents.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  // Resource Center Document methods
  async createResourceCenterDocument(
    req: Request<unknown, unknown, CreateResourceCenterDocumentDto>,
    res: Response,
  ) {
    try {
      logger.debug('Creating resource center document', {
        documentId: req.body.documentId,
      });

      // Check if file is uploaded
      if (!req.file) {
        this.sendBadRequest(res, 'No file uploaded');
        return;
      }

      const document =
        await this.resourceCenterService.createResourceCenterDocument(
          req.body,
          req.file,
        );
      this.sendCreated(
        res,
        document,
        'Resource center document created successfully',
      );
    } catch (error) {
      const err = error as ErrorWithMessage;
      logger.error('Failed to create resource center document:', {
        error: err.message,
        body: req.body,
      });

      // Handle specific file upload errors
      if (err.message.includes('Invalid file type')) {
        this.sendError(res, err.message, HTTP_STATUS.BAD_REQUEST, err);
        return;
      }

      this.sendError(
        res,
        'Failed to create resource center document.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  async updateResourceCenterDocument(
    req: Request<{ id: string }, unknown, UpdateResourceCenterDocumentDto>,
    res: Response,
  ) {
    try {
      const { id } = req.params;
      logger.debug('Updating resource center document', { id });

      // Check if file is uploaded
      if (!req.file) {
        this.sendBadRequest(res, 'No file uploaded');
        return;
      }

      const document =
        await this.resourceCenterService.updateResourceCenterDocument(
          id,
          req.body,
          req.file,
        );

      if (!document) {
        this.sendNotFound(res, 'Resource center document not found');
        return;
      }

      this.sendUpdated(
        res,
        document,
        'Resource center document updated successfully',
      );
    } catch (error) {
      const err = error as ErrorWithMessage;
      logger.error('Failed to update resource center document:', {
        error: err.message,
        id: req.params.id,
        body: req.body,
      });

      // Handle specific file upload errors
      if (err.message.includes('Invalid file type')) {
        this.sendError(res, err.message, HTTP_STATUS.BAD_REQUEST, err);
        return;
      }

      this.sendError(
        res,
        'Failed to update resource center document.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  async patchResourceCenterFile(req: Request, res: Response) {
    try {
      const {
        resourceCenterId,
        documentId,
        s3Key,
        s3Link,
        documentFormat,
      }: {
        resourceCenterId: string;
        documentId: string;
        s3Key: string;
        s3Link: string;
        documentFormat: string;
      } = req.body;
      if (
        !resourceCenterId ||
        !documentId ||
        !s3Key ||
        !s3Link ||
        !documentFormat
      ) {
        this.sendBadRequest(
          res,
          'resourceCenterId, documentId, s3Key, s3Link, and documentFormat are required',
        );
        return;
      }
      // Validate resourceCenterId is a valid ObjectId
      if (!resourceCenterId.match(/^[0-9a-fA-F]{24}$/)) {
        this.sendBadRequest(res, 'Invalid resourceCenterId');
        return;
      }
      // Find the resource center
      const resourceCenter =
        await this.resourceCenterService.getResourceCenterById(
          resourceCenterId,
        );
      if (!resourceCenter) {
        this.sendNotFound(res, 'Resource center not found');
        return;
      }
      // Find the file in files array
      const fileItem = resourceCenter.files?.find(
        (file: any) => String(file._id) === String(documentId),
      );
      if (!fileItem) {
        this.sendNotFound(res, 'Document not found in resource center files');
        return;
      }
      // Update the file item
      fileItem.s3Key = s3Key;
      fileItem.s3Link = s3Link;
      fileItem.documentFormat = documentFormat;
      // Save the resource center
      await resourceCenter.save();
      this.sendSuccess(
        res,
        fileItem,
        'Resource center file updated successfully',
      );
    } catch (error) {
      const err = error as ErrorWithMessage;
      logger.error('Failed to patch resource center file:', {
        error: err.message,
        body: req.body,
      });
      this.sendError(
        res,
        'Failed to patch resource center file.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  async sendShareableLink(
    req: Request<unknown, unknown, ResourceCenterShareableLinkDto>,
    res: Response,
  ) {
    try {
      const { link, mails } = req.body;

      logger.debug('Sending resource center shareable link emails', {
        emailsCount: mails.length,
        link,
      });

      // Validate input
      if (!link || !mails || !Array.isArray(mails) || mails.length === 0) {
        this.sendBadRequest(
          res,
          'Link and at least one email address are required',
        );
        return;
      }

      // Send emails and await the result
      await this.resourceCenterService.sendShareableLink(mails, link);

      // Return immediate response
      this.sendSuccess(res, null, 'The mail has been sent to users');
    } catch (error) {
      const err = error as ErrorWithMessage;
      logger.error('Failed to send resource center shareable link emails:', {
        error: err.message,
        body: req.body,
      });

      this.sendError(
        res,
        'Failed to send shareable link emails.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }
}
