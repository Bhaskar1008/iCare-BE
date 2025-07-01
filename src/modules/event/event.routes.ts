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
 *     tags: [Events]
 *     summary: Create a new event
 *     description: Creates a new event with the provided data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - startDateTime
 *               - endDateTime
 *               - createdBy
 *               - location
 *               - eventWith
 *               - eventSubtype
 *             properties:
 *               title:
 *                 type: string
 *                 description: Event title
 *                 example: "Demo Meeting"
 *               description:
 *                 type: string
 *                 description: Event description
 *                 example: "Event Type: Training\nEvent With: event_003"
 *               startDateTime:
 *                 type: string
 *                 format: date-time
 *                 description: Event start date and time
 *                 example: "2025-06-20T04:30:00.000Z"
 *               endDateTime:
 *                 type: string
 *                 format: date-time
 *                 description: Event end date and time
 *                 example: "2025-06-20T05:30:00.000Z"
 *               status:
 *                 type: string
 *                 enum: [SCHEDULED, CANCELLED, COMPLETED]
 *                 description: Status of the event
 *                 example: "SCHEDULED"
 *               createdBy:
 *                 type: string
 *                 description: ID of the user creating the event
 *                 example: "68444d60fd3ca4b18e65c51d"
 *               location:
 *                 type: object
 *                 required:
 *                   - type
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [PHYSICAL, VIRTUAL]
 *                     example: "PHYSICAL"
 *                   address:
 *                     type: string
 *                     example: "No 12 Gandhi Nagar"
 *                   city:
 *                     type: string
 *                     example: "Mabini"
 *                   state:
 *                     type: string
 *                     example: "Batangas"
 *                   postalCode:
 *                     type: string
 *                     example: "600091"
 *                   country:
 *                     type: string
 *                     example: "Philippines"
 *               attendees:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of attendee IDs
 *                 example: ["684a6549aa6b6dad66b0e563", "684fff0e3219ee93806c9ff9"]
 *               eventWith:
 *                 type: string
 *                 description: Identifier or name of who the event is with
 *                 example: "event_003"
 *               eventSubtype:
 *                 type: string
 *                 description: Subtype of the event
 *                 example: "Follow-up"
 *               type:
 *                 type: string
 *                 description: Type of the event
 *                 example: "Training"
 *               metadata:
 *                 type: object
 *                 description: Additional event metadata
 *                 example: {}
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Event created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         description: Bad request - validation error
 *       500:
 *         description: Internal server error
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
 *       - in: query
 *         name: eventWith
 *         schema:
 *           type: string
 *         description: Event with category (e.g., meeting, call)
 *       - in: query
 *         name: eventSubtype
 *         schema:
 *           type: string
 *         description: Subtype of the event (e.g., Follow-up, Initial)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Type of event (e.g., internal, external)
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
 *     tags: [Events]
 *     summary: Update an event
 *     description: Updates an existing event with the provided data
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
 *                 description: Event title
 *                 example: "Demo Meeting"
 *               description:
 *                 type: string
 *                 description: Event description
 *                 example: "Event Type: Training\nEvent With: event_003"
 *               startDateTime:
 *                 type: string
 *                 format: date-time
 *                 description: Event start date and time
 *                 example: "2025-06-20T04:30:00.000Z"
 *               endDateTime:
 *                 type: string
 *                 format: date-time
 *                 description: Event end date and time
 *                 example: "2025-06-20T05:30:00.000Z"
 *               location:
 *                 oneOf:
 *                   - type: string
 *                     description: Location ID
 *                     example: "685001938e1124ce538b5f8f"
 *                   - type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Location ID
 *                         example: "685001938e1124ce538b5f8f"
 *                       type:
 *                         type: string
 *                         enum: [PHYSICAL, VIRTUAL]
 *                         example: "PHYSICAL"
 *                       address:
 *                         type: string
 *                         example: "No 12 Gandhi Nagar"
 *                       city:
 *                         type: string
 *                         example: "Mabini"
 *                       state:
 *                         type: string
 *                         example: "Batangas"
 *                       postalCode:
 *                         type: string
 *                         example: "600091"
 *                       country:
 *                         type: string
 *                         example: "Philippines"
 *               attendees:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of attendee IDs
 *                 example: ["684a6549aa6b6dad66b0e563", "684fff0e3219ee93806c9ff9"]
 *               status:
 *                 type: string
 *                 enum: [SCHEDULED, CANCELLED, COMPLETED]
 *                 description: Event status
 *                 example: "SCHEDULED"
 *               eventWith:
 *                 type: string
 *                 description: Identifier or name of who the event is with
 *                 example: "event_003"
 *               eventSubtype:
 *                 type: string
 *                 description: Subtype of the event
 *                 example: "Follow-up"
 *               type:
 *                 type: string
 *                 description: Type of the event
 *                 example: "Training"
 *               metadata:
 *                 type: object
 *                 description: Additional event metadata
 *                 example: {}
 *     responses:
 *       200:
 *         description: Event updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Event updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         description: Bad request - validation error or invalid event ID
 *       404:
 *         description: Event not found
 *       500:
 *         description: Internal server error
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
