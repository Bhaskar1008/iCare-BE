import { Types } from 'mongoose';
import { UserModel } from '@/models/user.model';
import logger from '@/common/utils/logger';
import { DatabaseException } from '@/common/exceptions/database.exception';

export async function getUserIdByProjectId(
  projectId: string,
): Promise<Types.ObjectId> {
  try {
    logger.debug('Fetching user ID for project', { projectId });

    const user = await UserModel.findOne({
      projectId: new Types.ObjectId(projectId),
    });

    if (!user) {
      throw new DatabaseException('No user found for the given project ID');
    }

    logger.debug('Found user for project', {
      projectId,
      userId: user._id,
      userEmail: user.email,
    });

    return user._id as unknown as Types.ObjectId;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to fetch user ID for project:', {
      error: err.message,
      stack: err.stack,
      projectId,
    });
    throw err;
  }
}
