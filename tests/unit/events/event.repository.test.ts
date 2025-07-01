import { Types } from 'mongoose';
import { Event } from '@/models/event.model';
import type { IEvent } from '@/models/event.model';
import { EventStatus } from '@/common/enums/event-status.enum';
import logger from '@/common/utils/logger';
import { EventRepository } from '@/modules/event/event.respository';
import type { UpdateEventDto } from '@/modules/event/dto/update-event.dto';

// Mock dependencies
jest.mock('@/models/event.model');
jest.mock('@/common/utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('EventRepository', () => {
  let eventRepository: EventRepository;
  let mockEvent: jest.Mocked<typeof Event>;

  const mockObjectId = new Types.ObjectId();
  const mockLocationId = new Types.ObjectId();
  const mockAttendeeId = new Types.ObjectId();

  const mockEventData: Partial<IEvent> = {
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
  };

  const mockPopulatedEvent = {
    ...mockEventData,
    populate: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    eventRepository = new EventRepository();
    mockEvent = Event as jest.Mocked<typeof Event>;

    // Setup default mocks for Event model
    mockEvent.countDocuments = jest.fn();
    mockEvent.findById = jest.fn();
    mockEvent.findByIdAndUpdate = jest.fn();
  });

  describe('createEvent', () => {
    beforeEach(() => {
      // Mock the create method from BaseRepository
      eventRepository['create'] = jest.fn().mockResolvedValue(mockEventData);
    });

    it('should create an event successfully', async () => {
      const result = await eventRepository.createEvent(mockEventData as IEvent);

      expect(eventRepository['create']).toHaveBeenCalledWith(mockEventData);
      expect(result).toEqual(mockEventData);
      expect(logger.debug).toHaveBeenCalledWith('Creating event', {
        eventData: mockEventData,
      });
      expect(logger.debug).toHaveBeenCalledWith('Event created successfully', {
        event: mockEventData,
      });
    });

    it('should handle and log creation errors', async () => {
      const createError = new Error('Database creation failed');
      eventRepository['create'] = jest.fn().mockRejectedValue(createError);

      await expect(
        eventRepository.createEvent(mockEventData as IEvent),
      ).rejects.toThrow(createError);

      expect(logger.error).toHaveBeenCalledWith('Failed to create event:', {
        error: createError,
        eventData: mockEventData,
      });
    });
  });

  describe('countDocuments', () => {
    const mockFilter = { status: EventStatus.SCHEDULED };
    const mockCount = 5;

    beforeEach(() => {
      mockEvent.countDocuments.mockResolvedValue(mockCount);
    });

    it('should count documents with filter', async () => {
      const result = await eventRepository.countDocuments(mockFilter);

      expect(mockEvent.countDocuments).toHaveBeenCalledWith(mockFilter);
      expect(result).toBe(mockCount);
      expect(logger.debug).toHaveBeenCalledWith('Counting documents', {
        filter: mockFilter,
      });
      expect(logger.debug).toHaveBeenCalledWith('Documents counted', {
        count: mockCount,
      });
    });

    it('should count all documents when no filter provided', async () => {
      await eventRepository.countDocuments();

      expect(mockEvent.countDocuments).toHaveBeenCalledWith({});
    });

    it('should handle and log counting errors', async () => {
      const countError = new Error('Database count failed');
      mockEvent.countDocuments.mockRejectedValue(countError);

      await expect(eventRepository.countDocuments(mockFilter)).rejects.toThrow(
        countError,
      );

      expect(logger.error).toHaveBeenCalledWith('Failed to count documents:', {
        error: countError,
        filter: mockFilter,
      });
    });
  });

  describe('findAllEvents', () => {
    const mockFilter = { status: EventStatus.SCHEDULED };
    const page = 2;
    const limit = 5;
    const mockEvents = [
      mockEventData,
      { ...mockEventData, _id: new Types.ObjectId() },
    ];

    beforeEach(() => {
      // Mock the find method from BaseRepository
      eventRepository['find'] = jest.fn().mockResolvedValue(mockEvents);
    });

    it('should find all events with pagination and filters', async () => {
      const result = await eventRepository.findAllEvents(
        mockFilter,
        page,
        limit,
      );

      expect(eventRepository['find']).toHaveBeenCalledWith(
        {
          ...mockFilter,
          isDeleted: { $ne: true },
        },
        {
          limit,
          skip: (page - 1) * limit,
          sort: { startDateTime: 1 },
          populate: ['location', 'attendees'],
        },
      );
      expect(result).toEqual(mockEvents);
      expect(logger.debug).toHaveBeenCalledWith('Finding all events', {
        filter: mockFilter,
        page,
        limit,
      });
      expect(logger.debug).toHaveBeenCalledWith('All events found', {
        count: mockEvents.length,
      });
    });

    it('should use default pagination values', async () => {
      await eventRepository.findAllEvents();

      expect(eventRepository['find']).toHaveBeenCalledWith(
        {
          isDeleted: { $ne: true },
        },
        {
          limit: 10,
          skip: 0,
          sort: { startDateTime: 1 },
          populate: ['location', 'attendees'],
        },
      );
    });

    it('should handle and log find errors', async () => {
      const findError = new Error('Database find failed');
      eventRepository['find'] = jest.fn().mockRejectedValue(findError);

      await expect(
        eventRepository.findAllEvents(mockFilter, page, limit),
      ).rejects.toThrow(findError);

      expect(logger.error).toHaveBeenCalledWith('Failed to find all events:', {
        error: findError,
        filter: mockFilter,
        page,
        limit,
      });
    });
  });

  describe('findById', () => {
    const eventId = mockObjectId.toString();

    beforeEach(() => {
      // Create a chainable mock query object
      const mockQuery = {
        populate: jest.fn().mockImplementation(field => {
          if (field === 'location') {
            return {
              populate: jest.fn().mockResolvedValue(mockPopulatedEvent),
            };
          }
          return mockQuery;
        }),
      };
      mockEvent.findById.mockReturnValue(mockQuery as any);
    });

    it('should find event by ID with populated fields', async () => {
      const result = await eventRepository.findById(eventId);

      expect(mockEvent.findById).toHaveBeenCalledWith(eventId);
      expect(result).toEqual(mockPopulatedEvent);
      expect(logger.debug).toHaveBeenCalledWith('Finding event by ID', {
        id: eventId,
      });
      expect(logger.debug).toHaveBeenCalledWith('Event found by ID', {
        id: eventId,
        found: true,
      });
    });

    it('should return null when event not found', async () => {
      // Create a chainable mock query object that returns null
      const mockQuery = {
        populate: jest.fn().mockImplementation(field => {
          if (field === 'location') {
            return {
              populate: jest.fn().mockResolvedValue(null),
            };
          }
          return mockQuery;
        }),
      };
      mockEvent.findById.mockReturnValue(mockQuery as any);

      const result = await eventRepository.findById(eventId);

      expect(result).toBeNull();
      expect(logger.debug).toHaveBeenCalledWith('Event found by ID', {
        id: eventId,
        found: false,
      });
    });

    it('should handle and log find by ID errors', async () => {
      const findError = new Error('Database findById failed');
      mockEvent.findById.mockImplementation(() => {
        throw findError;
      });

      await expect(eventRepository.findById(eventId)).rejects.toThrow(
        findError,
      );

      expect(logger.error).toHaveBeenCalledWith('Failed to find event by ID:', {
        error: findError,
        id: eventId,
      });
    });
  });

  describe('updateEvent', () => {
    const eventId = mockObjectId.toString();
    const updateData: UpdateEventDto = {
      title: 'Updated Event',
      description: 'Updated Description',
      status: EventStatus.COMPLETED,
    };

    beforeEach(() => {
      // Create a chainable mock query object
      const mockQuery = {
        populate: jest.fn().mockImplementation(field => {
          if (field === 'location') {
            return {
              populate: jest.fn().mockResolvedValue(mockPopulatedEvent),
            };
          }
          return mockQuery;
        }),
      };
      mockEvent.findByIdAndUpdate.mockReturnValue(mockQuery as any);
    });

    it('should update event successfully', async () => {
      const result = await eventRepository.updateEvent(eventId, updateData);

      expect(mockEvent.findByIdAndUpdate).toHaveBeenCalledWith(
        eventId,
        updateData,
        { new: true },
      );
      expect(result).toEqual(mockPopulatedEvent);
      expect(logger.debug).toHaveBeenCalledWith('Updating event', {
        id: eventId,
        updateData,
      });
      expect(logger.debug).toHaveBeenCalledWith('Event updated successfully', {
        id: eventId,
        updated: true,
      });
    });

    it('should return null when event not found for update', async () => {
      // Create a chainable mock query object that returns null
      const mockQuery = {
        populate: jest.fn().mockImplementation(field => {
          if (field === 'location') {
            return {
              populate: jest.fn().mockResolvedValue(null),
            };
          }
          return mockQuery;
        }),
      };
      mockEvent.findByIdAndUpdate.mockReturnValue(mockQuery as any);

      const result = await eventRepository.updateEvent(eventId, updateData);

      expect(result).toBeNull();
      expect(logger.debug).toHaveBeenCalledWith('Event updated successfully', {
        id: eventId,
        updated: false,
      });
    });

    it('should handle and log update errors', async () => {
      const updateError = new Error('Database update failed');
      mockEvent.findByIdAndUpdate.mockImplementation(() => {
        throw updateError;
      });

      await expect(
        eventRepository.updateEvent(eventId, updateData),
      ).rejects.toThrow(updateError);

      expect(logger.error).toHaveBeenCalledWith('Failed to update event:', {
        error: updateError,
        id: eventId,
        updateData,
      });
    });
  });

  describe('deleteEvent', () => {
    const eventId = mockObjectId.toString();

    beforeEach(() => {
      // Mock the deleteById method from BaseRepository
      eventRepository['deleteById'] = jest
        .fn()
        .mockResolvedValue(mockEventData);
    });

    it('should delete event successfully', async () => {
      const result = await eventRepository.deleteEvent(eventId);

      expect(eventRepository['deleteById']).toHaveBeenCalledWith(eventId);
      expect(result).toEqual(mockEventData);
      expect(logger.debug).toHaveBeenCalledWith('Deleting event', {
        id: eventId,
      });
      expect(logger.debug).toHaveBeenCalledWith('Event deleted successfully', {
        id: eventId,
        deleted: true,
      });
    });

    it('should return null when event not found for deletion', async () => {
      eventRepository['deleteById'] = jest.fn().mockResolvedValue(null);

      const result = await eventRepository.deleteEvent(eventId);

      expect(result).toBeNull();
      expect(logger.debug).toHaveBeenCalledWith('Event deleted successfully', {
        id: eventId,
        deleted: false,
      });
    });

    it('should handle and log deletion errors', async () => {
      const deleteError = new Error('Database delete failed');
      eventRepository['deleteById'] = jest.fn().mockRejectedValue(deleteError);

      await expect(eventRepository.deleteEvent(eventId)).rejects.toThrow(
        deleteError,
      );

      expect(logger.error).toHaveBeenCalledWith('Failed to delete event:', {
        error: deleteError,
        id: eventId,
      });
    });
  });
});
