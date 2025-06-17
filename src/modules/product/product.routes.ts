import { Router } from 'express';
import multer from 'multer';
import { ProductController } from '@/modules/product/product.controller';
import { ValidationPipe } from '@/common/pipes/validation.pipe';
import { CreateProductDto } from '@/modules/product/dto/create-product.dto';
import { UpdateProductDto } from '@/modules/product/dto/update-product.dto';
import { ProductQueryDto } from '@/modules/product/dto/product-query.dto';
import { S3UploadRequestDto } from '@/modules/product/dto/s3-upload.dto';

const router = Router();
const productController = new ProductController();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
});

/**
 * @swagger
 * components:
 *   schemas:
 *     ReasonsToBuy:
 *       type: object
 *       required:
 *         - reason1
 *         - reason2
 *       properties:
 *         reason1:
 *           type: string
 *           maxLength: 300
 *           description: First reason to buy (required)
 *           example: "High quality materials and craftsmanship"
 *         reason2:
 *           type: string
 *           maxLength: 300
 *           description: Second reason to buy (required)
 *           example: "Excellent customer support and warranty"
 *         reason3:
 *           type: string
 *           maxLength: 300
 *           description: Third reason to buy (optional)
 *           example: "Competitive pricing and value for money"
 *         reason4:
 *           type: string
 *           maxLength: 300
 *           description: Fourth reason to buy (optional)
 *         reason5:
 *           type: string
 *           maxLength: 300
 *           description: Fifth reason to buy (optional)
 *
 *     ProductVideo:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         title:
 *           type: string
 *           maxLength: 100
 *           description: Video title
 *           example: "Product Demo Video"
 *         s3Links:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of S3 video links
 *           example: ["https://bucket.s3.amazonaws.com/video1.mp4"]
 *         youtubeUrl:
 *           type: string
 *           format: uri
 *           description: YouTube video URL (optional)
 *           example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
 *         isActive:
 *           type: boolean
 *           description: Whether the video is active
 *           default: true
 *
 *     ProductImage:
 *       type: object
 *       required:
 *         - title
 *         - s3Link
 *       properties:
 *         title:
 *           type: string
 *           maxLength: 100
 *           description: Image title
 *           example: "Product Main Image"
 *         s3Link:
 *           type: string
 *           description: S3 image link
 *           example: "https://bucket.s3.amazonaws.com/image1.jpg"
 *         isActive:
 *           type: boolean
 *           description: Whether the image is active
 *           default: true
 *
 *     ProductFile:
 *       type: object
 *       required:
 *         - categoryId
 *         - fileType
 *         - language
 *         - brochureName
 *         - s3Link
 *       properties:
 *         categoryId:
 *           type: string
 *           description: Product category ID for the file
 *           example: "507f1f77bcf86cd799439011"
 *         fileType:
 *           type: string
 *           enum: [PDF, PPT]
 *           description: Type of file
 *           example: "PDF"
 *         language:
 *           type: string
 *           maxLength: 50
 *           description: File language
 *           example: "English"
 *         brochureName:
 *           type: string
 *           maxLength: 100
 *           description: Name of the brochure
 *           example: "Product Brochure 2024"
 *         s3Link:
 *           type: string
 *           description: S3 file link
 *           example: "https://bucket.s3.amazonaws.com/brochure.pdf"
 *
 *     ProductMedia:
 *       type: object
 *       properties:
 *         videos:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductVideo'
 *         images:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductImage'
 *
 *     CreateProductRequest:
 *       type: object
 *       required:
 *         - productCategoryId
 *         - channelIds
 *         - productName
 *         - reasonsToBuy
 *         - createdBy
 *       properties:
 *         productCategoryId:
 *           type: string
 *           description: Product category ID
 *           example: "507f1f77bcf86cd799439011"
 *         channelIds:
 *           type: array
 *           items:
 *             type: string
 *           minItems: 1
 *           description: Array of channel IDs (at least one required)
 *           example: ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"]
 *         productName:
 *           type: string
 *           maxLength: 50
 *           description: Product name (must be unique)
 *           example: "Premium Smartphone"
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: Product status
 *           default: active
 *           example: "active"
 *         webLink:
 *           type: string
 *           format: uri
 *           description: Product web link (optional)
 *           example: "https://example.com/product"
 *         applicationId:
 *           type: string
 *           maxLength: 50
 *           description: Application ID (optional)
 *           example: "APP123456"
 *         productDescription:
 *           type: string
 *           maxLength: 500
 *           description: Product description (optional)
 *           example: "A premium smartphone with advanced features"
 *         reasonsToBuy:
 *           $ref: '#/components/schemas/ReasonsToBuy'
 *         media:
 *           $ref: '#/components/schemas/ProductMedia'
 *         files:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductFile'
 *         createdBy:
 *           type: string
 *           description: User ID who created the product
 *           example: "507f1f77bcf86cd799439014"
 *
 *     S3UploadRequest:
 *       type: object
 *       required:
 *         - userId
 *         - fileType
 *       properties:
 *         userId:
 *           type: string
 *           description: User ID for file organization
 *           example: "507f1f77bcf86cd799439012"
 *         fileType:
 *           type: string
 *           enum: [video, image, document]
 *           description: Type of file to upload
 *           example: "image"
 *         isMultiple:
 *           type: boolean
 *           description: Flag to indicate if multiple files will be uploaded
 *           default: false
 *           example: false
 *         fileName:
 *           type: string
 *           description: Original file name (optional, used for single file upload)
 *           example: "product-image.jpg"
 *         fileNames:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of file names (optional, used for multiple file upload)
 *           example: ["image1.jpg", "image2.jpg"]
 *         contentType:
 *           type: string
 *           description: MIME type of the file (optional, used for single file upload)
 *           example: "image/jpeg"
 *         contentTypes:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of MIME types (optional, used for multiple file upload)
 *           example: ["image/jpeg", "image/png"]
 *
 *     S3UploadResponse:
 *       type: object
 *       properties:
 *         files:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               uploadUrl:
 *                 type: string
 *                 description: Presigned URL for uploading to S3
 *                 example: "https://bucket.s3.amazonaws.com/path/file.jpg?presigned-params"
 *               fileKey:
 *                 type: string
 *                 description: S3 object key
 *                 example: "user123/image/1640995200000.jpg"
 *               s3Link:
 *                 type: string
 *                 description: Final S3 URL for the uploaded file
 *                 example: "https://bucket.s3.amazonaws.com/user123/image/1640995200000.jpg"
 *           description: Array of file upload details
 *         expiresIn:
 *           type: integer
 *           description: URL expiration time in seconds
 *           example: 3600
 *
 *     ContentTypeGuide:
 *       type: object
 *       properties:
 *         images:
 *           type: array
 *           description: Common image content types
 *           items:
 *             type: string
 *           example:
 *             - image/jpeg     # .jpg, .jpeg
 *             - image/png      # .png
 *             - image/gif      # .gif
 *             - image/webp     # .webp
 *             - image/svg+xml  # .svg
 *             - image/tiff     # .tif, .tiff
 *             - image/bmp      # .bmp
 *         videos:
 *           type: array
 *           description: Common video content types
 *           items:
 *             type: string
 *           example:
 *             - video/mp4          # .mp4
 *             - video/webm         # .webm
 *             - video/x-msvideo    # .avi
 *             - video/quicktime    # .mov
 *             - video/x-ms-wmv     # .wmv
 *             - video/x-flv        # .flv
 *             - video/3gpp         # .3gp
 *         documents:
 *           type: array
 *           description: Common document content types
 *           items:
 *             type: string
 *           example:
 *             - application/pdf                                                    # .pdf
 *             - application/msword                                                 # .doc
 *             - application/vnd.openxmlformats-officedocument.wordprocessingml.document  # .docx
 *             - application/vnd.ms-excel                                          # .xls
 *             - application/vnd.openxmlformats-officedocument.spreadsheetml.sheet # .xlsx
 *             - application/vnd.ms-powerpoint                                     # .ppt
 *             - application/vnd.openxmlformats-officedocument.presentationml.presentation # .pptx
 *             - text/plain                                                        # .txt
 *             - text/csv                                                          # .csv
 *             - application/rtf                                                   # .rtf
 *
 *   tags:
 *     - name: Products
 *       description: Product management endpoints
 *     - name: S3 Upload
 *       description: S3 file upload endpoints
 */

/**
 * @swagger
 * /api/products:
 *   post:
 *     tags: [Products]
 *     summary: Create a new product
 *     description: Creates a new product with comprehensive details including media, files, and reasons to buy
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductRequest'
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Bad request - validation errors
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  ValidationPipe.validateBody(CreateProductDto),
  productController.createProduct,
);

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: Get all products with pagination and filtering
 *     description: Retrieves a paginated list of products with optional filtering by status, category, and channel
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by product status
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by product category ID
 *       - in: query
 *         name: channelId
 *         schema:
 *           type: string
 *         description: Filter by channel ID
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *       400:
 *         description: Bad request - invalid query parameters
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  ValidationPipe.validateQuery(ProductQueryDto),
  productController.getAllProducts,
);

/**
 * @swagger
 * /api/products/active:
 *   get:
 *     tags: [Products]
 *     summary: Get all active products
 *     description: Retrieves a list of all active products without pagination
 *     responses:
 *       200:
 *         description: Active products retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/active', productController.getActiveProducts);

/**
 * @swagger
 * /api/products/category/{categoryId}:
 *   get:
 *     tags: [Products]
 *     summary: Get products by category
 *     description: Retrieves all products belonging to a specific category
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product category ID
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *       400:
 *         description: Bad request - invalid category ID
 *       500:
 *         description: Internal server error
 */
router.get('/category/:categoryId', productController.getProductsByCategory);

/**
 * @swagger
 * /api/products/channel/{channelId}:
 *   get:
 *     tags: [Products]
 *     summary: Get products by channel
 *     description: Retrieves all products associated with a specific channel
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Channel ID
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *       400:
 *         description: Bad request - invalid channel ID
 *       500:
 *         description: Internal server error
 */
router.get('/channel/:channelId', productController.getProductsByChannel);

/**
 * @swagger
 * /api/products/upload:
 *   post:
 *     tags: [S3 Upload]
 *     summary: Upload files directly to S3
 *     description: |
 *       Upload files directly to S3 bucket. The files will be immediately available after upload.
 *
 *       ## Upload Instructions
 *
 *       ### Using Postman
 *       1. Create new request
 *       2. Method: POST
 *       3. URL: http://localhost:3000/api/products/upload
 *       4. Body:
 *          - Select "form-data"
 *          - Add fields:
 *            - userId: Your user ID
 *            - fileType: "image", "video", or "document"
 *            - isMultiple: "true" or "false"
 *          - Add file(s):
 *            - Key: "files"
 *            - Value: Select your file(s)
 *
 *       ### Using curl
 *       ```bash
 *       # Single file upload
 *       curl -X POST 'http://localhost:3000/api/products/upload' \
 *         -F "userId=507f1f77bcf86cd799439012" \
 *         -F "fileType=image" \
 *         -F "files=@/path/to/your/image.jpg"
 *
 *       # Multiple files upload
 *       curl -X POST 'http://localhost:3000/api/products/upload' \
 *         -F "userId=507f1f77bcf86cd799439012" \
 *         -F "fileType=image" \
 *         -F "isMultiple=true" \
 *         -F "files=@/path/to/your/image1.jpg" \
 *         -F "files=@/path/to/your/image2.png"
 *       ```
 *
 *       ## File Size Limits
 *       - Images: Max 10MB
 *       - Videos: Max 100MB
 *       - Documents: Max 50MB
 *
 *       ## Supported File Types
 *
 *       ### Images
 *       - JPEG (.jpg, .jpeg)
 *       - PNG (.png)
 *       - GIF (.gif)
 *       - WebP (.webp)
 *       - SVG (.svg)
 *       - TIFF (.tif, .tiff)
 *       - BMP (.bmp)
 *
 *       ### Videos
 *       - MP4 (.mp4)
 *       - WebM (.webm)
 *       - AVI (.avi)
 *       - QuickTime (.mov)
 *       - Windows Media (.wmv)
 *       - Flash Video (.flv)
 *       - 3GPP (.3gp)
 *
 *       ### Documents
 *       - PDF (.pdf)
 *       - Word (.doc, .docx)
 *       - Excel (.xls, .xlsx)
 *       - PowerPoint (.ppt, .pptx)
 *       - Text (.txt)
 *       - CSV (.csv)
 *       - Rich Text (.rtf)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID for file organization
 *               fileType:
 *                 type: string
 *                 enum: [video, image, document]
 *                 description: Type of file to upload
 *               isMultiple:
 *                 type: boolean
 *                 description: Whether multiple files are being uploaded
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Files to upload
 *           examples:
 *             singleFile:
 *               summary: Single file upload
 *               value:
 *                 userId: "507f1f77bcf86cd799439012"
 *                 fileType: "image"
 *                 files: ["@/path/to/your/image.jpg"]
 *             multipleFiles:
 *               summary: Multiple files upload
 *               value:
 *                 userId: "507f1f77bcf86cd799439012"
 *                 fileType: "image"
 *                 isMultiple: true
 *                 files: ["@/path/to/your/image1.jpg", "@/path/to/your/image2.png"]
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/S3UploadResponse'
 *             examples:
 *               singleFile:
 *                 summary: Single file upload response
 *                 value:
 *                   success: true
 *                   message: "Files uploaded successfully"
 *                   data:
 *                     fileKey: "Salesverse/user123/image/1640995200000.jpg"
 *                     fileUrl: "https://salesverse-inxt-public-documents-20250531.s3.ap-southeast-1.amazonaws.com/Salesverse/user123/image/1640995200000.jpg"
 *               multipleFiles:
 *                 summary: Multiple files upload response
 *                 value:
 *                   success: true
 *                   message: "Files uploaded successfully"
 *                   data:
 *                     files:
 *                       - fileKey: "Salesverse/user123/image/1640995200001.jpg"
 *                         fileUrl: "https://salesverse-inxt-public-documents-20250531.s3.ap-southeast-1.amazonaws.com/Salesverse/user123/image/1640995200001.jpg"
 *                       - fileKey: "Salesverse/user123/image/1640995200002.png"
 *                         fileUrl: "https://salesverse-inxt-public-documents-20250531.s3.ap-southeast-1.amazonaws.com/Salesverse/user123/image/1640995200002.png"
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "No files uploaded"
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *       413:
 *         description: Payload too large - file size exceeds limit
 *       500:
 *         description: Internal server error
 */
router.post(
  '/upload',
  upload.array('files'),
  ValidationPipe.validateBody(S3UploadRequestDto),
  productController.uploadToS3,
);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get product by ID
 *     description: Retrieves a specific product by its unique identifier with all related information
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product's unique identifier
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       400:
 *         description: Bad request - invalid product ID
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', productController.getProductById);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Update product
 *     description: Updates an existing product with the provided information
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product's unique identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productName:
 *                 type: string
 *                 maxLength: 50
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *               webLink:
 *                 type: string
 *                 format: uri
 *               applicationId:
 *                 type: string
 *                 maxLength: 50
 *               productDescription:
 *                 type: string
 *                 maxLength: 500
 *               reasonsToBuy:
 *                 $ref: '#/components/schemas/ReasonsToBuy'
 *               media:
 *                 $ref: '#/components/schemas/ProductMedia'
 *               files:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ProductFile'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Bad request - validation errors
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/:id',
  ValidationPipe.validateBody(UpdateProductDto),
  productController.updateProduct,
);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete product
 *     description: Soft deletes a product by setting isDeleted flag to true
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product's unique identifier
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       400:
 *         description: Bad request - invalid product ID
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', productController.deleteProduct);

export default router;
