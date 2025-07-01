import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsOptional,
  IsMongoId,
} from 'class-validator';

export class ApplicationPatchDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['document', 'application'])
  type!: 'document' | 'application';

  @IsString()
  @IsNotEmpty()
  @IsIn([
    'applicationSubmitted',
    'underReview',
    'rejected',
    'qcRejected',
    'approved',
    'returned',
  ])
  status!:
    | 'applicationSubmitted'
    | 'underReview'
    | 'rejected'
    | 'qcRejected'
    | 'approved'
    | 'returned';

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsOptional()
  @IsMongoId({ message: 'Project ID must be a valid MongoDB ObjectId' })
  projectId?: string;
}
