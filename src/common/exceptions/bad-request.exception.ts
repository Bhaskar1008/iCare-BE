import { HTTP_STATUS } from '@/common/constants/http-status.constants';

export class BadRequestException extends Error {
  public status: number;

  constructor(message: string) {
    super(message);
    this.name = 'BadRequestException';
    this.status = HTTP_STATUS.BAD_REQUEST;
    Object.setPrototypeOf(this, BadRequestException.prototype);
  }
}
