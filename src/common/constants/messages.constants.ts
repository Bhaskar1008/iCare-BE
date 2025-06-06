export const MESSAGES = {
  LEAD: {
    CREATE: {
      SUCCESS: 'Lead created successfully.',
      FAILURE: 'Lead creation failed.',
      VALIDATION: {
        INVALID_PRODUCT: 'Invalid product ID provided.',
        INVALID_USER: 'Invalid user ID provided.',
        MISSING_FIELDS: (fields: string[]) => `Missing required fields: ${fields.join(', ')}.`,
        INVALID_EMAIL: 'Invalid email address format.',
        INVALID_PHONE: 'Invalid phone number format.',
        INVALID_STATUS: 'Invalid lead status configuration.',
        INVALID_PROGRESS: 'Invalid lead progress for this product.',
        INVALID_DISPOSITION: 'Invalid lead disposition for this progress.',
        INVALID_SUB_DISPOSITION: 'Invalid lead sub-disposition for this disposition.'
      }
    },
    UPDATE: {
      SUCCESS: 'Lead updated successfully.',
      FAILURE: 'Lead update failed.',
      NOT_FOUND: 'Lead not found.',
      VALIDATION: {
        INVALID_STATUS_TRANSITION: 'Invalid lead status transition.',
        APPOINTMENT_FUTURE: 'Appointment date must be in the future.',
        INVALID_TIME: 'Invalid time format. Use HH:MM (24-hour).'
      }
    },
    GET: {
      SUCCESS: 'Leads retrieved successfully.',
      FAILURE: 'Failed to retrieve leads.',
      NOT_FOUND: 'No leads found.',
      INVALID_QUERY: 'Invalid query parameters provided.'
    },
    OWNERSHIP: {
      SUCCESS: 'Lead ownership changed successfully.',
      FAILURE: 'Failed to change lead ownership.',
      VALIDATION: {
        NO_LEADS: 'No valid leads found for ownership change.',
        INVALID_OWNER: 'Invalid new owner ID provided.',
        INVALID_LEADS: 'One or more lead IDs are invalid.'
      }
    },
    STATUS: {
      SUCCESS: 'Lead status counts retrieved successfully.',
      FAILURE: 'Failed to retrieve lead status counts.'
    }
  },
  LEAD_CONFIG: {
    CREATE: {
      SUCCESS: 'Lead configuration created successfully.',
      FAILURE: 'Lead configuration creation failed.',
      DUPLICATE: 'Lead configuration already exists for this product.'
    },
    UPDATE: {
      SUCCESS: 'Lead configuration updated successfully.',
      FAILURE: 'Lead configuration update failed.',
      NOT_FOUND: 'Lead configuration not found.'
    },
    GET: {
      SUCCESS: 'Lead configuration retrieved successfully.',
      NOT_FOUND: 'Lead configuration not found for this product.'
    }
  },
  COMMON: {
    SUCCESS: 'Operation successful.',
    CREATED: 'Resource created successfully.',
    NOT_FOUND: 'Resource not found.',
    UNAUTHORIZED: 'Unauthorized access.',
    FORBIDDEN: 'Access forbidden.',
    SERVER_ERROR: 'Internal server error occurred.',
    INVALID_ID: 'Invalid ID format provided.',
    VALIDATION_ERROR: 'Validation error occurred.',
    CONFLICT: 'Resource already exists.'
  }
}; 