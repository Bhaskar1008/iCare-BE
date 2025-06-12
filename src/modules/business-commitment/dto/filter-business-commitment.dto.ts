import { IsDate, IsMongoId, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterBusinessCommitmentDto {
  @IsOptional()
  @IsMongoId()
  agentId?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fromDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  toDate?: Date;
}
