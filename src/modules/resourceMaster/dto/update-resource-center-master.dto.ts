export interface IUpdateResourceCenterMasterDto {
  resourceCategoryName?: string;
  sequence?: number;
  isActive?: boolean;
  categoryId?: string;
  updatedBy?: string;
}

export class UpdateResourceCenterMasterDto
  implements IUpdateResourceCenterMasterDto
{
  resourceCategoryName?: string;
  sequence?: number;
  isActive?: boolean;
  categoryId?: string;
  updatedBy?: string;

  constructor(data: Partial<UpdateResourceCenterMasterDto>) {
    Object.assign(this, data);
  }
}
