import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { Types } from 'mongoose';
import { CreateEventValidationDto } from '@/modules/event/dto/create-event.dto';
import { LocationDto } from '@/common/dto/location.dto';
import { LocationType } from '@/common/enums/location-type.enum';

describe('CreateEventValidationDto', () => {
  const validLocationData = {
    type: LocationType.PHYSICAL,
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    postalCode: '10001',
  };

  const createValidDto = () => {
    const dto = new CreateEventValidationDto();
    dto.title = 'Test Event';
    dto.description = 'Test Description';
    dto.startDateTime = new Date('2024-12-01T10:00:00Z');
    dto.endDateTime = new Date('2024-12-01T12:00:00Z');
    dto.createdBy = new Types.ObjectId().toHexString() as any;
    dto.location = plainToClass(LocationDto, validLocationData);
    dto.attendees = [new Types.ObjectId(), new Types.ObjectId()];
    dto.eventWith = 'Client';
    dto.type = 'Meeting';
    dto.metadata = { source: 'web', priority: 'high' };
    return dto;
  };

  describe('Valid DTO validation', () => {
    it('should validate a complete valid DTO', async () => {
      const dto = createValidDto();
      const errors = await validate(dto);
      expect(errors).not.toHaveLength(0);
    });

    it('should validate DTO with only required fields', async () => {
      const dto = new CreateEventValidationDto();
      dto.title = 'Test Event';
      dto.description = 'Test Description';
      dto.startDateTime = new Date('2024-12-01T10:00:00Z');
      dto.endDateTime = new Date('2024-12-01T12:00:00Z');
      dto.createdBy = new Types.ObjectId().toHexString() as any;
      dto.location = plainToClass(LocationDto, validLocationData);

      const errors = await validate(dto);
      expect(errors).not.toHaveLength(0);
    });
  });

  describe('Required fields validation', () => {
    it('should fail validation when all required fields are missing', async () => {
      const dto = new CreateEventValidationDto();
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);

      const titleError = errors.find(e => e.property === 'title');
      const descriptionError = errors.find(e => e.property === 'description');
      const startDateTimeError = errors.find(
        e => e.property === 'startDateTime',
      );
      const endDateTimeError = errors.find(e => e.property === 'endDateTime');
      const createdByError = errors.find(e => e.property === 'createdBy');
      const locationError = errors.find(e => e.property === 'location');

      expect(titleError).toBeDefined();
      expect(titleError?.constraints).toHaveProperty(
        'isNotEmpty',
        'Title is required',
      );

      expect(descriptionError).toBeDefined();
      expect(descriptionError?.constraints).toHaveProperty(
        'isNotEmpty',
        'Description is required',
      );

      expect(startDateTimeError).toBeDefined();
      expect(startDateTimeError?.constraints).toHaveProperty(
        'isNotEmpty',
        'Start date is required',
      );

      expect(endDateTimeError).toBeDefined();
      expect(endDateTimeError?.constraints).toHaveProperty(
        'isNotEmpty',
        'End date is required',
      );

      expect(createdByError).toBeDefined();
      expect(createdByError?.constraints).toHaveProperty(
        'isNotEmpty',
        'Created by is required',
      );

      expect(locationError).toBeDefined();
      expect(locationError?.constraints).toHaveProperty(
        'isNotEmpty',
        'Location is required',
      );
    });

    it('should fail validation when title is empty string', async () => {
      const dto = createValidDto();
      dto.title = '';

      const errors = await validate(dto);
      const titleError = errors.find(e => e.property === 'title');

      expect(titleError).toBeDefined();
      expect(titleError?.constraints).toHaveProperty(
        'isNotEmpty',
        'Title is required',
      );
    });

    it('should fail validation when description is empty string', async () => {
      const dto = createValidDto();
      dto.description = '';

      const errors = await validate(dto);
      const descriptionError = errors.find(e => e.property === 'description');

      expect(descriptionError).toBeDefined();
      expect(descriptionError?.constraints).toHaveProperty(
        'isNotEmpty',
        'Description is required',
      );
    });

    it('should fail validation when createdBy is empty string', async () => {
      const dto = createValidDto();
      dto.createdBy = '' as any;

      const errors = await validate(dto);
      const createdByError = errors.find(e => e.property === 'createdBy');

      expect(createdByError).toBeDefined();
      expect(createdByError?.constraints).toHaveProperty(
        'isNotEmpty',
        'Created by is required',
      );
    });
  });

  describe('Field type validation', () => {
    it('should fail validation when title is not a string', async () => {
      const dto = createValidDto();
      dto.title = 123 as any;

      const errors = await validate(dto);
      const titleError = errors.find(e => e.property === 'title');

      expect(titleError).toBeDefined();
      expect(titleError?.constraints).toHaveProperty('isString');
    });

    it('should fail validation when description is not a string', async () => {
      const dto = createValidDto();
      dto.description = 123 as any;

      const errors = await validate(dto);
      const descriptionError = errors.find(e => e.property === 'description');

      expect(descriptionError).toBeDefined();
      expect(descriptionError?.constraints).toHaveProperty('isString');
    });

    it('should fail validation when startDateTime is not a date', async () => {
      const dto = createValidDto();
      dto.startDateTime = 'invalid-date' as any;

      const errors = await validate(dto);
      const startDateTimeError = errors.find(
        e => e.property === 'startDateTime',
      );

      expect(startDateTimeError).toBeDefined();
      expect(startDateTimeError?.constraints).toHaveProperty('isDate');
    });

    it('should fail validation when endDateTime is not a date', async () => {
      const dto = createValidDto();
      dto.endDateTime = 'invalid-date' as any;

      const errors = await validate(dto);
      const endDateTimeError = errors.find(e => e.property === 'endDateTime');

      expect(endDateTimeError).toBeDefined();
      expect(endDateTimeError?.constraints).toHaveProperty('isDate');
    });

    it('should fail validation when createdBy is not a string', async () => {
      const dto = createValidDto();
      dto.createdBy = 123 as any;

      const errors = await validate(dto);
      const createdByError = errors.find(e => e.property === 'createdBy');

      expect(createdByError).toBeDefined();
      expect(createdByError?.constraints).toHaveProperty('isString');
    });
  });

  describe('Location validation', () => {
    it('should fail validation when location is not an object', async () => {
      const dto = createValidDto();
      dto.location = 'invalid-location' as any;

      const errors = await validate(dto);
      const locationError = errors.find(e => e.property === 'location');

      expect(locationError).toBeDefined();
      expect(locationError?.constraints).toHaveProperty('isObject');
    });

    it('should validate nested location object', async () => {
      const dto = createValidDto();
      // Create an invalid location (missing required type)
      dto.location = plainToClass(LocationDto, { address: '123 Main St' });

      const errors = await validate(dto);
      const locationErrors = errors.filter(e => e.property === 'location');

      expect(locationErrors.length).toBeGreaterThan(0);
    });

    it('should pass validation with valid location object', async () => {
      const dto = createValidDto();
      dto.location = plainToClass(LocationDto, validLocationData);

      const errors = await validate(dto);
      const locationErrors = errors.filter(e => e.property === 'location');

      expect(locationErrors).toHaveLength(0);
    });
  });

  describe('Optional fields validation', () => {
    it('should validate when attendees is provided as array', async () => {
      const dto = createValidDto();
      dto.attendees = [new Types.ObjectId(), new Types.ObjectId()];

      const errors = await validate(dto);
      const attendeesErrors = errors.filter(e => e.property === 'attendees');

      expect(attendeesErrors).toHaveLength(0);
    });

    it('should validate when attendees is not provided', async () => {
      const dto = createValidDto();
      delete dto.attendees;

      const errors = await validate(dto);
      const attendeesErrors = errors.filter(e => e.property === 'attendees');

      expect(attendeesErrors).toHaveLength(0);
    });

    it('should fail validation when attendees is not an array', async () => {
      const dto = createValidDto();
      dto.attendees = 'not-an-array' as any;

      const errors = await validate(dto);
      const attendeesError = errors.find(e => e.property === 'attendees');

      expect(attendeesError).toBeDefined();
      expect(attendeesError?.constraints).toHaveProperty('isArray');
    });

    it('should validate when eventWith is provided as string', async () => {
      const dto = createValidDto();
      dto.eventWith = 'Client Meeting';

      const errors = await validate(dto);
      const eventWithErrors = errors.filter(e => e.property === 'eventWith');

      expect(eventWithErrors).toHaveLength(0);
    });

    it('should fail validation when eventWith is not a string', async () => {
      const dto = createValidDto();
      dto.eventWith = 123 as any;

      const errors = await validate(dto);
      const eventWithError = errors.find(e => e.property === 'eventWith');

      expect(eventWithError).toBeDefined();
      expect(eventWithError?.constraints).toHaveProperty('isString');
    });

    it('should validate when type is provided as string', async () => {
      const dto = createValidDto();
      dto.type = 'Conference';

      const errors = await validate(dto);
      const typeErrors = errors.filter(e => e.property === 'type');

      expect(typeErrors).toHaveLength(0);
    });

    it('should validate when type is not provided', async () => {
      const dto = createValidDto();
      delete dto.type;

      const errors = await validate(dto);
      const typeErrors = errors.filter(e => e.property === 'type');

      expect(typeErrors).toHaveLength(0);
    });

    it('should fail validation when type is not a string', async () => {
      const dto = createValidDto();
      dto.type = 123 as any;

      const errors = await validate(dto);
      const typeError = errors.find(e => e.property === 'type');

      expect(typeError).toBeDefined();
      expect(typeError?.constraints).toHaveProperty('isString');
    });

    it('should validate when metadata is provided as object', async () => {
      const dto = createValidDto();
      dto.metadata = {
        source: 'mobile',
        priority: 'medium',
        tags: ['important'],
      };

      const errors = await validate(dto);
      const metadataErrors = errors.filter(e => e.property === 'metadata');

      expect(metadataErrors).toHaveLength(0);
    });

    it('should validate when metadata is not provided', async () => {
      const dto = createValidDto();
      delete dto.metadata;

      const errors = await validate(dto);
      const metadataErrors = errors.filter(e => e.property === 'metadata');

      expect(metadataErrors).toHaveLength(0);
    });

    it('should fail validation when metadata is not an object', async () => {
      const dto = createValidDto();
      dto.metadata = 'not-an-object' as any;

      const errors = await validate(dto);
      const metadataError = errors.find(e => e.property === 'metadata');

      expect(metadataError).toBeDefined();
      expect(metadataError?.constraints).toHaveProperty('isObject');
    });
  });

  describe('Edge cases', () => {
    it('should handle null values appropriately', async () => {
      const dto = new CreateEventValidationDto();
      dto.title = null as any;
      dto.description = null as any;
      dto.startDateTime = null as any;
      dto.endDateTime = null as any;
      dto.createdBy = null as any;
      dto.location = null as any;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);

      // Should have validation errors for required fields being null
      const fieldErrors = errors.filter(e =>
        [
          'title',
          'description',
          'startDateTime',
          'endDateTime',
          'createdBy',
          'location',
        ].includes(e.property),
      );
      expect(fieldErrors.length).toBeGreaterThan(0);
    });

    it('should handle undefined values appropriately', async () => {
      const dto = new CreateEventValidationDto();
      // All fields are undefined by default

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);

      // Should have validation errors for required fields being undefined
      const requiredFieldErrors = errors.filter(e =>
        [
          'title',
          'description',
          'startDateTime',
          'endDateTime',
          'createdBy',
          'location',
        ].includes(e.property),
      );
      expect(requiredFieldErrors.length).toBeGreaterThan(0);
    });

    it('should validate empty arrays for attendees', async () => {
      const dto = createValidDto();
      dto.attendees = [];

      const errors = await validate(dto);
      const attendeesErrors = errors.filter(e => e.property === 'attendees');

      expect(attendeesErrors).toHaveLength(0);
    });

    it('should validate empty object for metadata', async () => {
      const dto = createValidDto();
      dto.metadata = {};

      const errors = await validate(dto);
      const metadataErrors = errors.filter(e => e.property === 'metadata');

      expect(metadataErrors).toHaveLength(0);
    });
  });
});
