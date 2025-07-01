import { Types } from 'mongoose';
import { LeadNotificationService } from '@/modules/notification/services/lead-notification.service';
import { NotificationService } from '@/modules/notification/notification.service';
import type { ILead } from '@/models/lead.model';
import type {
  INotification,
  NotificationType,
} from '@/models/notification.model';

// Mock the NotificationService
jest.mock('@/modules/notification/notification.service');

describe('LeadNotificationService', () => {
  let leadNotificationService: LeadNotificationService;
  let mockNotificationService: jest.Mocked<NotificationService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNotificationService =
      new NotificationService() as jest.Mocked<NotificationService>;
    leadNotificationService = new LeadNotificationService();
    (leadNotificationService as any).notificationService =
      mockNotificationService;
  });

  describe('notifyLeadCreation', () => {
    const mockId = new Types.ObjectId();
    const mockLead = {
      _id: mockId,
      firstName: 'John',
      lastName: 'Doe',
      createdBy: new Types.ObjectId(),
      allocatedTo: new Types.ObjectId(),
      projectId: new Types.ObjectId(),
    } as unknown as ILead;

    it('should create lead creation notification successfully', async () => {
      const mockNotification = {
        _id: new Types.ObjectId(),
        type: 'lead_created' as NotificationType,
        title: 'New Lead Created',
        message: 'A new lead has been created',
        recipients: [],
        triggeredBy: new Types.ObjectId(),
        triggeredByType: 'admin',
        priority: 'high',
        isGlobal: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as INotification;

      mockNotificationService.createLeadCreationNotification.mockResolvedValue(
        mockNotification,
      );

      await leadNotificationService.notifyLeadCreation(mockLead);

      expect(
        mockNotificationService.createLeadCreationNotification,
      ).toHaveBeenCalledWith({
        leadId: mockLead._id,
        leadName: 'John Doe',
        createdBy: mockLead.createdBy,
        allocatedTo: mockLead.allocatedTo,
        projectId: mockLead.projectId,
      });
    });

    it('should handle errors without throwing', async () => {
      mockNotificationService.createLeadCreationNotification.mockRejectedValue(
        new Error('Notification error'),
      );

      await expect(
        leadNotificationService.notifyLeadCreation(mockLead),
      ).resolves.not.toThrow();
    });
  });

  describe('notifyLeadAllocation', () => {
    const mockLead = {
      _id: new Types.ObjectId(),
      firstName: 'John',
      lastName: 'Doe',
      createdBy: new Types.ObjectId(),
      allocatedTo: new Types.ObjectId(),
      allocatedBy: new Types.ObjectId(),
      projectId: new Types.ObjectId(),
    } as unknown as ILead;

    const previousAllocatedTo = new Types.ObjectId();
    const allocatedBy = new Types.ObjectId();

    it('should create lead allocation notification successfully', async () => {
      const mockNotification = {
        _id: new Types.ObjectId(),
        type: 'lead_allocated' as NotificationType,
        title: 'Lead Allocation Update',
        message: 'A lead has been allocated',
        recipients: [],
        triggeredBy: new Types.ObjectId(),
        triggeredByType: 'admin',
        priority: 'high',
        isGlobal: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as INotification;

      mockNotificationService.createLeadAllocationNotification.mockResolvedValue(
        mockNotification,
      );

      await leadNotificationService.notifyLeadAllocation(
        mockLead,
        previousAllocatedTo,
        allocatedBy,
      );

      expect(
        mockNotificationService.createLeadAllocationNotification,
      ).toHaveBeenCalledWith({
        leadId: mockLead._id,
        leadName: 'John Doe',
        previousAllocatedTo,
        newAllocatedTo: mockLead.allocatedTo,
        allocatedBy,
        projectId: mockLead.projectId,
      });
    });

    it('should use lead.allocatedBy if allocatedBy is not provided', async () => {
      await leadNotificationService.notifyLeadAllocation(
        mockLead,
        previousAllocatedTo,
      );

      expect(
        mockNotificationService.createLeadAllocationNotification,
      ).toHaveBeenCalledWith({
        leadId: mockLead._id,
        leadName: 'John Doe',
        previousAllocatedTo,
        newAllocatedTo: mockLead.allocatedTo,
        allocatedBy: mockLead.allocatedBy,
        projectId: mockLead.projectId,
      });
    });

    it('should handle errors without throwing', async () => {
      mockNotificationService.createLeadAllocationNotification.mockRejectedValue(
        new Error('Notification error'),
      );

      await expect(
        leadNotificationService.notifyLeadAllocation(
          mockLead,
          previousAllocatedTo,
          allocatedBy,
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('notifyLeadStatusUpdate', () => {
    const mockLead = {
      _id: new Types.ObjectId(),
      firstName: 'John',
      lastName: 'Doe',
      createdBy: new Types.ObjectId(),
      allocatedTo: new Types.ObjectId(),
      allocatedBy: new Types.ObjectId(),
      projectId: new Types.ObjectId(),
    } as unknown as ILead;

    const oldStatus = 'new';
    const newStatus = 'in_progress';
    const updatedBy = new Types.ObjectId();

    it('should create lead status update notification successfully', async () => {
      const mockNotification = {
        _id: new Types.ObjectId(),
        type: 'lead_status_updated' as NotificationType,
        title: 'Lead Status Updated',
        message: 'Lead status has been updated',
        recipients: [],
        triggeredBy: new Types.ObjectId(),
        triggeredByType: 'admin',
        priority: 'high',
        isGlobal: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as INotification;

      mockNotificationService.createNotification.mockResolvedValue(
        mockNotification,
      );

      await leadNotificationService.notifyLeadStatusUpdate(
        mockLead,
        oldStatus,
        newStatus,
        updatedBy,
      );

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'lead_status_updated',
          title: 'Lead Status Updated',
          message: expect.stringContaining('John Doe'),
          data: {
            leadId: mockLead._id,
            oldStatus,
            newStatus,
            updatedBy,
            projectId: mockLead.projectId,
          },
        }),
      );
    });

    it('should handle errors without throwing', async () => {
      mockNotificationService.createNotification.mockRejectedValue(
        new Error('Notification error'),
      );

      await expect(
        leadNotificationService.notifyLeadStatusUpdate(
          mockLead,
          oldStatus,
          newStatus,
          updatedBy,
        ),
      ).resolves.not.toThrow();
    });

    it('should notify all relevant parties', async () => {
      const differentCreator = new Types.ObjectId();
      const differentAllocator = new Types.ObjectId();
      const mockLeadWithDifferentUsers = {
        ...mockLead,
        createdBy: differentCreator,
        allocatedBy: differentAllocator,
      } as unknown as ILead;

      await leadNotificationService.notifyLeadStatusUpdate(
        mockLeadWithDifferentUsers,
        oldStatus,
        newStatus,
        updatedBy,
      );

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          recipients: expect.arrayContaining([
            {
              recipientId: mockLeadWithDifferentUsers.allocatedTo,
              recipientType: 'agent',
            },
            { recipientId: differentCreator, recipientType: 'agent' },
            { recipientId: differentAllocator, recipientType: 'agent' },
          ]),
        }),
      );
    });
  });

  describe('getNotificationService', () => {
    it('should return the notification service instance', () => {
      const service = leadNotificationService.getNotificationService();
      expect(service).toBe(mockNotificationService);
    });
  });
});
