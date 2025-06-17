import { Router } from 'express';
import {
  AobController,
  createApplication,
  listApplications,
  updateApplication,
  patchApplication,
  uploadDocument,
  getQcHistoryList,
} from './aob.controller';
import multer from 'multer';

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
 *         relatedToPhillifeEmployee:
 *           type: boolean
 *           example: true
 *         relatedToPhillifeEmployeeName:
 *           type: string
 *           example: "Jane Smith"
 *         relatedToPhillifeEmployeeRelationShip:
 *           type: string
 *           example: "Sister"
 *         applicationStatus:
 *           type: string
 *           enum: [applicationSubmitted, underReview, rejected, approved, returned]
 *           example: "applicationSubmitted"
 *         rejectRemark:
 *           type: string
 *           example: ""
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
 *           enum: [applicationSubmitted, underReview, rejected, approved, returned]
 *           example: "approved"
 *         remarks:
 *           type: string
 *           example: "Application is being reviewed"
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
 *           enum: [approve, reject, documentSubmitted]
 *           example: "approve"
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
 *                 enum: [approve, reject, documentSubmitted]
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
 */

/**
 * @swagger
 * /api/aobDocumentMaster:
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

// Application routes
/**
 * @swagger
 * /api/aob/application:
 *   get:
 *     summary: List all AOB applications
 *     tags: [AOB]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of applications retrieved successfully
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
 *                     $ref: '#/components/schemas/AobApplication'
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
 *       400:
 *         description: Bad request
 *       404:
 *         description: Application not found
 *       500:
 *         description: Internal server error
 */
router.patch('/application/:applicationId', patchApplication);

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
 * /api/aob:
 *   get:
 *     summary: Get all AOB document masters
 *     tags: [AOB]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of document masters retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentMasterResponse'
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

export default router;
