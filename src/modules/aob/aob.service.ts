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

export class AobService {
  private aobRepository: AobRepository;
  private s3Client: S3Client;

  constructor() {
    this.aobRepository = new AobRepository();
    this.s3Client = new S3Client({
      region: 'ap-southeast-1',
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
    documentStatus: 'approve' | 'reject' | 'documentSubmitted',
    file: Express.Multer.File,
  ): Promise<{ document: any }> {
    try {
      // Validate document type exists in master
      const documentMaster =
        await this.aobRepository.findDocumentMasterByType(documentType);
      if (!documentMaster) {
        throw new Error('Invalid document type');
      }

      // Validate application exists
      const application = await AobApplicationModel.findOne({ documentId });
      if (!application) {
        throw new Error('Application not found');
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

      // Create history record if document is rejected
      if (documentStatus === 'reject') {
        await AobDocumentHistoryModel.create({
          documentId,
          applicationId: application.applicationId,
          documentStatus,
          documentType,
          documentFormat: documentFormat as 'pdf' | 'png' | 'jpg',
          documentName: file.originalname,
          presignedS3Url: s3Url,
          s3Key,
        });

        // Check if document type already exists in qcAndDiscrepencyList
        const existingDiscrepancy = application.qcAndDiscrepencyList.find(
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
                'qcAndDiscrepencyList.$.createdAt': new Date(),
              },
            },
          );
        }
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

      // Generate OTP
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
  ): Promise<{ success: boolean; message: string }> {
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

      return {
        success: true,
        message: 'Email is verified',
      };
    } catch (error) {
      logger.error('Failed to verify email OTP:', { error, emailId });
      throw error;
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
}
