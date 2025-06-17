import jwt from 'jsonwebtoken';
import type { Secret } from 'jsonwebtoken';
import { UserModel, type IUser } from '@/models/user.model';
import { ProjectModel, type IProject } from '@/models/project.model';
import type {
  IAuthService,
  IAuthResponse,
  IRegisterUserDto,
  ITokenPayload,
} from './interfaces/auth.interface';
import { AuthResponseDto } from './dto/auth-response.dto';
import logger from '@/common/utils/logger';
import { AuthException } from '@/common/exceptions/auth.exception';

export class AuthService implements IAuthService {
  private readonly JWT_SECRET: Secret;
  private readonly JWT_EXPIRES_IN: string | number;
  private readonly JWT_REFRESH_SECRET: Secret;
  private readonly JWT_REFRESH_EXPIRES_IN: string | number;

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET ?? 'jwt_secret';
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';
    this.JWT_REFRESH_SECRET =
      process.env.JWT_REFRESH_SECRET ?? 'jwt_refresh_secret';
    this.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';
  }

  public async login(email: string, password: string): Promise<IAuthResponse> {
    try {
      const user = await UserModel.findOne({
        email,
        isActive: true,
        isDeleted: false,
      })
        .select('+password')
        .exec();

      if (!user) {
        throw new AuthException('Invalid email or password');
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new AuthException('Invalid email or password');
      }

      const tokens = this.generateTokens(user);

      user.lastLoginAt = new Date();
      user.refreshToken = tokens.refreshToken;
      await user.save();

      const userObject = user.toObject();
      // delete userObject.password;
      delete userObject.refreshToken;
      delete userObject.passwordResetToken;
      delete userObject.passwordResetExpires;

      // Fetch project information based on user role
      const projects = await this.fetchProjectsForUser(user);

      return new AuthResponseDto(
        userObject,
        tokens.accessToken,
        tokens.refreshToken,
        projects,
      );
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  public async generateTokensForUser(
    user: IUser,
    channelId?: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    projects?: IProject[];
  }> {
    try {
      const tokens = this.generateTokens(user, channelId);

      await UserModel.findByIdAndUpdate(user._id, {
        lastLoginAt: new Date(),
        refreshToken: tokens.refreshToken,
      });

      // Fetch project information based on user role
      const projects = await this.fetchProjectsForUser(user);

      return { ...tokens, projects };
    } catch (error) {
      logger.error('Error generating tokens for user:', error);
      throw new AuthException('Failed to generate authentication tokens');
    }
  }

  public async register(userData: IRegisterUserDto): Promise<IUser> {
    try {
      const existingUser = await UserModel.findOne({ email: userData.email });
      if (existingUser) {
        throw new AuthException('User with this email already exists');
      }

      // Set default role if not provided
      userData.role = userData.role ?? 'user';

      // Validate projectId for users with role 'user'
      if (userData.role === 'user' && !userData.projectId) {
        throw new AuthException(
          'Project ID is required for users with role "user"',
        );
      }

      const newUser = await UserModel.create(userData);
      return newUser;
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  public async refreshToken(refreshToken: string): Promise<IAuthResponse> {
    try {
      const decoded = await this.verifyToken(refreshToken, true);

      const user = await UserModel.findById(decoded.id)
        .select('+refreshToken')
        .exec();

      if (
        !user ||
        user.refreshToken !== refreshToken ||
        !user.isActive ||
        user.isDeleted
      ) {
        throw new AuthException('Invalid refresh token');
      }

      const tokens = this.generateTokens(user);

      user.refreshToken = tokens.refreshToken;
      await user.save();

      // Fetch project information based on user role
      const projects = await this.fetchProjectsForUser(user);

      return new AuthResponseDto(
        user,
        tokens.accessToken,
        tokens.refreshToken,
        projects,
      );
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw error;
    }
  }

  public async logout(userId: string): Promise<void> {
    try {
      await UserModel.findByIdAndUpdate(userId, { refreshToken: null });
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  public async verifyToken(
    token: string,
    isRefreshToken = false,
  ): Promise<ITokenPayload> {
    try {
      const secret = isRefreshToken ? this.JWT_REFRESH_SECRET : this.JWT_SECRET;
      const decoded = await Promise.resolve(
        jwt.verify(token, secret) as ITokenPayload,
      );
      return decoded;
    } catch (error) {
      logger.error('Token verification error:', error);
      throw new AuthException('Invalid token');
    }
  }

  private generateTokens(
    user: IUser,
    channelId?: string,
  ): {
    accessToken: string;
    refreshToken: string;
  } {
    const payload: ITokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      ...(channelId && { channelId }),
    };

    // Handle expiresIn type conversion for JWT sign
    // @ts-expect-error jwt.sign types are incompatible with our usage
    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });

    // @ts-expect-error jwt.sign types are incompatible with our usage
    const refreshToken = jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.JWT_REFRESH_EXPIRES_IN,
    });

    return { accessToken, refreshToken };
  }

  private async fetchProjectsForUser(user: IUser): Promise<IProject[]> {
    try {
      if (user.role === 'user') {
        // For users with role "user", fetch only their assigned project
        if (!user.projectId) {
          return [];
        }

        const project = await ProjectModel.findById(user.projectId)
          .populate(
            'modules.moduleId',
            'name code description version isCore permissions',
          )
          .lean();

        return project ? [project] : [];
      } else {
        // For admin and superadmin, fetch all projects
        return await ProjectModel.find({ isDeleted: false })
          .populate(
            'modules.moduleId',
            'name code description version isCore permissions',
          )
          .sort({ createdAt: -1 })
          .lean();
      }
    } catch (error) {
      logger.error('Error fetching projects for user:', {
        error,
        userId: user._id,
        role: user.role,
        projectId: user.projectId,
      });
      return [];
    }
  }
}
