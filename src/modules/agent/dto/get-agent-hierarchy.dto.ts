import { IsNotEmpty, IsMongoId, IsOptional } from 'class-validator';

export class GetAgentHierarchyDto {
  @IsNotEmpty({ message: 'Agent ID is required' })
  @IsMongoId({ message: 'Agent ID must be a valid MongoDB ObjectId' })
  agentId!: string;

  @IsOptional()
  @IsMongoId({ message: 'Hierarchy ID must be a valid MongoDB ObjectId' })
  hierarchyId?: string;

  @IsOptional()
  @IsMongoId({ message: 'Channel ID must be a valid MongoDB ObjectId' })
  channelId?: string;
}
