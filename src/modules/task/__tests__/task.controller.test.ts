import { TaskController } from '../task.controller';
import { TaskService } from '../task.service';
import type { Request, Response } from 'express';
import { PriorityType } from '../enums/task.enum';
import type { CreateTaskDto } from '../dto/create-task.dto';

// Mock the TaskService
jest.mock('../task.service');

describe('TaskController', () => {
  let taskController: TaskController;
  let mockTaskService: jest.Mocked<TaskService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockSendCreated: jest.Mock;
  let mockSendUpdated: jest.Mock;
  let mockSendSuccess: jest.Mock;
  let mockSendError: jest.Mock;
  let mockSendBadRequest: jest.Mock;

  // Dummy data for testing
  const dummyTask = {
    _id: '507f1f77bcf86cd799439011',
    teamMember: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
    taskDescription: 'Complete project documentation',
    priorityType: PriorityType.HIGH,
    dueReminder: new Date('2024-12-31'),
    remark: 'Important task for project completion',
    taskType: 'todo',
    isArchived: false,
    createdBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const dummyCreateTaskDto: CreateTaskDto = {
    teamMember: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
    taskDescription: 'Complete project documentation',
    priorityType: PriorityType.HIGH,
    dueReminder: new Date('2024-12-31'),
    remark: 'Important task for project completion',
  };

  const dummyUpdateTaskDto = {
    taskDescription: 'Updated project documentation',
    priorityType: PriorityType.MEDIUM,
    remark: 'Updated remark',
  };

  const dummyTeamMembers = [
    {
      _id: '507f1f77bcf86cd799439012',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      designation: 'Developer',
      channelId: '507f1f77bcf86cd799439014',
    },
    {
      _id: '507f1f77bcf86cd799439013',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      designation: 'Designer',
      channelId: '507f1f77bcf86cd799439014',
    },
  ];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock response methods
    mockSendCreated = jest.fn();
    mockSendUpdated = jest.fn();
    mockSendSuccess = jest.fn();
    mockSendError = jest.fn();
    mockSendBadRequest = jest.fn();

    // Create mock response object
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Create mock request object
    mockRequest = {
      body: {},
      query: {},
      headers: {},
    };

    // Create TaskService mock
    mockTaskService = new TaskService() as jest.Mocked<TaskService>;

    // Create TaskController instance
    taskController = new TaskController();

    // Mock the service methods
    (taskController as any).taskService = mockTaskService;

    // Mock the base controller methods
    (taskController as any).sendCreated = mockSendCreated;
    (taskController as any).sendUpdated = mockSendUpdated;
    (taskController as any).sendSuccess = mockSendSuccess;
    (taskController as any).sendError = mockSendError;
    (taskController as any).sendBadRequest = mockSendBadRequest;
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      // Arrange
      mockRequest.body = dummyCreateTaskDto;
      mockTaskService.createTask = jest.fn().mockResolvedValue(dummyTask);

      // Act
      await taskController.createTask(
        mockRequest as Request<unknown, unknown, CreateTaskDto>,
        mockResponse as Response,
      );

      // Assert
      expect(mockTaskService.createTask).toHaveBeenCalledWith(
        dummyCreateTaskDto,
        'system',
      );
      expect(mockSendCreated).toHaveBeenCalledWith(
        mockResponse,
        dummyTask,
        'Task created successfully',
      );
    });

    it('should handle error when creating task fails', async () => {
      // Arrange
      mockRequest.body = dummyCreateTaskDto;
      const error = new Error('Database connection failed');
      mockTaskService.createTask = jest.fn().mockRejectedValue(error);

      // Act
      await taskController.createTask(
        mockRequest as Request<unknown, unknown, CreateTaskDto>,
        mockResponse as Response,
      );

      // Assert
      expect(mockTaskService.createTask).toHaveBeenCalledWith(
        dummyCreateTaskDto,
        'system',
      );
      expect(mockSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to create the todo.',
        500,
        error,
      );
    });
  });

  describe('updateTask', () => {
    it('should update a task successfully', async () => {
      // Arrange
      mockRequest.body = dummyUpdateTaskDto;
      mockRequest.query = { taskId: '507f1f77bcf86cd799439011' };
      const updatedTask = { ...dummyTask, ...dummyUpdateTaskDto };
      mockTaskService.updateTask = jest.fn().mockResolvedValue(updatedTask);

      // Act
      await taskController.updateTask(
        mockRequest as Request<unknown, unknown, Partial<CreateTaskDto>>,
        mockResponse as Response,
      );

      // Assert
      expect(mockTaskService.updateTask).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        dummyUpdateTaskDto,
        'system',
      );
      expect(mockSendUpdated).toHaveBeenCalledWith(
        mockResponse,
        updatedTask,
        'Successfully updated the todo.',
      );
    });

    it('should handle error when updating task fails', async () => {
      // Arrange
      mockRequest.body = dummyUpdateTaskDto;
      mockRequest.query = { taskId: '507f1f77bcf86cd799439011' };
      const error = new Error('Task not found');
      mockTaskService.updateTask = jest.fn().mockRejectedValue(error);

      // Act
      await taskController.updateTask(
        mockRequest as Request<unknown, unknown, Partial<CreateTaskDto>>,
        mockResponse as Response,
      );

      // Assert
      expect(mockTaskService.updateTask).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        dummyUpdateTaskDto,
        'system',
      );
      expect(mockSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to update the todo.',
        500,
        error,
      );
    });
  });

  describe('archiveTask', () => {
    it('should archive a task successfully', async () => {
      // Arrange
      mockRequest.query = { taskId: '507f1f77bcf86cd799439011' };
      const archivedTask = {
        ...dummyTask,
        isArchived: true,
        taskType: 'archive',
      };
      mockTaskService.archiveTask = jest.fn().mockResolvedValue(archivedTask);

      // Act
      await taskController.archiveTask(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(mockTaskService.archiveTask).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'system',
      );
      expect(mockSendUpdated).toHaveBeenCalledWith(
        mockResponse,
        archivedTask,
        'Successfully archived the todo.',
      );
    });

    it('should handle error when archiving task fails', async () => {
      // Arrange
      mockRequest.query = { taskId: '507f1f77bcf86cd799439011' };
      const error = new Error('Task not found');
      mockTaskService.archiveTask = jest.fn().mockRejectedValue(error);

      // Act
      await taskController.archiveTask(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(mockTaskService.archiveTask).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'system',
      );
      expect(mockSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to archive the todo.',
        500,
        error,
      );
    });
  });

  describe('getTasks', () => {
    it('should get active tasks successfully', async () => {
      // Arrange
      mockRequest.query = { isArchived: 'false' };
      const tasks = [dummyTask];
      mockTaskService.getTasks = jest.fn().mockResolvedValue(tasks);

      // Act
      await taskController.getTasks(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(mockTaskService.getTasks).toHaveBeenCalledWith(false);
      expect(mockSendSuccess).toHaveBeenCalledWith(
        mockResponse,
        tasks,
        'Successfully fetched the todo list.',
      );
    });

    it('should get archived tasks successfully', async () => {
      // Arrange
      mockRequest.query = { isArchived: 'true' };
      const archivedTasks = [{ ...dummyTask, isArchived: true }];
      mockTaskService.getTasks = jest.fn().mockResolvedValue(archivedTasks);

      // Act
      await taskController.getTasks(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(mockTaskService.getTasks).toHaveBeenCalledWith(true);
      expect(mockSendSuccess).toHaveBeenCalledWith(
        mockResponse,
        archivedTasks,
        'Successfully fetched the todo list.',
      );
    });

    it('should handle error when getting tasks fails', async () => {
      // Arrange
      mockRequest.query = { isArchived: 'false' };
      const error = new Error('Database connection failed');
      mockTaskService.getTasks = jest.fn().mockRejectedValue(error);

      // Act
      await taskController.getTasks(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(mockTaskService.getTasks).toHaveBeenCalledWith(false);
      expect(mockSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to get all the todos.',
        500,
        error,
      );
    });
  });

  describe('getTeamMembers', () => {
    it('should get team members successfully', async () => {
      // Arrange
      const currentUser = {
        id: '507f1f77bcf86cd799439015',
        channelId: '507f1f77bcf86cd799439014',
      };
      mockRequest.headers = {
        currentuser: JSON.stringify(currentUser),
      };
      mockRequest.query = { search: 'john' };
      mockTaskService.getTeamMembers = jest
        .fn()
        .mockResolvedValue(dummyTeamMembers);

      // Act
      await taskController.getTeamMembers(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(mockTaskService.getTeamMembers).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439014',
        'john',
      );
      expect(mockSendSuccess).toHaveBeenCalledWith(
        mockResponse,
        dummyTeamMembers,
        'Successfully fetched the team members.',
      );
    });

    it('should get team members without search query successfully', async () => {
      // Arrange
      const currentUser = {
        id: '507f1f77bcf86cd799439015',
        channelId: '507f1f77bcf86cd799439014',
      };
      mockRequest.headers = {
        currentuser: JSON.stringify(currentUser),
      };
      mockRequest.query = {};
      mockTaskService.getTeamMembers = jest
        .fn()
        .mockResolvedValue(dummyTeamMembers);

      // Act
      await taskController.getTeamMembers(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(mockTaskService.getTeamMembers).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439014',
        undefined,
      );
      expect(mockSendSuccess).toHaveBeenCalledWith(
        mockResponse,
        dummyTeamMembers,
        'Successfully fetched the team members.',
      );
    });

    it('should return bad request when current user header is missing', async () => {
      // Arrange
      mockRequest.headers = {};
      mockRequest.query = { search: 'john' };

      // Act
      await taskController.getTeamMembers(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(mockSendBadRequest).toHaveBeenCalledWith(
        mockResponse,
        'Current user information is required',
      );
      expect(mockTaskService.getTeamMembers).not.toHaveBeenCalled();
    });

    it('should return bad request when channel ID is missing', async () => {
      // Arrange
      const currentUser = {
        id: '507f1f77bcf86cd799439015',
        // channelId is missing
      };
      mockRequest.headers = {
        currentuser: JSON.stringify(currentUser),
      };
      mockRequest.query = { search: 'john' };

      // Act
      await taskController.getTeamMembers(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(mockSendBadRequest).toHaveBeenCalledWith(
        mockResponse,
        'Channel ID is required',
      );
      expect(mockTaskService.getTeamMembers).not.toHaveBeenCalled();
    });

    it('should handle error when getting team members fails', async () => {
      // Arrange
      const currentUser = {
        id: '507f1f77bcf86cd799439015',
        channelId: '507f1f77bcf86cd799439014',
      };
      mockRequest.headers = {
        currentuser: JSON.stringify(currentUser),
      };
      mockRequest.query = { search: 'john' };
      const error = new Error('Database connection failed');
      mockTaskService.getTeamMembers = jest.fn().mockRejectedValue(error);

      // Act
      await taskController.getTeamMembers(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(mockTaskService.getTeamMembers).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439014',
        'john',
      );
      expect(mockSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to get team members.',
        500,
        error,
      );
    });

    it('should handle JSON parse error in current user header', async () => {
      // Arrange
      mockRequest.headers = {
        currentuser: 'invalid-json',
      };
      mockRequest.query = { search: 'john' };

      // Act
      await taskController.getTeamMembers(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(mockSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to get team members.',
        500,
        expect.any(Error),
      );
      expect(mockTaskService.getTeamMembers).not.toHaveBeenCalled();
    });
  });
});
