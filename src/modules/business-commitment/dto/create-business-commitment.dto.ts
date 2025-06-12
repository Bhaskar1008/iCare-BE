import { IsDate, IsMongoId, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBusinessCommitmentDto {
  @IsMongoId()
  agentId!: string;

  @Type(() => Date)
  @IsDate()
  commitmentDate!: Date;

  @IsNumber()
  @Min(0)
  commitmentCount!: number;

  @IsMongoId()
  createdBy!: string;
}
