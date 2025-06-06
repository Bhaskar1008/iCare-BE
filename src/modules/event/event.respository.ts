import { BaseRepository } from '@/repository/base.repository';
import { Event } from '@/models/event.model';
import type { IEvent } from '@/models/event.model';
import type { FilterQuery } from 'mongoose';
import logger from '@/common/utils/logger';
import type { UpdateEventDto } from './dto/update-event.dto';

export class EventRepository extends BaseRepository<IEvent> {
  constructor() {
    super(Event);
  }

  public async createEvent(eventData: IEvent): Promise<IEvent> {
    try {
      logger.debug('Creating event', { eventData });
      const event = await this.create(eventData);
      logger.debug('Event created successfully', { event });
      return event;
    } catch (error) {
      logger.error('Failed to create event:', { error, eventData });
      throw error;
    }
  }

  public async countDocuments(
    filter: FilterQuery<IEvent> = {},
  ): Promise<number> {
    try {
      logger.debug('Counting documents', { filter });
      const count = await this.model.countDocuments(filter);
      logger.debug('Documents counted', { count });
      return count;
    } catch (error) {
      logger.error('Failed to count documents:', { error, filter });
      throw error;
    }
  }

  public async findAllEvents(
    filter: FilterQuery<IEvent> = {},
    page: number = 1,
    limit: number = 10,
  ): Promise<IEvent[]> {
    try {
      logger.debug('Finding all events', { filter, page, limit });
      const skip = (page - 1) * limit;
      const events = await this.find(
        {
          ...filter,
          isDeleted: { $ne: true },
        },
        {
          limit,
          skip,
          sort: { startDateTime: 1 },
          populate: ['location'],
        },
      );
      logger.debug('All events found', { count: events.length });
      return events;
    } catch (error) {
      logger.error('Failed to find all events:', {
        error,
        filter,
        page,
        limit,
      });
      throw error;
    }
  }

  public async findById(id: string): Promise<IEvent | null> {
    try {
      logger.debug('Finding event by ID', { id });
      const event = await this.findById(id);
      logger.debug('Event found by ID', { id, found: !!event });
      return event;
    } catch (error) {
      logger.error('Failed to find event by ID:', { error, id });
      throw error;
    }
  }

  public async updateEvent(
    id: string,
    updateData: UpdateEventDto,
  ): Promise<IEvent | null> {
    try {
      logger.debug('Updating event', { id, updateData });
      const event = await this.updateById(id, updateData);
      logger.debug('Event updated successfully', { id, updated: !!event });
      return event;
    } catch (error) {
      logger.error('Failed to update event:', { error, id, updateData });
      throw error;
    }
  }

  public async deleteEvent(id: string): Promise<IEvent | null> {
    try {
      logger.debug('Deleting event', { id });
      const event = await this.deleteById(id);
      logger.debug('Event deleted successfully', { id, deleted: !!event });
      return event;
    } catch (error) {
      logger.error('Failed to delete event:', { error, id });
      throw error;
    }
  }
}
