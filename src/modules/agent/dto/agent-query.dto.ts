import { IsOptional, IsIn, IsMongoId, IsNumberString } from 'class-validator';
import { Transform } from 'class-transformer';
import { PAGINATION } from '@/common/constants/http-status.constants';
import { Types } from 'mongoose';

export class AgentQueryDto {
  @IsOptional()
  @IsNumberString({}, { message: 'Page must be a number' })
  @Transform(({ value }): string => value ?? String(PAGINATION.DEFAULT_PAGE))
  page: string = String(PAGINATION.DEFAULT_PAGE);

  @IsOptional()
  @IsNumberString({}, { message: 'Limit must be a number' })
  @Transform(({ value }): string => value ?? String(PAGINATION.DEFAULT_LIMIT))
  limit: string = String(PAGINATION.DEFAULT_LIMIT);

  @IsOptional()
  @IsIn(['active', 'inactive', 'suspended'], {
    message: 'Status must be one of: active, inactive, suspended',
  })
  status?: 'active' | 'inactive' | 'suspended';

  @IsOptional()
  @IsMongoId({ message: 'Channel ID must be a valid ID' })
  channelId?: string;

  @IsOptional()
  @IsMongoId({ message: 'User ID must be a valid ID' })
  userId?: string;

  getPage(): number {
    const parsedPage = parseInt(this.page, 10);
    return isNaN(parsedPage) || parsedPage <= 0
      ? PAGINATION.DEFAULT_PAGE
      : parsedPage;
  }

  getLimit(): number {
    const parsedLimit = parseInt(this.limit, 10);
    return isNaN(parsedLimit) || parsedLimit <= 0
      ? PAGINATION.DEFAULT_LIMIT
      : parsedLimit;
  }

  getChannelId(): Types.ObjectId | undefined {
    return this.channelId ? new Types.ObjectId(this.channelId) : undefined;
  }

  getUserId(): Types.ObjectId | undefined {
    return this.userId ? new Types.ObjectId(this.userId) : undefined;
  }
}
