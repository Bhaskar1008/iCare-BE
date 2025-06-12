import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '@/common/utils/logger';

type SendFunction = (body: unknown) => Response;

const HTTP_CLIENT_ERROR_START = 400;
const HTTP_SERVER_ERROR_START = 500;
const BEARER_PREFIX_LENGTH = 7;
const TOKEN_PREVIEW_LENGTH = 20;

const sanitizeRequestBody = (
  body: Record<string, unknown>,
): Record<string, unknown> => {
  const sanitizedBody = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
  sensitiveFields.forEach(field => {
    if (sanitizedBody[field]) {
      sanitizedBody[field] = '***MASKED***';
    }
  });
  return sanitizedBody;
};

const decodeJwtToken = (token: string): Record<string, unknown> | null => {
  try {
    // Decode JWT without verification (just to extract payload)
    const decoded = jwt.decode(token) as Record<string, unknown>;
    return decoded;
  } catch (error) {
    logger.warn('Failed to decode JWT token:', error);
    return null;
  }
};

const extractAndSetCurrentUser = (req: Request): void => {
  try {
    logger.debug('JWT Processing - Request details', {
      url: req.url,
      method: req.method,
      hasAuthHeader: !!req.headers.authorization,
      headerCount: Object.keys(req.headers).length,
    });

    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      logger.debug('Authorization header found, extracting token');
      const token = authHeader.substring(BEARER_PREFIX_LENGTH);
      logger.debug('Token details', {
        length: token.length,
        preview: `${token.substring(0, TOKEN_PREVIEW_LENGTH)}...`,
      });

      const decodedToken = decodeJwtToken(token);

      if (decodedToken) {
        // Set the currentUser header
        req.headers.currentuser = JSON.stringify(decodedToken);

        logger.debug('JWT Token decoded successfully', {
          userId: decodedToken.id,
          email: decodedToken.email,
          role: decodedToken.role,
          channelId: decodedToken.channelId,
        });
      } else {
        logger.warn('Failed to decode JWT token');
      }
    } else {
      logger.debug('No valid Authorization header found', {
        authHeaderPresent: !!authHeader,
        authHeaderValue: authHeader ? 'Bearer token expected' : 'Not provided',
      });
    }
  } catch (error) {
    logger.warn('Error processing JWT token:', error);
  }
};

const logRequestResponse = (
  req: Request,
  statusCode: number,
  responseTime: number,
): void => {
  const { method, path: requestPath } = req;
  const statusSymbol = statusCode >= HTTP_CLIENT_ERROR_START ? '✗' : '✓';

  const logInfo: Record<string, unknown> = {
    method,
    path: requestPath,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    statusCode,
    responseTime: `${responseTime}ms`,
  };

  if (Object.keys(req.query).length > 0) {
    logInfo.query = req.query;
  }

  if (
    method !== 'GET' &&
    req.body &&
    Object.keys(req.body as Record<string, unknown>).length > 0
  ) {
    logInfo.body = sanitizeRequestBody(req.body as Record<string, unknown>);
  }

  const message = `${statusSymbol} ${method} ${requestPath}`;

  if (statusCode >= HTTP_SERVER_ERROR_START) {
    logger.error(message, logInfo);
  } else if (statusCode >= HTTP_CLIENT_ERROR_START) {
    logger.warn(message, logInfo);
  } else {
    logger.http(message, logInfo);
  }
};

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const start = Date.now();

  const originalSend = res.send.bind(res) as SendFunction;
  (res as { send: SendFunction }).send = function (body: unknown): Response {
    const responseTime = Date.now() - start;
    const statusCode = res.statusCode;

    logRequestResponse(req, statusCode, responseTime);

    return originalSend(body);
  };

  extractAndSetCurrentUser(req);

  next();
};
