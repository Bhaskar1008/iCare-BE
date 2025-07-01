export class DuplicateResourceException extends Error {
  public readonly statusCode: number;
  public readonly isDuplicateError: boolean;

  constructor(message: string, statusCode: number = 409) {
    super(message);
    this.name = 'DuplicateResourceException';
    this.statusCode = statusCode;
    this.isDuplicateError = true;
  }
}
