import { Types } from 'mongoose';
import { Event } from '@/models/event.model';
import type { IEvent } from '@/models/event.model';
import type { CreateEventDto } from './dto/create-event.dto';
import type { UpdateEventDto } from './dto/update-event.dto';
import { EventStatus } from '@/common/enums/event-status.enum';
import { BadRequestException } from '@/common/exceptions/bad-request.exception';
import { NotFoundException } from '@/common/exceptions/not-found.exception';
import logger from '@/common/utils/logger';
import { EventRepository } from './event.respository';
import type { IEventFilter } from './interfaces/event.interface';

interface EventPaginationResult {
  events: IEvent[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export class EventService {
  private readonly eventRepository: EventRepository;

  constructor() {
    this.eventRepository = new EventRepository();
  }

  public async createEvent(eventData: CreateEventDto): Promise<IEvent> {
    try {
      logger.debug('Creating event via service', { eventData });

      // Validate dates
      if (new Date(eventData.startDateTime) > new Date(eventData.endDateTime)) {
        throw new BadRequestException('Start date must be before end date');
      }

      // Check for overlapping event
      const overlappingEvent = await this.eventRepository.findOne({
        $and: [
          { status: { $ne: EventStatus.CANCELLED } },
          {
            $or: [
              {
                // New event starts during an existing event
                startDateTime: {
                  $lte: new Date(eventData.startDateTime),
                },
                endDateTime: {
                  $gt: new Date(eventData.startDateTime),
                },
              },
              {
                // New event ends during an existing event
                startDateTime: {
                  $lt: new Date(eventData.endDateTime),
                },
                endDateTime: {
                  $gte: new Date(eventData.endDateTime),
                },
              },
              {
                // New event completely contains an existing event
                startDateTime: {
                  $gte: new Date(eventData.startDateTime),
                },
                endDateTime: {
                  $lte: new Date(eventData.endDateTime),
                },
              },
            ],
          },
        ],
      });

      if (overlappingEvent) {
        throw new BadRequestException(
          'An event already exists during this time period',
        );
      }

      // Create the event
      const event = new Event({
        ...eventData,
        status: EventStatus.SCHEDULED,
      });

      const savedEvent = await this.eventRepository.createEvent(event);

      return savedEvent.populate(['location', 'attendees']);
    } catch (error) {
      logger.error('Error creating event', { error });
      throw error;
    }
  }

  /**
   * Retrieves all events
   * @returns Array of events
   */
  public async getAllEvents(
    filter: IEventFilter,
  ): Promise<EventPaginationResult> {
    try {
      const { page = 1, limit = 10 } = filter;
      const query = this.buildEventQuery(filter);

      const total = await this.eventRepository.countDocuments(query);
      const events = await this.eventRepository.findAllEvents(
        query,
        page,
        limit,
      );

      return this.buildPaginationResult(events, total, page, limit);
    } catch (error) {
      logger.error('Error fetching all events', { error });
      throw error;
    }
  }

  private buildEventQuery(filter: IEventFilter): Record<string, unknown> {
    const { status, startDateTime, endDateTime, createdBy, eventWith, type } =
      filter;
    const query: Record<string, unknown> = {};

    if (status) {
      query.status = status;
    }

    if (eventWith) {
      query.eventWith = eventWith;
    }

    if (type) {
      query.type = type;
    }

    this.addDateRangeToQuery(query, startDateTime, endDateTime);
    this.addCreatedByToQuery(query, createdBy);

    return query;
  }

  private addDateRangeToQuery(
    query: Record<string, unknown>,
    startDateTime?: string | Date,
    endDateTime?: string | Date,
  ): void {
    if (startDateTime) {
      const startDate = this.parseDate(startDateTime, 'start');
      query.startDateTime = { $gte: startDate };
    }

    if (endDateTime) {
      const endDate = this.parseDate(endDateTime, 'end');
      query.endDateTime = { $lte: endDate };
    }
  }

  private addCreatedByToQuery(
    query: Record<string, unknown>,
    createdBy?: string,
  ): void {
    if (createdBy && Types.ObjectId.isValid(createdBy)) {
      query.createdBy = createdBy;
    }
  }

  private parseDate(dateInput: string | Date, dateType: 'start' | 'end'): Date {
    const date =
      typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid ${dateType} date format`);
    }
    return date;
  }

  private buildPaginationResult(
    events: IEvent[],
    total: number,
    page: number,
    limit: number,
  ): EventPaginationResult {
    return {
      events,
      totalCount: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retrieves an event by its ID
   * @param id The event ID
   * @returns The found event or null
   */
  public async getEventById(id: string): Promise<IEvent | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid event ID');
      }
      const event = await this.eventRepository.findById(id);

      if (!event) {
        throw new NotFoundException('Event not found');
      }
      return event.populate(['location', 'attendees']);
    } catch (error) {
      logger.error('Error fetching event by ID', { error, id });
      throw error;
    }
  }

  /**
   * Updates an event
   * @param id The event ID
   * @param updateData The update data
   * @returns The updated event
   */
  public async updateEvent(
    id: string,
    updateData: UpdateEventDto,
  ): Promise<IEvent | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid event ID');
      }

      // Validate dates if both are provided
      if (updateData.startDateTime && updateData.endDateTime) {
        if (
          new Date(updateData.startDateTime) > new Date(updateData.endDateTime)
        ) {
          throw new BadRequestException('Start date must be before end date');
        }
      }

      // Handle location update
      const { location, attendees, ...restUpdateData } = updateData;
      const eventUpdate: Record<string, unknown> = { ...restUpdateData };

      // Handle location based on its format
      if (location) {
        // If location has _id, use it as the location reference
        if (
          typeof location === 'object' &&
          '_id' in location &&
          Types.ObjectId.isValid(location._id as string)
        ) {
          eventUpdate.location = new Types.ObjectId(location._id as string);
        }
        // If location is a string (ObjectId), use it directly
        else if (
          typeof location === 'string' &&
          Types.ObjectId.isValid(location)
        ) {
          eventUpdate.location = new Types.ObjectId(location);
        }
      }

      // Convert attendee IDs to ObjectIds if provided
      if (attendees?.length) {
        eventUpdate.attendees = attendees.map(
          attendeeId => new Types.ObjectId(attendeeId),
        );
      }

      const event = await this.eventRepository.updateEvent(id, eventUpdate);

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      return event.populate(['location', 'attendees']);
    } catch (error) {
      logger.error('Error updating event', { error, id, updateData });
      throw error;
    }
  }

  /**
   * Deletes an event
   * @param id The event ID
   * @returns true if deleted, false if not found
   */
  public async deleteEvent(id: string): Promise<IEvent | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid event ID');
      }

      const result = await this.eventRepository.deleteEvent(id);

      if (!result) {
        throw new NotFoundException('Event not found');
      }

      return result;
    } catch (error) {
      logger.error('Error deleting event', { error, id });
      throw error;
    }
  }
}
