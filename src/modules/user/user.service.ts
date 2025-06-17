import { UserRepository } from './user.repository';
import type { IUserService } from './interfaces/user.interface';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type {
  UserResponseDto,
  UserListResponseDto,
} from './dto/user-response.dto';
import type { UserQueryDto } from './dto/user-query.dto';
import type { IUser } from '@/models/user.model';
import type { UpdateQuery, FilterQuery } from 'mongoose';
import { Types } from 'mongoose';
import { DatabaseOperationException } from '@/common/exceptions/database.exception';
import { PAGINATION } from '@/common/constants/http-status.constants';
import logger from '@/common/utils/logger';

interface UpdateData {
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

interface SearchFilter {
  isActive?: boolean;
  $or?: Array<{
    firstName?: { $regex: string; $options: string };
    lastName?: { $regex: string; $options: string };
    email?: { $regex: string; $options: string };
  }>;
}

export class UserService implements IUserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  public async createUser(userData: CreateUserDto): Promise<UserResponseDto> {
    try {
      logger.debug('Creating new user', { email: userData.email });

      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(
        userData.email,
      );
      if (existingUser) {
        throw new DatabaseOperationException(
          'User with this email already exists',
        );
      }

      // Create user with proper type conversion for projectId
      const user = await this.userRepository.create({
        ...userData,
        email: userData.email.toLowerCase().trim(),
        firstName: userData.firstName.trim(),
        lastName: userData.lastName.trim(),
        isActive: userData.isActive ?? true,
        role: userData.role ?? 'user',
        projectId: userData.projectId
          ? new Types.ObjectId(userData.projectId)
          : undefined,
      });

      logger.info('User created successfully', {
        id: user._id,
        email: user.email,
      });
      return this.mapToResponseDto(user);
    } catch (error) {
      logger.error('Failed to create user:', { error, userData });
      throw error;
    }
  }

  public async getUserById(id: string): Promise<UserResponseDto | null> {
    try {
      logger.debug('Getting user by ID', { id });
      const user = await this.userRepository.findById(id);

      if (!user || user.isDeleted) {
        logger.debug('User not found or deleted', { id });
        return null;
      }

      return this.mapToResponseDto(user);
    } catch (error) {
      logger.error('Failed to get user by ID:', { error, id });
      throw error;
    }
  }

  public async getUserByEmail(email: string): Promise<UserResponseDto | null> {
    try {
      logger.debug('Getting user by email', { email });
      const user = await this.userRepository.findByEmail(email);

      if (!user) {
        logger.debug('User not found', { email });
        return null;
      }

      return this.mapToResponseDto(user);
    } catch (error) {
      logger.error('Failed to get user by email:', { error, email });
      throw error;
    }
  }

  public async getUserByAgentCode(
    agentCode: string,
    includeOtp = false,
  ): Promise<UserResponseDto | null> {
    try {
      logger.debug('Getting user by agent code', { agentCode, includeOtp });
      const user = await this.userRepository.findByAgentCode(
        agentCode,
        includeOtp,
      );

      if (!user) {
        logger.debug('User not found', { agentCode });
        return null;
      }

      return this.mapToResponseDto(user);
    } catch (error) {
      logger.error('Failed to get user by agent code:', { error, agentCode });
      throw error;
    }
  }

  public async updateUser(
    id: string,
    userData: UpdateUserDto,
  ): Promise<UserResponseDto | null> {
    try {
      logger.debug('Updating user', { id, userData });

      // Check if user exists
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser || existingUser.isDeleted) {
        logger.debug('User not found or deleted', { id });
        return null;
      }

      // Check email availability if being updated
      if (userData.email && userData.email !== existingUser.email) {
        await this.validateEmailAvailability(userData.email, id);
      }

      // Build update data
      const updateData = this.buildUpdateData(userData);
      if (Object.keys(updateData).length === 0) {
        return this.mapToResponseDto(existingUser);
      }

      const updatedUser = await this.userRepository.updateById(
        id,
        updateData as UpdateQuery<IUser>,
      );

      if (!updatedUser) {
        logger.debug('User not found after update', { id });
        return null;
      }

      logger.info('User updated successfully', { id });
      return this.mapToResponseDto(updatedUser);
    } catch (error) {
      logger.error('Failed to update user:', { error, id, userData });
      throw error;
    }
  }

  private async validateEmailAvailability(
    email: string,
    currentUserId: string,
  ): Promise<void> {
    const emailExists = await this.userRepository.findByEmail(email);
    if (emailExists && emailExists._id.toString() !== currentUserId) {
      throw new DatabaseOperationException(
        'Email is already taken by another user',
      );
    }
  }

  private buildUpdateData(userData: UpdateUserDto): UpdateData {
    const updateData: UpdateData = {};

    if (userData.email) {
      updateData.email = userData.email.toLowerCase().trim();
    }
    if (userData.firstName) {
      updateData.firstName = userData.firstName.trim();
    }
    if (userData.lastName) {
      updateData.lastName = userData.lastName.trim();
    }
    if (userData.isActive !== undefined) {
      updateData.isActive = userData.isActive;
    }

    return updateData;
  }

  public async deleteUser(id: string): Promise<boolean> {
    try {
      logger.debug('Deleting user', { id });
      const deletedUser = await this.userRepository.softDelete(id);

      if (!deletedUser) {
        logger.debug('User not found for deletion', { id });
        return false;
      }

      logger.info('User deleted successfully', { id });
      return true;
    } catch (error) {
      logger.error('Failed to delete user:', { error, id });
      throw error;
    }
  }

  public async restoreUser(id: string): Promise<UserResponseDto | null> {
    try {
      logger.debug('Restoring user', { id });
      const restoredUser = await this.userRepository.restore(id);

      if (!restoredUser) {
        logger.debug('User not found for restoration', { id });
        return null;
      }

      logger.info('User restored successfully', { id });
      return this.mapToResponseDto(restoredUser);
    } catch (error) {
      logger.error('Failed to restore user:', { error, id });
      throw error;
    }
  }

  public async getAllUsers(query: UserQueryDto): Promise<UserListResponseDto> {
    try {
      logger.debug('Getting all users with pagination', { query });

      const page = query.page ?? PAGINATION.DEFAULT_PAGE;
      const limit = query.limit ?? PAGINATION.DEFAULT_LIMIT;

      // Build filter
      const filter = this.buildSearchFilter(query);
      const result = await this.userRepository.findWithPagination(
        filter as FilterQuery<IUser>,
        page,
        limit,
      );

      const response: UserListResponseDto = {
        users: result.users.map(user => this.mapToResponseDto(user)),
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          limit,
        },
      };

      logger.debug('Users retrieved successfully', {
        count: response.users.length,
        total: response.pagination.total,
      });

      return response;
    } catch (error) {
      logger.error('Failed to get all users:', { error, query });
      throw error;
    }
  }

  private buildSearchFilter(query: UserQueryDto): SearchFilter {
    const filter: SearchFilter = {};

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.search) {
      const searchRegex = { $regex: query.search, $options: 'i' };
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
      ];
    }

    return filter;
  }

  public async updateLastLogin(id: string): Promise<UserResponseDto | null> {
    try {
      logger.debug('Updating user last login', { id });
      const user = await this.userRepository.updateLastLogin(id);

      if (!user) {
        logger.debug('User not found for last login update', { id });
        return null;
      }

      logger.info('User last login updated successfully', { id });
      return this.mapToResponseDto(user);
    } catch (error) {
      logger.error('Failed to update user last login:', { error, id });
      throw error;
    }
  }

  private mapToResponseDto(user: IUser): UserResponseDto {
    const response: UserResponseDto & { otp?: string } = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Include OTP if it exists in the user document
    if ('otp' in user) {
      response.otp = user.otp;
    }

    return response;
  }
}
