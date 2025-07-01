import {
  AobApplicationModel,
  type IAobApplication,
} from '@/models/aob-application.model';
import { AgentModel, type IAgent } from '@/models/agent.model';
import { UserModel } from '@/models/user.model';
import { Types } from 'mongoose';
import logger from '@/common/utils/logger';
import { generateAgentCode } from '@/modules/agent/utils/agent-code-generator';
import { AobEmailTemplates } from '@/emailTemplates/aob.templates';

interface ApprovalResult {
  success: boolean;
  message: string;
  application?: IAobApplication;
  agent?: IAgent;
}

export class ApplicationApprovalService {
  /**
   * Process an approved application by creating an agent
   * @param applicationId The application ID
   * @param projectId The project ID
   * @param remarks Optional remarks
   * @returns The created agent with application details
   */
  public async processApprovedApplication(
    applicationId: string,
    projectId: string,
    remarks?: string,
  ): Promise<ApprovalResult> {
    try {
      logger.debug('Processing approved application', {
        applicationId,
        projectId,
      });

      // Find the application
      const application = await AobApplicationModel.findOne({ applicationId });
      if (!application) {
        logger.error('Application not found', { applicationId });
        return {
          success: false,
          message: 'Application not found',
        };
      }

      // Check if application is already approved
      if (application.applicationStatus === 'approved') {
        logger.warn('Application already approved', { applicationId });
        return {
          success: false,
          message: 'Application already approved',
        };
      }

      // Find the user associated with the project and role='user'
      const user = await UserModel.findOne({
        projectId: new Types.ObjectId(projectId),
        role: 'user',
      });

      if (!user) {
        logger.error('No user found for project with role=user', { projectId });
        return {
          success: false,
          message: 'No user found associated with the project',
        };
      }

      logger.debug('Found user for agent creation', {
        userId: user._id,
        projectId,
        applicationId,
      });

      // Generate agent code
      const agentCode = await generateAgentCode(projectId);

      // Create agent
      const agent = await AgentModel.create({
        userId: user._id,
        agentCode,
        firstName: application.firstName,
        lastName: application.lastName,
        middleName: application.middleName,
        email: application.emailAddress,
        phoneNumber: application.mobileNumber,
        address: {
          street: application.address ?? '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
        },
        projectId: new Types.ObjectId(projectId),
        agentStatus: 'active',
        isTeamLead: false,
        channelId: new Types.ObjectId(), // This needs to be set based on your business logic
        designationId: new Types.ObjectId(), // This needs to be set based on your business logic
      });

      // Update application status
      application.applicationStatus = 'approved';
      if (remarks) {
        application.rejectRemark = remarks;
      }
      application.qcAndDiscrepencyList = [];
      await application.save();

      // Send onboarding email
      await this.sendOnboardingEmail(application, agent.agentCode);

      logger.info('Application approved and agent created successfully', {
        applicationId,
        agentId: agent._id,
        agentCode: agent.agentCode,
      });

      return {
        success: true,
        message: 'Application approved and agent created successfully',
        application,
        agent,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to process approved application', {
        error: err.message,
        stack: err.stack,
        applicationId,
        projectId,
      });
      return {
        success: false,
        message: `Failed to process application: ${err.message}`,
      };
    }
  }

  /**
   * Send an onboarding email to the new agent
   * @param application The application data
   * @param agentCode The agent code
   * @param projectId The project ID
   */
  private async sendOnboardingEmail(
    application: IAobApplication,
    agentCode: string,
  ) {
    try {
      await AobEmailTemplates.sendOnboardingEmail(
        application.emailAddress,
        application.firstName ?? '',
        application.lastName ?? '',
        agentCode,
      );

      logger.info('Onboarding email sent successfully', {
        email: application.emailAddress,
        agentCode,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to send onboarding email', {
        error: err.message,
        stack: err.stack,
        email: application.emailAddress,
        agentCode,
      });
      // Don't throw the error, just log it - we don't want to fail the whole process if just the email fails
    }
  }
}
