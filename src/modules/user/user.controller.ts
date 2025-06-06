import type { Request, Response } from 'express';
import { BaseController } from '@/controllers/base.controller';
import { UserService } from './user.service';
import type { IUserController } from './interfaces/user.interface';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { PaginationQueryDto } from './dto/user-response.dto';
import { HTTP_STATUS } from '@/common/constants/http-status.constants';
import logger from '@/common/utils/logger';

interface ErrorWithMessage {
  message: string;
}

export class UserController extends BaseController implements IUserController {
  private userService: UserService;

  constructor() {
    super();
    this.userService = new UserService();
  }

  public async createUser(req: Request, res: Response): Promise<void> {
    try {
      const bodyForLogging = req.body
        ? JSON.stringify(req.body)
        : 'No body provided';
      logger.debug('Creating user via controller', { body: bodyForLogging });

      const requiredFields = ['email', 'firstName', 'lastName'];
      const requestBody = req.body as Record<string, unknown>;
      const missingFields = this.validateRequiredFields(
        requestBody,
        requiredFields,
      );

      if (missingFields.length > 0) {
        this.sendBadRequest(
          res,
          `Missing required fields: ${missingFields.join(', ')}`,
        );
        return;
      }

      const email = requestBody.email as string;
      if (!this.validateEmail(email)) {
        this.sendBadRequest(res, 'Please provide a valid email address');
        return;
      }

      const userData: CreateUserDto = {
        email,
        firstName: requestBody.firstName as string,
        lastName: requestBody.lastName as string,
        isActive: requestBody.isActive as boolean,
      };

      const user = await this.userService.createUser(userData);
      this.sendCreated(res, user, 'User created successfully');
    } catch (error) {
      const err = error as ErrorWithMessage;
      logger.error('Error creating user:', err);

      if (err.message?.includes('already exists')) {
        this.sendConflict(res, err.message);
      } else {
        this.sendError(
          res,
          'Failed to create user',
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          err,
        );
      }
    }
  }

  public async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.debug('Getting user by ID via controller', { id });

      if (!id) {
        this.sendBadRequest(res, 'User ID is required');
        return;
      }

      const user = await this.userService.getUserById(id);

      if (!user) {
        this.sendNotFound(res, 'User not found');
        return;
      }

      this.sendSuccess(res, user, 'User retrieved successfully');
    } catch (error) {
      const err = error as ErrorWithMessage;
      logger.error('Error getting user by ID:', err);
      this.sendError(
        res,
        'Failed to retrieve user',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  public async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const bodyForLogging = req.body
        ? JSON.stringify(req.body)
        : 'No body provided';
      logger.debug('Updating user via controller', {
        id,
        body: bodyForLogging,
      });

      if (!id) {
        this.sendBadRequest(res, 'User ID is required');
        return;
      }

      // Type-safe access to request body properties
      const requestBody = req.body as Record<string, unknown>;

      // Validate email format if provided
      const email = requestBody.email as string;
      if (email && !this.validateEmail(email)) {
        this.sendBadRequest(res, 'Please provide a valid email address');
        return;
      }

      const userData: UpdateUserDto = {
        email,
        firstName: requestBody.firstName as string,
        lastName: requestBody.lastName as string,
        isActive: requestBody.isActive as boolean,
      };

      const user = await this.userService.updateUser(id, userData);

      if (!user) {
        this.sendNotFound(res, 'User not found');
        return;
      }

      this.sendSuccess(res, user, 'User updated successfully');
    } catch (error) {
      const err = error as ErrorWithMessage;
      logger.error('Error updating user:', err);

      if (err.message?.includes('already taken')) {
        this.sendConflict(res, err.message);
      } else {
        this.sendError(
          res,
          'Failed to update user',
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          err,
        );
      }
    }
  }

  public async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.debug('Deleting user via controller', { id });

      if (!id) {
        this.sendBadRequest(res, 'User ID is required');
        return;
      }

      const deleted = await this.userService.deleteUser(id);

      if (!deleted) {
        this.sendNotFound(res, 'User not found');
        return;
      }

      this.sendSuccess(res, { deleted: true }, 'User deleted successfully');
    } catch (error) {
      const err = error as ErrorWithMessage;
      logger.error('Error deleting user:', err);
      this.sendError(
        res,
        'Failed to delete user',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  public async restoreUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.debug('Restoring user via controller', { id });

      if (!id) {
        this.sendBadRequest(res, 'User ID is required');
        return;
      }

      const user = await this.userService.restoreUser(id);

      if (!user) {
        this.sendNotFound(res, 'User not found');
        return;
      }

      this.sendSuccess(res, user, 'User restored successfully');
    } catch (error) {
      const err = error as ErrorWithMessage;
      logger.error('Error restoring user:', err);
      this.sendError(
        res,
        'Failed to restore user',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  public async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      logger.debug('Getting all users via controller', { query: req.query });

      const { page, limit, search } = this.getQueryParams(req);
      const isActive =
        req.query.isActive === 'true'
          ? true
          : req.query.isActive === 'false'
            ? false
            : undefined;

      const query: PaginationQueryDto = {
        page,
        limit,
        search,
        isActive,
      };

      const result = await this.userService.getAllUsers(query);
      this.sendSuccess(res, result, 'Users retrieved successfully');
    } catch (error) {
      const err = error as ErrorWithMessage;
      logger.error('Error getting all users:', err);
      this.sendError(
        res,
        'Failed to retrieve users',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  public async getUserByEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.params;
      logger.debug('Getting user by email via controller', { email });

      if (!email) {
        this.sendBadRequest(res, 'Email is required');
        return;
      }

      if (!this.validateEmail(email)) {
        this.sendBadRequest(res, 'Please provide a valid email address');
        return;
      }

      const user = await this.userService.getUserByEmail(email);

      if (!user) {
        this.sendNotFound(res, 'User not found');
        return;
      }

      this.sendSuccess(res, user, 'User retrieved successfully');
    } catch (error) {
      const err = error as ErrorWithMessage;
      logger.error('Error getting user by email:', err);
      this.sendError(
        res,
        'Failed to retrieve user',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  public async updateLastLogin(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.debug('Updating last login via controller', { id });

      if (!id) {
        this.sendBadRequest(res, 'User ID is required');
        return;
      }

      const user = await this.userService.updateLastLogin(id);

      if (!user) {
        this.sendNotFound(res, 'User not found');
        return;
      }

      this.sendSuccess(res, user, 'Last login updated successfully');
    } catch (error) {
      const err = error as ErrorWithMessage;
      logger.error('Error updating last login:', err);
      this.sendError(
        res,
        'Failed to update last login',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }
}
