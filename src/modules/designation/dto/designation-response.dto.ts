import type { Types } from 'mongoose';

export interface ChannelResponseDto {
  _id: Types.ObjectId | string;
  channelName: string;
  channelCode: string;
  channelStatus: 'active' | 'inactive';
}

export interface RoleResponseDto {
  _id: Types.ObjectId | string;
  roleName: string;
  roleCode: number;
  status: 'active' | 'inactive';
}

export interface HierarchyResponseDto {
  _id: Types.ObjectId | string;
  hierarchyName: string;
  hierarchyLevelCode: string;
  hierarchyLevel: number;
  hierarchyStatus: 'active' | 'inactive';
}

export interface DesignationResponseDto {
  _id: Types.ObjectId | string;
  channel: Types.ObjectId | string | ChannelResponseDto;
  role: Types.ObjectId | string | RoleResponseDto;
  hierarchy: Types.ObjectId | string | HierarchyResponseDto;
  designationName: string;
  designationCode: string;
  designationStatus: 'active' | 'inactive';
  designationDescription?: string;
  designationOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
