import { Types } from 'mongoose';
import { EventService } from '@/modules/event/event.service';
import { EventRepository } from '@/modules/event/event.respository';
import { Event } from '@/models/event.model';
import type { IEvent } from '@/models/event.model';
import type { CreateEventDto } from '@/modules/event/dto/create-event.dto';
import type { UpdateEventDto } from '@/modules/event/dto/update-event.dto';
import { EventStatus } from '@/common/enums/event-status.enum';
import { LocationType } from '@/common/enums/location-type.enum';
import { BadRequestException } from '@/common/exceptions/bad-request.exception';
import { NotFoundException } from '@/common/exceptions/not-found.exception';
import logger from '@/common/utils/logger';

// Mock dependencies
jest.mock('@/modules/event/event.respository');
jest.mock('@/models/event.model');
jest.mock('@/common/utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('EventService', () => {
  let eventService: EventService;
  let mockEventRepository: jest.Mocked<EventRepository>;

  const mockObjectId = new Types.ObjectId();
  const mockLocationId = new Types.ObjectId();
  const mockAttendeeId = new Types.ObjectId();

  const mockEventData: CreateEventDto = {
    title: 'Test Event',
    description: 'Test Description',
    startDateTime: new Date('2024-12-25T10:00:00.000Z'),
    endDateTime: new Date('2024-12-25T11:00:00.000Z'),
    createdBy: mockObjectId,
    location: {
      _id: mockLocationId,
      type: LocationType.PHYSICAL,
      address: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
      postalCode: '12345',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any, // Using 'as any' to bypass the complex type checking for test purposes
    attendees: [mockAttendeeId],
    eventWith: 'test_client',
    eventSubtype: 'Follow-up',
    type: 'Meeting',
    metadata: { source: 'test' },
  };

  const mockEvent: Partial<IEvent> = {
    _id: mockObjectId,
    title: 'Test Event',
    description: 'Test Description',
    startDateTime: new Date('2024-12-25T10:00:00.000Z'),
    endDateTime: new Date('2024-12-25T11:00:00.000Z'),
    createdBy: mockObjectId,
    location: mockLocationId,
    attendees: [mockAttendeeId],
    status: EventStatus.SCHEDULED,
    eventWith: 'test_client',
    eventSubtype: 'Follow-up',
    type: 'Meeting',
    metadata: { source: 'test' },
    createdAt: new Date(),
    updatedAt: new Date(),
    populate: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    eventService = new EventService();
    mockEventRepository = eventService[
      'eventRepository'
    ] as jest.Mocked<EventRepository>;
  });

  describe('createEvent', () => {
    beforeEach(() => {
      // Mock Event constructor
      (Event as jest.MockedClass<typeof Event>).mockImplementation(
        () => mockEvent as any,
      );
      mockEventRepository.findOne.mockResolvedValue(null);
      mockEventRepository.createEvent.mockResolvedValue(mockEvent as IEvent);
    });

    it('should create an event successfully', async () => {
      const result = await eventService.createEvent(mockEventData);

      expect(mockEventRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          $and: expect.arrayContaining([
            { status: { $ne: EventStatus.CANCELLED } },
            expect.objectContaining({
              $or: expect.any(Array),
            }),
          ]),
        }),
      );
      expect(mockEventRepository.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: mockEventData.title,
          description: mockEventData.description,
          startDateTime: mockEventData.startDateTime,
          endDateTime: mockEventData.endDateTime,
          createdBy: mockEventData.createdBy,
          eventWith: mockEventData.eventWith,
          eventSubtype: mockEventData.eventSubtype,
          type: mockEventData.type,
          status: EventStatus.SCHEDULED,
        }),
      );
      expect(result.populate).toHaveBeenCalledWith(['location', 'attendees']);
      expect(logger.debug).toHaveBeenCalledWith('Creating event via service', {
        eventData: mockEventData,
      });
    });

    it('should throw BadRequestException when start date is after end date', async () => {
      const invalidEventData = {
        ...mockEventData,
        startDateTime: new Date('2024-12-25T11:00:00.000Z'),
        endDateTime: new Date('2024-12-25T10:00:00.000Z'),
      };

      await expect(eventService.createEvent(invalidEventData)).rejects.toThrow(
        BadRequestException,
      );
      await expect(eventService.createEvent(invalidEventData)).rejects.toThrow(
        'Start date must be before end date',
      );
      expect(mockEventRepository.createEvent).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when overlapping event exists', async () => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent as IEvent);

      await expect(eventService.createEvent(mockEventData)).rejects.toThrow(
        BadRequestException,
      );
      await expect(eventService.createEvent(mockEventData)).rejects.toThrow(
        'An event already exists during this time period',
      );
      expect(mockEventRepository.createEvent).not.toHaveBeenCalled();
    });

    it('should handle and rethrow repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      mockEventRepository.createEvent.mockRejectedValue(repositoryError);

      await expect(eventService.createEvent(mockEventData)).rejects.toThrow(
        repositoryError,
      );
      expect(logger.error).toHaveBeenCalledWith('Error creating event', {
        error: repositoryError,
      });
    });
  });

  describe('getAllEvents', () => {
    const mockFilter = {
      page: 1,
      limit: 10,
      status: EventStatus.SCHEDULED,
      eventWith: 'test_client',
    };

    const mockEvents = [mockEvent, { ...mockEvent, _id: new Types.ObjectId() }];
    const expectedResult = {
      events: mockEvents,
      totalCount: 2,
      currentPage: 1,
      totalPages: 1,
    };

    beforeEach(() => {
      mockEventRepository.countDocuments.mockResolvedValue(2);
      mockEventRepository.findAllEvents.mockResolvedValue(
        mockEvents as IEvent[],
      );
    });

    it('should retrieve all events with pagination', async () => {
      const result = await eventService.getAllEvents(mockFilter);

      expect(mockEventRepository.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          status: EventStatus.SCHEDULED,
          eventWith: 'test_client',
        }),
      );
      expect(mockEventRepository.findAllEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          status: EventStatus.SCHEDULED,
          eventWith: 'test_client',
        }),
        1,
        10,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should handle date range filters', async () => {
      const filterWithDates = {
        ...mockFilter,
        startDateTime: '2024-12-25T00:00:00.000Z',
        endDateTime: '2024-12-25T23:59:59.000Z',
      };

      await eventService.getAllEvents(filterWithDates);

      expect(mockEventRepository.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          startDateTime: { $gte: new Date('2024-12-25T00:00:00.000Z') },
          endDateTime: { $lte: new Date('2024-12-25T23:59:59.000Z') },
        }),
      );
    });

    it('should handle createdBy filter with valid ObjectId', async () => {
      const filterWithCreatedBy = {
        ...mockFilter,
        createdBy: mockObjectId.toString(),
      };

      await eventService.getAllEvents(filterWithCreatedBy);

      expect(mockEventRepository.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          createdBy: mockObjectId.toString(),
        }),
      );
    });

    it('should ignore invalid createdBy ObjectId', async () => {
      const filterWithInvalidCreatedBy = {
        ...mockFilter,
        createdBy: 'invalid-object-id',
      };

      await eventService.getAllEvents(filterWithInvalidCreatedBy);

      expect(mockEventRepository.countDocuments).toHaveBeenCalledWith(
        expect.not.objectContaining({
          createdBy: expect.anything(),
        }),
      );
    });

    it('should throw BadRequestException for invalid date format', async () => {
      const filterWithInvalidDate = {
        ...mockFilter,
        startDateTime: 'invalid-date',
      };

      await expect(
        eventService.getAllEvents(filterWithInvalidDate),
      ).rejects.toThrow(BadRequestException);
      await expect(
        eventService.getAllEvents(filterWithInvalidDate),
      ).rejects.toThrow('Invalid start date format');
    });

    it('should handle repository errors', async () => {
      const repositoryError = new Error('Database query failed');
      mockEventRepository.countDocuments.mockRejectedValue(repositoryError);

      await expect(eventService.getAllEvents(mockFilter)).rejects.toThrow(
        repositoryError,
      );
      expect(logger.error).toHaveBeenCalledWith('Error fetching all events', {
        error: repositoryError,
      });
    });
  });

  describe('getEventById', () => {
    const validId = mockObjectId.toString();
    const invalidId = 'invalid-id';

    beforeEach(() => {
      mockEventRepository.findById.mockResolvedValue(mockEvent as IEvent);
    });

    it('should retrieve an event by valid ID', async () => {
      const result = await eventService.getEventById(validId);

      expect(mockEventRepository.findById).toHaveBeenCalledWith(validId);
      expect(result?.populate).toHaveBeenCalledWith(['location', 'attendees']);
    });

    it('should throw BadRequestException for invalid ID format', async () => {
      await expect(eventService.getEventById(invalidId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(eventService.getEventById(invalidId)).rejects.toThrow(
        'Invalid event ID',
      );
      expect(mockEventRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when event is not found', async () => {
      mockEventRepository.findById.mockResolvedValue(null);

      await expect(eventService.getEventById(validId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(eventService.getEventById(validId)).rejects.toThrow(
        'Event not found',
      );
    });

    it('should handle repository errors', async () => {
      const repositoryError = new Error('Database query failed');
      mockEventRepository.findById.mockRejectedValue(repositoryError);

      await expect(eventService.getEventById(validId)).rejects.toThrow(
        repositoryError,
      );
      expect(logger.error).toHaveBeenCalledWith('Error fetching event by ID', {
        error: repositoryError,
        id: validId,
      });
    });
  });

  describe('updateEvent', () => {
    const validId = mockObjectId.toString();
    const invalidId = 'invalid-id';

    const updateData: UpdateEventDto = {
      title: 'Updated Event',
      description: 'Updated Description',
      startDateTime: new Date('2024-12-26T10:00:00.000Z'),
      endDateTime: new Date('2024-12-26T11:00:00.000Z'),
      status: EventStatus.COMPLETED,
      attendees: [mockAttendeeId.toString()],
    };

    beforeEach(() => {
      mockEventRepository.updateEvent.mockResolvedValue(mockEvent as IEvent);
    });

    it('should update an event successfully', async () => {
      const result = await eventService.updateEvent(validId, updateData);

      expect(mockEventRepository.updateEvent).toHaveBeenCalledWith(
        validId,
        expect.objectContaining({
          title: 'Updated Event',
          description: 'Updated Description',
          attendees: [mockAttendeeId],
        }),
      );
      expect(result?.populate).toHaveBeenCalledWith(['location', 'attendees']);
    });

    it('should throw BadRequestException for invalid ID format', async () => {
      await expect(
        eventService.updateEvent(invalidId, updateData),
      ).rejects.toThrow(BadRequestException);
      await expect(
        eventService.updateEvent(invalidId, updateData),
      ).rejects.toThrow('Invalid event ID');
      expect(mockEventRepository.updateEvent).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when start date is after end date', async () => {
      const invalidUpdateData = {
        startDateTime: new Date('2024-12-26T11:00:00.000Z'),
        endDateTime: new Date('2024-12-26T10:00:00.000Z'),
      };

      await expect(
        eventService.updateEvent(validId, invalidUpdateData),
      ).rejects.toThrow(BadRequestException);
      await expect(
        eventService.updateEvent(validId, invalidUpdateData),
      ).rejects.toThrow('Start date must be before end date');
    });

    it('should handle location update with ObjectId string', async () => {
      const updateWithLocation = {
        ...updateData,
        location: mockLocationId.toString(),
      };

      await eventService.updateEvent(validId, updateWithLocation);

      expect(mockEventRepository.updateEvent).toHaveBeenCalledWith(
        validId,
        expect.objectContaining({
          location: mockLocationId,
        }),
      );
    });

    it('should handle location update with location object', async () => {
      const updateWithLocationObject = {
        ...updateData,
        location: {
          _id: mockLocationId.toString(),
          type: 'VIRTUAL',
          address: 'Virtual Room 1',
        },
      };

      await eventService.updateEvent(validId, updateWithLocationObject);

      expect(mockEventRepository.updateEvent).toHaveBeenCalledWith(
        validId,
        expect.objectContaining({
          location: mockLocationId,
        }),
      );
    });

    it('should throw NotFoundException when event is not found', async () => {
      mockEventRepository.updateEvent.mockResolvedValue(null);

      await expect(
        eventService.updateEvent(validId, updateData),
      ).rejects.toThrow(NotFoundException);
      await expect(
        eventService.updateEvent(validId, updateData),
      ).rejects.toThrow('Event not found');
    });

    it('should handle repository errors', async () => {
      const repositoryError = new Error('Database update failed');
      mockEventRepository.updateEvent.mockRejectedValue(repositoryError);

      await expect(
        eventService.updateEvent(validId, updateData),
      ).rejects.toThrow(repositoryError);
      expect(logger.error).toHaveBeenCalledWith('Error updating event', {
        error: repositoryError,
        id: validId,
        updateData,
      });
    });
  });

  describe('deleteEvent', () => {
    const validId = mockObjectId.toString();
    const invalidId = 'invalid-id';

    beforeEach(() => {
      mockEventRepository.deleteEvent.mockResolvedValue(mockEvent as IEvent);
    });

    it('should delete an event successfully', async () => {
      const result = await eventService.deleteEvent(validId);

      expect(mockEventRepository.deleteEvent).toHaveBeenCalledWith(validId);
      expect(result).toEqual(mockEvent);
    });

    it('should throw BadRequestException for invalid ID format', async () => {
      await expect(eventService.deleteEvent(invalidId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(eventService.deleteEvent(invalidId)).rejects.toThrow(
        'Invalid event ID',
      );
      expect(mockEventRepository.deleteEvent).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when event is not found', async () => {
      mockEventRepository.deleteEvent.mockResolvedValue(null);

      await expect(eventService.deleteEvent(validId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(eventService.deleteEvent(validId)).rejects.toThrow(
        'Event not found',
      );
    });

    it('should handle repository errors', async () => {
      const repositoryError = new Error('Database delete failed');
      mockEventRepository.deleteEvent.mockRejectedValue(repositoryError);

      await expect(eventService.deleteEvent(validId)).rejects.toThrow(
        repositoryError,
      );
      expect(logger.error).toHaveBeenCalledWith('Error deleting event', {
        error: repositoryError,
        id: validId,
      });
    });
  });
});
