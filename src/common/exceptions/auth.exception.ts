import { HTTP_STATUS } from '@/common/constants/http-status.constants';

export class AuthException extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = HTTP_STATUS.UNAUTHORIZED) {
    super(message);
    this.name = 'AuthException';
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
