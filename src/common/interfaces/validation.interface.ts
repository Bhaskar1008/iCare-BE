import type { Request } from 'express';

export interface ValidatedRequest<T = unknown> extends Request {
  validatedQuery: T;
}
