import { Types } from 'mongoose';
import type { Response } from 'express';

/**
 * Generate a random MongoDB ObjectId
 */
export const generateObjectId = (): string => {
  return new Types.ObjectId().toString();
};

/**
 * Mock response object for controller tests
 */
export const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Mock request object for controller tests
 * @param data - Request body data
 * @param params - Request parameters
 * @param query - Request query parameters
 * @param user - Authenticated user
 */
export const mockRequest = (
  data: Record<string, unknown> = {},
  params: Record<string, unknown> = {},
  query: Record<string, unknown> = {},
  user: unknown = null,
) => {
  return {
    body: data,
    params,
    query,
    user,
  };
};

/**
 * Helper to create a mock service with specified mock implementations
 * @param mockImplementations - Object containing method names and their mock implementations
 */
export const createMockService = (
  mockImplementations: Record<string, unknown> = {},
): Record<string, jest.Mock> => {
  const mockService: Record<string, jest.Mock> = {};

  // Add default mock implementations for common methods
  const defaultMethods = ['create', 'findById', 'findAll', 'update', 'delete'];

  for (const method of defaultMethods) {
    mockService[method] = jest.fn().mockResolvedValue({});
  }

  // Override with provided mock implementations
  for (const [method, implementation] of Object.entries(mockImplementations)) {
    mockService[method] = jest
      .fn()
      .mockImplementation(implementation as (...args: unknown[]) => unknown);
  }

  return mockService;
};

/**
 * Helper for testing async functions that should throw errors
 * @param fn - Function to test
 * @param errorType - Expected error type or message
 */
export const expectToThrowAsync = async (
  fn: () => Promise<unknown>,
  errorType?: unknown,
): Promise<void> => {
  try {
    await fn();
    fail('Expected function to throw an error');
  } catch (error) {
    if (errorType) {
      if (typeof errorType === 'string') {
        expect((error as Error).message).toContain(errorType);
      } else {
        expect(error).toBeInstanceOf(
          errorType as new (...args: unknown[]) => unknown,
        );
      }
    }
  }
};
