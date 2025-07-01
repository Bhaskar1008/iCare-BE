import { Types } from 'mongoose';
import { EventService } from '@/modules/event/event.service';
import { Event } from '@/models/event.model';
import { Location } from '@/models/location.model';
import { AgentModel } from '@/models/agent.model';
import type { CreateEventDto } from '@/modules/event/dto/create-event.dto';
import type { UpdateEventDto } from '@/modules/event/dto/update-event.dto';
import { EventStatus } from '@/common/enums/event-status.enum';
import { LocationType } from '@/common/enums/location-type.enum';
import { BadRequestException } from '@/common/exceptions/bad-request.exception';
import { NotFoundException } from '@/common/exceptions/not-found.exception';
import {
  setupTestDB,
  teardownTestDB,
  clearTestDB,
} from '../models/__tests__/setup';

describe('EventService Integration Tests', () => {
  let eventService: EventService;
  let mockLocationId: Types.ObjectId;
  let mockUserId: Types.ObjectId;

  beforeAll(async () => {
    await setupTestDB();
    // Ensure Agent model is registered by accessing its modelName
    const agentModelName = AgentModel.modelName;
    expect(agentModelName).toBe('Agent');
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    eventService = new EventService();

    // Create test data
    mockUserId = new Types.ObjectId();

    // Create a test location
    const testLocation = await Location.create({
      type: LocationType.PHYSICAL,
      address: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
      postalCode: '12345',
    });
    mockLocationId = testLocation._id as Types.ObjectId;
  });

  describe('createEvent', () => {
    it('should create an event with valid data', async () => {
      const validEventData: CreateEventDto = {
        title: 'Integration Test Event',
        description: 'Test Description',
        startDateTime: new Date('2024-12-25T10:00:00.000Z'),
        endDateTime: new Date('2024-12-25T11:00:00.000Z'),
        createdBy: mockUserId,
        location: mockLocationId as any,
        attendees: [],
        eventWith: 'test_client',
        eventSubtype: 'Follow-up',
        type: 'Meeting',
        metadata: { source: 'integration_test' },
      };

      const result = await eventService.createEvent(validEventData);

      expect(result).toBeDefined();
      expect(result.title).toBe(validEventData.title);
      expect(result.description).toBe(validEventData.description);
      expect(result.status).toBe(EventStatus.SCHEDULED);
      expect(result.eventWith).toBe(validEventData.eventWith);
      expect(result.eventSubtype).toBe(validEventData.eventSubtype);

      // Verify the event was saved to the database
      const savedEvent = await Event.findById(result._id);
      expect(savedEvent).toBeDefined();
      expect(savedEvent?.title).toBe(validEventData.title);
    });

    it('should throw BadRequestException for overlapping events', async () => {
      const validEventData: CreateEventDto = {
        title: 'First Event',
        description: 'Test Description',
        startDateTime: new Date('2024-12-25T10:00:00.000Z'),
        endDateTime: new Date('2024-12-25T11:00:00.000Z'),
        createdBy: mockUserId,
        location: mockLocationId as any,
        attendees: [],
        eventWith: 'test_client',
        eventSubtype: 'Follow-up',
        type: 'Meeting',
        metadata: { source: 'integration_test' },
      };

      // Create first event
      await eventService.createEvent(validEventData);

      // Try to create overlapping event
      const overlappingEventData: CreateEventDto = {
        ...validEventData,
        title: 'Overlapping Event',
        startDateTime: new Date('2024-12-25T10:30:00.000Z'),
        endDateTime: new Date('2024-12-25T11:30:00.000Z'),
      };

      await expect(
        eventService.createEvent(overlappingEventData),
      ).rejects.toThrow(BadRequestException);
      await expect(
        eventService.createEvent(overlappingEventData),
      ).rejects.toThrow('An event already exists during this time period');
    });

    it('should allow creating non-overlapping events', async () => {
      const firstEventData: CreateEventDto = {
        title: 'First Event',
        description: 'Test Description',
        startDateTime: new Date('2024-12-25T10:00:00.000Z'),
        endDateTime: new Date('2024-12-25T11:00:00.000Z'),
        createdBy: mockUserId,
        location: mockLocationId as any,
        attendees: [],
        eventWith: 'test_client',
        eventSubtype: 'Follow-up',
        type: 'Meeting',
        metadata: { source: 'integration_test' },
      };

      // Create first event
      await eventService.createEvent(firstEventData);

      // Create non-overlapping event
      const nonOverlappingEventData: CreateEventDto = {
        ...firstEventData,
        title: 'Non-overlapping Event',
        startDateTime: new Date('2024-12-25T12:00:00.000Z'),
        endDateTime: new Date('2024-12-25T13:00:00.000Z'),
      };

      const result = await eventService.createEvent(nonOverlappingEventData);
      expect(result).toBeDefined();
      expect(result.title).toBe('Non-overlapping Event');

      // Verify both events exist in database
      const eventCount = await Event.countDocuments();
      expect(eventCount).toBe(2);
    });
  });

  describe('getAllEvents', () => {
    beforeEach(async () => {
      // Create test events
      const eventData1: CreateEventDto = {
        title: 'Event 1',
        description: 'Description 1',
        startDateTime: new Date('2024-12-25T10:00:00.000Z'),
        endDateTime: new Date('2024-12-25T11:00:00.000Z'),
        createdBy: mockUserId,
        location: mockLocationId as any,
        attendees: [], // Empty attendees to avoid Agent model issues
        eventWith: 'client_1',
        eventSubtype: 'Initial',
        type: 'Meeting',
      };

      const eventData2: CreateEventDto = {
        title: 'Event 2',
        description: 'Description 2',
        startDateTime: new Date('2024-12-26T10:00:00.000Z'),
        endDateTime: new Date('2024-12-26T11:00:00.000Z'),
        createdBy: mockUserId,
        location: mockLocationId as any,
        attendees: [], // Empty attendees to avoid Agent model issues
        eventWith: 'client_2',
        eventSubtype: 'Follow-up',
        type: 'Call',
      };

      await eventService.createEvent(eventData1);
      await eventService.createEvent(eventData2);
    });

    it('should retrieve all events with pagination', async () => {
      const result = await eventService.getAllEvents({ page: 1, limit: 10 });

      expect(result.events).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter events by status', async () => {
      const result = await eventService.getAllEvents({
        status: EventStatus.SCHEDULED,
        page: 1,
        limit: 10,
      });

      expect(result.events).toHaveLength(2);
      result.events.forEach(event => {
        expect(event.status).toBe(EventStatus.SCHEDULED);
      });
    });

    it('should filter events by eventWith', async () => {
      const result = await eventService.getAllEvents({
        eventWith: 'client_1',
        page: 1,
        limit: 10,
      });

      expect(result.events).toHaveLength(1);
      expect(result.events[0].eventWith).toBe('client_1');
    });

    it('should handle pagination correctly', async () => {
      const result = await eventService.getAllEvents({ page: 1, limit: 1 });

      expect(result.events).toHaveLength(1);
      expect(result.totalCount).toBe(2);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(2);
    });
  });

  describe('getEventById', () => {
    let createdEventId: string;

    beforeEach(async () => {
      const eventData: CreateEventDto = {
        title: 'Test Event',
        description: 'Test Description',
        startDateTime: new Date('2024-12-25T10:00:00.000Z'),
        endDateTime: new Date('2024-12-25T11:00:00.000Z'),
        createdBy: mockUserId,
        location: mockLocationId as any,
        attendees: [],
        eventWith: 'test_client',
        eventSubtype: 'Test',
        type: 'Meeting',
      };

      const createdEvent = await eventService.createEvent(eventData);
      createdEventId = (createdEvent._id as Types.ObjectId).toString();
    });

    it('should retrieve an event by valid ID', async () => {
      const result = await eventService.getEventById(createdEventId);

      expect(result).toBeDefined();
      expect(result!.title).toBe('Test Event');
      expect(result!.description).toBe('Test Description');
      expect(result!.eventWith).toBe('test_client');
    });

    it('should throw NotFoundException for non-existent ID', async () => {
      const nonExistentId = new Types.ObjectId().toString();

      await expect(eventService.getEventById(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(eventService.getEventById(nonExistentId)).rejects.toThrow(
        'Event not found',
      );
    });

    it('should throw BadRequestException for invalid ID format', async () => {
      const invalidId = 'invalid-id';

      await expect(eventService.getEventById(invalidId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(eventService.getEventById(invalidId)).rejects.toThrow(
        'Invalid event ID',
      );
    });
  });

  describe('updateEvent', () => {
    let createdEventId: string;

    beforeEach(async () => {
      const eventData: CreateEventDto = {
        title: 'Original Event',
        description: 'Original Description',
        startDateTime: new Date('2024-12-25T10:00:00.000Z'),
        endDateTime: new Date('2024-12-25T11:00:00.000Z'),
        createdBy: mockUserId,
        location: mockLocationId as any,
        attendees: [],
        eventWith: 'original_client',
        eventSubtype: 'Initial',
        type: 'Meeting',
      };

      const createdEvent = await eventService.createEvent(eventData);
      createdEventId = (createdEvent._id as Types.ObjectId).toString();
    });

    it('should update an event successfully', async () => {
      const updateData: UpdateEventDto = {
        title: 'Updated Event',
        description: 'Updated Description',
        status: EventStatus.COMPLETED,
      };

      const result = await eventService.updateEvent(createdEventId, updateData);

      expect(result).toBeDefined();
      expect(result!.title).toBe('Updated Event');
      expect(result!.description).toBe('Updated Description');
      expect(result!.status).toBe(EventStatus.COMPLETED);

      // Verify the update was persisted
      const updatedEvent = await Event.findById(createdEventId);
      expect(updatedEvent!.title).toBe('Updated Event');
      expect(updatedEvent!.status).toBe(EventStatus.COMPLETED);
    });

    it('should update event with location reference', async () => {
      const updateData: UpdateEventDto = {
        location: mockLocationId.toString(),
      };

      const result = await eventService.updateEvent(createdEventId, updateData);

      expect(result).toBeDefined();
      // Handle both populated and non-populated location scenarios
      const locationId = (result!.location as any)._id
        ? (result!.location as any)._id.toString()
        : result!.location.toString();
      expect(locationId).toBe(mockLocationId.toString());
    });

    it('should throw NotFoundException for non-existent event', async () => {
      const nonExistentId = new Types.ObjectId().toString();
      const updateData: UpdateEventDto = { title: 'Updated Title' };

      await expect(
        eventService.updateEvent(nonExistentId, updateData),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteEvent', () => {
    let createdEventId: string;

    beforeEach(async () => {
      const eventData: CreateEventDto = {
        title: 'Event to Delete',
        description: 'This event will be deleted',
        startDateTime: new Date('2024-12-25T10:00:00.000Z'),
        endDateTime: new Date('2024-12-25T11:00:00.000Z'),
        createdBy: mockUserId,
        location: mockLocationId as any,
        attendees: [],
        eventWith: 'delete_client',
        eventSubtype: 'Delete',
        type: 'Meeting',
      };

      const createdEvent = await eventService.createEvent(eventData);
      createdEventId = (createdEvent._id as Types.ObjectId).toString();
    });

    it('should delete an event successfully', async () => {
      const result = await eventService.deleteEvent(createdEventId);

      expect(result).toBeDefined();
      expect(result!.title).toBe('Event to Delete');

      // Verify the event was deleted (using soft delete pattern)
      const deletedEvent = await Event.findById(createdEventId);
      expect(deletedEvent).toBeNull();
    });

    it('should throw NotFoundException for non-existent event', async () => {
      const nonExistentId = new Types.ObjectId().toString();

      await expect(eventService.deleteEvent(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(eventService.deleteEvent(nonExistentId)).rejects.toThrow(
        'Event not found',
      );
    });

    it('should throw BadRequestException for invalid ID format', async () => {
      const invalidId = 'invalid-id';

      await expect(eventService.deleteEvent(invalidId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
