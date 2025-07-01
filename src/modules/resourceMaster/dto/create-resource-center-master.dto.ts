export interface ICreateResourceCenterMasterDto {
  resourceCategoryName: string;
  sequence: number;
  isActive?: boolean;
  createdBy?: string;
}

export class CreateResourceCenterMasterDto
  implements ICreateResourceCenterMasterDto
{
  resourceCategoryName!: string;
  sequence!: number;
  isActive?: boolean;
  createdBy?: string;

  constructor(data: Partial<CreateResourceCenterMasterDto>) {
    Object.assign(this, data);
    this.isActive ??= false;
  }
}
