import { HTTP_STATUS } from '@/common/constants/http-status.constants';

export class NotFoundException extends Error {
  public status: number;

  constructor(message: string) {
    super(message);
    this.name = 'NotFoundException';
    this.status = HTTP_STATUS.NOT_FOUND;
    Object.setPrototypeOf(this, NotFoundException.prototype);
  }
}
