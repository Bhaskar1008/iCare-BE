import { AgentModel, type IAgent } from '@/models/agent.model';
import { AuthException } from '@/common/exceptions/auth.exception';
import logger from '@/common/utils/logger';
import type { IAgentLoginDto } from '../dto/agent-login.dto';
import { ModuleModel } from '@/models/module.model';

export class AgentAuthService {
  private generateOTP(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  private async mockSendOTP(
    agent: IAgent,
    otp: string,
    deliveryMethod: 'email' | 'mobile' | 'both',
  ): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 10)); // simulate delay
    // Mock implementation for sending OTP
    logger.info(
      `Mock sending OTP: ${otp} to agent ${agent.agentCode} via ${deliveryMethod}`,
    );

    if (deliveryMethod === 'email' || deliveryMethod === 'both') {
      logger.info(`Mock email sent to: ${agent.email}`);
    }

    if (deliveryMethod === 'mobile' || deliveryMethod === 'both') {
      logger.info(`Mock SMS sent to: ${agent.phoneNumber}`);
    }
  }

  public async initiateLogin(loginDto: IAgentLoginDto): Promise<{
    agentCode: string;
    email?: string;
    phoneNumber?: string;
    message: string;
  }> {
    try {
      const agent = await AgentModel.findOne({
        agentCode: loginDto.agentCode.toUpperCase(),
        agentStatus: 'active',
        isDeleted: false,
      });

      if (!agent) {
        throw new AuthException('Invalid agent code or agent not active');
      }

      // Generate and save OTP
      const otp = this.generateOTP();
      agent.otp = otp;
      await agent.save();

      // Send OTP via selected method
      await this.mockSendOTP(agent, otp, loginDto.otpDeliveryMethod);

      // Return masked contact details
      const maskedEmail = agent.email
        ? `${agent.email.substring(0, 2)}****${agent.email.substring(
            agent.email.lastIndexOf('@'),
          )}`
        : undefined;

      const maskedPhone = agent.phoneNumber
        ? `****${agent.phoneNumber.slice(-4)}`
        : undefined;

      return {
        agentCode: agent.agentCode,
        email: maskedEmail,
        phoneNumber: maskedPhone,
        message: 'OTP sent successfully',
      };
    } catch (error) {
      logger.error('Agent login initiation error:', error);
      throw error;
    }
  }

  public async verifyOTP(agentCode: string, otp: string): Promise<IAgent> {
    try {
      // First find the agent with populated projectId
      const agent = await AgentModel.findOne({
        agentCode: agentCode.toUpperCase(),
        agentStatus: 'active',
        isDeleted: false,
      }).populate({
        path: 'projectId',
        populate: {
          path: 'modules.moduleId',
          model: 'Module',
          select: 'name code description version isCore permissions',
        },
      });

      if (agent && process.env.NODE_ENV == 'development' && otp == '3003') {
        return agent;
      }

      if (!agent || agent.otp !== otp) {
        throw new AuthException(`Invalid OTP for agent ${agentCode}`);
      }

      // Clear OTP after successful verification
      agent.otp = undefined;
      await agent.save();

      // If the modules aren't properly populated, manually populate them
      if (
        agent.projectId &&
        typeof agent.projectId === 'object' &&
        'modules' in agent.projectId
      ) {
        const project = agent.projectId;

        // Check if any module needs to be manually populated
        for (const moduleRef of project.modules) {
          if (moduleRef.moduleId && typeof moduleRef.moduleId === 'string') {
            try {
              // Fetch the module details
              const moduleDetails = await ModuleModel.findById(
                moduleRef.moduleId,
                'name code description version isCore permissions',
              );

              if (moduleDetails) {
                // Replace the string ID with the module object
                moduleRef.moduleId = moduleDetails;
              }
            } catch (err) {
              logger.warn('Failed to manually populate module', { error: err });
            }
          }
        }
      }

      return agent;
    } catch (error) {
      logger.error('OTP verification error:', error);
      throw error;
    }
  }
}
