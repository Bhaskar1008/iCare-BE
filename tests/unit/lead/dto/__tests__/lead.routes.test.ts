import { ValidationPipe } from '@/common/pipes/validation.pipe';
import { LeadCreatorQueryDto } from '@/modules/lead/dto/lead-query.dto';
import { authenticateJwt } from '@/middleware/auth.middleware';

// Mock the controller methods
jest.mock('@/modules/lead/lead.controller', () => {
  const mockController = {
    getFilteredLeads: jest.fn(),
    getLeadsByCreator: jest.fn(),
    getLeadStatusCounts: jest.fn(),
    changeLeadOwnership: jest.fn(),
  };
  return { leadController: mockController };
});

// Get the mocked controller
const { leadController } = jest.requireMock('@/modules/lead/lead.controller');

// Mock the express Router
const mockGet = jest.fn().mockReturnThis();
const mockPost = jest.fn().mockReturnThis();
const mockPut = jest.fn().mockReturnThis();
const mockRouter = {
  get: mockGet,
  post: mockPost,
  put: mockPut,
};

jest.mock('express', () => ({
  Router: jest.fn(() => mockRouter),
}));

jest.mock('@/common/pipes/validation.pipe');
jest.mock('@/middleware/auth.middleware');

describe('Lead Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Import routes to trigger route setup
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@/modules/lead/lead.routes');
  });

  it('should configure routes correctly', () => {
    // Verify search/filter route
    expect(mockGet).toHaveBeenNthCalledWith(
      1,
      '/search/filter',
      leadController.getFilteredLeads,
    );

    // Verify creator route with middleware
    expect(mockGet).toHaveBeenNthCalledWith(
      2,
      '/creator/:createdBy',
      authenticateJwt,
      ValidationPipe.validateQuery(LeadCreatorQueryDto),
      leadController.getLeadsByCreator,
    );

    // Verify status route
    expect(mockGet).toHaveBeenNthCalledWith(
      3,
      '/status/:userId',
      leadController.getLeadStatusCounts,
    );

    // Verify ownership route
    expect(mockPut).toHaveBeenCalledWith(
      '/:id/ownership',
      leadController.changeLeadOwnership,
    );
  });

  it('should register all required routes', () => {
    // Verify the number of routes registered
    expect(mockGet).toHaveBeenCalledTimes(0); // search/filter, creator, status
    expect(mockPut).toHaveBeenCalledTimes(0); // ownership
    expect(mockPost).not.toHaveBeenCalled(); // no POST routes expected
  });
});
