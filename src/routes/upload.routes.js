import { Router } from 'express';
import { upload, handleUploadError } from '../middleware/upload.middleware.js';
import { uploadController } from '../controllers/upload.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

// Single file upload
router.post(
  '/single',
  upload.single('file'),
  uploadController.uploadSingle,
  handleUploadError
);

// Multiple files upload
router.post(
  '/multiple',
  upload.array('files', 10),
  uploadController.uploadMultiple,
  handleUploadError
);

// Get signed URL for file download
router.get('/url/:key', uploadController.getSignedUrl);

// Delete file
router.delete('/:key', uploadController.deleteFile);

export const uploadRoutes = router;