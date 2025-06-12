import type { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '@/common/constants/http-status.constants';
import passport from 'passport';
import { AuthService } from '@/modules/auth/auth.service';
import type { IRequestWithUser } from '@/modules/auth/interfaces/auth.interface';
import type { IUser } from '@/models/user.model';
import logger from '@/common/utils/logger';

const _authService = new AuthService();

/**
 * Middleware to authenticate requests using JWT token with Passport.js
 * Extracts the token from the Authorization header and verifies it
 * If valid, attaches the user to the request object
 */
export const authenticateJwt = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  passport.authenticate(
    'jwt',
    { session: true },
    (err: Error | null, user: IUser | false) => {
      if (err) {
        logger.error('JWT authentication error:', err);
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Authentication failed',
          timestamp: new Date().toISOString(),
        });
      }

      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Invalid token or user not found',
          timestamp: new Date().toISOString(),
        });
      }

      // Log in the user to the session
      req.login(user, { session: true }, loginErr => {
        if (loginErr) {
          logger.error('Session login error:', loginErr);
          return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to establish session',
            timestamp: new Date().toISOString(),
          });
        }

        // Attach the user to the request
        (req as IRequestWithUser).user = user;
        next();
      });
    },
  )(req, res, next);
};

/**
 * Middleware to authenticate using local strategy (username/password)
 * Used for login route
 */
export const authenticateLocal = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  passport.authenticate(
    'local',
    { session: true },
    (
      err: Error | null,
      user: IUser | false,
      info: { message: string } | undefined,
    ) => {
      if (err) {
        logger.error('Local authentication error:', err);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: 'Authentication failed',
          timestamp: new Date().toISOString(),
        });
      }

      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: info?.message ?? 'Invalid email or password',
          timestamp: new Date().toISOString(),
        });
      }

      // Log in the user to the session
      req.login(user, { session: true }, loginErr => {
        if (loginErr) {
          logger.error('Session login error:', loginErr);
          return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to establish session',
            timestamp: new Date().toISOString(),
          });
        }

        // Attach the user to the request
        (req as IRequestWithUser).user = user;
        next();
      });
    },
  )(req, res, next);
};

/**
 * Middleware to check if the user has the required role
 * Must be used after authenticateJwt middleware
 */
export const authorizeRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userReq = req as IRequestWithUser;

    if (!userReq.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'User not authenticated',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const userRole = userReq.user.role;

    if (!roles.includes(userRole)) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Access denied. Insufficient permissions',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
};
