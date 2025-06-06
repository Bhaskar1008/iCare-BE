import { HTTP_STATUS } from '@/common/constants/http-status.constants';

export class DatabaseException extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(
    message: string,
    code: string = 'DATABASE_ERROR',
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  ) {
    super(message);
    this.name = 'DatabaseException';
    this.code = code;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, DatabaseException);
  }
}

export class DatabaseConnectionException extends DatabaseException {
  constructor(message: string = 'Failed to connect to database') {
    super(
      message,
      'DATABASE_CONNECTION_ERROR',
      HTTP_STATUS.SERVICE_UNAVAILABLE,
    );
    this.name = 'DatabaseConnectionException';
  }
}

export class DatabaseOperationException extends DatabaseException {
  constructor(message: string = 'Database operation failed') {
    super(
      message,
      'DATABASE_OPERATION_ERROR',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
    this.name = 'DatabaseOperationException';
  }
}

export class DatabaseValidationException extends DatabaseException {
  constructor(message: string = 'Database validation error') {
    super(message, 'DATABASE_VALIDATION_ERROR', HTTP_STATUS.BAD_REQUEST);
    this.name = 'DatabaseValidationException';
  }
}
