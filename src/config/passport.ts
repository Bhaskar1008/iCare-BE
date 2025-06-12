import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { UserModel, type IUser } from '@/models/user.model';
import logger from '@/common/utils/logger';
import type { ITokenPayload } from '@/modules/auth/interfaces/auth.interface';

export const configurePassport = (): void => {
  passport.serializeUser((user: any, done) => {
    logger.debug('Serializing user to session:', { userId: user._id });
    done(null, user._id);
  });

  passport.deserializeUser((id: string, done) => {
    findUserById(id)
      .then(user => done(null, user))
      .catch(error => done(error, null));
  });

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      (email, password, done) => {
        authenticateUser(email, password)
          .then(result => {
            if (result.error) {
              return done(result.error);
            }
            if (!result.user) {
              return done(null, false, {
                message: result.message || 'Authentication failed',
              });
            }
            return done(null, result.user);
          })
          .catch(error => done(error));
      },
    ),
  );

  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET ?? 'jwt_secret',
      },
      (payload: ITokenPayload, done) => {
        findUserByPayload(payload)
          .then(user => done(null, user))
          .catch(error => done(error, false));
      },
    ),
  );
};

// Helper functions to handle async operations
async function findUserById(id: string): Promise<IUser | false> {
  try {
    logger.debug('Deserializing user from session:', { userId: id });
    const user = await UserModel.findById(id);

    if (!user) {
      logger.warn('User not found during session deserialization:', {
        userId: id,
      });
      return false;
    }

    if (!user.isActive || user.isDeleted) {
      logger.warn('Inactive/deleted user tried to use session:', {
        userId: id,
      });
      return false;
    }

    return user;
  } catch (error) {
    logger.error('Error deserializing user from session:', error);
    throw error;
  }
}

async function authenticateUser(
  email: string,
  password: string,
): Promise<{ user: IUser | null; error: Error | null; message: string }> {
  try {
    const user = await UserModel.findOne({
      email,
      isActive: true,
      isDeleted: false,
    }).select('+password');

    if (!user) {
      return { user: null, error: null, message: 'Invalid email or password' };
    }

    // Validate password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return { user: null, error: null, message: 'Invalid email or password' };
    }

    // Remove password from user object
    const userObject = user.toObject() as Partial<
      IUser & { password?: string }
    >;
    delete userObject.password;

    return { user: userObject as IUser, error: null, message: '' };
  } catch (error) {
    logger.error('Local strategy error:', error);
    return {
      user: null,
      error: error as Error,
      message: 'Authentication error',
    };
  }
}

async function findUserByPayload(
  payload: ITokenPayload,
): Promise<IUser | false> {
  try {
    const user = await UserModel.findById(payload.id);

    if (!user || !user.isActive || user.isDeleted) {
      return false;
    }

    return user;
  } catch (error) {
    logger.error('JWT strategy error:', error);
    throw error;
  }
}
