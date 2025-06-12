import type { Request, Response } from 'express';
import type { CreateUserDto } from '../dto/create-user.dto';
import type { UpdateUserDto } from '../dto/update-user.dto';
import type {
  UserResponseDto,
  UserListResponseDto,
} from '../dto/user-response.dto';
import type { UserQueryDto } from '../dto/user-query.dto';

export interface IUserService {
  createUser(userData: CreateUserDto): Promise<UserResponseDto>;
  getUserById(id: string): Promise<UserResponseDto | null>;
  getUserByEmail(email: string): Promise<UserResponseDto | null>;
  getUserByAgentCode(
    agentCode: string,
    includeOtp?: boolean,
  ): Promise<UserResponseDto | null>;
  updateUser(
    id: string,
    userData: UpdateUserDto,
  ): Promise<UserResponseDto | null>;
  deleteUser(id: string): Promise<boolean>;
  restoreUser(id: string): Promise<UserResponseDto | null>;
  getAllUsers(query: UserQueryDto): Promise<UserListResponseDto>;
  updateLastLogin(id: string): Promise<UserResponseDto | null>;
}

export interface IUserController {
  createUser: (req: Request, res: Response) => Promise<void>;
  getUserById: (req: Request, res: Response) => Promise<void>;
  getUserByEmail: (req: Request, res: Response) => Promise<void>;
  getAllUsers: (req: Request, res: Response) => Promise<void>;
  updateUser: (req: Request, res: Response) => Promise<void>;
  deleteUser: (req: Request, res: Response) => Promise<void>;
  restoreUser: (req: Request, res: Response) => Promise<void>;
  updateLastLogin: (req: Request, res: Response) => Promise<void>;
  sendOtp: (req: Request, res: Response) => Promise<void>;
  verifyOtp: (req: Request, res: Response) => Promise<void>;
}
