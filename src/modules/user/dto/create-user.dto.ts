export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  isActive?: boolean;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  isActive?: boolean;
}
