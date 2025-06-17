import { IsNotEmpty, IsMongoId } from 'class-validator';

export class GetAgentHierarchiesDto {
  @IsNotEmpty({ message: 'Agent ID is required' })
  @IsMongoId({ message: 'Agent ID must be a valid MongoDB ObjectId' })
  agentId!: string;
}
