import type { Request, Response } from 'express';
import type { Session } from 'express-session';
import type { IUser } from '@/models/user.model';
import type { IProject } from '@/models/project.model';

export interface IAuthService {
  login(email: string, password: string): Promise<IAuthResponse>;
  register(userData: IRegisterUserDto): Promise<IUser>;
  refreshToken(refreshToken: string): Promise<IAuthResponse>;
  logout(userId: string): Promise<void>;
  verifyToken(token: string, isRefreshToken?: boolean): Promise<ITokenPayload>;
  generateTokensForUser(
    user: IUser,
    channelId?: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    projects?: IProject[];
  }>;
}

export interface IAuthController {
  register(req: Request, res: Response): Promise<void>;
  login(req: Request, res: Response): Promise<void>;
  refreshToken(req: Request, res: Response): Promise<void>;
  logout(req: Request, res: Response): Promise<void>;
  agentLogin(req: Request, res: Response): Promise<void>;
  verifyAgentOTP(req: Request, res: Response): Promise<void>;
}

export interface IRegisterUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
  projectId?: string;
}

export interface IVerifyAgentOTPBody {
  agentCode: string;
  otp: string;
}

export interface ILoginDto {
  email: string;
  password: string;
}

export interface IAuthResponse {
  user: IUser;
  accessToken: string;
  refreshToken: string;
  projects?: IProject[];
}

export interface ITokenPayload {
  id: string;
  email: string;
  role: string;
  channelId?: string;
}

// Extending the Express session interface to include user
declare module 'express-session' {
  interface SessionData {
    passport: {
      user: string; // User ID stored in the session
    };
  }
}

// We're extending the Express Request type but not trying to redefine built-in methods
export interface IRequestWithUser extends Request {
  user?: IUser;
  session: Session &
    Partial<{
      passport: {
        user: string;
      };
    }>;
}
