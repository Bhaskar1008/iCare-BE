export class HierarchyResponseDto {
  _id!: string;
  channelName?: string;
  channelCode?: string;
  hierarchyName!: string;
  hierarchyLevelCode!: string;
  hierarchyLevel!: number;
  hierarchyParentId?: string;
  parentName?: string;
  hierarchyDescription?: string;
  hierarchyOrder!: number;
  hierarchyStatus!: 'active' | 'inactive';
  isActive!: boolean;
  isRoot!: boolean;
  hasParent!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
