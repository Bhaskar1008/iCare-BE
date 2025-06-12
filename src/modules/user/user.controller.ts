import type { Request, Response } from 'express';
import { BaseController } from '@/controllers/base.controller';
import { UserService } from './user.service';
import type {
  IUserController,
  IUserService,
} from './interfaces/user.interface';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import { HTTP_STATUS } from '@/common/constants/http-status.constants';
import { DatabaseValidationException } from '@/common/exceptions/database.exception';
import logger from '@/common/utils/logger';
import type { ValidatedRequest } from '@/common/interfaces/validation.interface';
import type { UserQueryDto } from './dto/user-query.dto';

export class UserController extends BaseController implements IUserController {
  private userService: IUserService;

  constructor() {
    super();
    this.userService = new UserService();
  }

  public createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.debug('Create user request received', req.body);

      // req.body is now validated and transformed by ValidationPipe
      const userData = req.body as CreateUserDto;
      const user = await this.userService.createUser(userData);

      logger.info('User created successfully', {
        id: user.id,
        email: user.email,
      });

      this.sendCreated(res, user, 'User created successfully');
    } catch (error) {
      this.handleCreateUserError(error, req, res);
    }
  };

  private handleCreateUserError(
    error: unknown,
    req: Request,
    res: Response,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to create user:', {
      error: err.message,
      stack: err.stack,
    });

    if (error instanceof DatabaseValidationException) {
      this.sendBadRequest(res, err.message);
      return;
    }

    if (err.message?.includes('already exists')) {
      this.sendConflict(res, err.message);
      return;
    }

    this.sendError(
      res,
      'Failed to create user',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      err,
    );
  }

  public getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      logger.debug('Get user by ID request received', { id });

      if (!id) {
        this.sendBadRequest(res, 'User ID is required');
        return;
      }

      const user = await this.userService.getUserById(id);

      if (!user) {
        this.sendNotFound(res, 'User not found');
        return;
      }

      logger.debug('User retrieved successfully', { id });
      this.sendSuccess(res, user, 'User retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get user by ID:', {
        error: err.message,
        stack: err.stack,
        id: req.params.id,
      });

      this.sendError(
        res,
        'Failed to retrieve user',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getUserByEmail = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { email } = req.params;
      logger.debug('Get user by email request received', { email });

      if (!email) {
        this.sendBadRequest(res, 'Email is required');
        return;
      }

      const user = await this.userService.getUserByEmail(email);

      if (!user) {
        this.sendNotFound(res, 'User not found');
        return;
      }

      logger.debug('User retrieved successfully', { email, id: user.id });
      this.sendSuccess(res, user, 'User retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get user by email:', {
        error: err.message,
        stack: err.stack,
        email: req.params.email,
      });

      this.sendError(
        res,
        'Failed to retrieve user',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.debug('Get all users request received', { query: req.query });

      const queryParams = (req as ValidatedRequest<UserQueryDto>)
        .validatedQuery;

      const result = await this.userService.getAllUsers(queryParams);

      logger.debug('Users retrieved successfully', {
        count: result.users.length,
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
      });

      this.sendSuccess(res, result, 'Users retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get all users:', {
        error: err.message,
        stack: err.stack,
        query: req.query,
      });

      this.sendError(
        res,
        'Failed to retrieve users',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      logger.debug('Update user request received', { id, body: req.body });

      if (!id) {
        this.sendBadRequest(res, 'User ID is required');
        return;
      }

      // req.body is now validated and transformed by ValidationPipe
      const userData = req.body as UpdateUserDto;
      const user = await this.userService.updateUser(id, userData);

      if (!user) {
        this.sendNotFound(res, 'User not found');
        return;
      }

      logger.info('User updated successfully', { id });
      this.sendSuccess(res, user, 'User updated successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to update user:', {
        error: err.message,
        stack: err.stack,
        id: req.params.id,
      });

      if (error instanceof DatabaseValidationException) {
        this.sendBadRequest(res, err.message);
        return;
      }

      if (err.message?.includes('already taken')) {
        this.sendConflict(res, err.message);
        return;
      }

      this.sendError(
        res,
        'Failed to update user',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      logger.debug('Delete user request received', { id });

      if (!id) {
        this.sendBadRequest(res, 'User ID is required');
        return;
      }

      const success = await this.userService.deleteUser(id);

      if (!success) {
        this.sendNotFound(res, 'User not found');
        return;
      }

      logger.info('User deleted successfully', { id });
      this.sendSuccess(res, { id }, 'User deleted successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to delete user:', {
        error: err.message,
        stack: err.stack,
        id: req.params.id,
      });

      this.sendError(
        res,
        'Failed to delete user',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public restoreUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      logger.debug('Restore user request received', { id });

      if (!id) {
        this.sendBadRequest(res, 'User ID is required');
        return;
      }

      const user = await this.userService.restoreUser(id);

      if (!user) {
        this.sendNotFound(res, 'User not found');
        return;
      }

      logger.info('User restored successfully', { id });
      this.sendSuccess(res, user, 'User restored successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to restore user:', {
        error: err.message,
        stack: err.stack,
        id: req.params.id,
      });

      this.sendError(
        res,
        'Failed to restore user',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public updateLastLogin = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      logger.debug('Update last login request received', { id });

      if (!id) {
        this.sendBadRequest(res, 'User ID is required');
        return;
      }

      const user = await this.userService.updateLastLogin(id);

      if (!user) {
        this.sendNotFound(res, 'User not found');
        return;
      }

      logger.info('User last login updated successfully', { id });
      this.sendSuccess(res, user, 'User last login updated successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to update user last login:', {
        error: err.message,
        stack: err.stack,
        id: req.params.id,
      });

      this.sendError(
        res,
        'Failed to update user last login',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public sendOtp = async (req: Request, res: Response): Promise<void> => {
    try {
      const { agentCode } = req.params;
      logger.debug('Send OTP request received', { agentCode });

      if (!agentCode) {
        this.sendBadRequest(res, 'Agent code is required');
        return;
      }

      // Verify agent exists
      const user = await this.userService.getUserByAgentCode(agentCode, false);
      if (!user) {
        this.sendNotFound(res, 'Agent not found');
        return;
      }

      // In a real implementation, you would:
      // 1. Generate a new OTP
      // 2. Send it via SMS
      // For now, we'll just return success since we're using a default OTP

      logger.info('OTP request processed for agent', { agentCode });
      this.sendSuccess(res, null, 'OTP sent to your registered mobile number');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to process OTP request:', {
        error: err.message,
        stack: err.stack,
        agentCode: req.params.agentCode,
      });

      this.sendError(
        res,
        'Failed to process OTP request',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public verifyOtp = async (req: Request, res: Response): Promise<void> => {
    try {
      const { agentCode, otp } = req.params;
      logger.debug('Verify OTP request received', { agentCode, otp });

      if (!agentCode || !otp) {
        this.sendBadRequest(res, 'Agent code and OTP are required');
        return;
      }

      // Find user with the agent code and include the OTP field
      const user = await this.userService.getUserByAgentCode(agentCode, true);

      if (!user) {
        this.sendNotFound(res, 'Agent not found');
        return;
      }

      // Compare OTP
      if (user.otp !== otp) {
        this.sendBadRequest(res, 'Invalid OTP');
        return;
      }

      logger.info('OTP verified successfully for agent', { agentCode });
      this.sendSuccess(res, user, 'OTP verified successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to verify OTP:', {
        error: err.message,
        stack: err.stack,
        agentCode: req.params.agentCode,
      });

      this.sendError(
        res,
        'Failed to verify OTP',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };
}
