import winston from 'winston';
import 'winston-mongodb';
import path from 'path';
import { format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { v4 as uuidv4 } from 'uuid';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const maskSensitiveData = format(info => {
  const sensitiveFields = [
    'password',
    'token',
    'apiKey',
    'secret',
    'authorization',
  ];
  const maskedInfo = { ...info };

  sensitiveFields.forEach(field => {
    if (maskedInfo[field]) {
      maskedInfo[field] = '***MASKED***';
    }
  });

  return maskedInfo;
});

const addCorrelationId = format(info => {
  info.correlationId ??= uuidv4();
  return info;
});

const CORRELATION_ID_DISPLAY_LENGTH = 8;

const consoleFormat = printf(
  ({ level, message, timestamp, stack, correlationId, ...metadata }) => {
    const time = String(timestamp).split(' ')[1];
    const corrId = String(correlationId).slice(
      0,
      CORRELATION_ID_DISPLAY_LENGTH,
    );

    let msg = `${time} [${level.toUpperCase()}] [${corrId}] ${String(message)}`;

    if (Object.keys(metadata).length > 0) {
      const formatted = Object.entries(metadata)
        .map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            return `${key}: ${JSON.stringify(value)}`;
          }
          return `${key}: ${String(value)}`;
        })
        .join(', ');
      msg += `\n  └─ ${formatted}`;
    }

    if (stack) {
      const stackStr =
        typeof stack === 'string' ? stack : JSON.stringify(stack);
      msg += `\n${stackStr}`;
    }

    return msg;
  },
);

const logsDir = path.join(process.cwd(), 'logs');

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  trace: 5,
};

const getLogLevel = () => {
  const env = process.env.NODE_ENV ?? 'development';
  switch (env) {
    case 'production':
      return 'info';
    case 'staging':
      return 'debug';
    default:
      return 'debug';
  }
};

const logger = winston.createLogger({
  levels,
  level: getLogLevel(),
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    errors({ stack: true }),
    addCorrelationId(),
    maskSensitiveData(),
    json(),
  ),
  defaultMeta: {
    service: 'salesverse-api',
    environment: process.env.NODE_ENV ?? 'development',
  },
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        consoleFormat,
      ),
    }),
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    }),
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
      level: 'error',
    }),
  ],
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    }),
  ],
});

if (process.env.MONGODB_URI) {
  logger.add(
    new winston.transports.MongoDB({
      db: process.env.MONGODB_URI,
      collection: 'logs',
      options: {
        useUnifiedTopology: true,
      },
      level: 'http',
      expireAfterSeconds: 2592000,
    }),
  );
}

export const createChildLogger = (correlationId: string) => {
  return logger.child({ correlationId });
};

export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export default logger;
