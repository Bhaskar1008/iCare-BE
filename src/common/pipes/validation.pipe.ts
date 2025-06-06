import 'reflect-metadata';
import type { ValidationError } from 'class-validator';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import type { Request, Response, NextFunction } from 'express';
import type { ClassConstructor } from 'class-transformer';
import { HTTP_STATUS } from '@/common/constants/http-status.constants';
import logger from '@/common/utils/logger';
import type { ValidatedRequest } from '@/common/interfaces/validation.interface';

export class ValidationPipe {
  /**
   * Validates request body against a DTO class using class-validator
   */
  static validateBody<T extends object>(dtoClass: ClassConstructor<T>) {
    return async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      try {
        const dto = this.transformToDto(dtoClass, req.body);
        const errors = await this.validateDto(dto);

        if (errors.length > 0) {
          this.handleValidationErrors(errors, req, res, 'Validation failed');
          return;
        }

        req.body = dto;
        next();
      } catch (error) {
        this.handleInternalError(error, req, res, 'Internal validation error');
      }
    };
  }

  /**
   * Validates query parameters against a DTO class
   */
  static validateQuery<T extends object>(dtoClass: ClassConstructor<T>) {
    return async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      try {
        const dto = this.transformToDto(dtoClass, req.query);
        const errors = await this.validateDto(dto);

        if (errors.length > 0) {
          this.handleQueryValidationErrors(errors, req, res);
          return;
        }

        (req as ValidatedRequest<T>).validatedQuery = dto;
        next();
      } catch (error) {
        this.handleInternalError(
          error,
          req,
          res,
          'Internal query validation error',
        );
      }
    };
  }

  private static transformToDto<T extends object>(
    dtoClass: ClassConstructor<T>,
    data: unknown,
  ): T {
    return plainToClass(dtoClass, data, {
      enableImplicitConversion: true,
    });
  }

  private static async validateDto<T extends object>(
    dto: T,
  ): Promise<ValidationError[]> {
    return validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
  }

  private static handleValidationErrors(
    errors: ValidationError[],
    req: Request,
    res: Response,
    message: string,
  ): void {
    const errorMessages: string[] = this.formatValidationErrors(errors);

    logger.warn('Validation failed:', {
      path: req.path,
      method: req.method,
      body: req.body as Record<string, unknown>,
      errors: errorMessages,
    });

    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message,
      errors: errorMessages,
      timestamp: new Date().toISOString(),
    });
  }

  private static handleQueryValidationErrors(
    errors: ValidationError[],
    req: Request,
    res: Response,
  ): void {
    const errorMessages: string[] = this.formatValidationErrors(errors);

    logger.warn('Query validation failed:', {
      path: req.path,
      method: req.method,
      query: req.query as Record<string, unknown>,
      errors: errorMessages,
    });

    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Query validation failed',
      errors: errorMessages,
      timestamp: new Date().toISOString(),
    });
  }

  private static handleInternalError(
    error: unknown,
    req: Request,
    res: Response,
    message: string,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));

    logger.error('ValidationPipe internal error:', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Formats validation errors into a readable format
   */
  private static formatValidationErrors(errors: ValidationError[]): string[] {
    const messages: string[] = [];

    const processError = (error: ValidationError, parentPath = ''): void => {
      const propertyPath = parentPath
        ? `${parentPath}.${error.property}`
        : error.property;

      if (error.constraints) {
        Object.values(error.constraints).forEach(constraint => {
          messages.push(`${propertyPath}: ${constraint}`);
        });
      }

      if (error.children && error.children.length > 0) {
        error.children.forEach(child => {
          processError(child, propertyPath);
        });
      }
    };

    errors.forEach(error => processError(error));
    return messages;
  }
}
