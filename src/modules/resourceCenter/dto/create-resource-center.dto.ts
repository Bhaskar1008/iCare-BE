import { v4 as uuidv4 } from 'uuid';

interface ChannelInfo {
  channelId: string;
  channelName: string;
}

interface TagInfo {
  tagName: string;
  tagId: string;
}

interface RoleInfo {
  roleId: string;
  roleName: string;
}

interface ResourceCenterFile {
  s3Key: string;
  s3Link: string;
  documentFormat: string;
  isActive: boolean;
}

export class CreateResourceCenterDto {
  channelId!: ChannelInfo[];
  projectId?: string;
  resourceCategory!: string;
  subCategory!: string[];
  isActive?: boolean;
  title!: string;
  description!: string;
  documentId?: string;
  publish!: 'publish' | 'draft';
  tags!: TagInfo[];
  roles!: RoleInfo[];
  updatedBy?: string;
  createdBy?: string;
  files?: ResourceCenterFile[];

  constructor(data: Partial<CreateResourceCenterDto>) {
    Object.assign(this, data);
    // Generate UUID for documentId if not provided
    this.documentId ??= uuidv4();
    // Set default value for isActive
    this.isActive ??= false;
  }
}
