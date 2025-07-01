import { UtilityController } from '@/modules/utility/utility.controller';
import { AgentService } from '@/modules/agent/agent.service';
import { ApplicantOtpModel } from '@/models/applicant-otp.model';
import { EmailUtil } from '@/common/utils/email.util';
import { mockResponse } from 'tests/utils/test-utils';
import { UserModel } from '@/models/user.model';
import { Types, type DeleteResult } from 'mongoose';

// Mock dependencies
jest.mock('@/modules/agent/agent.service');
jest.mock('@/models/aob-application.model');
jest.mock('@/models/applicant-otp.model');
jest.mock('@/common/utils/email.util');
jest.mock('@/models/user.model');

describe('UtilityController', () => {
  let utilityController: UtilityController;
  let mockAgentService: jest.Mocked<AgentService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAgentService = new AgentService() as jest.Mocked<AgentService>;
    utilityController = new UtilityController();
    (utilityController as any).agentService = mockAgentService;
  });

  describe('getAgentHierarchyInfo', () => {
    it('should return hierarchies when only agentId is provided', async () => {
      const req = {
        validatedQuery: {
          agentId: '123',
        },
      };
      const res = mockResponse();

      const mockResult = {
        hierarchies: [
          { hierarchyName: 'Hierarchy 1', hierarchyId: '456' },
          { hierarchyName: 'Hierarchy 2', hierarchyId: '789' },
        ],
      };

      mockAgentService.getAgentHierarchyInfo.mockResolvedValue(mockResult);

      await utilityController.getAgentHierarchyInfo(req as any, res as any);

      expect(mockAgentService.getAgentHierarchyInfo).toHaveBeenCalledWith(
        '123',
        undefined,
        undefined,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockResult,
          message: 'Successfully retrieved agent hierarchies',
        }),
      );
    });

    it('should return agents when agentId, hierarchyId, and channelId are provided', async () => {
      const req = {
        validatedQuery: {
          agentId: '123',
          hierarchyId: '456',
          channelId: '789',
        },
      };
      const res = mockResponse();

      const mockResult = {
        agents: [
          { firstName: 'John', lastName: 'Doe', id: '111' },
          { firstName: 'Jane', lastName: 'Smith', id: '222' },
        ],
      };

      mockAgentService.getAgentHierarchyInfo.mockResolvedValue(mockResult);

      await utilityController.getAgentHierarchyInfo(req as any, res as any);

      expect(mockAgentService.getAgentHierarchyInfo).toHaveBeenCalledWith(
        '123',
        '456',
        '789',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockResult,
          message: 'Successfully retrieved agents list',
        }),
      );
    });
  });

  describe('verifyEmail', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // Mock Date.now() to return a fixed timestamp
      jest.spyOn(Date, 'now').mockImplementation(() => 1687514295442); // Fixed timestamp
      jest
        .spyOn(Date.prototype, 'toISOString')
        .mockReturnValue('2025-06-23T09:38:15.442Z');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should send OTP when email is valid and not registered', async () => {
      const req = {
        body: { emailId: 'test@example.com' },
        validatedBody: { emailId: 'test@example.com' },
      };
      const res = mockResponse();

      // Mock user not found
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(null);

      const mockOtp = {
        _id: new Types.ObjectId(),
        emailId: 'test@example.com',
        otp: '1234',
        isUsed: false,
        createdAt: new Date(),
      };
      jest
        .spyOn(ApplicantOtpModel, 'create')
        .mockResolvedValueOnce(mockOtp as any);
      jest.spyOn(ApplicantOtpModel, 'deleteMany').mockResolvedValueOnce({
        acknowledged: true,
        deletedCount: 1,
      } as unknown as DeleteResult);
      jest.spyOn(EmailUtil, 'sendOtpEmail').mockResolvedValueOnce(true);

      await utilityController.verifyEmail(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'OTP sent to test@example.com',
        data: { otpSent: true },
        timestamp: '2025-06-23T09:38:15.442Z',
      });
    });
  });
});
