import type { Document } from 'mongoose';

export interface BaseDocument extends Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryFilters {
  [key: string]: string | number | boolean | Date | null | undefined;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  companyId: string;
}

export interface AuditFields {
  createdBy?: string;
  updatedBy?: string;
  deletedBy?: string;
  deletedAt?: Date;
  isDeleted?: boolean;
}
