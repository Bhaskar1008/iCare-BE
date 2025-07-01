import { IsNotEmpty, IsMongoId } from 'class-validator';

export class GetAgentHierarchyInfoDto {
  @IsNotEmpty({ message: 'Agent ID is required' })
  @IsMongoId({ message: 'Agent ID must be a valid MongoDB ObjectId' })
  agentId!: string;

  @IsNotEmpty({ message: 'Channel ID is required' })
  @IsMongoId({ message: 'Channel ID must be a valid MongoDB ObjectId' })
  channelId!: string;
} 