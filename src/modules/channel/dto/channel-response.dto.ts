export interface ChannelResponseDto {
  _id: string;
  channelName: string;
  channelCode: string;
  channelStatus: 'active' | 'inactive';
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
}
