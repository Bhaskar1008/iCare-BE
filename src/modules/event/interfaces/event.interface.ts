import type { Request, Response } from 'express';
import type { EventStatus } from '@/common/enums/event-status.enum';

export interface IEventController {
  createEvent(req: Request, res: Response): Promise<void>;
  getAllEvents(req: Request, res: Response): Promise<void>;
  getEventById(req: Request, res: Response): Promise<void>;
  updateEvent(req: Request, res: Response): Promise<void>;
  deleteEvent(req: Request, res: Response): Promise<void>;
}

export interface IEventFilter {
  status?: EventStatus;
  startDateTime?: string | Date;
  endDateTime?: string | Date;
  createdBy?: string;
  page?: number;
  limit?: number;
}
