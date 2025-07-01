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
  type IQcAndDiscrepancyList,
} from '@/models/aob-application.model';
import type { FilterQuery } from 'mongoose';
import mongoose from 'mongoose';
import { AobDocumentModel } from '@/models/aob-document.model';
import type { DocumentStatusUpdateDto } from './dto/batch-update-document-status.dto';
import { AobDocumentHistoryModel } from '@/models/aob-document-history.model';
import type { QcDiscrepancyUpdateDto } from './dto/qc-discrepancy-update.dto';
import { DocumentStatus } from '@/common/constants/document-status.constants';
import type { ApplicationPatchDto } from './dto/application-patch.dto';
import { ApplicationApprovalService } from './services/application-approval.service';
import type { ShareableLinkDto } from './dto/shareable-link.dto';

interface ErrorWithMessage {
  message: string;
  stack?: string;
}

export class AobController extends BaseController {
  private aobService: AobService;
  private applicationApprovalService: ApplicationApprovalService;

  constructor() {
    super();
    this.aobService = new AobService();
    this.applicationApprovalService = new ApplicationApprovalService();
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

  createBulkDocumentMasters: RequestHandler = async (req, res) => {
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
  };

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
      if (!emailId || typeof emailId !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Email ID is required',
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid email format',
        });
        return;
      }

      // Check if email exists in application
      const application = await AobApplicationModel.findOne({
        emailAddress: emailId,
      });

      if (!application) {
        res.status(404).json({
          success: false,
          message: 'Email not found in our records',
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

      // If verification is successful, check application status
      if (result.success) {
        const application = await AobApplicationModel.findOne({
          emailAddress: emailId,
        });
        if (application) {
          result.applicationStatus = application.applicationStatus;
          result.applicationId = application.applicationId;

          // Add additional information based on application status
          switch (application.applicationStatus) {
            case 'approved':
              result.message =
                'Your application has been approved. You can proceed with the next steps.';
              break;
            case 'rejected':
              result.message =
                'Your application has been rejected. Please contact support for more information.';
              result.rejectionReason = application.rejectRemark;
              break;
            case 'returned':
              result.message =
                'Your application has been returned for corrections.';
              break;
            case 'underReview':
              result.message = 'Your application is currently under review.';
              break;
            case 'applicationSubmitted':
              result.message =
                'Your application has been submitted successfully and is pending review.';
              break;
            default:
              result.message = 'Email is verified.';
          }
        }
      }

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

      // Find the application
      let application;

      // Check if applicationId is a MongoDB ObjectId or a string ID
      if (mongoose.Types.ObjectId.isValid(applicationId)) {
        // Convert string to ObjectId safely
        const objectId = new mongoose.Types.ObjectId(applicationId.toString());
        application = await AobApplicationModel.findById(objectId);
      } else {
        application = await AobApplicationModel.findOne({
          applicationId,
        });
      }

      if (!application) {
        res.status(404).json({
          success: false,
          message: 'Application not found',
        });
        return;
      }

      // Find all documents for this application
      const documents = await AobDocumentModel.find({
        applicationId: application.applicationId,
      }).lean();

      // Create a response object with the application and documents
      const responseData = {
        ...application.toObject(),
        documents: documents || [],
      };

      res.status(200).json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      logger.error('Controller error:', {
        error,
        statusCode: 500,
      });
      next(error);
    }
  }

  async getDocumentDetails(req: Request, res: Response): Promise<void> {
    try {
      const { applicationId, documentId } = req.query;

      if (!applicationId || typeof applicationId !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Application ID is required',
        });
        return;
      }

      if (!documentId || typeof documentId !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Document ID is required',
        });
        return;
      }

      // Find the application
      const application = await AobApplicationModel.findOne({
        applicationId,
      });

      if (!application) {
        res.status(404).json({
          success: false,
          message: 'Application not found',
        });
        return;
      }

      // Find the document
      const document = await AobDocumentModel.findOne({
        documentId,
        applicationId,
      });

      if (!document) {
        res.status(404).json({
          success: false,
          message: 'Document not found',
        });
        return;
      }

      // Get document history
      const history = await this.aobService.getQcHistoryList(documentId);

      // Find if document is in QC discrepancy list
      const discrepancy = application.qcAndDiscrepencyList?.find(
        item => item.documentType === document.documentType,
      );

      res.status(200).json({
        success: true,
        data: {
          document,
          history,
          discrepancy: discrepancy ?? null,
          application: {
            _id: application._id,
            applicationId: application.applicationId,
            firstName: application.firstName,
            lastName: application.lastName,
            emailAddress: application.emailAddress,
            mobileNumber: application.mobileNumber,
            applicationStatus: application.applicationStatus,
            projectId: application.projectId,
          },
        },
        message: 'Document details retrieved successfully',
      });
    } catch (error) {
      logger.error('Failed to get document details:', {
        error,
        applicationId: req.query.applicationId,
        documentId: req.query.documentId,
      });

      const err = error instanceof Error ? error : new Error('Unknown error');
      this.sendError(
        res,
        'Failed to retrieve document details',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  async batchUpdateDocumentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { applicationId, documents, projectId } = req.body;

      logger.debug('Batch update document status request received', {
        applicationId,
        documentsCount: documents?.length ?? 0,
        projectId,
      });

      // Validate required fields
      if (
        !applicationId ||
        !documents ||
        !Array.isArray(documents) ||
        documents.length === 0
      ) {
        this.sendBadRequest(
          res,
          'Application ID and at least one document are required',
        );
        return;
      }

      // Validate that reject status has remarks
      for (const doc of documents) {
        if (
          (doc.documentStatus === 'reject' ||
            doc.documentStatus === 'qcReject') &&
          !doc.remarks
        ) {
          res.status(400).json({
            success: false,
            error: `Remarks are required for ${doc.documentStatus}ed document: ${doc.documentId}`,
          });
          return;
        }
      }

      // Convert documents to proper type
      const typedDocuments: DocumentStatusUpdateDto[] = documents.map(doc => ({
        _id: String(doc._id),
        documentId: String(doc.documentId),
        documentStatus: doc.documentStatus,
        remarks: doc.remarks,
        type: doc.type,
        infoName: doc.infoName,
      }));

      const result = await this.aobService.batchUpdateDocumentStatus(
        String(applicationId),
        typedDocuments,
        projectId ? String(projectId) : undefined,
      );

      this.sendSuccess(res, result, 'Documents status updated successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logger.error('Failed to batch update document status:', {
        error: err.message,
        stack: err.stack,
        body: req.body,
      });

      if (err.message.includes('not found')) {
        this.sendNotFound(res, err.message);
        return;
      }

      this.sendError(
        res,
        'Failed to update document statuses',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  async updateQcDiscrepancies(
    req: Request<any, any, QcDiscrepancyUpdateDto>,
    res: Response,
  ): Promise<void> {
    try {
      const {
        applicationId,
        documents,
        updateApplicationStatus = false,
        projectId,
      } = req.body;

      logger.debug('Updating QC discrepancies', {
        applicationId,
        documentsCount: documents.length,
        updateApplicationStatus,
        projectId,
      });

      // Find the application
      const application = await AobApplicationModel.findOne({
        applicationId,
        ...(projectId ? { projectId } : {}),
      });

      if (!application) {
        logger.error('Application not found', { applicationId, projectId });
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Application not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Initialize qcAndDiscrepencyList if undefined
      application.qcAndDiscrepencyList = application.qcAndDiscrepencyList ?? [];

      // Process each document
      const updatedDocuments = await Promise.all(
        documents.map(async doc => {
          // Update document status
          const document = await AobDocumentModel.findOneAndUpdate(
            { documentId: doc.documentId, applicationId },
            { $set: { documentStatus: doc.status } },
            { new: true },
          );

          if (!document) {
            logger.error('Document not found', {
              documentId: doc.documentId,
              applicationId,
            });
            return null;
          }

          // Create document history entry
          await AobDocumentHistoryModel.create({
            documentId: doc.documentId,
            applicationId,
            documentStatus: doc.status,
            remarks: doc.remarks,
            documentType: doc.documentType,
            documentName: doc.documentName,
            type: doc.type,
            infoName: doc.infoName,
          });

          // Update QC discrepancy list in application
          if (doc.status === DocumentStatus.REJECT && doc.remarks) {
            const discrepancyIndex =
              application.qcAndDiscrepencyList!.findIndex(
                d => d.documentType === doc.documentType,
              );

            const discrepancyEntry: IQcAndDiscrepancyList = {
              documentType: doc.documentType,
              documentName: doc.documentName,
              documentFormat: document.documentFormat ?? 'pdf', // Default to pdf if not specified
              remarks: doc.remarks,
              type: doc.type,
              infoName: doc.infoName,
              createdAt: new Date(),
            };

            if (discrepancyIndex >= 0) {
              application.qcAndDiscrepencyList![discrepancyIndex] =
                discrepancyEntry;
            } else {
              application.qcAndDiscrepencyList!.push(discrepancyEntry);
            }
          } else if (doc.status === DocumentStatus.QCREJECT && doc.remarks) {
            // Handle qcReject status - update both document and application status
            const discrepancyEntry: IQcAndDiscrepancyList = {
              documentType: doc.documentType,
              documentName: doc.documentName,
              documentFormat: document.documentFormat ?? 'pdf',
              remarks: doc.remarks,
              type: doc.type,
              infoName: doc.infoName,
              createdAt: new Date(),
            };

            // Add to discrepancy list
            const discrepancyIndex =
              application.qcAndDiscrepencyList!.findIndex(
                d => d.documentType === doc.documentType,
              );

            if (discrepancyIndex >= 0) {
              application.qcAndDiscrepencyList![discrepancyIndex] =
                discrepancyEntry;
            } else {
              application.qcAndDiscrepencyList!.push(discrepancyEntry);
            }

            // Update application status to qcRejected
            application.applicationStatus = 'qcRejected';
          } else if (doc.status === DocumentStatus.APPROVE) {
            // Remove from discrepancy list if approved
            application.qcAndDiscrepencyList =
              application.qcAndDiscrepencyList!.filter(
                d => d.documentType !== doc.documentType,
              );
          }

          return {
            documentId: doc.documentId,
            status: doc.status,
            remarks: doc.remarks,
          };
        }),
      );

      // Update application status if requested
      if (updateApplicationStatus) {
        const hasRejectedDocuments = documents.some(
          doc => doc.status === DocumentStatus.REJECT,
        );
        const allDocumentsApproved = documents.every(
          doc => doc.status === DocumentStatus.APPROVE,
        );

        if (hasRejectedDocuments) {
          application.applicationStatus = 'returned';
        } else if (allDocumentsApproved) {
          application.applicationStatus = 'approved';
        }
      }

      // Save application changes
      await application.save();

      logger.debug('QC discrepancies updated successfully', {
        applicationId,
        documentsCount: documents.length,
        applicationStatus: application.applicationStatus,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'QC discrepancies updated successfully',
        data: {
          applicationId,
          applicationStatus: application.applicationStatus,
          updatedDocuments: updatedDocuments.filter(doc => doc !== null),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to update QC discrepancies:', {
        error: err.message,
        stack: err.stack,
        body: req.body,
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to update QC discrepancies',
        error: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async shareableLink(
    req: Request<any, any, ShareableLinkDto>,
    res: Response,
  ): Promise<void> {
    try {
      const { link, notifyType, emailId, smsNo } = req.body;

      logger.debug('Processing shareable link request', {
        notifyType,
        hasEmailId: !!emailId,
        hasSmsNo: !!smsNo,
      });

      // Additional validation to ensure either emailId or smsNo is provided
      if (notifyType === 'email' && !emailId) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Email ID is required when notify type is email',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (notifyType === 'sms' && !smsNo) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'SMS number is required when notify type is sms',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Send notification based on type
      if (notifyType === 'email' && emailId) {
        await this.aobService.sendShareableLinkEmail(emailId, link);
      } else if (notifyType === 'sms' && smsNo) {
        await this.aobService.sendShareableLinkSms(smsNo, link);
      }

      logger.info('Shareable link notification sent successfully', {
        notifyType,
        recipient: notifyType === 'email' ? emailId : smsNo,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Successful mail has been sent',
        data: {
          notifyType,
          recipient: notifyType === 'email' ? emailId : smsNo,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to send shareable link notification:', {
        error: err.message,
        stack: err.stack,
        body: req.body,
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to send notification',
        error: err.message,
        timestamp: new Date().toISOString(),
      });
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

    // Validate projectId if provided
    if (
      applicationData.projectId &&
      !mongoose.Types.ObjectId.isValid(
        applicationData.projectId as unknown as string,
      )
    ) {
      res.status(400).json({
        error: 'Validation failed',
        details: 'Invalid project ID format',
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

    // Convert projectId to ObjectId if provided
    if (applicationData.projectId) {
      applicationData.projectId = new mongoose.Types.ObjectId(
        applicationData.projectId as unknown as string,
      );
    }

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
    const skip = parseInt(req.query.skip as string) ?? 0;
    const limit = parseInt(req.query.limit as string) ?? 10;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const projectId = req.query.projectId as string;

    logger.debug('Fetching applications list', {
      skip,
      limit,
      status,
      search,
      projectId,
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

    if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
      query.projectId = new mongoose.Types.ObjectId(projectId);
    }

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

    res.status(200).json({
      success: true,
      data: applications,
      total,
      skip,
      limit,
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

    // Validate projectId if provided
    if (
      updateData.projectId &&
      !mongoose.Types.ObjectId.isValid(
        updateData.projectId as unknown as string,
      )
    ) {
      res.status(400).json({
        success: false,
        error: 'Invalid project ID format',
      });
      return;
    }

    // Convert projectId to ObjectId if provided
    if (updateData.projectId) {
      updateData.projectId = new mongoose.Types.ObjectId(
        updateData.projectId as unknown as string,
      );
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
    const patchData: ApplicationPatchDto = req.body;

    logger.debug('Patching AOB application', {
      applicationId,
      type: patchData.type,
      status: patchData.status,
      projectId: patchData.projectId,
    });

    if (!applicationId) {
      res.status(400).json({
        success: false,
        error: 'Application ID is required',
      });
      return;
    }

    if (
      !patchData.type ||
      !['document', 'application'].includes(patchData.type)
    ) {
      res.status(400).json({
        success: false,
        error: 'Invalid type. Must be either "document" or "application"',
      });
      return;
    }

    // Validate projectId if provided
    if (
      patchData.projectId &&
      !mongoose.Types.ObjectId.isValid(patchData.projectId)
    ) {
      res.status(400).json({
        success: false,
        error: 'Invalid project ID format',
      });
      return;
    }

    if (patchData.type === 'document') {
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
      !patchData.status ||
      ![
        'applicationSubmitted',
        'underReview',
        'rejected',
        'qcRejected',
        'approved',
        'returned',
      ].includes(patchData.status)
    ) {
      res.status(400).json({
        success: false,
        error: 'Invalid status value',
      });
      return;
    }

    // Special handling for approved applications
    if (patchData.status === 'approved' && patchData.projectId) {
      const approvalService = new ApplicationApprovalService();
      const result = await approvalService.processApprovedApplication(
        applicationId,
        patchData.projectId,
        patchData.remarks,
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.message,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Application approved and agent created successfully',
        data: {
          application: result.application,
          agent: result.agent,
        },
      });
      return;
    }

    // Regular application update
    const updateData: Partial<IAobApplication> = {
      applicationStatus: patchData.status,
    };

    if (patchData.remarks) {
      updateData.rejectRemark = patchData.remarks;
    }

    if (patchData.projectId) {
      updateData.projectId = new mongoose.Types.ObjectId(patchData.projectId);
    }

    // If status is approved, empty the qcAndDiscrepencyList
    if (patchData.status === 'approved') {
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
      projectId,
    }: {
      documentId: string;
      documentType: string;
      documentFormat: string;
      documentStatus: 'approve' | 'reject' | 'qcReject' | 'documentSubmitted';
      projectId?: string;
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
    const allowedStatuses = [
      'approve',
      'reject',
      'qcReject',
      'documentSubmitted',
    ];
    if (!allowedStatuses.includes(documentStatus)) {
      res.status(400).json({
        success: false,
        error:
          'Invalid document status. Allowed statuses are: approve, reject, qcReject, documentSubmitted',
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

    // Validate projectId if provided
    if (
      projectId &&
      !mongoose.Types.ObjectId.isValid(projectId as unknown as string)
    ) {
      res.status(400).json({
        success: false,
        error: 'Invalid project ID format',
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
      projectId,
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

export const batchUpdateDocumentStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { applicationId, documents, projectId } = req.body as {
      applicationId: string;
      documents: DocumentStatusUpdateDto[];
      projectId: string;
    };

    logger.debug('Batch update document status request received', {
      applicationId,
      documentsCount: documents.length,
      projectId,
    });

    // Validate required fields
    if (
      !applicationId ||
      !documents ||
      !Array.isArray(documents) ||
      documents.length === 0
    ) {
      res.status(400).json({
        success: false,
        error: 'Application ID and at least one document are required',
      });
      return;
    }

    // Validate that reject status has remarks
    for (const doc of documents) {
      if (
        (doc.documentStatus === 'reject' ||
          doc.documentStatus === 'qcReject') &&
        !doc.remarks
      ) {
        res.status(400).json({
          success: false,
          error: `Remarks are required for ${doc.documentStatus}ed document: ${doc.documentId}`,
        });
        return;
      }
    }

    const aobService = new AobService();
    const result = await aobService.batchUpdateDocumentStatus(
      applicationId as unknown as string,
      documents as unknown as DocumentStatusUpdateDto[],
      projectId as unknown as string,
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Documents status updated successfully',
    });
  } catch (error) {
    const err = error as ErrorWithMessage;
    logger.error('Failed to batch update document status:', {
      error: err.message,
      stack: err.stack,
      body: req.body,
    });

    if (err.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: err.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update document statuses',
      details: err.message,
    });
  }
};
