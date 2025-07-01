/**
 * @jest-environment node
 */

import { ApplicationApprovalService } from '@/modules/aob/services/application-approval.service';
import { AobApplicationModel } from '@/models/aob-application.model';
import { AgentModel } from '@/models/agent.model';
import { UserModel } from '@/models/user.model';
import { generateAgentCode } from '@/modules/agent/utils/agent-code-generator';
import { EmailUtil } from '@/common/utils/email.util';
import { AobEmailTemplates } from '@/emailTemplates/aob.templates';
import mongoose from 'mongoose';
import logger from '@/common/utils/logger';

// Mock all dependencies
jest.mock('@/models/aob-application.model', () => ({
  AobApplicationModel: {
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    updateOne: jest.fn(),
  },
}));

jest.mock('@/models/agent.model', () => ({
  AgentModel: {
    create: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

jest.mock('@/models/user.model', () => ({
  UserModel: {
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

jest.mock('@/modules/agent/utils/agent-code-generator');
jest.mock('@/common/utils/email.util', () => ({
  EmailUtil: {
    generateCustomEmailTemplate: jest.fn(),
    sendEmail: jest.fn(),
    sendMail: jest.fn(),
  },
}));

jest.mock('@/emailTemplates/aob.templates', () => ({
  AobEmailTemplates: {
    sendOnboardingEmail: jest.fn(),
  },
}));
jest.mock('@/common/utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Mock mongoose Types
jest.mock('mongoose', () => {
  const mockObjectId = Object.assign(
    jest.fn().mockImplementation(id => ({
      toString: () => (id ?? 'mock-object-id') as unknown as string,
      toHexString: () => (id ?? 'mock-object-id') as unknown as string,
    })),
    {
      isValid: jest.fn().mockReturnValue(true),
    },
  );

  return {
    Schema: Object.assign(
      jest.fn().mockImplementation(() => ({
        index: jest.fn(),
        virtual: jest.fn(() => ({ get: jest.fn(), set: jest.fn() })),
        pre: jest.fn(),
        post: jest.fn(),
        set: jest.fn(),
        methods: {},
      })),
      {
        Types: {
          ObjectId: mockObjectId,
        },
      },
    ),
    model: jest.fn(),
    connect: jest.fn(),
    Types: {
      ObjectId: mockObjectId,
    },
  };
});

describe('ApplicationApprovalService', () => {
  let applicationApprovalService: ApplicationApprovalService;
  let mockAgentModel: jest.Mocked<typeof AgentModel>;
  let mockUserModel: jest.Mocked<typeof UserModel>;
  let mockGenerateAgentCode: jest.MockedFunction<typeof generateAgentCode>;
  let mockAobEmailTemplates: jest.Mocked<typeof AobEmailTemplates>;
  let mockLogger: jest.Mocked<typeof logger>;

  // Mock data
  const mockApplicationId = 'APP-123456';
  const mockProjectId = '507f1f77bcf86cd799439011';
  const mockUserId = '507f1f77bcf86cd799439012';
  const mockAgentCode = 'AG-001234';

  const mockApplication = {
    _id: new mongoose.Types.ObjectId(),
    applicationId: mockApplicationId,
    firstName: 'John',
    lastName: 'Doe',
    middleName: 'Michael',
    emailAddress: 'john.doe@example.com',
    mobileNumber: '1234567890',
    address: '123 Main Street',
    applicationStatus: 'pending',
    rejectRemark: '',
    qcAndDiscrepencyList: ['Some discrepancy'],
    save: jest.fn(),
  };

  const mockUser = {
    _id: new mongoose.Types.ObjectId(mockUserId),
    projectId: new mongoose.Types.ObjectId(mockProjectId),
    role: 'user',
    firstName: 'Project',
    lastName: 'User',
    email: 'project.user@example.com',
  };

  const mockAgent = {
    _id: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(mockUserId),
    agentCode: mockAgentCode,
    firstName: 'John',
    lastName: 'Doe',
    middleName: 'Michael',
    email: 'john.doe@example.com',
    phoneNumber: '1234567890',
    address: {
      street: '123 Main Street',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
    projectId: new mongoose.Types.ObjectId(mockProjectId),
    agentStatus: 'active',
    isTeamLead: false,
    channelId: new mongoose.Types.ObjectId(),
    designationId: new mongoose.Types.ObjectId(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    applicationApprovalService = new ApplicationApprovalService();

    // Setup mocks

    mockAgentModel = AgentModel as jest.Mocked<typeof AgentModel>;
    mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
    mockGenerateAgentCode = generateAgentCode as jest.MockedFunction<
      typeof generateAgentCode
    >;
    mockAobEmailTemplates = AobEmailTemplates as jest.Mocked<
      typeof AobEmailTemplates
    >;
    mockLogger = logger as jest.Mocked<typeof logger>;

    // Reset mockApplication state for each test
    mockApplication.applicationStatus = 'pending';
    mockApplication.rejectRemark = '';
    mockApplication.qcAndDiscrepencyList = ['Some discrepancy'];
    mockApplication.save = jest.fn().mockResolvedValue(mockApplication as any);

    // Setup default successful behavior - models are already mocked with methods
    mockGenerateAgentCode.mockResolvedValue(mockAgentCode);
    (EmailUtil.generateCustomEmailTemplate as jest.Mock).mockReturnValue(
      '<html>Mock email template</html>',
    );
    (EmailUtil.sendEmail as jest.Mock).mockResolvedValue(undefined);
    (EmailUtil.sendMail as jest.Mock).mockResolvedValue(undefined);
    (AobEmailTemplates.sendOnboardingEmail as jest.Mock).mockResolvedValue(
      undefined,
    );
  });

  describe('processApprovedApplication', () => {
    it('should process application without remarks', async () => {
      // Arrange
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(
        mockApplication as any,
      );
      (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser as any);
      (AgentModel.create as jest.Mock).mockResolvedValue(mockAgent as any);
      mockApplication.save.mockResolvedValue(mockApplication);

      // Act
      const result =
        await applicationApprovalService.processApprovedApplication(
          mockApplicationId,
          mockProjectId,
        );

      // Assert
      expect(result.success).toBe(true);
      expect(mockApplication.rejectRemark).toBe('');
    });

    it('should handle application with null address', async () => {
      // Arrange
      const applicationWithNullAddress = { ...mockApplication, address: null };
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(
        applicationWithNullAddress as any,
      );
      (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser as any);
      (AgentModel.create as jest.Mock).mockResolvedValue(mockAgent as any);
      applicationWithNullAddress.save = jest
        .fn()
        .mockResolvedValue(applicationWithNullAddress);

      // Act
      const result =
        await applicationApprovalService.processApprovedApplication(
          mockApplicationId,
          mockProjectId,
        );

      // Assert
      expect(result.success).toBe(true);
      expect(AgentModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          address: {
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: '',
          },
        }),
      );
    });

    it('should return error when application not found', async () => {
      // Arrange
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(null);

      // Act
      const result =
        await applicationApprovalService.processApprovedApplication(
          mockApplicationId,
          mockProjectId,
        );

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Application not found');
      expect(result.application).toBeUndefined();
      expect(result.agent).toBeUndefined();
      expect(logger.error).toHaveBeenCalledWith('Application not found', {
        applicationId: mockApplicationId,
      });
    });

    it('should return error when application is already approved', async () => {
      // Arrange
      const approvedApplication = {
        ...mockApplication,
        applicationStatus: 'approved',
      };
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(
        approvedApplication as any,
      );

      // Act
      const result =
        await applicationApprovalService.processApprovedApplication(
          mockApplicationId,
          mockProjectId,
        );

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Application already approved');
      expect(logger.warn).toHaveBeenCalledWith('Application already approved', {
        applicationId: mockApplicationId,
      });
    });

    it('should return error when no user found for project', async () => {
      // Arrange
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(
        mockApplication as any,
      );
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);

      // Act
      const result =
        await applicationApprovalService.processApprovedApplication(
          mockApplicationId,
          mockProjectId,
        );

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('No user found associated with the project');
      expect(logger.error).toHaveBeenCalledWith(
        'No user found for project with role=user',
        { projectId: mockProjectId },
      );
    });

    it('should handle error during agent code generation', async () => {
      // Arrange
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(
        mockApplication as any,
      );
      mockUserModel.findOne.mockResolvedValue(mockUser as any);
      mockGenerateAgentCode.mockRejectedValue(
        new Error('Agent code generation failed'),
      );

      // Act
      const result =
        await applicationApprovalService.processApprovedApplication(
          mockApplicationId,
          mockProjectId,
        );

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe(
        'Failed to process application: Agent code generation failed',
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to process approved application',
        expect.objectContaining({
          error: 'Agent code generation failed',
          applicationId: mockApplicationId,
          projectId: mockProjectId,
        }),
      );
    });

    it('should handle error during agent creation', async () => {
      // Arrange
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(
        mockApplication as any,
      );
      mockUserModel.findOne.mockResolvedValue(mockUser as any);
      mockAgentModel.create.mockRejectedValue(new Error('Database error'));

      // Act
      const result =
        await applicationApprovalService.processApprovedApplication(
          mockApplicationId,
          mockProjectId,
        );

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe(
        'Failed to process application: Database error',
      );
    });

    it('should handle error during application save', async () => {
      // Arrange
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(
        mockApplication as any,
      );
      mockUserModel.findOne.mockResolvedValue(mockUser as any);
      mockAgentModel.create.mockResolvedValue(mockAgent as never);
      mockApplication.save.mockRejectedValue(new Error('Save failed'));

      // Act
      const result =
        await applicationApprovalService.processApprovedApplication(
          mockApplicationId,
          mockProjectId,
        );

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to process application: Save failed');
    });

    it('should handle non-Error exceptions', async () => {
      // Arrange
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(
        mockApplication as any,
      );
      mockUserModel.findOne.mockResolvedValue(mockUser as any);
      mockAgentModel.create.mockRejectedValue('String error');

      // Act
      const result =
        await applicationApprovalService.processApprovedApplication(
          mockApplicationId,
          mockProjectId,
        );

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe(
        'Failed to process application: String error',
      );
    });

    it('should continue processing even if email sending fails', async () => {
      // Arrange
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(
        mockApplication as any,
      );
      mockUserModel.findOne.mockResolvedValue(mockUser as any);
      mockAgentModel.create.mockResolvedValue(mockAgent as never);
      mockApplication.save.mockResolvedValue(mockApplication as any);
      mockAobEmailTemplates.sendOnboardingEmail.mockRejectedValue(
        new Error('Email service unavailable'),
      );

      // Act
      const result =
        await applicationApprovalService.processApprovedApplication(
          mockApplicationId,
          mockProjectId,
        );

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe(
        'Application approved and agent created successfully',
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to send onboarding email',
        expect.objectContaining({
          error: 'Email service unavailable',
          email: mockApplication.emailAddress,
          agentCode: mockAgentCode,
        }),
      );
    });
  });

  describe('sendOnboardingEmail', () => {
    it('should send onboarding email successfully', async () => {
      // Arrange
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(
        mockApplication as any,
      );
      mockUserModel.findOne.mockResolvedValue(mockUser as any);
      mockAgentModel.create.mockResolvedValue(mockAgent as never);
      mockApplication.save.mockResolvedValue(mockApplication as any);

      // Act
      await applicationApprovalService.processApprovedApplication(
        mockApplicationId,
        mockProjectId,
      );

      // Assert
      expect(mockAobEmailTemplates.sendOnboardingEmail).toHaveBeenCalledWith(
        mockApplication.emailAddress,
        mockApplication.firstName,
        mockApplication.lastName,
        mockAgentCode,
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Onboarding email sent successfully',
        {
          email: mockApplication.emailAddress,
          agentCode: mockAgentCode,
        },
      );
    });

    it('should handle application with null first name', async () => {
      // Arrange
      const applicationWithNullName = {
        ...mockApplication,
        firstName: null,
        lastName: null,
      };
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(
        applicationWithNullName as any,
      );
      mockUserModel.findOne.mockResolvedValue(mockUser as any);
      mockAgentModel.create.mockResolvedValue(mockAgent as never);
      applicationWithNullName.save = jest
        .fn()
        .mockResolvedValue(applicationWithNullName);

      // Act
      await applicationApprovalService.processApprovedApplication(
        mockApplicationId,
        mockProjectId,
      );

      // Assert
      expect(mockAobEmailTemplates.sendOnboardingEmail).toHaveBeenCalledWith(
        applicationWithNullName.emailAddress,
        '',
        '',
        mockAgentCode,
      );
    });
    it('should handle email template generation error', async () => {
      // Arrange
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(
        mockApplication as any,
      );
      mockUserModel.findOne.mockResolvedValue(mockUser as any);
      mockAgentModel.create.mockResolvedValue(mockAgent as never);
      mockApplication.save.mockResolvedValue(mockApplication);
      mockAobEmailTemplates.sendOnboardingEmail.mockRejectedValue(
        new Error('Template generation failed'),
      );

      // Act
      const result =
        await applicationApprovalService.processApprovedApplication(
          mockApplicationId,
          mockProjectId,
        );

      // Assert
      expect(result.success).toBe(true); // Process should still succeed
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to send onboarding email',
        expect.objectContaining({
          error: 'Template generation failed',
          email: mockApplication.emailAddress,
          agentCode: mockAgentCode,
        }),
      );
    });

    it('should handle non-Error email exceptions', async () => {
      // Arrange
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(
        mockApplication as any,
      );
      mockUserModel.findOne.mockResolvedValue(mockUser as any);
      mockAgentModel.create.mockResolvedValue(mockAgent as never);
      mockApplication.save.mockResolvedValue(mockApplication);
      mockAobEmailTemplates.sendOnboardingEmail.mockRejectedValue(
        'Email service down',
      );

      // Act
      const result =
        await applicationApprovalService.processApprovedApplication(
          mockApplicationId,
          mockProjectId,
        );

      // Assert
      expect(result.success).toBe(true);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to send onboarding email',
        expect.objectContaining({
          error: 'Email service down',
          email: mockApplication.emailAddress,
          agentCode: mockAgentCode,
        }),
      );
    });
  });

  describe('Logging', () => {
    it('should log debug messages appropriately', async () => {
      // Arrange
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(
        mockApplication as any,
      );
      mockUserModel.findOne.mockResolvedValue(mockUser as any);
      mockAgentModel.create.mockResolvedValue(mockAgent as never);
      mockApplication.save.mockResolvedValue(mockApplication as any);

      // Act
      await applicationApprovalService.processApprovedApplication(
        mockApplicationId,
        mockProjectId,
      );

      // Assert
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Processing approved application',
        {
          applicationId: mockApplicationId,
          projectId: mockProjectId,
        },
      );

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Found user for agent creation',
        {
          userId: mockUser._id,
          projectId: mockProjectId,
          applicationId: mockApplicationId,
        },
      );
    });

    it('should include stack trace in error logs', async () => {
      // Arrange
      const errorWithStack = new Error('Test error');
      errorWithStack.stack = 'Error: Test error\n    at test location';
      (AobApplicationModel.findOne as jest.Mock).mockRejectedValue(
        errorWithStack,
      );

      // Act
      await applicationApprovalService.processApprovedApplication(
        mockApplicationId,
        mockProjectId,
      );

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to process approved application',
        expect.objectContaining({
          error: 'Test error',
          stack: 'Error: Test error\n    at test location',
          applicationId: mockApplicationId,
          projectId: mockProjectId,
        }),
      );
    });
  });
});
