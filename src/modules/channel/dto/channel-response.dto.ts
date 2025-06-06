export interface ChannelResponseDto {
  _id: string;
  channelName: string;
  channelCode: string;
  channelStatus: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}
