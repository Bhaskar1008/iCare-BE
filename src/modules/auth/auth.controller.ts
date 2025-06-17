import type { Request, Response } from 'express';
import { BaseController } from '@/controllers/base.controller';
import { AuthService } from './auth.service';
import type {
  IAuthController,
  IRequestWithUser,
  IVerifyAgentOTPBody,
} from './interfaces/auth.interface';
import { HTTP_STATUS } from '@/common/constants/http-status.constants';
import logger from '@/common/utils/logger';
import { RegisterDto } from './dto/register.dto';
import { AgentAuthService } from './services/agent-auth.service';
import type { AgentLoginDto } from './dto/agent-login.dto';
import { UserModel, type IUser } from '@/models/user.model';
import type { IAgent } from '@/models/agent.model';

// Define time constants to avoid magic numbers
const SEVEN_DAYS = 7;
const TWENTY_FOUR_HOURS = 24;
const SIXTY_MINUTES = 60;
const SIXTY_SECONDS = 60;
const MILLISECONDS_PER_SECOND = 1000;
const SEVEN_DAYS_IN_MS =
  SEVEN_DAYS *
  TWENTY_FOUR_HOURS *
  SIXTY_MINUTES *
  SIXTY_SECONDS *
  MILLISECONDS_PER_SECOND;
const MIN_PASSWORD_LENGTH = 8;

export class AuthController extends BaseController implements IAuthController {
  private authService: AuthService;
  private agentAuthService: AgentAuthService;

  constructor() {
    super();
    this.authService = new AuthService();
    this.agentAuthService = new AgentAuthService();
  }

  public async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, role, projectId } =
        req.body;
      if (!email || !password || !firstName || !lastName) {
        this.sendBadRequest(res, 'Missing required fields');
        return;
      }

      if (password.length < MIN_PASSWORD_LENGTH) {
        this.sendBadRequest(
          res,
          `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
        );
        return;
      }

      // Validate projectId if role is 'user'
      if (role === 'user' && !projectId) {
        this.sendBadRequest(
          res,
          'Project ID is required for users with role "user"',
        );
        return;
      }

      const registerDto = new RegisterDto();
      registerDto.email = email;
      registerDto.password = password;
      registerDto.firstName = firstName;
      registerDto.lastName = lastName;
      registerDto.role = role ?? 'user';
      registerDto.projectId = projectId;

      const user = await this.authService.register(registerDto);

      this.sendCreated(res, user, 'User registered successfully');
    } catch (error) {
      logger.error('Error registering user:', error);

      if (error instanceof Error && error.message.includes('already exists')) {
        this.sendConflict(res, error.message);
        return;
      }

      this.sendError(
        res,
        'Failed to register user',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async login(req: Request, res: Response): Promise<void> {
    try {
      const userReq = req as IRequestWithUser;
      const user = userReq.user;

      if (!user) {
        this.sendUnauthorized(res, 'Authentication failed');
        return;
      }

      const tokenResponse = await this.authService.generateTokensForUser(user);

      res.cookie('refreshToken', tokenResponse.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: SEVEN_DAYS_IN_MS,
      });

      this.sendSuccess(
        res,
        {
          user,
          accessToken: tokenResponse.accessToken,
          projects: tokenResponse.projects,
        },
        'Login successful',
      );
    } catch (error) {
      logger.error('Error logging in:', error);
      this.sendError(
        res,
        'Failed to log in',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        this.sendUnauthorized(res, 'Refresh token is required');
        return;
      }

      const authResponse = await this.authService.refreshToken(
        refreshToken as string,
      );

      res.cookie('refreshToken', authResponse.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: SEVEN_DAYS_IN_MS,
      });

      this.sendSuccess(
        res,
        {
          user: authResponse.user,
          accessToken: authResponse.accessToken,
          projects: authResponse.projects,
        },
        'Token refreshed successfully',
      );
    } catch (error) {
      logger.error('Error refreshing token:', error);
      this.sendUnauthorized(res, 'Invalid refresh token');
    }
  }

  public async logout(req: Request, res: Response): Promise<void> {
    try {
      const userReq = req as IRequestWithUser;
      const user = userReq.user;

      if (!user?._id) {
        this.sendUnauthorized(res, 'User not authenticated');
        return;
      }

      await this.authService.logout(user._id.toString());

      res.clearCookie('refreshToken');

      req.logout((logoutErr: Error | null) => {
        if (logoutErr) {
          logger.error('Error during passport logout:', logoutErr);
        }

        if (req.session) {
          req.session.destroy((sessionErr: Error | null) => {
            if (sessionErr) {
              logger.error('Error destroying session:', sessionErr);
              this.sendError(
                res,
                'Error during logout',
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
              );
              return;
            }

            // Clear session cookie
            res.clearCookie('connect.sid');

            this.sendSuccess(res, null, 'Logged out successfully');
          });
        } else {
          this.sendSuccess(res, null, 'Logged out successfully');
        }
      });
    } catch (error) {
      logger.error('Error logging out:', error);
      this.sendError(
        res,
        'Failed to log out',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async agentLogin(req: Request, res: Response): Promise<void> {
    try {
      const { agentCode, otpDeliveryMethod } = req.body;

      if (!agentCode || !otpDeliveryMethod) {
        this.sendBadRequest(res, 'Missing required fields');
        return;
      }

      const loginDto: AgentLoginDto = {
        agentCode,
        otpDeliveryMethod,
      };

      const result = await this.agentAuthService.initiateLogin(loginDto);
      this.sendSuccess(res, result, 'OTP sent successfully');
    } catch (error) {
      logger.error('Error initiating agent login:', error);

      if (error instanceof Error) {
        this.sendUnauthorized(res, error.message);
        return;
      }

      this.sendError(
        res,
        'Failed to initiate agent login',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async verifyAgentOTP(req: Request, res: Response): Promise<void> {
    try {
      const { agentCode, otp } = req.body as IVerifyAgentOTPBody;

      if (!agentCode || !otp) {
        this.sendBadRequest(res, 'Missing required fields');
        return;
      }

      const agent = await this.agentAuthService.verifyOTP(agentCode, otp);
      const user = await this.getUserForAgent(agent);

      if (!user) {
        this.sendUnauthorized(res, 'User not found');
        return;
      }

      const tokens = await this.generateTokensForAgent(user, agent);
      this.setRefreshTokenCookie(res, tokens.refreshToken);

      this.sendSuccess(
        res,
        {
          agent,
          accessToken: tokens.accessToken,
          projects: tokens.projects,
        },
        'OTP verified successfully',
      );
    } catch (error) {
      this.handleVerifyOTPError(res, error);
    }
  }

  private async getUserForAgent(agent: IAgent): Promise<IUser | null> {
    return UserModel.findById(agent.userId);
  }

  private async generateTokensForAgent(user: IUser, agent: IAgent) {
    const channelId = this.extractChannelId(agent);
    return this.authService.generateTokensForUser(user, channelId);
  }

  private extractChannelId(agent: IAgent): string | undefined {
    const { channelId } = agent;

    if (typeof channelId === 'string') {
      return channelId;
    }

    if (channelId && typeof channelId === 'object') {
      // Check if it's a populated object with _id property
      if ('_id' in channelId && typeof channelId._id === 'string') {
        return channelId._id;
      }
      // Check if it's an ObjectId-like object with toHexString method
      if (
        'toHexString' in channelId &&
        typeof channelId.toHexString === 'function'
      ) {
        return channelId.toHexString();
      }
      // Check if it has _id as ObjectId
      if (
        '_id' in channelId &&
        channelId._id &&
        typeof channelId._id === 'object'
      ) {
        const objectId = channelId._id as { toString(): string };
        return objectId.toString();
      }
    }

    return undefined;
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: SEVEN_DAYS_IN_MS,
    });
  }

  private handleVerifyOTPError(res: Response, error: unknown): void {
    logger.error('Error verifying agent OTP:', error);

    if (error instanceof Error) {
      this.sendUnauthorized(res, error.message);
      return;
    }

    this.sendError(
      res,
      'Failed to verify OTP',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
}
