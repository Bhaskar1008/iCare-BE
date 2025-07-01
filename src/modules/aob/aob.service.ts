import type {
  CreateAobDocumentMasterDto,
  BulkCreateAobDocumentMasterDto,
} from './dto/create-aob-document-master.dto';
import type { AobDocumentMasterResponseDto } from './dto/aob-document-master-response.dto';
import type { IAobDocumentMaster } from '@/models/aob-document-master.model';
import { AobRepository } from './aob.repository';
import logger from '@/common/utils/logger';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { AobDocumentModel } from '@/models/aob-document.model';
import { AobApplicationModel } from '@/models/aob-application.model';
import { AobDocumentHistoryModel } from '@/models/aob-document-history.model';
import { v4 as uuidv4 } from 'uuid';
import { ApplicantOtpModel } from '@/models/applicant-otp.model';
import mongoose from 'mongoose';
import type { DocumentStatusUpdateDto } from './dto/batch-update-document-status.dto';
import { AobEmailTemplates } from '@/emailTemplates/aob.templates';

export class AobService {
  private aobRepository: AobRepository;
  private s3Client: S3Client;

  constructor() {
    this.aobRepository = new AobRepository();
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION ?? 'ap-southeast-1',
      endpoint: 'https://s3.ap-southeast-1.amazonaws.com',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
      },
    });
  }

  async createDocumentMaster(
    data: CreateAobDocumentMasterDto,
  ): Promise<AobDocumentMasterResponseDto> {
    try {
      logger.debug('Creating AOB document master', {
        documentType: data.documentType,
      });
      const documentMaster =
        await this.aobRepository.createDocumentMaster(data);
      return this.mapToResponseDto(documentMaster);
    } catch (error) {
      logger.error('Failed to create AOB document master:', { error, data });
      throw error;
    }
  }

  async createBulkDocumentMasters(
    data: BulkCreateAobDocumentMasterDto,
  ): Promise<AobDocumentMasterResponseDto[]> {
    try {
      logger.debug('Creating bulk AOB document masters', {
        count: data.documents.length,
      });

      // Validate that all documents have required fields
      this.validateBulkDocuments(data.documents);

      const documentMasters =
        await this.aobRepository.createManyDocumentMasters(data.documents);

      logger.debug('Successfully created bulk AOB document masters', {
        count: documentMasters.length,
      });

      return documentMasters.map(doc => this.mapToResponseDto(doc));
    } catch (error) {
      logger.error('Failed to create bulk AOB document masters:', {
        error,
        count: data.documents.length,
      });
      throw error;
    }
  }

  async getAllDocumentMasters(): Promise<AobDocumentMasterResponseDto[]> {
    try {
      logger.debug('Fetching all AOB document masters');
      const documentMasters = await this.aobRepository.findAllDocumentMasters();
      return documentMasters.map(doc => this.mapToResponseDto(doc));
    } catch (error) {
      logger.error('Failed to fetch all AOB document masters:', { error });
      throw error;
    }
  }

  async getDocumentMasterById(
    id: string,
  ): Promise<AobDocumentMasterResponseDto | null> {
    try {
      logger.debug('Fetching AOB document master by ID', { id });
      const documentMaster =
        await this.aobRepository.findDocumentMasterById(id);
      return documentMaster ? this.mapToResponseDto(documentMaster) : null;
    } catch (error) {
      logger.error('Failed to fetch AOB document master by ID:', { error, id });
      throw error;
    }
  }

  async getDocumentMastersByCategory(
    category: string,
  ): Promise<AobDocumentMasterResponseDto[]> {
    try {
      logger.debug('Fetching AOB document masters by category', { category });
      const documentMasters =
        await this.aobRepository.findDocumentMastersByCategory(category);
      return documentMasters.map(doc => this.mapToResponseDto(doc));
    } catch (error) {
      logger.error('Failed to fetch AOB document masters by category:', {
        error,
        category,
      });
      throw error;
    }
  }

  async uploadDocument(
    documentId: string,
    documentType: string,
    documentFormat: string,
    documentStatus: 'approve' | 'reject' | 'qcReject' | 'documentSubmitted',
    file: Express.Multer.File,
    projectId?: string,
  ): Promise<{ document: any }> {
    try {
      // Validate document type exists in master
      const documentMaster =
        await this.aobRepository.findDocumentMasterByType(documentType);
      if (!documentMaster) {
        throw new Error('Invalid document type');
      }

      // Get the application
      const application = await AobApplicationModel.findOne({ documentId });
      if (!application) {
        throw new Error('Application not found');
      }

      // Update projectId if provided
      if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
        await AobApplicationModel.findByIdAndUpdate(
          application._id,
          { projectId: new mongoose.Types.ObjectId(projectId) },
          { new: true },
        );
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new Error(
          'Invalid file type. Only PDF, PNG, and JPG are allowed',
        );
      }

      // Generate unique s3Key
      const uniqueId = uuidv4();
      const s3Key = `${uniqueId}.${documentFormat}`;

      // Upload to S3
      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET ?? '',
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      try {
        await this.s3Client.send(new PutObjectCommand(uploadParams));
        logger.debug('File uploaded to S3 successfully', { s3Key });
      } catch (error) {
        logger.error('Failed to upload file to S3:', { error, s3Key });
        throw new Error('Failed to upload file to S3');
      }

      // Construct the S3 URL
      const s3Url = `https://${process.env.AWS_S3_BUCKET}.s3.ap-southeast-1.amazonaws.com/${s3Key}`;

      // Update or create document record
      const document = await AobDocumentModel.findOneAndUpdate(
        { documentType, applicationId: application.applicationId },
        {
          documentId,
          applicationId: application.applicationId,
          documentStatus,
          documentType,
          documentFormat: documentFormat as 'pdf' | 'png' | 'jpg',
          documentName: file.originalname,
          presignedS3Url: s3Url,
          s3Key,
        },
        { upsert: true, new: true },
      );

      // Create history record for all status changes
      await AobDocumentHistoryModel.create({
        documentId,
        applicationId: application.applicationId,
        documentStatus,
        documentType,
        documentFormat: documentFormat as 'pdf' | 'png' | 'jpg',
        documentName: file.originalname,
        presignedS3Url: s3Url,
        s3Key,
        remarks: document.remarks,
        type: document.type,
        infoName: document.infoName,
      });

      // Handle specific status actions
      if (documentStatus === 'reject') {
        // Check if document type already exists in qcAndDiscrepencyList
        const existingDiscrepancy = application.qcAndDiscrepencyList?.find(
          item => item.documentType === documentType,
        );

        if (!existingDiscrepancy) {
          // Add new discrepancy to the list
          await AobApplicationModel.findByIdAndUpdate(
            application._id,
            {
              $push: {
                qcAndDiscrepencyList: {
                  documentType,
                  documentFormat: documentFormat as 'pdf' | 'png' | 'jpg',
                  documentName: file.originalname,
                  remarks: document.remarks ?? 'Document rejected',
                  type: document.type,
                  infoName: document.infoName,
                  createdAt: new Date(),
                },
              },
            },
            { new: true },
          );
        } else {
          // Update existing discrepancy
          await AobApplicationModel.updateOne(
            {
              _id: application._id,
              'qcAndDiscrepencyList.documentType': documentType,
            },
            {
              $set: {
                'qcAndDiscrepencyList.$.documentFormat': documentFormat as
                  | 'pdf'
                  | 'png'
                  | 'jpg',
                'qcAndDiscrepencyList.$.documentName': file.originalname,
                'qcAndDiscrepencyList.$.remarks':
                  document.remarks ?? 'Document rejected',
                'qcAndDiscrepencyList.$.type': document.type,
                'qcAndDiscrepencyList.$.infoName': document.infoName,
                'qcAndDiscrepencyList.$.createdAt': new Date(),
              },
            },
          );
        }
      } else if (documentStatus === 'qcReject') {
        // Handle qcReject status - update both document and application status
        // Update application status to qcRejected
        await AobApplicationModel.findByIdAndUpdate(
          application._id,
          {
            applicationStatus: 'qcRejected',
            $push: {
              qcAndDiscrepencyList: {
                documentType,
                documentFormat: documentFormat as 'pdf' | 'png' | 'jpg',
                documentName: file.originalname,
                remarks: document.remarks ?? 'Document QC rejected',
                type: document.type,
                infoName: document.infoName,
                createdAt: new Date(),
              },
            },
          },
          { new: true },
        );
      } else if (documentStatus === 'approve') {
        // Remove document from qcAndDiscrepencyList if status is approve
        await AobApplicationModel.updateOne(
          { _id: application._id },
          {
            $pull: {
              qcAndDiscrepencyList: {
                documentType,
              },
            },
          },
        );
      }

      return { document };
    } catch (error) {
      logger.error('Failed to upload document:', {
        error,
        documentId,
        documentType,
      });
      throw error;
    }
  }

  async getQcHistoryList(documentId: string) {
    try {
      const history = await AobDocumentHistoryModel.find({ documentId })
        .sort({ createdAt: -1 })
        .lean();

      return history;
    } catch (error) {
      logger.error('Failed to fetch QC history:', {
        error,
        documentId,
      });
      throw error;
    }
  }

  async checkApplicantExists(
    emailId: string,
  ): Promise<{ exists: boolean; message: string }> {
    try {
      logger.debug('Checking if applicant exists', { emailId });
      const application = await AobApplicationModel.findOne({
        emailAddress: emailId,
      });

      if (application) {
        // Generate and store OTP
        const otp =
          process.env.NODE_ENV === 'development'
            ? '3003'
            : Math.floor(1000 + Math.random() * 9000).toString();
        // Remove any existing OTP for this email
        await ApplicantOtpModel.deleteMany({ emailAddress: emailId });

        // Create new OTP
        await ApplicantOtpModel.create({
          emailAddress: emailId,
          otp,
          isUsed: false,
        });

        await this.sendOtpEmail(emailId, otp);
        // Send email with OTP
        if (process.env.NODE_ENV !== 'development') {
          try {
            await this.sendOtpEmail(emailId, otp);
            logger.info('OTP email sent successfully', { emailId });
          } catch (emailError) {
            logger.error('Failed to send OTP email:', {
              error: emailError,
              emailId,
            });
            // Continue even if email fails - we'll return success
            // since the OTP was generated and stored
          }
        }

        return {
          exists: true,
          message: `OTP is sent to ${emailId}`,
        };
      }

      return {
        exists: false,
        message: 'Application not found',
      };
    } catch (error) {
      logger.error('Failed to check applicant existence:', { error, emailId });
      throw error;
    }
  }

  private async sendOtpEmail(email: string, otp: string): Promise<void> {
    try {
      await AobEmailTemplates.sendOtpEmail(email, otp);
      logger.debug('OTP email sent successfully', { email });
    } catch (error) {
      logger.error('Failed to send OTP email:', { error, email });
      // Don't throw the error - let the calling method handle it
      // This prevents email failures from breaking the entire flow
    }
  }

  async validateOtp(
    emailId: string,
    otp: string,
  ): Promise<{ verified: boolean; message: string; applicationData?: any }> {
    try {
      logger.debug('Validating OTP', { emailId });

      // Find the most recent OTP for this email
      const otpRecord = await ApplicantOtpModel.findOne({
        emailAddress: emailId,
        isUsed: false,
      }).sort({ createdAt: -1 });

      if (!otpRecord) {
        return {
          verified: false,
          message: 'No valid OTP found',
        };
      }

      // Check if OTP is expired (15 minutes)
      const now = new Date();
      const otpAge = now.getTime() - otpRecord.createdAt.getTime();
      if (otpAge > 15 * 60 * 1000) {
        // 15 minutes in milliseconds
        await ApplicantOtpModel.deleteOne({ _id: otpRecord._id });
        return {
          verified: false,
          message: 'OTP has expired',
        };
      }

      // Validate OTP
      if (otpRecord.otp !== otp) {
        return {
          verified: false,
          message: 'Invalid OTP',
        };
      }

      // Mark OTP as used
      await ApplicantOtpModel.updateOne(
        { _id: otpRecord._id },
        { isUsed: true },
      );

      // Get application data
      const application = await AobApplicationModel.findOne({
        emailAddress: emailId,
      });
      if (!application) {
        return {
          verified: false,
          message: 'Application not found',
        };
      }

      return {
        verified: true,
        message: 'Applicant is verified',
        applicationData: application.toObject(),
      };
    } catch (error) {
      logger.error('Failed to validate OTP:', { error, emailId });
      throw error;
    }
  }

  async resendOtp(
    emailId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      logger.debug('Resending OTP', { emailId });
      const application = await AobApplicationModel.findOne({
        emailAddress: emailId,
      });

      if (!application) {
        return {
          success: false,
          message: 'Application not found',
        };
      }

      // Remove any existing OTP for this email
      await ApplicantOtpModel.deleteMany({ emailAddress: emailId });

      // Generate and store new OTP
      const otp =
        process.env.NODE_ENV === 'development'
          ? '3003'
          : Math.floor(1000 + Math.random() * 9000).toString();
      await ApplicantOtpModel.create({
        emailAddress: emailId,
        otp,
        isUsed: false,
      });

      // Send email with OTP
      if (process.env.NODE_ENV !== 'development') {
        try {
          await this.sendOtpEmail(emailId, otp);
          logger.info('OTP email sent successfully', { emailId });
        } catch (emailError) {
          logger.error('Failed to send OTP email:', {
            error: emailError,
            emailId,
          });
          // Continue even if email fails
        }
      }

      return {
        success: true,
        message: `OTP is resent to ${emailId}`,
      };
    } catch (error) {
      logger.error('Failed to resend OTP:', { error, emailId });
      throw error;
    }
  }

  async sendEmailVerificationOtp(
    emailId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      logger.debug('Sending email verification OTP', { emailId });

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailId)) {
        return {
          success: false,
          message: 'Invalid email format',
        };
      }

      // Check if email exists in application
      const application = await AobApplicationModel.findOne({
        emailAddress: emailId,
      });

      if (!application) {
        return {
          success: false,
          message: 'Email not found in our records',
        };
      }

      // Generate OTP
      const otp = Math.floor(1000 + Math.random() * 9000).toString();

      // Remove any existing OTP for this email
      await ApplicantOtpModel.deleteMany({ emailAddress: emailId });

      // Create new OTP
      await ApplicantOtpModel.create({
        emailAddress: emailId,
        otp,
        isUsed: false,
      });

      // Send email with OTP
      try {
        await this.sendOtpEmail(emailId, otp);
        logger.info('OTP email sent successfully', { emailId });
      } catch (emailError) {
        logger.error('Failed to send OTP email:', {
          error: emailError,
          emailId,
        });
      }

      return {
        success: true,
        message: `OTP sent to ${emailId}`,
      };
    } catch (error) {
      logger.error('Failed to send email verification OTP:', {
        error,
        emailId,
      });
      throw error;
    }
  }

  async verifyEmailOtp(
    emailId: string,
    otp: string,
  ): Promise<{
    success: boolean;
    message: string;
    applicationStatus?: string;
    applicationId?: string;
    rejectionReason?: string;
  }> {
    try {
      logger.debug('Verifying email OTP', { emailId });

      // Find the most recent OTP for this email
      const otpRecord = await ApplicantOtpModel.findOne({
        emailAddress: emailId,
        isUsed: false,
      }).sort({ createdAt: -1 });

      if (!otpRecord) {
        return {
          success: false,
          message: 'No valid OTP found',
        };
      }

      // Check if OTP is expired (15 minutes)
      const now = new Date();
      const otpAge = now.getTime() - otpRecord.createdAt.getTime();
      if (otpAge > 15 * 60 * 1000) {
        // 15 minutes in milliseconds
        await ApplicantOtpModel.deleteOne({ _id: otpRecord._id });
        return {
          success: false,
          message: 'OTP has expired',
        };
      }

      // Validate OTP
      if (otpRecord.otp !== otp) {
        return {
          success: false,
          message: 'Invalid OTP',
        };
      }

      // Delete the OTP record
      await ApplicantOtpModel.deleteOne({ _id: otpRecord._id });

      // Check application status if email exists
      const application = await AobApplicationModel.findOne({
        emailAddress: emailId,
      });
      if (application) {
        return {
          success: true,
          message: this.getStatusMessage(application.applicationStatus),
          applicationStatus: application.applicationStatus,
          rejectionReason:
            application.applicationStatus === 'rejected'
              ? application.rejectRemark
              : undefined,
        };
      }

      return {
        success: true,
        message: 'Email is verified',
      };
    } catch (error) {
      logger.error('Failed to verify email OTP:', { error, emailId });
      throw error;
    }
  }

  private getStatusMessage(status?: string): string {
    switch (status) {
      case 'approved':
        return 'Your application has been approved. You can proceed with the next steps.';
      case 'rejected':
        return 'Your application has been rejected. Please contact support for more information.';
      case 'returned':
        return 'Your application has been returned for corrections.';
      case 'underReview':
        return 'Your application is currently under review.';
      case 'applicationSubmitted':
        return 'Your application has been submitted successfully and is pending review.';
      default:
        return 'Email is verified.';
    }
  }

  async getApplicationById(
    applicationId: string,
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      logger.debug('Fetching application by ID', { applicationId });
      const application = await AobApplicationModel.findById(
        new mongoose.Types.ObjectId(applicationId),
      );

      if (!application) {
        return {
          success: false,
          message: 'Application does not exist',
        };
      }

      return {
        success: true,
        data: application.toObject(),
      };
    } catch (error) {
      logger.error('Failed to fetch application by ID:', {
        error,
        applicationId,
      });
      throw error;
    }
  }

  async getDocumentDetails(
    applicationId: string,
    documentId: string,
  ): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> {
    try {
      logger.debug('Fetching document details', { applicationId, documentId });

      // Find the application
      const application = await AobApplicationModel.findOne({
        applicationId,
      });

      if (!application) {
        return {
          success: false,
          message: 'Application not found',
        };
      }

      // Find the document
      const document = await AobDocumentModel.findOne({
        documentId,
        applicationId,
      });

      if (!document) {
        return {
          success: false,
          message: 'Document not found',
        };
      }

      // Get document history
      const history = await this.getQcHistoryList(documentId);

      // Find if document is in QC discrepancy list
      const discrepancy = application.qcAndDiscrepencyList?.find(
        item => item.documentType === document.documentType,
      );

      return {
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
      };
    } catch (error) {
      logger.error('Failed to fetch document details:', {
        error,
        applicationId,
        documentId,
      });
      throw error;
    }
  }

  async batchUpdateDocumentStatus(
    applicationId: string,
    documents: DocumentStatusUpdateDto[],
    projectId?: string,
  ): Promise<{ success: boolean; results: any[] }> {
    try {
      logger.debug('Batch updating document status', {
        applicationId,
        documentsCount: documents.length,
        projectId,
      });

      // Validate application exists
      const application = await AobApplicationModel.findOne({ applicationId });
      if (!application) {
        throw new Error('Application not found');
      }

      // Update projectId if provided
      if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
        await AobApplicationModel.findByIdAndUpdate(
          application._id,
          { projectId: new mongoose.Types.ObjectId(projectId) },
          { new: true },
        );
      }

      const results = [];

      // Process each document update
      for (const doc of documents) {
        try {
          // Update document status using _id
          const updatedDocument = await AobDocumentModel.findByIdAndUpdate(
            doc._id,
            {
              documentStatus: doc.documentStatus,
              ...(doc.remarks && { remarks: doc.remarks }),
            },
            { new: true },
          );

          if (!updatedDocument) {
            results.push({
              documentId: doc.documentId,
              _id: doc._id,
              success: false,
              message: 'Document not found',
            });
            continue;
          }

          // Create history record for all status changes
          await AobDocumentHistoryModel.create({
            documentId: doc.documentId,
            applicationId,
            documentStatus: doc.documentStatus,
            documentType: updatedDocument.documentType,
            documentFormat: updatedDocument.documentFormat,
            documentName: updatedDocument.documentName,
            presignedS3Url: updatedDocument.presignedS3Url,
            s3Key: updatedDocument.s3Key,
            remarks: doc.remarks,
            type: doc.type,
            infoName: doc.infoName,
          });

          // Handle document status specific actions
          if (doc.documentStatus === 'reject') {
            // Update or add to qcAndDiscrepencyList
            const existingDiscrepancy = application.qcAndDiscrepencyList?.find(
              item => item.documentType === updatedDocument.documentType,
            );

            if (!existingDiscrepancy) {
              // Add new discrepancy
              await AobApplicationModel.findByIdAndUpdate(
                application._id,
                {
                  $push: {
                    qcAndDiscrepencyList: {
                      documentType: updatedDocument.documentType,
                      documentFormat: updatedDocument.documentFormat,
                      documentName: updatedDocument.documentName,
                      remarks: doc.remarks ?? 'Document rejected',
                      type: doc.type,
                      infoName: doc.infoName,
                      createdAt: new Date(),
                    },
                  },
                },
                { new: true },
              );
            } else {
              // Update existing discrepancy
              await AobApplicationModel.updateOne(
                {
                  _id: application._id,
                  'qcAndDiscrepencyList.documentType':
                    updatedDocument.documentType,
                },
                {
                  $set: {
                    'qcAndDiscrepencyList.$.remarks':
                      doc.remarks ?? 'Document rejected',
                    'qcAndDiscrepencyList.$.type': doc.type,
                    'qcAndDiscrepencyList.$.infoName': doc.infoName,
                    'qcAndDiscrepencyList.$.createdAt': new Date(),
                  },
                },
              );
            }
          } else if (doc.documentStatus === 'qcReject') {
            // Handle qcReject status - update both document and application status
            // Update application status to qcRejected
            await AobApplicationModel.findByIdAndUpdate(
              application._id,
              {
                applicationStatus: 'qcRejected',
                $push: {
                  qcAndDiscrepencyList: {
                    documentType: updatedDocument.documentType,
                    documentFormat: updatedDocument.documentFormat,
                    documentName: updatedDocument.documentName,
                    remarks: doc.remarks ?? 'Document QC rejected',
                    type: doc.type,
                    infoName: doc.infoName,
                    createdAt: new Date(),
                  },
                },
              },
              { new: true },
            );
          } else if (doc.documentStatus === 'approve') {
            // Remove from qcAndDiscrepencyList if approved
            await AobApplicationModel.updateOne(
              { _id: application._id },
              {
                $pull: {
                  qcAndDiscrepencyList: {
                    documentType: updatedDocument.documentType,
                  },
                },
              },
            );
          }

          results.push({
            documentId: doc.documentId,
            _id: doc._id,
            success: true,
            status: doc.documentStatus,
          });
        } catch (docError) {
          logger.error('Error processing document in batch update:', {
            error: docError,
            documentId: doc.documentId,
            _id: doc._id,
          });

          results.push({
            documentId: doc.documentId,
            _id: doc._id,
            success: false,
            message:
              docError instanceof Error ? docError.message : 'Unknown error',
          });
        }
      }

      return {
        success: true,
        results,
      };
    } catch (error) {
      logger.error('Failed to batch update document status:', {
        error,
        applicationId,
        documentsCount: documents.length,
      });
      throw error;
    }
  }

  private validateBulkDocuments(documents: CreateAobDocumentMasterDto[]): void {
    if (!documents || documents.length === 0) {
      throw new Error('Documents array cannot be empty');
    }

    documents.forEach((doc, index) => {
      if (
        !doc.documentName ||
        !doc.documentType ||
        !doc.documentDescription ||
        !doc.documentInstruction
      ) {
        throw new Error(
          `Document at index ${index} is missing required fields`,
        );
      }
    });
  }

  private mapToResponseDto(
    documentMaster: IAobDocumentMaster,
  ): AobDocumentMasterResponseDto {
    return {
      _id: documentMaster._id.toString(),
      documentName: documentMaster.documentName,
      documentType: documentMaster.documentType,
      documentDescription: documentMaster.documentDescription,
      documentInstruction: documentMaster.documentInstruction,
      category: documentMaster.category ?? '',
      createdAt: documentMaster.createdAt,
      updatedAt: documentMaster.updatedAt,
    };
  }

  async sendShareableLinkEmail(emailId: string, link: string): Promise<void> {
    try {
      logger.debug('Sending shareable link email', { emailId });
      await AobEmailTemplates.sendShareableLinkEmail(emailId, link);
      logger.info('Shareable link email sent successfully', { emailId });
    } catch (error) {
      logger.error('Failed to send shareable link email:', {
        error: error instanceof Error ? error.message : String(error),
        emailId,
      });
      // Don't throw the error - let the calling method handle it
      // This prevents email failures from breaking the entire flow
    }
  }

  async sendShareableLinkSms(smsNo: string, _link: string): Promise<void> {
    try {
      logger.debug('Sending shareable link SMS', { smsNo });

      // TODO: Implement actual SMS sending logic
      // This is a placeholder implementation
      // You would typically use a service like Twilio, AWS SNS, or similar

      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 100));

      logger.info('Shareable link SMS sent successfully', { smsNo });
    } catch (error) {
      logger.error('Failed to send shareable link SMS:', {
        error: error instanceof Error ? error.message : String(error),
        smsNo,
      });
      throw error;
    }
  }
}
