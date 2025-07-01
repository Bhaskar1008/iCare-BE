import type { Types } from 'mongoose';
import { NotificationService } from '../notification.service';
import type { ILead } from '@/models/lead.model';
import logger from '@/common/utils/logger';

export class LeadNotificationService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Create notification when a new lead is created
   */
  async notifyLeadCreation(lead: ILead): Promise<void> {
    try {
      const leadName = `${lead.firstName} ${lead.lastName}`;

      await this.notificationService.createLeadCreationNotification({
        leadId: lead._id as unknown as Types.ObjectId,
        leadName,
        createdBy: lead.createdBy,
        allocatedTo: lead.allocatedTo,
        projectId: lead.projectId,
      });

      logger.info('Lead creation notification sent successfully', {
        leadId: lead._id,
        leadName,
        createdBy: lead.createdBy,
        allocatedTo: lead.allocatedTo,
      });
    } catch (error) {
      logger.error('Failed to send lead creation notification:', {
        leadId: lead._id,
        error: (error as Error).message,
      });
      // Don't throw error to avoid breaking lead creation process
    }
  }

  /**
   * Create notification when a lead is allocated or reallocated
   */
  async notifyLeadAllocation(
    lead: ILead,
    previousAllocatedTo?: Types.ObjectId,
    allocatedBy?: Types.ObjectId,
  ): Promise<void> {
    try {
      const leadName = `${lead.firstName} ${lead.lastName}`;

      await this.notificationService.createLeadAllocationNotification({
        leadId: lead._id as unknown as Types.ObjectId,
        leadName,
        previousAllocatedTo,
        newAllocatedTo: lead.allocatedTo,
        allocatedBy: allocatedBy ?? lead.allocatedBy,
        projectId: lead.projectId,
      });

      logger.info('Lead allocation notification sent successfully', {
        leadId: lead._id,
        leadName,
        previousAllocatedTo,
        newAllocatedTo: lead.allocatedTo,
        allocatedBy: allocatedBy ?? lead.allocatedBy,
      });
    } catch (error) {
      logger.error('Failed to send lead allocation notification:', {
        leadId: lead._id,
        error: (error as Error).message,
      });
      // Don't throw error to avoid breaking lead allocation process
    }
  }

  /**
   * Create notification when lead status is updated
   */
  async notifyLeadStatusUpdate(
    lead: ILead,
    oldStatus: string,
    newStatus: string,
    updatedBy: Types.ObjectId,
  ): Promise<void> {
    try {
      const leadName = `${lead.firstName} ${lead.lastName}`;
      const recipients = [];

      // Notify allocated agent
      if (lead.allocatedTo) {
        recipients.push({
          recipientId: lead.allocatedTo,
          recipientType: 'agent' as const,
        });
      }

      // Notify creator if different from allocated agent
      if (
        lead.createdBy &&
        (!lead.allocatedTo ||
          lead.createdBy.toString() !== lead.allocatedTo.toString())
      ) {
        recipients.push({
          recipientId: lead.createdBy,
          recipientType: 'agent' as const,
        });
      }

      // Notify allocator if different from others
      if (
        lead.allocatedBy &&
        lead.allocatedBy.toString() !== updatedBy.toString() &&
        (!lead.allocatedTo ||
          lead.allocatedBy.toString() !== lead.allocatedTo.toString()) &&
        (!lead.createdBy ||
          lead.allocatedBy.toString() !== lead.createdBy.toString())
      ) {
        recipients.push({
          recipientId: lead.allocatedBy,
          recipientType: 'agent' as const,
        });
      }

      if (recipients.length > 0) {
        await this.notificationService.createNotification({
          type: 'lead_status_updated',
          title: 'Lead Status Updated',
          message: `Lead "${leadName}" status has been updated from "${oldStatus}" to "${newStatus}".`,
          recipients,
          triggeredBy: updatedBy,
          triggeredByType: 'agent',
          priority: 'medium',
          data: {
            leadId: lead._id,
            oldStatus,
            newStatus,
            updatedBy,
            projectId: lead.projectId,
          },
          actionUrl: `/leads/${lead._id.toString()}`,
        });

        logger.info('Lead status update notification sent successfully', {
          leadId: lead._id,
          leadName,
          oldStatus,
          newStatus,
          updatedBy,
        });
      }
    } catch (error) {
      logger.error('Failed to send lead status update notification:', {
        leadId: lead._id,
        error: (error as Error).message,
      });
      // Don't throw error to avoid breaking lead update process
    }
  }

  /**
   * Get notification service instance for additional operations
   */
  getNotificationService(): NotificationService {
    return this.notificationService;
  }
}

export const leadNotificationService = new LeadNotificationService();
