import { IsString, IsNotEmpty } from 'class-validator';

export class HierarchyByDesignationDto {
  @IsString()
  @IsNotEmpty()
  designationName!: string;
}
