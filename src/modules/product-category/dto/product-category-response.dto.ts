export interface ProductCategoryResponseDto {
  _id: string;
  categoryName: string;
  sequenceNumber: number;
  status: 'active' | 'inactive';
  createdBy: string;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
}
