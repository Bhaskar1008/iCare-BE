export interface IAgentLoginDto {
  agentCode: string;
  otpDeliveryMethod: 'email' | 'mobile' | 'both';
}

export class AgentLoginDto implements IAgentLoginDto {
  agentCode!: string;
  otpDeliveryMethod!: 'email' | 'mobile' | 'both';
}
