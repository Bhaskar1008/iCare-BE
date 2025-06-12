export interface PermissionResourceResponseDto {
  _id: string;
  name: string;
  identifier: string;
  type: 'module' | 'api' | 'page' | 'ui' | 'feature';
  parentId?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}
