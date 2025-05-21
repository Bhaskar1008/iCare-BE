import { s3Service } from '../services/s3.service.js';
import { logger } from '../utils/logger.js';

export const uploadController = {
  async uploadSingle(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { folder } = req.query;
      const result = await s3Service.uploadFile(req.file, folder);

      res.status(201).json(result);
    } catch (error) {
      logger.error({ error }, 'Failed to upload file');
      res.status(500).json({ message: 'Failed to upload file' });
    }
  },

  async uploadMultiple(req, res) {
    try {
      if (!req.files?.length) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const { folder } = req.query;
      const results = await s3Service.uploadMultipleFiles(req.files, folder);

      res.status(201).json(results);
    } catch (error) {
      logger.error({ error }, 'Failed to upload files');
      res.status(500).json({ message: 'Failed to upload files' });
    }
  },

  async getSignedUrl(req, res) {
    try {
      const { key } = req.params;
      const { expiresIn } = req.query;

      const url = await s3Service.getSignedUrl(
        key,
        expiresIn ? parseInt(expiresIn) : undefined
      );

      res.json({ url });
    } catch (error) {
      logger.error({ error }, 'Failed to generate signed URL');
      res.status(500).json({ message: 'Failed to generate download URL' });
    }
  },

  async deleteFile(req, res) {
    try {
      const { key } = req.params;
      await s3Service.deleteFile(key);

      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      logger.error({ error }, 'Failed to delete file');
      res.status(500).json({ message: 'Failed to delete file' });
    }
  },
};