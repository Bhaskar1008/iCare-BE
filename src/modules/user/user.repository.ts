import { BaseRepository } from '@/repository/base.repository';
import { UserModel } from '@/models/user.model';
import type { IUser } from '@/models/user.model';
import type { FilterQuery } from 'mongoose';
import logger from '@/common/utils/logger';

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(UserModel);
  }

  public async findByEmail(email: string): Promise<IUser | null> {
    try {
      logger.debug('Finding user by email', { email });
      const user = await this.findOne({
        email: email.toLowerCase(),
        isDeleted: { $ne: true },
      });
      logger.debug('User found by email', { email, found: !!user });
      return user;
    } catch (error) {
      logger.error('Failed to find user by email:', { error, email });
      throw error;
    }
  }

  public async findByAgentCode(
    agentCode: string,
    includeOtp = false,
  ): Promise<IUser | null> {
    try {
      logger.debug('Finding user by agent code', { agentCode, includeOtp });
      const user = await this.findOne(
        {
          agentCode,
          isDeleted: { $ne: true },
        },
        includeOtp ? '+otp' : undefined,
      );
      logger.debug('User found by agent code', { agentCode, found: !!user });
      return user;
    } catch (error) {
      logger.error('Failed to find user by agent code:', { error, agentCode });
      throw error;
    }
  }

  public async findActiveUsers(
    limit: number = 100,
    skip: number = 0,
  ): Promise<IUser[]> {
    try {
      logger.debug('Finding active users', { limit, skip });
      const users = await this.find(
        {
          isActive: true,
          isDeleted: { $ne: true },
        },
        {
          limit,
          skip,
          sort: { createdAt: -1 },
        },
      );
      logger.debug('Active users found', { count: users.length, limit, skip });
      return users;
    } catch (error) {
      logger.error('Failed to find active users:', { error, limit, skip });
      throw error;
    }
  }

  public async softDelete(id: string): Promise<IUser | null> {
    try {
      logger.debug('Soft deleting user', { id });
      const user = await this.updateById(id, {
        isDeleted: true,
        deletedAt: new Date(),
        isActive: false,
      });
      logger.info('User soft deleted successfully', { id, deleted: !!user });
      return user;
    } catch (error) {
      logger.error('Failed to soft delete user:', { error, id });
      throw error;
    }
  }

  public async restore(id: string): Promise<IUser | null> {
    try {
      logger.debug('Restoring user', { id });
      const user = await this.updateById(id, {
        isDeleted: false,
        deletedAt: null,
        isActive: true,
      });
      logger.info('User restored successfully', { id, restored: !!user });
      return user;
    } catch (error) {
      logger.error('Failed to restore user:', { error, id });
      throw error;
    }
  }

  public async updateLastLogin(id: string): Promise<IUser | null> {
    try {
      logger.debug('Updating user last login', { id });
      const user = await this.updateById(id, {
        lastLoginAt: new Date(),
      });
      logger.debug('User last login updated', { id, updated: !!user });
      return user;
    } catch (error) {
      logger.error('Failed to update user last login:', { error, id });
      throw error;
    }
  }

  public async findWithPagination(
    filter: FilterQuery<IUser> = {},
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    users: IUser[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      this.logPaginationStart(filter, page, limit);
      const result = await this.executeUserPaginationQuery(filter, page, limit);
      this.logPaginationResults(result);
      return result;
    } catch (error) {
      this.handlePaginationError(error, filter, page, limit);
      throw error;
    }
  }

  private logPaginationStart(
    filter: FilterQuery<IUser>,
    page: number,
    limit: number,
  ): void {
    logger.debug('Finding users with pagination', { filter, page, limit });
  }

  private async executeUserPaginationQuery(
    filter: FilterQuery<IUser>,
    page: number,
    limit: number,
  ): Promise<{
    users: IUser[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const baseFilter = {
      ...filter,
      isDeleted: { $ne: true },
    };

    const [users, total] = await Promise.all([
      this.find(baseFilter, {
        limit,
        skip,
        sort: { createdAt: -1 },
      }),
      this.count(baseFilter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      users,
      total,
      page,
      totalPages,
    };
  }

  private logPaginationResults(result: {
    users: IUser[];
    total: number;
    page: number;
    totalPages: number;
  }): void {
    logger.debug('Users found with pagination', {
      count: result.users.length,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    });
  }

  private handlePaginationError(
    error: unknown,
    filter: FilterQuery<IUser>,
    page: number,
    limit: number,
  ): void {
    logger.error('Failed to find users with pagination:', {
      error,
      filter,
      page,
      limit,
    });
  }
}
