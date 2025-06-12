import { IsNumber, Min } from 'class-validator';

export class UpdateBusinessCommitmentDto {
  @IsNumber()
  @Min(0)
  achievedCount!: number;
}
