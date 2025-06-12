// Channel response interface
export interface ChannelDto {
  _id: string;
  channelName?: string;
  channelCode?: string | number;
  channelStatus?: string;
}

// Resource response interface
export interface ResourceDto {
  _id: string;
  name?: string;
  identifier?: string;
  type?: string;
  parentId?: string;
  status?: string;
}

// Permission response interface
export interface PermissionDto {
  _id: string;
  resource?: ResourceDto | string;
  action?: string;
  effect?: string;
  conditions?: Record<string, unknown>;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RoleResponseDto {
  _id: string;
  channel: ChannelDto | string;
  roleName: string;
  roleCode: number;
  description?: string;
  permissions: Array<PermissionDto | string>;
  isSystem: boolean;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}
