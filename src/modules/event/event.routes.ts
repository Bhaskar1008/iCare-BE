import { Router } from 'express';
import { EventController } from './event.controller';
import { ValidationPipe } from '@/common/pipes/validation.pipe';
import { CreateEventValidationDto } from './dto/create-event.dto';
import { UpdateEventValidationDto } from './dto/update-event.dto';
import { EventQueryDto } from './dto/event-query.dto';

const router = Router();
const eventController = new EventController();

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - startDateTime
 *               - endDateTime
 *               - createdBy
 *               - location
 *               - isAllDay
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Team Meeting"
 *               description:
 *                 type: string
 *                 example: "Weekly team sync meeting"
 *               startDateTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-03-20T10:00:00Z"
 *               endDateTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-03-20T11:00:00Z"
 *               createdBy:
 *                 type: string
 *                 format: objectId
 *                 example: "507f1f77bcf86cd799439011"
 *               location:
 *                 type: object
 *                 required:
 *                   - type
 *                   - name
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [PHYSICAL, VIRTUAL, HYBRID]
 *                   address:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   country:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   coordinates:
 *                     type: object
 *                     properties:
 *                       latitude:
 *                         type: number
 *                       longitude:
 *                         type: number
 *                   meetingUrl:
 *                     type: string
 *                   meetingId:
 *                     type: string
 *                   meetingPassword:
 *                     type: string
 *                   platform:
 *                     type: string
 *               attendees:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: objectId
 *                 example: ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"]
 *
 *               metadata:
 *                 type: object
 *                 example: {
 *                   "meetingLink": "https://meet.example.com/123",
 *                   "notes": "Bring project updates"
 *                 }
 *     responses:
 *       201:
 *         description: Event created successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  ValidationPipe.validateBody(CreateEventValidationDto),
  async (req, res) => {
    await eventController.createEvent(req, res);
  },
);

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SCHEDULED, CANCELLED, COMPLETED]
 *         description: Status of the event
 *       - in: query
 *         name: startDateTime
 *         schema:
 *           type: string
 *         description: Start date of the event
 *       - in: query
 *         name: endDateTime
 *         schema:
 *           type: string
 *         description: End date of the event
 *       - in: query
 *         name: createdBy
 *         schema:
 *           type: string
 *         description: Created by of the event
 *     responses:
 *       200:
 *         description: List of events retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  ValidationPipe.validateQuery(EventQueryDto),
  async (req, res) => {
    await eventController.getAllEvents(req, res);
  },
);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get an event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event retrieved successfully
 *       404:
 *         description: Event not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', async (req, res) => {
  await eventController.getEventById(req, res);
});

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update an event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startDateTime:
 *                 type: string
 *                 format: date-time
 *               endDateTime:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: object
 *                 required:
 *                   - type
 *                   - name
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [PHYSICAL, VIRTUAL]
 *                   address:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   country:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   coordinates:
 *                     type: object
 *                     properties:
 *                       latitude:
 *                         type: number
 *                       longitude:
 *                         type: number
 *                   meetingUrl:
 *                     type: string
 *                   meetingId:
 *                     type: string
 *                   meetingPassword:
 *                     type: string
 *                   platform:
 *                     type: string
 *               attendees:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: objectId
 *               status:
 *                 type: string
 *                 enum: [SCHEDULED, CANCELLED, COMPLETED]
 *
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       404:
 *         description: Event not found
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 */
router.put(
  '/:id',
  ValidationPipe.validateBody(UpdateEventValidationDto),
  async (req, res) => {
    await eventController.updateEvent(req, res);
  },
);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete an event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       404:
 *         description: Event not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', async (req, res) => {
  await eventController.deleteEvent(req, res);
});

export default router;
