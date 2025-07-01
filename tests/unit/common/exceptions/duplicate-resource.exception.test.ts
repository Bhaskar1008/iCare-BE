import { DuplicateResourceException } from '@/common/exceptions/duplicate-resource.exception';

describe('DuplicateResourceException', () => {
  it('should create an instance with the provided message and status code', () => {
    const message = 'Resource already exists';
    const statusCode = 409;
    const error = new DuplicateResourceException(message, statusCode);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(DuplicateResourceException);
    expect(error.message).toBe(message);
    expect(error.name).toBe('DuplicateResourceException');
    expect(error.statusCode).toBe(statusCode);
    expect(error.isDuplicateError).toBe(true);
  });

  it('should create an instance with default status code if not provided', () => {
    const message = 'Resource already exists';
    const error = new DuplicateResourceException(message);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(DuplicateResourceException);
    expect(error.message).toBe(message);
    expect(error.name).toBe('DuplicateResourceException');
    expect(error.statusCode).toBe(409);
    expect(error.isDuplicateError).toBe(true);
  });

  it('should maintain stack trace', () => {
    const error = new DuplicateResourceException('Resource already exists');

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('DuplicateResourceException');
  });
});
