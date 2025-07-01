import { Router } from 'express';
import type { RequestHandler } from 'express';
import {
  AobController,
  createApplication,
  listApplications,
  updateApplication,
  patchApplication,
  uploadDocument,
  getQcHistoryList,
  batchUpdateDocumentStatus,
} from './aob.controller';
import multer from 'multer';
import { ValidationPipe } from '@/common/pipes/validation.pipe';
import { BatchUpdateDocumentStatusDto } from './dto/batch-update-document-status.dto';
import { DocumentDetailsQueryDto } from './dto/document-details.dto';
import { QcDiscrepancyUpdateDto } from './dto/qc-discrepancy-update.dto';
import { ApplicationPatchDto } from './dto/application-patch.dto';

const router = Router();
const aobController = new AobController();

// Constants for file size limits
const FILE_SIZE_LIMIT_MB = 5;
const BYTES_IN_MB = 1024 * 1024;

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: FILE_SIZE_LIMIT_MB * BYTES_IN_MB, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, PNG, and JPG are allowed'));
    }
  },
});

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateAobDocumentMasterDto:
 *       type: object
 *       required:
 *         - documentName
 *         - documentType
 *         - documentDescription
 *         - documentInstruction
 *       properties:
 *         documentName:
 *           type: string
 *           description: Name of the document
 *           example: "Examination Result (IC Or IIAP) (1 Page)"
 *         documentType:
 *           type: string
 *           description: Type identifier for the document
 *           example: "examResult"
 *         documentDescription:
 *           type: string
 *           description: Detailed description of the document
 *           example: "Examination result from Insurance Commission or IIAP"
 *         documentInstruction:
 *           type: string
 *           description: Instructions for submitting this document
 *           example: "Maximum 5 MB. PDF, PNG or JPG files"
 *         category:
 *           type: string
 *           description: Document category for grouping (optional)
 *           example: ""
 *
 *     BulkCreateAobDocumentMasterDto:
 *       type: object
 *       required:
 *         - documents
 *       properties:
 *         documents:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CreateAobDocumentMasterDto'
 *           description: Array of document masters to create
 *
 *     AobDocumentMasterResponseDto:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier
 *         documentName:
 *           type: string
 *           description: Name of the document
 *         documentType:
 *           type: string
 *           description: Type identifier for the document
 *         documentDescription:
 *           type: string
 *           description: Detailed description of the document
 *         documentInstruction:
 *           type: string
 *           description: Instructions for submitting this document
 *         category:
 *           type: string
 *           description: Document category for grouping
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *
 *     AobApplication:
 *       type: object
 *       required:
 *         - emailAddress
 *         - mobileNumber
 *       properties:
 *         firstName:
 *           type: string
 *           example: "John"
 *         middleName:
 *           type: string
 *           example: "Robert"
 *         lastName:
 *           type: string
 *           example: "Doe"
 *         emailAddress:
 *           type: string
 *           format: email
 *           example: "john.doe1@example.com"
 *         mobileNumber:
 *           type: string
 *           example: "+1234567891"
 *         address:
 *           type: string
 *           example: "123 Main St, City, Country"
 *         passedLifeInsuranceExam:
 *           type: boolean
 *           example: true
 *         passedLifeInsuranceExamRating:
 *           type: string
 *           example: "85"
 *         passedLifeInsuranceExamDateOfExam:
 *           type: string
 *           format: date
 *           example: "2024-03-15"
 *         passedLifeInsuranceExamVenueOfExam:
 *           type: string
 *           example: "Main Testing Center"
 *         hasLifeInsuranceCompany:
 *           type: boolean
 *           example: true
 *         hasLifeInsuranceCompanyName:
 *           type: string
 *           example: "ABC Insurance Co."
 *         hasNonLifeInsuranceCompany:
 *           type: boolean
 *           example: false
 *         hasNonLifeInsuranceCompanyName:
 *           type: string
 *           example: ""
 *         hasVariableInsuranceCompany:
 *           type: boolean
 *           example: false
 *         hasVariableInsuranceCompanyName:
 *           type: string
 *           example: ""
 *         relatedToEmployee:
 *           type: boolean
 *           example: true
 *         relatedToEmployeeName:
 *           type: string
 *           example: "Jane Smith"
 *         relatedToEmployeeRelationShip:
 *           type: string
 *           example: "Sister"
 *         applicationStatus:
 *           type: string
 *           enum: [applicationSubmitted, underReview, rejected, qcRejected, approved, returned]
 *           example: "applicationSubmitted"
 *         rejectRemark:
 *           type: string
 *           example: ""
 *         projectId:
 *           type: string
 *           description: Reference to the project
 *           example: "507f1f77bcf86cd799439011"
 *         qcAndDiscrepencyList:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               documentType:
 *                 type: string
 *                 example: "examResult"
 *               documentName:
 *                 type: string
 *                 example: "Life Insurance Exam Result"
 *               documentFormat:
 *                 type: string
 *                 enum: [pdf, png, jpg]
 *                 example: "pdf"
 *               remarks:
 *                 type: string
 *                 example: "Document verified and approved"
 *               type:
 *                 type: string
 *                 example: "additional_info"
 *               infoName:
 *                 type: string
 *                 example: "Additional Information"
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-06-16T09:03:15.688Z"
 *               _id:
 *                 type: string
 *                 example: "684fddd3da58a898bc521415"
 *     ApplicationPatchRequest:
 *       type: object
 *       required:
 *         - type
 *         - status
 *       properties:
 *         type:
 *           type: string
 *           enum: [document, application]
 *           example: "application"
 *         status:
 *           type: string
 *           enum: [applicationSubmitted, underReview, rejected, qcRejected, approved, returned]
 *           example: "approved"
 *         remarks:
 *           type: string
 *           example: "Application is being reviewed"
 *         projectId:
 *           type: string
 *           description: Reference to the project
 *           example: "507f1f77bcf86cd799439011"
 *     DocumentUploadRequest:
 *       type: object
 *       required:
 *         - documentId
 *         - documentType
 *         - file
 *         - documentFormat
 *         - documentStatus
 *       properties:
 *         documentId:
 *           type: string
 *           example: "84bd4fd3-2af4-4dfc-ad11-4fd70b36941f"
 *         documentType:
 *           type: string
 *           example: "examResult"
 *         file:
 *           type: string
 *           format: binary
 *         documentFormat:
 *           type: string
 *           enum: [pdf, png, jpg]
 *           example: "pdf"
 *         documentStatus:
 *           type: string
 *           enum: [approve, reject, qcReject, documentSubmitted]
 *           example: "approve"
 *         projectId:
 *           type: string
 *           description: Reference to the project
 *           example: "507f1f77bcf86cd799439011"
 *     QcHistoryResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 example: "684fdde5da58a898bc52141d"
 *               presignedS3Url:
 *                 type: string
 *                 example: "https://salesverse-inxt-public-documents-20250531.s3.ap-southeast-1.amazonaws.com/81b8b867-2286-4404-a30c-87e1443edee5.jpg"
 *               documentId:
 *                 type: string
 *                 example: "84bd4fd3-2af4-4dfc-ad11-4fd70b36941f"
 *               applicationId:
 *                 type: string
 *                 example: "APP17500051476209013"
 *               documentStatus:
 *                 type: string
 *                 enum: [approve, reject, qcReject, documentSubmitted]
 *                 example: "reject"
 *               documentType:
 *                 type: string
 *                 example: "sssDocument"
 *               documentFormat:
 *                 type: string
 *                 enum: [pdf, png, jpg]
 *                 example: "jpg"
 *               documentName:
 *                 type: string
 *                 example: "4047.jpg"
 *               s3Key:
 *                 type: string
 *                 example: "81b8b867-2286-4404-a30c-87e1443edee5.jpg"
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-06-16T09:03:33.348Z"
 *               updatedAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-06-16T09:03:33.348Z"
 *     DocumentMasterResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Successfully fetched all document masters."
 *         data:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 example: "684ac68e7277c627ebe34746"
 *               documentName:
 *                 type: string
 *                 example: "Accomplished IC Application (4 Pages)"
 *               documentType:
 *                 type: string
 *                 example: "icApplicationForm"
 *               documentDescription:
 *                 type: string
 *                 example: "IC application form for agent registration"
 *               documentInstruction:
 *                 type: string
 *                 example: "Download form here\nMaximum 5 MB. PDF file only"
 *               category:
 *                 type: string
 *                 example: ""
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-06-12T12:22:38.816Z"
 *               updatedAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-06-12T12:22:38.816Z"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2025-06-17T09:15:54.964Z"
 *     ApplicantLoginRequest:
 *       type: object
 *       required:
 *         - emailId
 *       properties:
 *         emailId:
 *           type: string
 *           format: email
 *           example: "john.doe2@examplse.com"
 *     ApplicantLoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Application not found"
 *         data:
 *           type: object
 *           properties:
 *             exists:
 *               type: boolean
 *               example: false
 *     OtpVerificationRequest:
 *       type: object
 *       required:
 *         - emailId
 *         - otp
 *       properties:
 *         emailId:
 *           type: string
 *           format: email
 *           example: "john.doe2@exsample.com"
 *         otp:
 *           type: string
 *           example: "3003"
 *     EmailVerificationResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "OTP sent to testdoe2@example.com"
 *     EmailOtpVerificationResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Email is verified"
 *         applicationStatus:
 *           type: string
 *           enum: [applicationSubmitted, underReview, rejected, qcRejected, approved, returned]
 *           example: "approved"
 *         rejectionReason:
 *           type: string
 *           example: "Missing required documents"
 *     BatchUpdateDocumentStatusRequest:
 *       type: object
 *       required:
 *         - applicationId
 *         - documents
 *       properties:
 *         applicationId:
 *           type: string
 *           description: The application ID
 *           example: "APP17500051476209013"
 *         projectId:
 *           type: string
 *           description: Reference to the project (optional)
 *           example: "507f1f77bcf86cd799439011"
 *         documents:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - _id
 *               - documentId
 *               - documentStatus
 *             properties:
 *               _id:
 *                 type: string
 *                 description: The MongoDB ObjectId of the document
 *                 example: "507f1f77bcf86cd799439011"
 *               documentId:
 *                 type: string
 *                 description: The document ID
 *                 example: "84bd4fd3-2af4-4dfc-ad11-4fd70b36941f"
 *               documentType:
 *                 type: string
 *                 description: Type of the document (optional)
 *                 example: "examResult"
 *               documentName:
 *                 type: string
 *                 description: Name of the document (optional)
 *                 example: "Life Insurance Exam Result"
 *               status:
 *                 type: string
 *                 enum: [approve, reject, qcReject]
 *                 description: The status to set for the document
 *                 example: "approve"
 *               remarks:
 *                 type: string
 *                 description: Optional remarks (required for reject status)
 *                 example: "Document is not clear"
 *               type:
 *                 type: string
 *                 description: Optional type information
 *                 example: "additional_info"
 *               infoName:
 *                 type: string
 *                 description: Optional information name
 *                 example: "Additional Information"
 *         updateApplicationStatus:
 *           type: boolean
 *           description: Whether to automatically update the application status based on document statuses
 *           example: true
 *     BatchUpdateDocumentStatusResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Documents status updated successfully"
 *         data:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *               example: true
 *             results:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: "507f1f77bcf86cd799439011"
 *                   documentId:
 *                     type: string
 *                     example: "84bd4fd3-2af4-4dfc-ad11-4fd70b36941f"
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   status:
 *                     type: string
 *                     example: "approve"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2025-06-17T09:15:54.964Z"
 *     DocumentDetailsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Document details retrieved successfully"
 *         data:
 *           type: object
 *           properties:
 *             document:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: "684fdde5da58a898bc52141d"
 *                 presignedS3Url:
 *                   type: string
 *                   example: "https://salesverse-inxt-public-documents-20250531.s3.ap-southeast-1.amazonaws.com/81b8b867-2286-4404-a30c-87e1443edee5.jpg"
 *                 documentId:
 *                   type: string
 *                   example: "84bd4fd3-2af4-4dfc-ad11-4fd70b36941f"
 *                 applicationId:
 *                   type: string
 *                   example: "APP17500051476209013"
 *                 documentStatus:
 *                   type: string
 *                   enum: [approve, reject, qcReject, documentSubmitted]
 *                   example: "reject"
 *                 documentType:
 *                   type: string
 *                   example: "sssDocument"
 *                 documentFormat:
 *                   type: string
 *                   enum: [pdf, png, jpg]
 *                   example: "jpg"
 *                 documentName:
 *                   type: string
 *                   example: "4047.jpg"
 *                 s3Key:
 *                   type: string
 *                   example: "81b8b867-2286-4404-a30c-87e1443edee5.jpg"
 *             history:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   documentId:
 *                     type: string
 *                   documentStatus:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *             discrepancy:
 *               type: object
 *               nullable: true
 *               properties:
 *                 documentType:
 *                   type: string
 *                 documentName:
 *                   type: string
 *                 remarks:
 *                   type: string
 *             application:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 applicationId:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 emailAddress:
 *                   type: string
 *                 mobileNumber:
 *                   type: string
 *                 applicationStatus:
 *                   type: string
 *                   enum: [applicationSubmitted, underReview, rejected, qcRejected, approved, returned]
 *                   example: "applicationSubmitted"
 *                 projectId:
 *                   type: string
 *         timestamp:
 *           type: string
 *           format: date-time
 *     QcDiscrepancyUpdateRequest:
 *       type: object
 *       required:
 *         - applicationId
 *         - documents
 *       properties:
 *         applicationId:
 *           type: string
 *           description: The application ID
 *           example: "APP17500051476209013"
 *         projectId:
 *           type: string
 *           description: Reference to the project (optional)
 *           example: "507f1f77bcf86cd799439011"
 *         documents:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - documentId
 *               - status
 *             properties:
 *               documentId:
 *                 type: string
 *                 description: The document ID
 *                 example: "84bd4fd3-2af4-4dfc-ad11-4fd70b36941f"
 *               documentType:
 *                 type: string
 *                 description: Type of the document (optional)
 *                 example: "examResult"
 *               documentName:
 *                 type: string
 *                 description: Name of the document (optional)
 *                 example: "Life Insurance Exam Result"
 *               status:
 *                 type: string
 *                 enum: [approve, reject, qcReject]
 *                 description: The status to set for the document
 *                 example: "approve"
 *               remarks:
 *                 type: string
 *                 description: Remarks for the document (required for reject status)
 *                 example: "Document is not clear"
 *               type:
 *                 type: string
 *                 description: Optional type information
 *                 example: "additional_info"
 *               infoName:
 *                 type: string
 *                 description: Optional information name
 *                 example: "Additional Information"
 *         updateApplicationStatus:
 *           type: boolean
 *           description: Whether to automatically update the application status based on document statuses
 *           example: true
 *     QcDiscrepancyUpdateResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "QC discrepancies updated successfully"
 *         data:
 *           type: object
 *           properties:
 *             applicationId:
 *               type: string
 *               example: "APP17500051476209013"
 *             applicationStatus:
 *               type: string
 *               example: "approved"
 *             updatedDocuments:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   documentId:
 *                     type: string
 *                     example: "84bd4fd3-2af4-4dfc-ad11-4fd70b36941f"
 *                   status:
 *                     type: string
 *                     example: "approve"
 *                   remarks:
 *                     type: string
 *                     example: "Document verified successfully"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2025-06-19T14:23:29.221Z"
 *     ApplicationApprovalResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Application approved and agent created successfully"
 *         data:
 *           type: object
 *           properties:
 *             application:
 *               $ref: '#/components/schemas/AobApplication'
 *             agent:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: "507f1f77bcf86cd799439011"
 *                 agentCode:
 *                   type: string
 *                   example: "IC00001"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2025-06-19T14:23:29.221Z"
 */

/**
 * @swagger
 * /api/aob:
 *   post:
 *     summary: Create bulk AOB document masters
 *     description: Create multiple AOB document master entries at once. Supports both direct array format and wrapped object format.
 *     tags: [AOB]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: array
 *                 items:
 *                   $ref: '#/components/schemas/CreateAobDocumentMasterDto'
 *                 description: Direct array of document masters
 *               - $ref: '#/components/schemas/BulkCreateAobDocumentMasterDto'
 *                 description: Object with documents array property
 *           examples:
 *             directArray:
 *               summary: Direct Array Format
 *               value:
 *                 - documentName: "Examination Result (IC Or IIAP) (1 Page)"
 *                   documentType: "examResult"
 *                   documentDescription: "Examination result from Insurance Commission or IIAP"
 *                   documentInstruction: "Maximum 5 MB. PDF, PNG or JPG files"
 *                   category: ""
 *                 - documentName: "Accomplished IC Application (4 Pages)"
 *                   documentType: "icApplicationForm"
 *                   documentDescription: "IC application form for agent registration"
 *                   documentInstruction: "Download form here\\nMaximum 5 MB. PDF file only"
 *                   category: ""
 *             wrappedObject:
 *               summary: Wrapped Object Format
 *               value:
 *                 documents:
 *                   - documentName: "Examination Result (IC Or IIAP) (1 Page)"
 *                     documentType: "examResult"
 *                     documentDescription: "Examination result from Insurance Commission or IIAP"
 *                     documentInstruction: "Maximum 5 MB. PDF, PNG or JPG files"
 *                     category: ""
 *                   - documentName: "Accomplished IC Application (4 Pages)"
 *                     documentType: "icApplicationForm"
 *                     documentDescription: "IC application form for agent registration"
 *                     documentInstruction: "Download form here\\nMaximum 5 MB. PDF file only"
 *                     category: ""
 *     responses:
 *       201:
 *         description: Document masters created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Successfully created 12 document masters"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AobDocumentMasterResponseDto'
 *       400:
 *         description: Bad request - validation error or invalid format
 *       500:
 *         description: Internal server error
 */
router.post('/', aobController.createBulkDocumentMasters);

/**
 * @swagger
 * /api/aob/application/qcHistoryList:
 *   get:
 *     summary: Get QC history list for a document
 *     tags: [AOB]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *         example: "84bd4fd3-2af4-4dfc-ad11-4fd70b36941f"
 *     responses:
 *       200:
 *         description: Successfully retrieved QC history
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QcHistoryResponse'
 *       400:
 *         description: Bad request - Document ID is required
 *       500:
 *         description: Internal server error
 */
router.get('/application/qcHistoryList', getQcHistoryList);

/**
 * @swagger
 * /api/aob/document/batch:
 *   post:
 *     summary: Batch update document statuses
 *     tags: [AOB]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BatchUpdateDocumentStatusRequest'
 *     responses:
 *       200:
 *         description: Documents status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BatchUpdateDocumentStatusResponse'
 *       400:
 *         description: Bad request - missing required fields or invalid data
 *       404:
 *         description: Application not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/document/batch',
  ValidationPipe.validateBody(BatchUpdateDocumentStatusDto),
  batchUpdateDocumentStatus,
);

/**
 * @swagger
 * /api/aob/document/details:
 *   get:
 *     summary: Get document details by application ID and document ID
 *     tags: [AOB]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *         description: The application ID
 *         example: "APP17500051476209013"
 *       - in: query
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The document ID
 *         example: "84bd4fd3-2af4-4dfc-ad11-4fd70b36941f"
 *     responses:
 *       200:
 *         description: Document details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentDetailsResponse'
 *       400:
 *         description: Bad request - missing required parameters
 *       404:
 *         description: Application or document not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/document/details',
  ValidationPipe.validateQuery(DocumentDetailsQueryDto),
  (req, res) => aobController.getDocumentDetails(req, res),
);

/**
 * @swagger
 * /api/aob/application:
 *   get:
 *     summary: List all AOB applications with pagination
 *     tags: [AOB]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of items to skip for pagination
 *         example: 0
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items to return
 *         example: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by application status
 *         example: "applicationSubmitted"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in firstName, lastName, emailAddress, or mobileNumber
 *         example: "john"
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: List of applications retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/application', listApplications);

/**
 * @swagger
 * /api/aob/application:
 *   post:
 *     summary: Create a new AOB application
 *     tags: [AOB]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AobApplication'
 *     responses:
 *       201:
 *         description: Application created successfully
 *       400:
 *         description: Bad request - validation error
 *       500:
 *         description: Internal server error
 */
router.post('/application', createApplication);

/**
 * @swagger
 * /api/aob/application/{id}:
 *   put:
 *     summary: Update an AOB application
 *     tags: [AOB]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "684bc362f3aa4ec49153242d"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AobApplication'
 *     responses:
 *       200:
 *         description: Application updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Application not found
 *       500:
 *         description: Internal server error
 */
router.put('/application/:id', updateApplication);

/**
 * @swagger
 * /api/aob/application/{applicationId}:
 *   patch:
 *     summary: Patch an AOB application
 *     tags: [AOB]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *         example: "APP17500051476209013"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApplicationPatchRequest'
 *     responses:
 *       200:
 *         description: Application patched successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     data:
 *                       $ref: '#/components/schemas/AobApplication'
 *                 - $ref: '#/components/schemas/ApplicationApprovalResponse'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Application not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/application/:applicationId',
  ValidationPipe.validateBody(ApplicationPatchDto),
  patchApplication,
);

/**
 * @swagger
 * /api/aob/document:
 *   patch:
 *     summary: Upload a document for an AOB application
 *     tags: [AOB]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/DocumentUploadRequest'
 *     responses:
 *       200:
 *         description: Document uploaded successfully
 *       400:
 *         description: Invalid request (missing required fields, invalid format, or file extension mismatch)
 *       500:
 *         description: Server error
 */
router.patch('/document', upload.single('file'), uploadDocument);

/**
 * @swagger
 * /api/aob/applicantLogin:
 *   post:
 *     summary: Check if an AOB application exists and send OTP
 *     tags: [AOB]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApplicantLoginRequest'
 *     responses:
 *       200:
 *         description: OTP sent successfully or application not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApplicantLoginResponse'
 *       400:
 *         description: Bad request - Email ID is required
 *       500:
 *         description: Internal server error
 */
router.post('/applicantLogin', (req, res, next) =>
  aobController.checkApplicantExists(req, res, next),
);

/**
 * @swagger
 * /api/aob/applicantOtpValidate:
 *   post:
 *     summary: Validate OTP for an AOB application
 *     tags: [AOB]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OtpVerificationRequest'
 *     responses:
 *       200:
 *         description: OTP validation result
 *       400:
 *         description: Bad request - Email ID and OTP are required
 *       500:
 *         description: Internal server error
 */
router.post('/applicantOtpValidate', (req, res, next) =>
  aobController.validateOtp(req, res, next),
);

/**
 * @swagger
 * /api/aob/resendOtp:
 *   post:
 *     summary: Resend OTP for an AOB application
 *     tags: [AOB]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailId
 *             properties:
 *               emailId:
 *                 type: string
 *                 format: email
 *                 example: "john.doe2@example.com"
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       400:
 *         description: Bad request - Email ID is required
 *       500:
 *         description: Internal server error
 */
router.post('/resendOtp', (req, res, next) =>
  aobController.resendOtp(req, res, next),
);

/**
 * @swagger
 * /api/aob/emailVerification:
 *   get:
 *     summary: Send email verification OTP
 *     tags: [AOB]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: emailId
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         example: "testdoe2@example.com"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmailVerificationResponse'
 *       400:
 *         description: Bad request - Email ID is required
 *       500:
 *         description: Internal server error
 */
router.get('/emailVerification', (req, res, next) =>
  aobController.sendEmailVerificationOtp(req, res, next),
);

/**
 * @swagger
 * /api/aob/emailOtpVerification:
 *   post:
 *     summary: Verify email with OTP
 *     tags: [AOB]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OtpVerificationRequest'
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmailOtpVerificationResponse'
 *       400:
 *         description: Bad request - Invalid OTP or missing fields
 *       500:
 *         description: Internal server error
 */
router.post('/emailOtpVerification', (req, res, next) =>
  aobController.verifyEmailOtp(req, res, next),
);

/**
 * @swagger
 * /api/aob/emailVerification:
 *   get:
 *     summary: Send email verification OTP
 *     tags: [AOB]
 *     parameters:
 *       - in: query
 *         name: emailId
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email address to verify
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Bad request - Email ID is required
 *       500:
 *         description: Internal server error
 */
router.get('/emailVerification', (req, res, next) =>
  aobController.sendEmailVerificationOtp(req, res, next),
);

/**
 * @swagger
 * /api/aob/emailOtpVerification:
 *   post:
 *     summary: Verify email with OTP
 *     tags: [AOB]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailId
 *               - otp
 *             properties:
 *               emailId:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Bad request - Invalid OTP or missing fields
 *       500:
 *         description: Internal server error
 */
router.post('/emailOtpVerification', (req, res, next) =>
  aobController.verifyEmailOtp(req, res, next),
);

/**
 * @swagger
 * /api/aob/getApplication:
 *   get:
 *     summary: Get a single AOB application by ID
 *     tags: [AOB]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *         example: "684ef59b6ff9725db37fc149"
 *     responses:
 *       200:
 *         description: Application retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AobApplication'
 *       404:
 *         description: Application not found
 *       500:
 *         description: Internal server error
 */
router.get('/', (req, res) => {
  if (req.query.category) {
    return aobController.getDocumentMastersByCategory(req, res);
  }
  return aobController.getAllDocumentMasters(req, res);
});

/**
 * @swagger
 * /api/aob/getApplication:
 *   get:
 *     summary: Get a single AOB application by ID
 *     tags: [AOB]
 *     parameters:
 *       - in: query
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the application to retrieve
 *     responses:
 *       200:
 *         description: Application retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   description: Application data
 *       404:
 *         description: Application not found
 *       500:
 *         description: Internal server error
 */
router.get('/getApplication', (req, res, next) =>
  aobController.getApplicationById(req, res, next),
);

/**
 * @swagger
 * /api/aob/{id}:
 *   get:
 *     summary: Get AOB document master by ID
 *     tags: [AOB]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the document master to retrieve
 *     responses:
 *       200:
 *         description: Document master retrieved successfully
 *       404:
 *         description: Document master not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', (req, res) => aobController.getDocumentMasterById(req, res));

/**
 * @swagger
 * /api/aob/applicantLogin:
 *   post:
 *     summary: Check if an AOB application exists and send OTP
 *     tags: [AOB]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailId
 *             properties:
 *               emailId:
 *                 type: string
 *                 format: email
 *                 description: Email address of the applicant
 *     responses:
 *       200:
 *         description: OTP sent successfully or application not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP is sent to applicant@example.com"
 *                 data:
 *                   type: object
 *                   properties:
 *                     exists:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Bad request - Email ID is required
 *       500:
 *         description: Internal server error
 */
router.post('/applicantLogin', (req, res, next) =>
  aobController.checkApplicantExists(req, res, next),
);

/**
 * @swagger
 * /api/aob/applicantOtpValidate:
 *   post:
 *     summary: Validate OTP for an AOB application
 *     tags: [AOB]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailId
 *               - otp
 *             properties:
 *               emailId:
 *                 type: string
 *                 format: email
 *                 description: Email address of the applicant
 *               otp:
 *                 type: string
 *                 description: OTP received by the applicant
 *     responses:
 *       200:
 *         description: OTP validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Applicant is verified"
 *                 data:
 *                   type: object
 *                   properties:
 *                     verified:
 *                       type: boolean
 *                       example: true
 *                     applicationData:
 *                       type: object
 *                       description: Application data if verified
 *       400:
 *         description: Bad request - Email ID and OTP are required
 *       500:
 *         description: Internal server error
 */
router.post('/applicantOtpValidate', (req, res, next) =>
  aobController.validateOtp(req, res, next),
);

/**
 * @swagger
 * /api/aob/resendOtp:
 *   post:
 *     summary: Resend OTP for an AOB application
 *     tags: [AOB]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailId
 *             properties:
 *               emailId:
 *                 type: string
 *                 format: email
 *                 description: Email address of the applicant
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP is resent to applicant@example.com"
 *       400:
 *         description: Bad request - Email ID is required
 *       500:
 *         description: Internal server error
 */
router.post('/resendOtp', (req, res, next) =>
  aobController.resendOtp(req, res, next),
);

/**
 * @swagger
 * /api/aob/document/qc-update:
 *   post:
 *     summary: Update QC discrepancies and document statuses
 *     description: |
 *       Updates document statuses and QC discrepancies for an application.
 *       Can optionally update the application status based on document statuses.
 *       - If all documents are approved, application status can be set to 'approved'
 *       - If any document is rejected, application status can be set to 'returned'
 *     tags: [AOB]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QcDiscrepancyUpdateRequest'
 *     responses:
 *       200:
 *         description: QC discrepancies updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QcDiscrepancyUpdateResponse'
 *       400:
 *         description: Bad request - missing required fields or invalid data
 *       404:
 *         description: Application or document not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/document/qc-update',
  ValidationPipe.validateBody(QcDiscrepancyUpdateDto),
  (req, res) => aobController.updateQcDiscrepancies(req, res),
);

/**
 * @swagger
 * /api/aob/shareableLink:
 *   post:
 *     summary: Send shareable link via email or SMS
 *     tags: [AOB]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - link
 *               - notifyType
 *             properties:
 *               link:
 *                 type: string
 *                 description: The shareable link to send
 *                 example: "https://example.com/shareable-link"
 *               notifyType:
 *                 type: string
 *                 enum: [email, sms]
 *                 description: Type of notification to send
 *                 example: "email"
 *               emailId:
 *                 type: string
 *                 format: email
 *                 description: Email address (required when notifyType is email)
 *                 example: "user@example.com"
 *               smsNo:
 *                 type: string
 *                 description: SMS number (required when notifyType is sms)
 *                 example: "+1234567890"
 *     responses:
 *       200:
 *         description: Notification sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Successful mail has been sent"
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifyType:
 *                       type: string
 *                       example: "email"
 *                     recipient:
 *                       type: string
 *                       example: "user@example.com"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-01-27T10:30:00.000Z"
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Email ID is required when notify type is email"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Internal server error
 */
router.post(
  '/shareableLink',
  aobController.shareableLink.bind(aobController) as unknown as RequestHandler,
);

export default router;
