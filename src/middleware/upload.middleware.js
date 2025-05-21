import multer from 'multer';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!config.upload.allowedTypes.includes(file.mimetype)) {
    logger.warn({
      mimetype: file.mimetype,
      filename: file.originalname,
    }, 'Invalid file type uploaded');
    
    cb(new Error('Invalid file type'), false);
    return;
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxSize,
  },
});

export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: `File size exceeds limit of ${config.upload.maxSize / (1024 * 1024)}MB`,
      });
    }
    return res.status(400).json({ message: err.message });
  }

  if (err.message === 'Invalid file type') {
    return res.status(400).json({
      message: 'Invalid file type. Allowed types: ' + 
        config.upload.allowedTypes.map(type => type.split('/')[1]).join(', '),
    });
  }

  next(err);
};