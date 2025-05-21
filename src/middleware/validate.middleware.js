import { validationResult } from 'express-validator';
import { logger } from '../utils/logger.js';

export const validate = (validations) => {
  return async (req, res, next) => {
    try {
      // Execute all validations
      await Promise.all(validations.map(validation => validation.run(req)));

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      next();
    } catch (error) {
      logger.error({ error }, 'Validation middleware error');
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};