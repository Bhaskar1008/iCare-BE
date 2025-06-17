import type { Request, Response, RequestHandler, NextFunction } from 'express';
import { AobService } from './aob.service';
import type {
  CreateAobDocumentMasterDto,
  BulkCreateAobDocumentMasterDto,
} from './dto/create-aob-document-master.dto';
import { HTTP_STATUS } from '@/common/constants/http-status.constants';
import { BaseController } from '@/controllers/base.controller';
import logger from '@/common/utils/logger';
import {
  AobApplicationModel,
  type IAobApplication,
} from '@/models/aob-application.model';
import type { FilterQuery } from 'mongoose';

interface ErrorWithMessage {
  message: string;
  stack?: string;
}

export class AobController extends BaseController {
  private aobService: AobService;

  constructor() {
    super();
    this.aobService = new AobService();
  }

  async createDocumentMaster(
    req: Request<unknown, unknown, CreateAobDocumentMasterDto>,
    res: Response,
  ) {
    try {
      logger.debug('Creating AOB document master', {
        documentType: req.body.documentType,
      });

      const documentMaster = await this.aobService.createDocumentMaster(
        req.body,
      );
      this.sendCreated(
        res,
        documentMaster,
        'Document master created successfully',
      );
    } catch (error) {
      const err = error as ErrorWithMessage;
      logger.error('Failed to create AOB document master:', {
        error: err.message,
        body: req.body,
      });
      this.sendError(
        res,
        'Failed to create document master.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  async createBulkDocumentMasters(
    req: Request<
      unknown,
      unknown,
      BulkCreateAobDocumentMasterDto | CreateAobDocumentMasterDto[]
    >,
    res: Response,
  ) {
    try {
      // Handle both formats: direct array or wrapped in documents object
      let documentsArray: CreateAobDocumentMasterDto[];

      if (Array.isArray(req.body)) {
        // Direct array format
        documentsArray = req.body;
        logger.debug('Creating bulk AOB document masters (direct array)', {
          count: documentsArray.length,
        });
      } else if (
        req.body &&
        'documents' in req.body &&
        Array.isArray(req.body.documents)
      ) {
        // Wrapped object format
        documentsArray = req.body.documents;
        logger.debug('Creating bulk AOB document masters (wrapped object)', {
          count: documentsArray.length,
        });
      } else {
        logger.error('Invalid request format for bulk document masters:', {
          bodyType: typeof req.body,
          isArray: Array.isArray(req.body),
          hasDocuments: req.body && 'documents' in req.body,
        });
        this.sendBadRequest(
          res,
          'Invalid request format. Expected array of documents or object with documents property.',
        );
        return;
      }

      const bulkData: BulkCreateAobDocumentMasterDto = {
        documents: documentsArray,
      };
      const documentMasters =
        await this.aobService.createBulkDocumentMasters(bulkData);

      this.sendCreated(
        res,
        documentMasters,
        `Successfully created ${documentMasters.length} document masters`,
      );
    } catch (error) {
      const err = error as ErrorWithMessage;
      logger.error('Failed to create bulk AOB document masters:', {
        error: err.message,
        bodyType: typeof req.body,
        isArray: Array.isArray(req.body),
      });
      this.sendError(
        res,
        'Failed to create document masters.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  async getAllDocumentMasters(req: Request, res: Response) {
    try {
      logger.debug('Fetching all AOB document masters');

      const documentMasters = await this.aobService.getAllDocumentMasters();
      this.sendSuccess(
        res,
        documentMasters,
        'Successfully fetched all document masters.',
      );
    } catch (error) {
      const err = error as ErrorWithMessage;
      logger.error('Failed to fetch AOB document masters:', {
        error: err.message,
      });
      this.sendError(
        res,
        'Failed to fetch document masters.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  async getDocumentMasterById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      logger.debug('Fetching AOB document master by ID', { id });

      const documentMaster = await this.aobService.getDocumentMasterById(id);

      if (!documentMaster) {
        this.sendNotFound(res, 'Document master not found');
        return;
      }

      this.sendSuccess(
        res,
        documentMaster,
        'Successfully fetched document master.',
      );
    } catch (error) {
      const err = error as ErrorWithMessage;
      logger.error('Failed to fetch AOB document master by ID:', {
        error: err.message,
        id: req.params.id,
      });
      this.sendError(
        res,
        'Failed to fetch document master.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  async getDocumentMastersByCategory(req: Request, res: Response) {
    try {
      const { category } = req.query;
      logger.debug('Fetching AOB document masters by category', { category });

      if (!category || typeof category !== 'string') {
        this.sendBadRequest(res, 'Category parameter is required');
        return;
      }

      const documentMasters =
        await this.aobService.getDocumentMastersByCategory(category);
      this.sendSuccess(
        res,
        documentMasters,
        `Successfully fetched document masters for category: ${category}`,
      );
    } catch (error) {
      const err = error as ErrorWithMessage;
      logger.error('Failed to fetch AOB document masters by category:', {
        error: err.message,
        category: req.query.category,
      });
      this.sendError(
        res,
        'Failed to fetch document masters by category.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  checkApplicantExists: RequestHandler = async (req, res, next) => {
    try {
      const { emailId }: { emailId: string } = req.body;
      if (!emailId) {
        res.status(400).json({
          success: false,
          message: 'Email ID is required',
        });
        return;
      }

      const result = await this.aobService.checkApplicantExists(emailId);
      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          exists: result.exists,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  validateOtp: RequestHandler = async (req, res, next) => {
    try {
      const { emailId, otp }: { emailId: string; otp: string } = req.body;
      if (!emailId || !otp) {
        res.status(400).json({
          success: false,
          message: 'Email ID and OTP are required',
        });
        return;
      }

      const result = await this.aobService.validateOtp(emailId, otp);
      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          verified: result.verified,
          applicationData: result.applicationData,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  resendOtp: RequestHandler = async (req, res, next) => {
    try {
      const { emailId }: { emailId: string } = req.body;
      if (!emailId) {
        res.status(400).json({
          success: false,
          message: 'Email ID is required',
        });
        return;
      }

      const result = await this.aobService.resendOtp(emailId);
      res.status(200).json({
        success: result.success,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  sendEmailVerificationOtp: RequestHandler = async (req, res, next) => {
    try {
      const emailId: string = req.query.emailId as string;
      // const { emailId }: { emailId: string } = req.body;
      if (!emailId || typeof emailId !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Email ID is required',
        });
        return;
      }

      const result = await this.aobService.sendEmailVerificationOtp(emailId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  verifyEmailOtp: RequestHandler = async (req, res, next) => {
    try {
      const { emailId, otp }: { emailId: string; otp: string } = req.body;
      if (!emailId || !otp) {
        res.status(400).json({
          success: false,
          message: 'Email ID and OTP are required',
        });
        return;
      }

      const result = await this.aobService.verifyEmailOtp(emailId, otp);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  async getApplicationById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { applicationId } = req.query;

      if (!applicationId || typeof applicationId !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Application ID is required',
        });
        return;
      }

      const result = await this.aobService.getApplicationById(applicationId);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      logger.error('Controller error:', {
        error,
        statusCode: 500,
      });
      next(error);
    }
  }
}

export const createApplication = async (req: Request, res: Response) => {
  try {
    const applicationData = req.body;
    logger.debug('Creating AOB application', { applicationData });

    // Check for required fields
    if (!applicationData.emailAddress) {
      res.status(400).json({
        error: 'Validation failed',
        details: 'Email address is required',
      });
      return;
    }

    if (!applicationData.mobileNumber) {
      res.status(400).json({
        error: 'Validation failed',
        details: 'Mobile number is required',
      });
      return;
    }

    // Check for existing email or mobile
    const existingApplication = await AobApplicationModel.findOne({
      $or: [
        { emailAddress: applicationData.emailAddress },
        { mobileNumber: applicationData.mobileNumber },
      ],
    });

    if (existingApplication) {
      const errors = [];
      if (existingApplication.emailAddress === applicationData.emailAddress) {
        errors.push('Email address already exists');
      }
      if (existingApplication.mobileNumber === applicationData.mobileNumber) {
        errors.push('Mobile number already exists');
      }

      res.status(400).json({
        error: 'Validation failed',
        details: errors.join(', '),
      });
      return;
    }

    // Generate unique applicationId
    const timestamp = new Date().getTime();
    const randomNum = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    const applicationId = `APP${timestamp}${randomNum}`;

    const application = new AobApplicationModel({
      ...applicationData,
      applicationId,
    });
    await application.save();

    logger.info('AOB application created successfully', {
      email: application.emailAddress,
    });

    res.status(201).json(application);
  } catch (error) {
    const err = error as ErrorWithMessage;
    logger.error('Failed to create AOB application:', {
      error: err.message,
      stack: err.stack,
      body: req.body,
    });

    if (error instanceof Error) {
      res.status(500).json({
        error: 'Failed to create application',
        details: error.message,
      });
    } else {
      res.status(500).json({ error: 'Failed to create application' });
    }
  }
};

export const listApplications = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const search = req.query.search as string;

    logger.debug('Fetching applications list', {
      page,
      limit,
      status,
      search,
    });

    const query: Record<string, unknown> = {};

    if (status) {
      query.applicationStatus = status;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { emailAddress: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      AobApplicationModel.aggregate([
        { $match: query },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'aobdocuments',
            localField: 'applicationId',
            foreignField: 'applicationId',
            as: 'documents',
          },
        },
        {
          $addFields: {
            documents: {
              $cond: {
                if: { $eq: [{ $size: '$documents' }, 0] },
                then: null,
                else: '$documents',
              },
            },
          },
        },
      ]),
      AobApplicationModel.countDocuments(query as FilterQuery<IAobApplication>),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        applications,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    const err = error as ErrorWithMessage;
    logger.error('Failed to fetch applications:', {
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications',
      details: err.message,
    });
  }
};

export const updateApplication = async (
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    logger.debug('Updating AOB application', { id, updateData });

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Application ID is required',
      });
      return;
    }

    const application = await AobApplicationModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!application) {
      res.status(404).json({
        success: false,
        error: 'Application not found',
      });
      return;
    }

    logger.info('AOB application updated successfully', {
      applicationId: application.applicationId,
      email: application.emailAddress,
    });

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    const err = error as ErrorWithMessage;
    logger.error('Failed to update AOB application:', {
      error: err.message,
      stack: err.stack,
      body: req.body,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to update application',
      details: err.message,
    });
  }
};

export const patchApplication = async (
  req: Request<{ applicationId: string }>,
  res: Response,
): Promise<void> => {
  try {
    const { applicationId } = req.params;
    const {
      type,
      status,
      remarks,
    }: { type: string; status: string; remarks: string } = req.body;

    if (!applicationId) {
      res.status(400).json({
        success: false,
        error: 'Application ID is required',
      });
      return;
    }

    if (!type || !['document', 'application'].includes(type)) {
      res.status(400).json({
        success: false,
        error: 'Invalid type. Must be either "document" or "application"',
      });
      return;
    }

    if (type === 'document') {
      // For now, just return the application data
      const application = await AobApplicationModel.findOne({ applicationId });
      if (!application) {
        res.status(404).json({
          success: false,
          error: 'Application not found',
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: application,
      });
      return;
    }

    // Handle application type update
    if (
      !status ||
      ![
        'applicationSubmitted',
        'underReview',
        'rejected',
        'approved',
        'returned',
      ].includes(status)
    ) {
      res.status(400).json({
        success: false,
        error: 'Invalid status value',
      });
      return;
    }

    const updateData: Partial<IAobApplication> = {
      applicationStatus: status as
        | 'applicationSubmitted'
        | 'underReview'
        | 'rejected'
        | 'approved'
        | 'returned',
    };

    if (remarks) {
      updateData.rejectRemark = remarks;
    }

    // If status is approved, empty the qcAndDiscrepencyList
    if (status === 'approved') {
      updateData.qcAndDiscrepencyList = [];
    }

    const application = await AobApplicationModel.findOneAndUpdate(
      { applicationId },
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!application) {
      res.status(404).json({
        success: false,
        error: 'Application not found',
      });
      return;
    }

    logger.info('AOB application patched successfully', {
      applicationId: application.applicationId,
      email: application.emailAddress,
      status: application.applicationStatus,
    });

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    const err = error as ErrorWithMessage;
    logger.error('Failed to patch AOB application:', {
      error: err.message,
      stack: err.stack,
      body: req.body,
      applicationId: req.params.applicationId,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to patch application',
      details: err.message,
    });
  }
};

export const uploadDocument = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      documentId,
      documentType,
      documentFormat,
      documentStatus,
    }: {
      documentId: string;
      documentType: string;
      documentFormat: string;
      documentStatus: 'approve' | 'reject' | 'documentSubmitted';
    } = req.body;

    if (!documentId || !documentType || !documentFormat || !documentStatus) {
      res.status(400).json({
        success: false,
        error:
          'Document ID, document type, document format, and document status are required',
      });
      return;
    }

    // Validate document status
    const allowedStatuses = ['approve', 'reject', 'documentSubmitted'];
    if (!allowedStatuses.includes(documentStatus)) {
      res.status(400).json({
        success: false,
        error:
          'Invalid document status. Allowed statuses are: approve, reject, documentSubmitted',
      });
      return;
    }

    // Validate document format
    const allowedFormats = ['pdf', 'png', 'jpg'];
    if (!allowedFormats.includes(documentFormat.toLowerCase())) {
      res.status(400).json({
        success: false,
        error: 'Invalid document format. Allowed formats are: pdf, png, jpg',
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
      return;
    }

    // Validate that file extension matches the specified format
    const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();
    if (fileExtension !== documentFormat.toLowerCase()) {
      res.status(400).json({
        success: false,
        error: `File extension (${fileExtension}) does not match specified format (${documentFormat})`,
      });
      return;
    }

    const aobService = new AobService();
    const result = await aobService.uploadDocument(
      documentId,
      documentType,
      documentFormat,
      documentStatus,
      req.file,
    );

    res.status(200).json({
      success: true,
      data: result.document,
    });
  } catch (error) {
    const err = error as ErrorWithMessage;
    logger.error('Failed to upload document:', {
      error: err.message,
      stack: err.stack,
      body: req.body,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to upload document',
      details: err.message,
    });
  }
};

/**
 * @swagger
 * /application/qcHistoryList:
 *   get:
 *     tags:
 *       - AOB Application
 *     summary: Get QC history list for a document
 *     description: Retrieves the history of QC actions for a specific document
 *     parameters:
 *       - in: query
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the document to get history for
 *     responses:
 *       200:
 *         description: Successfully retrieved QC history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       documentId:
 *                         type: string
 *                       applicationId:
 *                         type: string
 *                       documentStatus:
 *                         type: string
 *                         enum: [approve, reject, documentSubmitted]
 *                       documentType:
 *                         type: string
 *                       documentFormat:
 *                         type: string
 *                         enum: [pdf, png, jpg]
 *                       documentName:
 *                         type: string
 *                       presignedS3Url:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Bad request - Document ID is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Document ID is required
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                 details:
 *                   type: string
 */
export const getQcHistoryList = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { documentId } = req.query;

    if (!documentId || typeof documentId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Document ID is required',
      });
      return;
    }

    const aobService = new AobService();
    const history = await aobService.getQcHistoryList(documentId);

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    const err = error as ErrorWithMessage;
    logger.error('Failed to fetch QC history:', {
      error: err.message,
      stack: err.stack,
      query: req.query,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch QC history',
      details: err.message,
    });
  }
};
