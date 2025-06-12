import type { Types } from 'mongoose';

export class AgentResponseDto {
  _id!: string | Types.ObjectId;
  channelId!: string | Types.ObjectId;
  channelName?: string;
  channelCode?: string;
  designationId!: string | Types.ObjectId;
  designationName?: string;
  designationCode?: string;
  agentCode!: string;
  employeeId?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  displayName?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  agentStatus!: 'active' | 'inactive' | 'suspended';
  joiningDate?: Date;
  targetAmount?: number;
  commissionPercentage?: number;
  isTeamLead!: boolean;
  teamLeadId?: string | Types.ObjectId;
  teamLeadName?: string;
  teamLeadCode?: string;
  reportingManagerId?: string | Types.ObjectId;
  reportingManagerName?: string;
  reportingManagerCode?: string;
  profilePictureUrl?: string;
  createdAt!: Date;
  updatedAt!: Date;
}
