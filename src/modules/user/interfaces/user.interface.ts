import type { Request, Response } from 'express';
import type { CreateUserDto } from '../dto/create-user.dto';
import type { UpdateUserDto } from '../dto/update-user.dto';
import type {
  UserResponseDto,
  UserListResponseDto,
  PaginationQueryDto,
} from '../dto/user-response.dto';

export interface IUserService {
  createUser(userData: CreateUserDto): Promise<UserResponseDto>;
  getUserById(id: string): Promise<UserResponseDto | null>;
  getUserByEmail(email: string): Promise<UserResponseDto | null>;
  updateUser(
    id: string,
    userData: UpdateUserDto,
  ): Promise<UserResponseDto | null>;
  deleteUser(id: string): Promise<boolean>;
  restoreUser(id: string): Promise<UserResponseDto | null>;
  getAllUsers(query: PaginationQueryDto): Promise<UserListResponseDto>;
  updateLastLogin(id: string): Promise<UserResponseDto | null>;
}

export interface IUserController {
  createUser(req: Request, res: Response): Promise<void>;
  getUserById(req: Request, res: Response): Promise<void>;
  updateUser(req: Request, res: Response): Promise<void>;
  deleteUser(req: Request, res: Response): Promise<void>;
  restoreUser(req: Request, res: Response): Promise<void>;
  getAllUsers(req: Request, res: Response): Promise<void>;
}
