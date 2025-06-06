import type { Document } from 'mongoose';

export interface IBaseModel extends Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted?: boolean;
  deletedAt?: Date;
}

export interface ITimestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface ISoftDelete {
  isDeleted: boolean;
  deletedAt?: Date;
}
