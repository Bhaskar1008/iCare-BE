export class UserResponseDto {
  id!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  fullName?: string;
  isActive!: boolean;
  lastLoginAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;
  otp?: string;
}

export class UserListResponseDto {
  users!: UserResponseDto[];
  pagination!: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
}
