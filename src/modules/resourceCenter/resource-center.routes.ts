import { Router } from 'express';
import type { RequestHandler } from 'express';
import { ResourceCenterController } from './resource-center.controller';
import multer from 'multer';
import { ValidationPipe } from '@/common/pipes/validation.pipe';
import { ResourceCenterShareableLinkDto } from './dto/shareable-link.dto';

/**
 * @swagger
 * tags:
 *   name: Resource Center
 *   description: Resource center management endpoints
 */

const router = Router();
const resourceCenterController = new ResourceCenterController();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'video/mp4',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error('Invalid file type. Only PDF, PNG, JPG, and MP4 are allowed'),
      );
    }
  },
});

/**
 * @swagger
 * /api/resourceCenter/tag:
 *   post:
 *     summary: Create a new tag
 *     tags: [Resource Center]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tagName
 *             properties:
 *               tagName:
 *                 type: string
 *                 description: Name of the tag (must be unique)
 *               updatedBy:
 *                 type: string
 *                 description: ID of the user who updated the tag
 *               createdBy:
 *                 type: string
 *                 description: ID of the user who created the tag
 *     responses:
 *       200:
 *         description: Tag created successfully
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
 *                   example: "Tag created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "68527b1a22ed614fdd3deed1"
 *                     tagName:
 *                       type: string
 *                       example: "Sales"
 *                     updatedBy:
 *                       type: string
 *                       example: "user123"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-06-18T08:38:50.679Z"
 *                     createdBy:
 *                       type: string
 *                       example: "user123"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-06-18T08:38:50.679Z"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-06-18T08:38:50.724Z"
 *       409:
 *         description: Tag with this name already exists
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
 *                   example: "Tag with name 'Sales' already exists"
 *                 error:
 *                   type: string
 *                   example: "Tag with name 'Sales' already exists"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-06-18T08:40:22.488Z"
 *       500:
 *         description: Internal server error
 */
router.post(
  '/tag',
  resourceCenterController.createTag.bind(
    resourceCenterController,
  ) as unknown as RequestHandler,
);

/**
 * @swagger
 * /api/resourceCenter/tag:
 *   get:
 *     summary: Get all tags
 *     tags: [Resource Center]
 *     responses:
 *       200:
 *         description: List of tags retrieved successfully
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
 *                   example: "Successfully fetched all tags."
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "68527bb222ed614fdd3deed6"
 *                       tagName:
 *                         type: string
 *                         example: "Admin"
 *                       updatedBy:
 *                         type: string
 *                         example: "user123"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-06-18T08:41:22.295Z"
 *                       createdBy:
 *                         type: string
 *                         example: "user123"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-06-18T08:41:22.295Z"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-06-18T08:41:41.737Z"
 *       500:
 *         description: Internal server error
 */
router.get(
  '/tag',
  resourceCenterController.getAllTags.bind(
    resourceCenterController,
  ) as unknown as RequestHandler,
);

/**
 * @swagger
 * /api/resourceCenter/tag/{id}:
 *   get:
 *     summary: Get a specific tag by ID
 *     tags: [Resource Center]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tag ID
 *     responses:
 *       200:
 *         description: Tag retrieved successfully
 *       404:
 *         description: Tag not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/tag/:id',
  resourceCenterController.getTagById.bind(
    resourceCenterController,
  ) as unknown as RequestHandler,
);

/**
 * @swagger
 * /api/resourceCenter:
 *   post:
 *     summary: Create a new resource center entry
 *     tags: [Resource Center]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - channelId
 *               - resourceCategory
 *               - subCategory
 *               - title
 *               - description
 *               - publish
 *               - tags
 *               - roles
 *             properties:
 *               channelId:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     channelId:
 *                       type: string
 *                       description: ObjectId of the channel
 *                     channelName:
 *                       type: string
 *                       description: Name of the channel
 *               resourceCategory:
 *                 type: string
 *                 description: ObjectId referencing the resources collection
 *               subCategory:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Videos, PDF, Article, Infographics]
 *                 description: Sub categories (case-insensitive, will be converted to uppercase)
 *               isActive:
 *                 type: boolean
 *                 default: false
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               documentId:
 *                 type: string
 *                 description: UUID (auto-generated if not provided)
 *               publish:
 *                 type: string
 *                 enum: [publish, draft]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     tagName:
 *                       type: string
 *                     tagId:
 *                       type: string
 *                       description: ObjectId referencing the tags collection
 *               roles:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     roleId:
 *                       type: string
 *                       description: ObjectId referencing the roles collection
 *                     roleName:
 *                       type: string
 *                       description: Name of the role
 *               files:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     s3Key:
 *                       type: string
 *                       description: S3 key for the file
 *                     s3Link:
 *                       type: string
 *                       description: S3 link for the file
 *                     documentFormat:
 *                       type: string
 *                       enum: [pdf, png, jpg, mp4]
 *                       description: Format of the document
 *                     isActive:
 *                       type: boolean
 *                       description: Whether the file is active
 *               updatedBy:
 *                 type: string
 *                 description: ObjectId of the user who updated
 *               createdBy:
 *                 type: string
 *                 description: ObjectId of the user who created
 *     responses:
 *       201:
 *         description: Resource center created successfully
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  resourceCenterController.createResourceCenter.bind(
    resourceCenterController,
  ) as unknown as RequestHandler,
);

/**
 * @swagger
 * /api/resourceCenter/{resourceCenterId}:
 *   put:
 *     summary: Update a resource center entry
 *     tags: [Resource Center]
 *     parameters:
 *       - in: path
 *         name: resourceCenterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource center ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               channelId:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     channelId:
 *                       type: string
 *                     channelName:
 *                       type: string
 *               resourceCategory:
 *                 type: string
 *               subCategory:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Videos, PDF, Article, Infographics]
 *                 description: Sub categories (case-insensitive, will be converted to uppercase)
 *               isActive:
 *                 type: boolean
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               publish:
 *                 type: string
 *                 enum: [publish, draft]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     tagName:
 *                       type: string
 *                     tagId:
 *                       type: string
 *               roles:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     roleId:
 *                       type: string
 *                       description: ObjectId referencing the roles collection
 *                     roleName:
 *                       type: string
 *                       description: Name of the role
 *               files:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: ObjectId of existing file (optional, for updating specific files)
 *                     s3Key:
 *                       type: string
 *                       description: S3 key for the file
 *                     s3Link:
 *                       type: string
 *                       description: S3 link for the file
 *                     documentFormat:
 *                       type: string
 *                       enum: [pdf, png, jpg, mp4]
 *                       description: Format of the document
 *                     isActive:
 *                       type: boolean
 *                       description: Whether the file is active
 *               updatedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resource center updated successfully
 *       404:
 *         description: Resource center not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/:resourceCenterId',
  resourceCenterController.updateResourceCenter.bind(
    resourceCenterController,
  ) as unknown as RequestHandler,
);

/**
 * @swagger
 * /api/resourceCenter/admin/list:
 *   get:
 *     summary: Get all resource center entries
 *     tags: [Resource Center]
 *     responses:
 *       200:
 *         description: List of resource centers retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get(
  '/admin/list',
  resourceCenterController.getAllResourceCenters.bind(
    resourceCenterController,
  ) as unknown as RequestHandler,
);

/**
 * @swagger
 * /api/resourceCenter/agent/list:
 *   get:
 *     summary: Get filtered resource center entries
 *     tags: [Resource Center]
 *     parameters:
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter by tag name
 *       - in: query
 *         name: contentType
 *         schema:
 *           type: string
 *           enum: [all, pdf, video, article, infographics]
 *         description: Filter by content type
 *     responses:
 *       200:
 *         description: Filtered resource centers retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get(
  '/agent/list',
  resourceCenterController.getResourceCentersByFilters.bind(
    resourceCenterController,
  ) as unknown as RequestHandler,
);
//  * @swagger
//  * /api/resourceCenter/agent/resourceCenter:
//  *   get:
//  *     summary: Get active and published resource centers for agents
//  *     tags: [Resource Center]
//  *     description: Retrieves resource centers that are active (isActive=true) and published (publish='publish') with optional filtering and pagination
//  *     parameters:
//  *       - in: query
//  *         name: tag
//  *         schema:
//  *           type: string
//  *         description: Filter by tag name
//  *       - in: query
//  *         name: contentType
//  *         schema:
//  *           type: string
//  *           enum: [all, pdf, video, article, infographics]
//  *         description: Filter by content type
//  *       - in: query
//  *         name: resourceCategory
//  *         schema:
//  *           type: string
//  *         description: Filter by resource category ObjectId
//  *       - in: query
//  *         name: skip
//  *         schema:
//  *           type: integer
//  *           default: 0
//  *         description: Number of items to skip for pagination
//  *         example: 0
//  *       - in: query
//  *         name: limit
//  *         schema:
//  *           type: integer
//  *           default: 10
//  *         description: Number of items to return
//  *         example: 10
//  *     responses:
//  *       200:
//  *         description: Active and published resource centers retrieved successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: true
//  *                 message:
//  *                   type: string
//  *                   example: "Successfully fetched filtered resource centers for agents."
//  *                 data:
//  *                   type: object
//  *                   properties:
//  *                     data:
//  *                       type: array
//  *                       items:
//  *                         type: object
//  *                         properties:
//  *                           _id:
//  *                             type: string
//  *                             example: "685523f2affd57912514e936"
//  *                           channelId:
//  *                             type: array
//  *                             items:
//  *                               type: object
//  *                               properties:
//  *                                 channelId:
//  *                                   type: string
//  *                                   example: "68542552674d4ac104c493d9"
//  *                                 channelName:
//  *                                   type: string
//  *                                   example: "Partner sales"
//  *                                 _id:
//  *                                   type: string
//  *                                   example: "685523f2affd57912514e937"
//  *                           resourceCategory:
//  *                             type: string
//  *                             example: "685521718a8e51c7360ce19a"
//  *                           subCategory:
//  *                             type: array
//  *                             items:
//  *                               type: string
//  *                             example: ["VIDEOS", "PDF"]
//  *                           isActive:
//  *                             type: boolean
//  *                             example: true
//  *                           title:
//  *                             type: string
//  *                             example: "Sales Training Guide"
//  *                           description:
//  *                             type: string
//  *                             example: "Comprehensive guide for sales training"
//  *                           documentId:
//  *                             type: string
//  *                             example: "8176964c-658a-46a1-8e7b-7b5c80667abd"
//  *                           publish:
//  *                             type: string
//  *                             enum: [publish, draft]
//  *                             example: "publish"
//  *                           tags:
//  *                             type: array
//  *                             items:
//  *                               type: object
//  *                               properties:
//  *                                 tagName:
//  *                                   type: string
//  *                                   example: "Demo"
//  *                                 tagId:
//  *                                   type: string
//  *                                   example: "685520468a8e51c7360ce189"
//  *                                 _id:
//  *                                   type: string
//  *                                   example: "685523f2affd57912514e938"
//  *                           roles:
//  *                             type: array
//  *                             items:
//  *                               type: object
//  *                               properties:
//  *                                 roleId:
//  *                                   type: string
//  *                                   example: "68540b1dd4e96e845ed3e822"
//  *                                 roleName:
//  *                                   type: string
//  *                                   example: "Channel Head"
//  *                                 _id:
//  *                                   type: string
//  *                                   example: "685523f2affd57912514e939"
//  *                           createdBy:
//  *                             type: string
//  *                             example: "507f1f77bcf86cd799439014"
//  *                           createdAt:
//  *                             type: string
//  *                             format: date-time
//  *                             example: "2025-06-20T09:03:46.343Z"
//  *                           updatedAt:
//  *                             type: string
//  *                             format: date-time
//  *                             example: "2025-06-20T09:03:46.343Z"
//  *                           documents:
//  *                             type: array
//  *                             items:
//  *                               type: object
//  *                             example: []
//  *                     total:
//  *                       type: integer
//  *                       description: Total number of items (before pagination)
//  *                       example: 1
//  *                     skip:
//  *                       type: integer
//  *                       description: Number of items skipped
//  *                       example: 0
//  *                     limit:
//  *                       type: integer
//  *                       description: Number of items returned
//  *                       example: 10
//  *                 timestamp:
//  *                   type: string
//  *                   format: date-time
//  *                   example: "2025-06-20T09:28:02.650Z"
//  *             example:
//  *               success: true
//  *               message: "Successfully fetched filtered resource centers for agents."
//  *               data:
//  *                 data:
//  *                   - _id: "685523f2affd57912514e936"
//  *                     channelId:
//  *                       - channelId: "68542552674d4ac104c493d9"
//  *                         channelName: "Partner sales"
//  *                         _id: "685523f2affd57912514e937"
//  *                     resourceCategory: "685521718a8e51c7360ce19a"
//  *                     subCategory: ["VIDEOS", "PDF"]
//  *                     isActive: true
//  *                     title: "Sales Training Guide"
//  *                     description: "Comprehensive guide for sales training"
//  *                     documentId: "8176964c-658a-46a1-8e7b-7b5c80667abd"
//  *                     publish: "publish"
//  *                     tags:
//  *                       - tagName: "Demo"
//  *                         tagId: "685520468a8e51c7360ce189"
//  *                         _id: "685523f2affd57912514e938"
//  *                     roles:
//  *                       - roleId: "68540b1dd4e96e845ed3e822"
//  *                         roleName: "Channel Head"
//  *                         _id: "685523f2affd57912514e939"
//  *                       - roleId: "68540b1dd4e96e845ed3e827"
//  *                         roleName: "Business Development Manager"
//  *                         _id: "685523f2affd57912514e93a"
//  *                     createdBy: "507f1f77bcf86cd799439014"
//  *                     createdAt: "2025-06-20T09:03:46.343Z"
//  *                     updatedAt: "2025-06-20T09:03:46.343Z"
//  *                     documents: []
//  *                 total: 1
//  *                 skip: 0
//  *                 limit: 10
//  *               timestamp: "2025-06-20T09:28:02.650Z"
//  *       500:
//  *         description: Internal server error
//  */
// router.get(
//   '/agent/resourceCenter',
//   resourceCenterController.getResourceCentersForAgents.bind(
//     resourceCenterController,
//   ) as unknown as RequestHandler,
// );

/**
 * @swagger
 * /api/resourceCenter/{resourceCenterId}:
 *   get:
 *     summary: Get Individual resource center with documents
 *     tags: [Resource Center]
 *     parameters:
 *       - in: path
 *         name: resourceCenterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource center ID
 *     responses:
 *       200:
 *         description: Resource center with documents retrieved successfully
 *       404:
 *         description: Resource center not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:resourceCenterId',
  resourceCenterController.getResourceCenterWithDocuments.bind(
    resourceCenterController,
  ) as unknown as RequestHandler,
);

/**
 * @swagger
 * /api/resourceCenter/document:
 *   post:
 *     summary: Create a resource center document with file upload
 *     tags: [Resource Center]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - resourceCenterId
 *               - documentType
 *               - file
 *             properties:
 *               resourceCenterId:
 *                 type: string
 *                 description: ObjectId of the resource center (documentId will be auto-fetched)
 *               documentType:
 *                 type: string
 *                 enum: [VIDEOS, PDF, ARTICLE, INFOGRAPHICS]
 *                 description: Document type (case-insensitive, will be converted to uppercase)
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload (PDF, PNG, JPG, MP4) - format will be automatically detected
 *               updatedBy:
 *                 type: string
 *                 description: ObjectId of the user who updated
 *               createdBy:
 *                 type: string
 *                 description: ObjectId of the user who created
 *     responses:
 *       201:
 *         description: Resource center document created successfully
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
 *                   example: "Resource center document created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "685296a9f97b9acc2dd94a73"
 *                     documentId:
 *                       type: string
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
 *                     s3Key:
 *                       type: string
 *                       example: "ba9c5956-ab2c-46a0-8656-e86b4d0edb41.pdf"
 *                     s3Link:
 *                       type: string
 *                       example: "https://salesverse-inxt-public-documents-20250531.s3.ap-southeast-1.amazonaws.com/ba9c5956-ab2c-46a0-8656-e86b4d0edb41.pdf"
 *                     documentType:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["PDF"]
 *                     documentFormat:
 *                       type: string
 *                       example: "pdf"
 *                     createdBy:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439014"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-06-18T10:36:25.298Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-06-18T11:07:18.762Z"
 *                     updatedBy:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439014"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-06-18T11:07:18.845Z"
 *       400:
 *         description: Bad request - Invalid file type, missing file, or invalid document type
 *       404:
 *         description: Resource center not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/document',
  upload.single('file'),
  resourceCenterController.createResourceCenterDocument.bind(
    resourceCenterController,
  ) as unknown as RequestHandler,
);

/**
 * @swagger
 * /api/resourceCenter/document:
 *   patch:
 *     summary: Update a resource center document with file upload
 *     tags: [Resource Center]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               documentType:
 *                 type: string
 *                 enum: [VIDEOS, PDF, ARTICLE, INFOGRAPHICS]
 *                 description: Document type (case-insensitive, will be converted to uppercase)
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload (PDF, PNG, JPG, MP4) - format will be automatically detected
 *               updatedBy:
 *                 type: string
 *                 description: ObjectId of the user who updated
 *     responses:
 *       200:
 *         description: Resource center document updated successfully
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
 *                   example: "Resource center document updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "685296a9f97b9acc2dd94a73"
 *                     documentId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439015"
 *                     s3Key:
 *                       type: string
 *                       example: "ba9c5956-ab2c-46a0-8656-e86b4d0edb41.pdf"
 *                     s3Link:
 *                       type: string
 *                       example: "https://salesverse-inxt-public-documents-20250531.s3.ap-southeast-1.amazonaws.com/ba9c5956-ab2c-46a0-8656-e86b4d0edb41.pdf"
 *                     documentType:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["PDF"]
 *                     documentFormat:
 *                       type: string
 *                       example: "pdf"
 *                     createdBy:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439014"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-06-18T10:36:25.298Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-06-18T11:07:18.762Z"
 *                     updatedBy:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439014"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-06-18T11:07:18.845Z"
 *       400:
 *         description: Bad request - Invalid file type, missing file, or invalid document type
 *       404:
 *         description: Document not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/document',
  resourceCenterController.patchResourceCenterFile.bind(
    resourceCenterController,
  ) as unknown as RequestHandler,
);

/**
 * @swagger
 * /api/resourceCenter/shareableLink:
 *   post:
 *     summary: Send shareable link via email to multiple recipients
 *     tags: [Resource Center]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - link
 *               - mails
 *             properties:
 *               link:
 *                 type: string
 *                 description: The shareable link to send
 *                 example: "https://example.com/resource-center/shared-document"
 *               mails:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *                 description: Array of email addresses to send the link to
 *                 example: ["user1@example.com", "user2@example.com"]
 *     responses:
 *       200:
 *         description: Emails sent successfully
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
 *                   example: "The mail has been sent to users"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-01-27T10:30:00.000Z"
 *       400:
 *         description: Bad request - Link and at least one email address are required
 *       500:
 *         description: Internal server error
 */
router.post(
  '/shareableLink',
  ValidationPipe.validateBody(ResourceCenterShareableLinkDto),
  resourceCenterController.sendShareableLink.bind(
    resourceCenterController,
  ) as unknown as RequestHandler,
);

export default router;
