export interface UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserListResponseDto {
  users: UserResponseDto[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export interface PaginationQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}
