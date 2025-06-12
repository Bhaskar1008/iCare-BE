import { IsNumber, Min } from 'class-validator';

export class UpdateCommitmentCountDto {
  @IsNumber()
  @Min(1)
  additionalCount!: number;
}
