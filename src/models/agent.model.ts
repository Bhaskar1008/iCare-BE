import type { Types } from 'mongoose';
import { Schema, model } from 'mongoose';
import { VALIDATION } from '@/common/constants/http-status.constants';
import type { IBaseModel } from '@/models/base.model';
import type { IChannel } from '@/models/channel.model';
import type { IDesignation } from '@/models/designation.model';
import type { IUser } from '@/models/user.model';
import type { IProject } from '@/models/project.model';

const MAX_SKILLS_LENGTH = 50;
const MAX_LANGUAGES_LENGTH = 30;
const MAX_ACHIEVEMENTS_LENGTH = 200;
const MAX_EMERGENCY_CONTACT_NAME_LENGTH = 100;
const MAX_RELATIONSHIP_LENGTH = 50;
const MAX_STREET_LENGTH = 200;
const MAX_CITY_LENGTH = 100;
const MAX_STATE_LENGTH = 100;
const MAX_POSTAL_CODE_LENGTH = 20;
const MAX_COUNTRY_LENGTH = 100;
const MAX_ACCOUNT_HOLDER_NAME_LENGTH = 100;
const MAX_ACCOUNT_NUMBER_LENGTH = 34;
const MAX_BANK_NAME_LENGTH = 100;
const MAX_BRANCH_NAME_LENGTH = 100;
const MAX_NOTES_LENGTH = 500;
const MAX_REJECTION_REASON_LENGTH = 500;
const MAX_FILE_SIZE = 5242880;
const MAX_EXAM_SCORE = 100;
const MAX_COMMISSION_PERCENTAGE = 100;
const MIN_PERFORMANCE_RATING = 1;
const MAX_PERFORMANCE_RATING = 5;
const MAX_TITLE_LENGTH = 20;
const MAX_SUFFIX_LENGTH = 20;
const MAX_NATIONALITY_LENGTH = 100;
const MAX_STATE_CODE_LENGTH = 20;
const MAX_COUNTRY_CODE_LENGTH = 10;
const MAX_FORMATTED_ADDRESS_LENGTH = 500;

const PHONE_NUMBER_REGEX = /^(\+\d{1,3}[- ]?)?\d{5,15}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const URL_REGEX = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|pdf)$/i;

const DOCUMENT_STATUSES = [
  'pending',
  'in_progress',
  'under_review',
  'submitted',
  'approved',
  'rejected',
  'qcRejected',
  'expired',
] as const;

const AGENT_STATUSES = ['active', 'inactive', 'suspended'] as const;
const DOCUMENT_CATEGORIES = [
  'certification',
  'identity',
  'financial',
  'training',
  'compliance',
  'education',
  'medical',
  'visa',
  'license',
  'other',
] as const;

const SUPPORTED_FILE_TYPES = [
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'doc',
  'docx',
] as const;

const TITLE_TYPES = [
  'Mr',
  'Mrs',
  'Ms',
  'Miss',
  'Dr',
  'Prof',
  'Sir',
  'Lady',
  'Lord',
  'Mx',
  'Other',
] as const;

const GENDER_TYPES = ['male', 'female', 'other', 'prefer_not_to_say'] as const;

interface ICertificationDocument {
  certificationId: string;
  certificationType: string;
  status: (typeof DOCUMENT_STATUSES)[number];
  certificateNumber?: string;
  issuedDate?: Date;
  expiryDate?: Date;
  issuingAuthority?: string;
  country: string;
  region?: string;
  notes?: string;
  verificationUrl?: string;
  verificationCode?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  lastVerifiedDate?: Date;
  requiresRenewal?: boolean;
  renewalReminderSent?: boolean;
  renewalReminderDate?: Date;
}

interface IAgentDocument {
  documentId: string;
  documentType: string;
  documentCategory: (typeof DOCUMENT_CATEGORIES)[number];
  certificationId?: string;
  fileName: string;
  originalFileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: (typeof SUPPORTED_FILE_TYPES)[number];
  uploadedAt: Date;
  status: (typeof DOCUMENT_STATUSES)[number];
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
  expiryDate?: Date;
  isRequired: boolean;
  country: string;
  region?: string;
  isVerified?: boolean;
  verificationMethod?: 'manual' | 'automated' | 'third_party';
  verifiedBy?: string;
  verifiedAt?: Date;
  verificationNotes?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  metadata?: {
    amount?: number;
    examScore?: number;
    issueDate?: Date;
    validUntil?: Date;
    documentNumber?: string;
    issuingAuthority?: string;
    documentDescription?: string;
    additionalInfo?: Record<string, unknown>;
  };
}

interface IAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressLine2?: string;
  landmark?: string;
  isPrimary?: boolean;
  addressType?: 'home' | 'work' | 'permanent' | 'temporary' | 'other';
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  region?: string;
  province?: string;
  district?: string;
  county?: string;
  stateCode?: string;
  countryCode?: string;
  formattedAddress?: string;
}

interface IBankDetails {
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  ifscCode?: string;
  swiftCode?: string;
  ibanNumber?: string;
  routingNumber?: string;
  branchName: string;
  branchCode?: string;
  accountType?: 'savings' | 'checking' | 'current' | 'salary' | 'other';
  currency?: string;
  isPrimary?: boolean;
}

interface IEmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
  address?: Partial<IAddress>;
  isNotified?: boolean;
  lastNotifiedAt?: Date;
}

interface IOnboardingStatus {
  status: 'not_started' | 'in_progress' | 'completed' | 'rejected';
  currentStep?: number;
  totalSteps?: number;
  startDate?: Date;
  completionDate?: Date;
  lastUpdatedDate?: Date;
  requiredDocumentsSubmitted?: boolean;
  requiredTrainingsCompleted?: boolean;
  rejectionReason?: string;
  checklist?: {
    personalInfoSubmitted?: boolean;
    addressVerified?: boolean;
    bankDetailsSubmitted?: boolean;
    contractSigned?: boolean;
    backgroundCheckCompleted?: boolean;
    taxDocumentsSubmitted?: boolean;
    identityVerified?: boolean;
    trainingAssigned?: boolean;
    equipmentAssigned?: boolean;
    systemAccessGranted?: boolean;
    orientationCompleted?: boolean;
  };
  assignedTo?: string;
  notes?: string;
}

export interface IAgent extends IBaseModel {
  userId: Types.ObjectId | IUser;
  channelId: Types.ObjectId | IChannel;
  designationId: Types.ObjectId | IDesignation;
  projectId?: Types.ObjectId | IProject;
  agentCode: string;
  employeeId?: string;
  title?: (typeof TITLE_TYPES)[number];
  firstName?: string;
  middleName?: string;
  lastName?: string;
  suffix?: string;
  displayName?: string;
  gender?: (typeof GENDER_TYPES)[number];
  dateOfBirth?: Date;
  nationality?: string;
  nationalId?: string;
  taxId?: string;
  phoneNumber?: string;
  email?: string;
  alternatePhoneNumber?: string;
  alternateEmail?: string;
  preferredLanguage?: string;
  agentStatus: (typeof AGENT_STATUSES)[number];
  agentType?: 'full_time' | 'part_time' | 'contract' | 'freelance' | 'intern';
  joiningDate?: Date;
  resignationDate?: Date;
  onboarding?: IOnboardingStatus;
  targetAmount?: number;
  commissionPercentage?: number;
  commissionStructure?: {
    base?: number;
    tier1Threshold?: number;
    tier1Rate?: number;
    tier2Threshold?: number;
    tier2Rate?: number;
    tier3Threshold?: number;
    tier3Rate?: number;
  };
  isTeamLead: boolean;
  teamLeadId?: Types.ObjectId | IAgent;
  reportingManagerId?: Types.ObjectId | IAgent;
  bio?: string;
  skills?: string[];
  languages?: string[];
  achievements?: string[];
  performanceRating?: number;
  lastActiveAt?: Date;
  profilePictureUrl?: string;
  salaryDetails?: {
    baseSalary?: number;
    currency?: string;
    effectiveDate?: Date;
    payFrequency?: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly';
    bonusEligible?: boolean;
    taxDeductions?: number;
  };
  workSchedule?: {
    workDays?: (
      | 'monday'
      | 'tuesday'
      | 'wednesday'
      | 'thursday'
      | 'friday'
      | 'saturday'
      | 'sunday'
    )[];
    shiftStart?: string;
    shiftEnd?: string;
    timeZone?: string;
    hoursPerWeek?: number;
    isFlexible?: boolean;
  };
  emergencyContact?: IEmergencyContact;
  addresses?: IAddress[];
  address?: IAddress;
  bankDetails?: IBankDetails;
  educationDetails?: {
    degree?: string;
    institution?: string;
    yearCompleted?: number;
    fieldOfStudy?: string;
    grade?: string;
  }[];
  previousEmployment?: {
    company?: string;
    position?: string;
    startDate?: Date;
    endDate?: Date;
    responsibilities?: string;
    referenceName?: string;
    referenceContact?: string;
  }[];
  certifications?: ICertificationDocument[];
  documents?: IAgentDocument[];
  trainingStatus?: {
    programName?: string;
    status?: 'not_started' | 'in_progress' | 'completed' | 'failed';
    startDate?: Date;
    completionDate?: Date;
    score?: number;
    certificate?: string;
  }[];
  tags?: string[];
  notes?: string;
  otp?: string;
}

const agentSchema = new Schema<IAgent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    channelId: {
      type: Schema.Types.ObjectId,
      ref: 'Channel',
      required: [true, 'Channel ID is required'],
    },
    designationId: {
      type: Schema.Types.ObjectId,
      ref: 'Designation',
      required: [true, 'Designation ID is required'],
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
    agentCode: {
      type: String,
      required: [true, 'Agent code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [
        VALIDATION.MAX_CODE_LENGTH,
        `Agent code cannot exceed ${VALIDATION.MAX_CODE_LENGTH} characters`,
      ],
      match: [
        /^[A-Z0-9_]+$/,
        'Agent code can only contain uppercase letters, numbers, and underscores',
      ],
    },
    employeeId: {
      type: String,
      trim: true,
      maxlength: [
        VALIDATION.MAX_CODE_LENGTH,
        `Employee ID cannot exceed ${VALIDATION.MAX_CODE_LENGTH} characters`,
      ],
      sparse: true,
    },
    title: {
      type: String,
      trim: true,
      enum: {
        values: TITLE_TYPES,
        message: 'Title must be one of the supported title types',
      },
      maxlength: [
        MAX_TITLE_LENGTH,
        `Title cannot exceed ${MAX_TITLE_LENGTH} characters`,
      ],
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: [
        VALIDATION.MAX_NAME_LENGTH,
        `First name cannot exceed ${VALIDATION.MAX_NAME_LENGTH} characters`,
      ],
    },
    middleName: {
      type: String,
      trim: true,
      maxlength: [
        VALIDATION.MAX_NAME_LENGTH,
        `Middle name cannot exceed ${VALIDATION.MAX_NAME_LENGTH} characters`,
      ],
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [
        VALIDATION.MAX_NAME_LENGTH,
        `Last name cannot exceed ${VALIDATION.MAX_NAME_LENGTH} characters`,
      ],
    },
    suffix: {
      type: String,
      trim: true,
      maxlength: [
        MAX_SUFFIX_LENGTH,
        `Suffix cannot exceed ${MAX_SUFFIX_LENGTH} characters`,
      ],
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: [
        VALIDATION.MAX_NAME_LENGTH * 2,
        `Display name cannot exceed ${VALIDATION.MAX_NAME_LENGTH * 2} characters`,
      ],
    },
    gender: {
      type: String,
      enum: {
        values: GENDER_TYPES,
        message:
          'Gender must be one of: male, female, other, prefer_not_to_say',
      },
    },
    dateOfBirth: {
      type: Date,
    },
    nationality: {
      type: String,
      trim: true,
      maxlength: [
        MAX_NATIONALITY_LENGTH,
        `Nationality cannot exceed ${MAX_NATIONALITY_LENGTH} characters`,
      ],
    },
    nationalId: {
      type: String,
      trim: true,
      sparse: true,
    },
    taxId: {
      type: String,
      trim: true,
      sparse: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [
        /^[09]\d{10}$/,
        'Phone number must be 11 digits and start with 0 or 9',
      ],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please enter a valid email address',
      ],
      index: true,
    },
    alternatePhoneNumber: {
      type: String,
      trim: true,
      match: [PHONE_NUMBER_REGEX, 'Please enter a valid phone number'],
    },
    alternateEmail: {
      type: String,
      trim: true,
      match: [EMAIL_REGEX, 'Please enter a valid alternate email'],
    },
    preferredLanguage: {
      type: String,
      trim: true,
      maxlength: [
        MAX_LANGUAGES_LENGTH,
        `Preferred language cannot exceed ${MAX_LANGUAGES_LENGTH} characters`,
      ],
    },
    agentStatus: {
      type: String,
      required: [true, 'Agent status is required'],
      enum: {
        values: AGENT_STATUSES,
        message: 'Status must be one of: active, inactive, suspended',
      },
      default: 'active',
    },
    agentType: {
      type: String,
      enum: {
        values: ['full_time', 'part_time', 'contract', 'freelance', 'intern'],
        message:
          'Agent type must be one of: full_time, part_time, contract, freelance, intern',
      },
    },
    joiningDate: {
      type: Date,
    },
    resignationDate: {
      type: Date,
      validate: {
        validator(this: IAgent, value: Date) {
          return !value || !this.joiningDate || value > this.joiningDate;
        },
        message: 'Resignation date must be after joining date',
      },
    },
    onboarding: {
      status: {
        type: String,
        enum: {
          values: [
            'not_started',
            'in_progress',
            'completed',
            'rejected',
            'qcRejected',
          ],
          message:
            'Onboarding status must be one of: not_started, in_progress, completed, rejected',
        },
      },
      currentStep: {
        type: Number,
      },
      totalSteps: {
        type: Number,
      },
      startDate: {
        type: Date,
      },
      completionDate: {
        type: Date,
      },
      lastUpdatedDate: {
        type: Date,
      },
      requiredDocumentsSubmitted: {
        type: Boolean,
      },
      requiredTrainingsCompleted: {
        type: Boolean,
      },
      rejectionReason: {
        type: String,
        trim: true,
        maxlength: [
          MAX_REJECTION_REASON_LENGTH,
          'Rejection reason cannot exceed 500 characters',
        ],
      },
      checklist: {
        personalInfoSubmitted: {
          type: Boolean,
        },
        addressVerified: {
          type: Boolean,
        },
        bankDetailsSubmitted: {
          type: Boolean,
        },
        contractSigned: {
          type: Boolean,
        },
        backgroundCheckCompleted: {
          type: Boolean,
        },
        taxDocumentsSubmitted: {
          type: Boolean,
        },
        identityVerified: {
          type: Boolean,
        },
        trainingAssigned: {
          type: Boolean,
        },
        equipmentAssigned: {
          type: Boolean,
        },
        systemAccessGranted: {
          type: Boolean,
        },
        orientationCompleted: {
          type: Boolean,
        },
      },
      assignedTo: {
        type: String,
        trim: true,
      },
      notes: {
        type: String,
        trim: true,
        maxlength: [MAX_NOTES_LENGTH, 'Notes cannot exceed 500 characters'],
      },
    },
    targetAmount: {
      type: Number,
      min: [0, 'Target amount cannot be negative'],
      default: 0,
    },
    commissionPercentage: {
      type: Number,
      min: [0, 'Commission percentage cannot be negative'],
      max: [
        MAX_COMMISSION_PERCENTAGE,
        'Commission percentage cannot exceed 100',
      ],
      default: 0,
    },
    commissionStructure: {
      base: {
        type: Number,
      },
      tier1Threshold: {
        type: Number,
      },
      tier1Rate: {
        type: Number,
      },
      tier2Threshold: {
        type: Number,
      },
      tier2Rate: {
        type: Number,
      },
      tier3Threshold: {
        type: Number,
      },
      tier3Rate: {
        type: Number,
      },
    },
    isTeamLead: {
      type: Boolean,
      default: false,
    },
    teamLeadId: {
      type: Schema.Types.ObjectId,
      ref: 'Agent',
    },
    reportingManagerId: {
      type: Schema.Types.ObjectId,
      ref: 'Agent',
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [
        VALIDATION.MAX_DESCRIPTION_LENGTH,
        `Bio cannot exceed ${VALIDATION.MAX_DESCRIPTION_LENGTH} characters`,
      ],
    },
    skills: [
      {
        type: String,
        trim: true,
        maxlength: [
          MAX_SKILLS_LENGTH,
          'Skill name cannot exceed 50 characters',
        ],
      },
    ],
    languages: [
      {
        type: String,
        trim: true,
        maxlength: [
          MAX_LANGUAGES_LENGTH,
          'Language name cannot exceed 30 characters',
        ],
      },
    ],
    achievements: [
      {
        type: String,
        trim: true,
        maxlength: [
          MAX_ACHIEVEMENTS_LENGTH,
          'Achievement cannot exceed 200 characters',
        ],
      },
    ],
    performanceRating: {
      type: Number,
      min: [MIN_PERFORMANCE_RATING, 'Performance rating must be at least 1'],
      max: [MAX_PERFORMANCE_RATING, 'Performance rating cannot exceed 5'],
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    profilePictureUrl: {
      type: String,
      trim: true,
      match: [URL_REGEX, 'Please enter a valid image URL'],
    },
    salaryDetails: {
      baseSalary: {
        type: Number,
      },
      currency: {
        type: String,
      },
      effectiveDate: {
        type: Date,
      },
      payFrequency: {
        type: String,
        enum: {
          values: ['weekly', 'bi-weekly', 'monthly', 'quarterly'],
          message:
            'Pay frequency must be one of: weekly, bi-weekly, monthly, quarterly',
        },
      },
      bonusEligible: {
        type: Boolean,
      },
      taxDeductions: {
        type: Number,
      },
    },
    workSchedule: {
      workDays: [
        {
          type: String,
          enum: {
            values: [
              'monday',
              'tuesday',
              'wednesday',
              'thursday',
              'friday',
              'saturday',
              'sunday',
            ],
            message:
              'Work day must be one of: monday, tuesday, wednesday, thursday, friday, saturday, sunday',
          },
        },
      ],
      shiftStart: {
        type: String,
      },
      shiftEnd: {
        type: String,
      },
      timeZone: {
        type: String,
      },
      hoursPerWeek: {
        type: Number,
      },
      isFlexible: {
        type: Boolean,
      },
    },
    emergencyContact: {
      name: {
        type: String,
        trim: true,
        maxlength: [
          MAX_EMERGENCY_CONTACT_NAME_LENGTH,
          'Emergency contact name cannot exceed 100 characters',
        ],
      },
      relationship: {
        type: String,
        trim: true,
        maxlength: [
          MAX_RELATIONSHIP_LENGTH,
          'Relationship cannot exceed 50 characters',
        ],
      },
      phoneNumber: {
        type: String,
        trim: true,
        match: [
          PHONE_NUMBER_REGEX,
          'Please enter a valid emergency contact phone number',
        ],
      },
      email: {
        type: String,
        trim: true,
        match: [EMAIL_REGEX, 'Please enter a valid email'],
      },
      address: {
        street: {
          type: String,
          trim: true,
          maxlength: [
            MAX_STREET_LENGTH,
            'Street address cannot exceed 200 characters',
          ],
        },
        city: {
          type: String,
          trim: true,
          maxlength: [
            MAX_CITY_LENGTH,
            'City name cannot exceed 100 characters',
          ],
        },
        state: {
          type: String,
          trim: true,
          maxlength: [
            MAX_STATE_LENGTH,
            'State name cannot exceed 100 characters',
          ],
        },
        postalCode: {
          type: String,
          trim: true,
          maxlength: [
            MAX_POSTAL_CODE_LENGTH,
            'Postal code cannot exceed 20 characters',
          ],
        },
        country: {
          type: String,
          trim: true,
          maxlength: [
            MAX_COUNTRY_LENGTH,
            'Country name cannot exceed 100 characters',
          ],
          default: 'India',
        },
        addressLine2: {
          type: String,
          trim: true,
          maxlength: [
            MAX_STREET_LENGTH,
            'Address line 2 cannot exceed 200 characters',
          ],
        },
        landmark: {
          type: String,
          trim: true,
          maxlength: [
            MAX_STREET_LENGTH,
            'Landmark cannot exceed 200 characters',
          ],
        },
        isPrimary: {
          type: Boolean,
        },
        addressType: {
          type: String,
          enum: {
            values: ['home', 'work', 'permanent', 'temporary', 'other'],
            message:
              'Address type must be one of: home, work, permanent, temporary, other',
          },
        },
        coordinates: {
          latitude: {
            type: Number,
          },
          longitude: {
            type: Number,
          },
        },
        region: {
          type: String,
          trim: true,
          maxlength: [MAX_STATE_LENGTH, 'Region cannot exceed 100 characters'],
        },
        province: {
          type: String,
          trim: true,
          maxlength: [
            MAX_STATE_LENGTH,
            'Province cannot exceed 100 characters',
          ],
        },
        district: {
          type: String,
          trim: true,
          maxlength: [
            MAX_STATE_LENGTH,
            'District cannot exceed 100 characters',
          ],
        },
        county: {
          type: String,
          trim: true,
          maxlength: [MAX_STATE_LENGTH, 'County cannot exceed 100 characters'],
        },
        stateCode: {
          type: String,
          trim: true,
          maxlength: [
            MAX_STATE_CODE_LENGTH,
            'State code cannot exceed 20 characters',
          ],
        },
        countryCode: {
          type: String,
          trim: true,
          maxlength: [
            MAX_COUNTRY_CODE_LENGTH,
            'Country code cannot exceed 10 characters',
          ],
        },
        formattedAddress: {
          type: String,
          trim: true,
          maxlength: [
            MAX_FORMATTED_ADDRESS_LENGTH,
            'Formatted address cannot exceed 500 characters',
          ],
        },
      },
      isNotified: {
        type: Boolean,
      },
      lastNotifiedAt: {
        type: Date,
      },
    },
    addresses: [
      {
        street: {
          type: String,
          trim: true,
          maxlength: [
            MAX_STREET_LENGTH,
            'Street address cannot exceed 200 characters',
          ],
        },
        city: {
          type: String,
          trim: true,
          maxlength: [
            MAX_CITY_LENGTH,
            'City name cannot exceed 100 characters',
          ],
        },
        state: {
          type: String,
          trim: true,
          maxlength: [
            MAX_STATE_LENGTH,
            'State name cannot exceed 100 characters',
          ],
        },
        postalCode: {
          type: String,
          trim: true,
          maxlength: [
            MAX_POSTAL_CODE_LENGTH,
            'Postal code cannot exceed 20 characters',
          ],
        },
        country: {
          type: String,
          trim: true,
          maxlength: [
            MAX_COUNTRY_LENGTH,
            'Country name cannot exceed 100 characters',
          ],
          default: 'India',
        },
        addressLine2: {
          type: String,
          trim: true,
          maxlength: [
            MAX_STREET_LENGTH,
            'Address line 2 cannot exceed 200 characters',
          ],
        },
        landmark: {
          type: String,
          trim: true,
          maxlength: [
            MAX_STREET_LENGTH,
            'Landmark cannot exceed 200 characters',
          ],
        },
        isPrimary: {
          type: Boolean,
        },
        addressType: {
          type: String,
          enum: {
            values: ['home', 'work', 'permanent', 'temporary', 'other'],
            message:
              'Address type must be one of: home, work, permanent, temporary, other',
          },
        },
        coordinates: {
          latitude: {
            type: Number,
          },
          longitude: {
            type: Number,
          },
        },
        region: {
          type: String,
          trim: true,
          maxlength: [MAX_STATE_LENGTH, 'Region cannot exceed 100 characters'],
        },
        province: {
          type: String,
          trim: true,
          maxlength: [
            MAX_STATE_LENGTH,
            'Province cannot exceed 100 characters',
          ],
        },
        district: {
          type: String,
          trim: true,
          maxlength: [
            MAX_STATE_LENGTH,
            'District cannot exceed 100 characters',
          ],
        },
        county: {
          type: String,
          trim: true,
          maxlength: [MAX_STATE_LENGTH, 'County cannot exceed 100 characters'],
        },
        stateCode: {
          type: String,
          trim: true,
          maxlength: [
            MAX_STATE_CODE_LENGTH,
            'State code cannot exceed 20 characters',
          ],
        },
        countryCode: {
          type: String,
          trim: true,
          maxlength: [
            MAX_COUNTRY_CODE_LENGTH,
            'Country code cannot exceed 10 characters',
          ],
        },
        formattedAddress: {
          type: String,
          trim: true,
          maxlength: [
            MAX_FORMATTED_ADDRESS_LENGTH,
            'Formatted address cannot exceed 500 characters',
          ],
        },
      },
    ],
    bankDetails: {
      accountHolderName: {
        type: String,
        trim: true,
        maxlength: [
          MAX_ACCOUNT_HOLDER_NAME_LENGTH,
          'Account holder name cannot exceed 100 characters',
        ],
      },
      accountNumber: {
        type: String,
        trim: true,
        maxlength: [
          MAX_ACCOUNT_NUMBER_LENGTH,
          'Account number cannot exceed 34 characters',
        ],
      },
      bankName: {
        type: String,
        trim: true,
        maxlength: [
          MAX_BANK_NAME_LENGTH,
          'Bank name cannot exceed 100 characters',
        ],
      },
      ifscCode: {
        type: String,
        trim: true,
        uppercase: true,
        match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Please enter a valid IFSC code'],
      },
      swiftCode: {
        type: String,
        trim: true,
      },
      ibanNumber: {
        type: String,
        trim: true,
      },
      routingNumber: {
        type: String,
        trim: true,
      },
      branchName: {
        type: String,
        trim: true,
        maxlength: [
          MAX_BRANCH_NAME_LENGTH,
          'Branch name cannot exceed 100 characters',
        ],
      },
      branchCode: {
        type: String,
        trim: true,
      },
      accountType: {
        type: String,
        enum: {
          values: ['savings', 'checking', 'current', 'salary', 'other'],
          message:
            'Account type must be one of: savings, checking, current, salary, other',
        },
      },
      currency: {
        type: String,
      },
      isPrimary: {
        type: Boolean,
      },
    },
    educationDetails: [
      {
        degree: {
          type: String,
          trim: true,
        },
        institution: {
          type: String,
          trim: true,
        },
        yearCompleted: {
          type: Number,
        },
        fieldOfStudy: {
          type: String,
          trim: true,
        },
        grade: {
          type: String,
          trim: true,
        },
      },
    ],
    previousEmployment: [
      {
        company: {
          type: String,
          trim: true,
        },
        position: {
          type: String,
          trim: true,
        },
        startDate: {
          type: Date,
        },
        endDate: {
          type: Date,
        },
        responsibilities: {
          type: String,
          trim: true,
        },
        referenceName: {
          type: String,
          trim: true,
        },
        referenceContact: {
          type: String,
          trim: true,
        },
      },
    ],
    certifications: [
      {
        certificationId: {
          type: String,
          required: [true, 'Certification ID is required'],
          trim: true,
        },
        certificationType: {
          type: String,
          required: [true, 'Certification type is required'],
          trim: true,
        },
        status: {
          type: String,
          required: [true, 'Certification status is required'],
          enum: {
            values: DOCUMENT_STATUSES,
            message:
              'Status must be one of: pending, in_progress, under_review, submitted, approved, rejected, expired',
          },
          default: 'pending',
        },
        certificateNumber: {
          type: String,
          trim: true,
          uppercase: true,
          sparse: true,
        },
        issuedDate: {
          type: Date,
        },
        expiryDate: {
          type: Date,
        },
        issuingAuthority: {
          type: String,
          trim: true,
        },
        country: {
          type: String,
          required: [true, 'Country is required'],
          trim: true,
        },
        region: {
          type: String,
          trim: true,
        },
        notes: {
          type: String,
          trim: true,
          maxlength: [MAX_NOTES_LENGTH, 'Notes cannot exceed 500 characters'],
        },
      },
    ],
    documents: [
      {
        documentId: {
          type: String,
          required: [true, 'Document ID is required'],
          trim: true,
        },
        documentType: {
          type: String,
          required: [true, 'Document type is required'],
          trim: true,
        },
        documentCategory: {
          type: String,
          required: [true, 'Document category is required'],
          enum: {
            values: DOCUMENT_CATEGORIES,
            message:
              'Category must be one of: certification, identity, financial, training, compliance, education, medical, visa, license, other',
          },
        },
        certificationId: {
          type: String,
          trim: true,
        },
        fileName: {
          type: String,
          required: [true, 'File name is required'],
          trim: true,
        },
        originalFileName: {
          type: String,
          required: [true, 'Original file name is required'],
          trim: true,
        },
        fileUrl: {
          type: String,
          required: [true, 'File URL is required'],
          trim: true,
        },
        fileSize: {
          type: Number,
          required: [true, 'File size is required'],
          min: [0, 'File size cannot be negative'],
          max: [MAX_FILE_SIZE, 'File size cannot exceed 5MB'],
        },
        fileType: {
          type: String,
          required: [true, 'File type is required'],
          lowercase: true,
          trim: true,
          enum: {
            values: SUPPORTED_FILE_TYPES,
            message:
              'File type must be one of: pdf, jpg, jpeg, png, gif, webp, doc, docx',
          },
        },
        uploadedAt: {
          type: Date,
          required: [true, 'Upload date is required'],
          default: Date.now,
        },
        status: {
          type: String,
          required: [true, 'Document status is required'],
          enum: {
            values: DOCUMENT_STATUSES,
            message:
              'Status must be one of: pending, in_progress, under_review, submitted, approved, rejected, expired',
          },
          default: 'pending',
        },
        reviewedBy: {
          type: String,
          trim: true,
        },
        reviewedAt: {
          type: Date,
        },
        rejectionReason: {
          type: String,
          trim: true,
          maxlength: [
            MAX_REJECTION_REASON_LENGTH,
            'Rejection reason cannot exceed 500 characters',
          ],
        },
        expiryDate: {
          type: Date,
        },
        isRequired: {
          type: Boolean,
          required: [true, 'Required flag is mandatory'],
          default: false,
        },
        country: {
          type: String,
          required: [true, 'Country is required'],
          trim: true,
        },
        region: {
          type: String,
          trim: true,
        },
        metadata: {
          amount: {
            type: Number,
            min: [0, 'Amount cannot be negative'],
          },
          examScore: {
            type: Number,
            min: [0, 'Exam score cannot be negative'],
            max: [MAX_EXAM_SCORE, 'Exam score cannot exceed 100'],
          },
          issueDate: {
            type: Date,
          },
          validUntil: {
            type: Date,
          },
          documentNumber: {
            type: String,
            trim: true,
          },
          additionalInfo: {
            type: Schema.Types.Mixed,
          },
        },
      },
    ],
    trainingStatus: [
      {
        programName: {
          type: String,
          trim: true,
        },
        status: {
          type: String,
          enum: {
            values: ['not_started', 'in_progress', 'completed', 'failed'],
            message:
              'Training status must be one of: not_started, in_progress, completed, failed',
          },
        },
        startDate: {
          type: Date,
        },
        completionDate: {
          type: Date,
        },
        score: {
          type: Number,
        },
        certificate: {
          type: String,
          trim: true,
        },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    notes: {
      type: String,
      trim: true,
      maxlength: [MAX_NOTES_LENGTH, 'Notes cannot exceed 500 characters'],
    },
    otp: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'agents',
  },
);

agentSchema.index({ agentCode: 1 }, { unique: true });
agentSchema.index({ projectId: 1 });
agentSchema.index({ channelId: 1 });
agentSchema.index({ designationId: 1 });
agentSchema.index({ userId: 1 });
agentSchema.index({ teamLeadId: 1 });
agentSchema.index({ reportingManagerId: 1 });
agentSchema.index({ agentStatus: 1 });
agentSchema.index({ isDeleted: 1 });
agentSchema.index({ createdAt: -1 });

agentSchema.set('toJSON', { virtuals: true });
agentSchema.set('toObject', { virtuals: true });

// Add virtual for full name
agentSchema.virtual('fullName').get(function (this: IAgent) {
  const parts = [];
  if (this.title) parts.push(this.title);
  if (this.firstName) parts.push(this.firstName);
  if (this.middleName) parts.push(this.middleName);
  if (this.lastName) parts.push(this.lastName);
  if (this.suffix) parts.push(this.suffix);
  return parts.join(' ').trim() || undefined;
});

export const AgentModel = model<IAgent>('Agent', agentSchema);
