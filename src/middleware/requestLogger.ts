import type { Request, Response, NextFunction } from 'express';
import logger from '@/common/utils/logger';

type SendFunction = (body: unknown) => Response;

const HTTP_CLIENT_ERROR_START = 400;
const HTTP_SERVER_ERROR_START = 500;

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

  next();
};
