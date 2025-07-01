import { Types } from 'mongoose';
import type { IModule } from '@/models/module.model';

export function isObjectId(value: unknown): value is Types.ObjectId {
  return (
    value instanceof Types.ObjectId ||
    (typeof value === 'object' && value !== null && '_id' in value)
  );
}

export function isModule(value: unknown): value is IModule {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'code' in value &&
    typeof (value as IModule).name === 'string' &&
    typeof (value as IModule).code === 'string'
  );
}
