export interface IResourceCenterMasterResponseDto {
  _id: string;
  resourceCategoryName: string;
  sequence: number;
  isActive: boolean;
  categoryId: string;
  updatedBy?: string;
  updatedAt?: Date;
  createdBy?: string;
  createdAt: Date;
}

export class ResourceCenterMasterResponseDto
  implements IResourceCenterMasterResponseDto
{
  _id!: string;
  resourceCategoryName!: string;
  sequence!: number;
  isActive!: boolean;
  categoryId!: string;
  updatedBy?: string;
  updatedAt?: Date;
  createdBy?: string;
  createdAt!: Date;

  constructor(data: IResourceCenterMasterResponseDto) {
    Object.assign(this, data);
  }
}
