import type { Request, Response } from 'express';
import { BaseController } from '@/controllers/base.controller';
import { EventService } from './event.service';
import type { IEventController } from './interfaces/event.interface';
import { LocationService } from '../location/location.service';
import logger from '@/common/utils/logger';
import type { CreateEventDto } from './dto/create-event.dto';
import type { UpdateEventDto } from './dto/update-event.dto';

// Remove this interface as we'll use proper error handling

export class EventController
  extends BaseController
  implements IEventController
{
  private eventService: EventService;
  private locationService: LocationService;

  constructor() {
    super();
    this.eventService = new EventService();
    this.locationService = new LocationService();
  }

  public async createEvent(req: Request, res: Response): Promise<void> {
    try {
      const bodyForLogging = req.body
        ? JSON.stringify(req.body)
        : 'No body provided';
      logger.debug('Creating event via controller', { body: bodyForLogging });

      const requestBody = req.body as CreateEventDto;

      const missingFields = this.validateRequiredFields(
        {
          ...requestBody,
          type: requestBody.location.type,
        },
        ['title', 'startDateTime', 'endDateTime', 'type'],
      );

      if (missingFields.length > 0) {
        this.sendBadRequest(
          res,
          `Missing required fields: ${missingFields.join(', ')}`,
        );
        return;
      }
      const location = await this.locationService.createLocation(
        requestBody.location,
      );

      if (!location) {
        this.sendError(res, 'Failed to create location');
        return;
      }

      const eventData: CreateEventDto = {
        ...requestBody,
        location: location._id as typeof requestBody.location,
      };
      const newEvent = await this.eventService.createEvent(eventData);
      this.sendCreated(res, newEvent);
    } catch (error) {
      logger.error('Error creating event', { error });
      const err = error instanceof Error ? error : new Error(String(error));
      this.sendError(res, err.message);
    }
  }

  public async getAllEvents(req: Request, res: Response): Promise<void> {
    try {
      const events = await this.eventService.getAllEvents(req.query);
      this.sendSuccess(res, events);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.sendError(res, err.message);
    }
  }

  public async getEventById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const event = await this.eventService.getEventById(id);

      if (!event) {
        this.sendNotFound(res, 'Event not found');
        return;
      }

      this.sendSuccess(res, event);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.sendError(res, err.message);
    }
  }

  public async updateEvent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body as UpdateEventDto;

      const updatedEvent = await this.eventService.updateEvent(id, updateData);

      if (!updatedEvent) {
        this.sendNotFound(res, 'Event not found');
        return;
      }

      this.sendSuccess(res, updatedEvent);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.sendError(res, err.message);
    }
  }

  public async deleteEvent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await this.eventService.deleteEvent(id);
      const locationDeleted = await this.locationService.deleteLocation(
        deleted?.location?.toString() ?? '',
      );

      if (!deleted || !locationDeleted) {
        this.sendNotFound(res, 'Event not found');
        return;
      }

      this.sendSuccess(res, { message: 'Event deleted successfully' });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.sendError(res, err.message);
    }
  }
}
