import type { Request, Response } from 'express';
import {
  HTTP_STATUS,
  PAGINATION,
} from '@/common/constants/http-status.constants';
import logger from '@/common/utils/logger';

interface ErrorWithMessage {
  message: string;
  stack?: string;
}

interface ValidationData {
  [key: string]: unknown;
}

export abstract class BaseController {
  protected sendSuccess<T>(
    res: Response,
    data: T,
    message: string = 'Operation successful',
    statusCode: number = HTTP_STATUS.OK,
  ): void {
    res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  protected sendError(
    res: Response,
    message: string = 'Operation failed',
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    error?: ErrorWithMessage,
  ): void {
    logger.error('Controller error:', {
      message,
      statusCode,
      error: error?.message ?? error,
      stack: error?.stack,
    });

    res.status(statusCode).json({
      success: false,
      message,
      error:
        process.env.NODE_ENV === 'development' ? error?.message : undefined,
      timestamp: new Date().toISOString(),
    });
  }

  protected sendCreated<T>(
    res: Response,
    data: T,
    message: string = 'Resource created successfully',
  ): void {
    this.sendSuccess(res, data, message, HTTP_STATUS.CREATED);
  }

  protected sendUpdated<T>(
    res: Response,
    data: T,
    message: string = 'Resource Updated successfully',
  ): void {
    this.sendSuccess(res, data, message, HTTP_STATUS.CREATED);
  }

  protected sendNotFound(
    res: Response,
    message: string = 'Resource not found',
  ): void {
    this.sendError(res, message, HTTP_STATUS.NOT_FOUND);
  }

  protected sendBadRequest(
    res: Response,
    message: string = 'Bad request',
    error?: ErrorWithMessage,
  ): void {
    this.sendError(res, message, HTTP_STATUS.BAD_REQUEST, error);
  }

  protected sendUnauthorized(
    res: Response,
    message: string = 'Unauthorized',
  ): void {
    this.sendError(res, message, HTTP_STATUS.UNAUTHORIZED);
  }

  protected sendForbidden(res: Response, message: string = 'Forbidden'): void {
    this.sendError(res, message, HTTP_STATUS.FORBIDDEN);
  }

  protected sendConflict(
    res: Response,
    message: string = 'Resource already exists',
  ): void {
    this.sendError(res, message, HTTP_STATUS.CONFLICT);
  }

  protected getQueryParams(req: Request): {
    page: number;
    limit: number;
    search?: string;
  } {
    const page = Math.max(
      PAGINATION.DEFAULT_PAGE,
      parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE,
    );
    const limit = Math.min(
      PAGINATION.MAX_LIMIT,
      Math.max(
        PAGINATION.DEFAULT_PAGE,
        parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT,
      ),
    );
    const search = (req.query.search as string) || undefined;

    return { page, limit, search };
  }

  protected validateRequiredFields(
    data: ValidationData,
    fields: string[],
  ): string[] {
    const missingFields: string[] = [];

    for (const field of fields) {
      const value = data[field];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        missingFields.push(field);
      }
    }

    return missingFields;
  }

  protected validateEmail(email: string): boolean {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
  }
}
