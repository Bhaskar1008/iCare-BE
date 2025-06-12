export interface PermissionResponseDto {
  _id: string;
  resourceId: string;
  action:
    | 'create'
    | 'read'
    | 'update'
    | 'delete'
    | 'view'
    | 'edit'
    | 'publish'
    | 'approve'
    | 'reject'
    | 'export'
    | 'import'
    | 'share'
    | 'download'
    | 'upload'
    | 'admin'
    | 'manage'
    | '*';
  effect: 'allow' | 'deny';
  conditions?: Record<string, unknown>;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}
