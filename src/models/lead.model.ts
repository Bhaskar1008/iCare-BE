import { Schema, model, Types } from 'mongoose';
import type { IBaseModel } from './base.model';
import type { IUser } from './user.model';
import { LeadConfigurationModel } from './lead-configuration.model';

export interface ILead extends IBaseModel {
  productId: Types.ObjectId;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'Male' | 'Female' | 'Other';
  // Mailing Address
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  province: string;
  city: string;
  zipcode: string;
  // Permanent Address
  isMailingAddressSameAsPermanent: boolean;
  permanentAddressLine1?: string;
  permanentAddressLine2?: string;
  permanentLandmark?: string;
  permanentProvince?: string;
  permanentCity?: string;
  permanentZipcode?: string;
  // Contact Details
  primaryNumber: string;
  alternateMobileNo?: string;
  landlineNo?: string;
  emailAddress: string;
  // Professional Details
  education: string;
  professionType: string;
  incomeGroup: string;
  vehicleType: string;
  // Lead Details
  leadType: string;
  stage: string;
  currentLeadStatus: {
    id: string;
    name: string;
    updatedAt: Date;
    relationships: {
      progress?: {
        id: string;
        name: string;
      };
      disposition?: {
        id: string;
        name: string;
      };
      subDisposition?: {
        id: string;
        name: string;
      };
    };
  };
  leadStatusHistory: Array<{
    id: string;
    name: string;
    updatedAt: Date;
    relationships: {
      progress?: {
        id: string;
        name: string;
      };
      disposition?: {
        id: string;
        name: string;
      };
      subDisposition?: {
        id: string;
        name: string;
      };
    };
  }>;
  leadProgress: string;
  leadDisposition: string;
  leadSubDisposition: string;
  appointmentDate?: Date;
  startTime?: string;
  allocatedTo: Types.ObjectId;
  allocatedBy: Types.ObjectId;
  allocatedAt: Date;
  allocatorsRemark?: string;
  remarkFromUser?: string;
}

const relationshipItemSchema = new Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  }
}, { _id: false });

const relationshipsSchema = new Schema({
  progress: relationshipItemSchema,
  disposition: relationshipItemSchema,
  subDisposition: relationshipItemSchema
}, { _id: false });

const leadStatusSchema = new Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  relationships: relationshipsSchema
}, { _id: false });

const leadSchema = new Schema<ILead>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required']
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [30, 'First name cannot exceed 30 characters'],
      match: [/^[A-Za-z]+$/, 'First name must be alphabetic only']
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [30, 'Last name cannot exceed 30 characters'],
      match: [/^[A-Za-z]+$/, 'Last name must be alphabetic only']
    },
    dateOfBirth: {
      type: Date,
      required: [false, 'Date of birth is required'],
      validate: {
        validator: function(value: Date) {
          if (!value) return true;
          const today = new Date();
          const age = today.getFullYear() - value.getFullYear();
          return age >= 18 && age <= 100;
        },
        message: 'Lead must be between 18 and 100 years old'
      }
    },
    gender: {
      type: String,
      required: [false, 'Gender is required'],
      enum: {
        values: ['Male', 'Female', 'Other'],
        message: 'Gender must be either Male, Female, or Other'
      }
    },
    // Mailing Address
    addressLine1: {
      type: String,
      required: [false, 'Mailing address line 1 is required'],
      trim: true,
      maxlength: [100, 'Address line 1 cannot exceed 100 characters']
    },
    addressLine2: {
      type: String,
      trim: true,
      maxlength: [100, 'Address line 2 cannot exceed 100 characters']
    },
    landmark: {
      type: String,
      trim: true,
      maxlength: [50, 'Landmark cannot exceed 50 characters']
    },
    province: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    zipcode: {
      type: String,
      required: [false, 'Zipcode is required'],
      trim: true,
      match: [/^\d{4,6}$/, 'Please enter a valid zipcode']
    },
    // Permanent Address
    isMailingAddressSameAsPermanent: {
      type: Boolean,
      required: [true, 'Please specify if mailing address is same as permanent address'],
      default: true
    },
    permanentAddressLine1: {
      type: String,
      required: function(this: ILead) {
        return this.isMailingAddressSameAsPermanent === false;
      },
      trim: true,
      maxlength: [100, 'Permanent address line 1 cannot exceed 100 characters']
    },
    permanentAddressLine2: {
      type: String,
      trim: true,
      maxlength: [100, 'Permanent address line 2 cannot exceed 100 characters']
    },
    permanentLandmark: {
      type: String,
      trim: true,
      maxlength: [50, 'Permanent address landmark cannot exceed 50 characters']
    },
    permanentProvince: {
      type: String,
      required: function(this: ILead) {
        return this.isMailingAddressSameAsPermanent === false;
      },
      trim: true
    },
    permanentCity: {
      type: String,
      required: function(this: ILead) {
        return this.isMailingAddressSameAsPermanent === false;
      },
      trim: true
    },
    permanentZipcode: {
      type: String,
      required: function(this: ILead) {
        return this.isMailingAddressSameAsPermanent === false;
      },
      trim: true,
      match: [/^\d{4,6}$/, 'Please enter a valid permanent address zipcode']
    },
    // Contact Details
    primaryNumber: {
      type: String,
      required: [true, 'Primary number is required'],
      trim: true,
      maxlength: [14, 'Primary number cannot exceed 14 digits'],
      minlength: [10, 'Primary number must be at least 10 digits'],
      match: [
        /^(0|6|7|8|9)\d{9,13}$/,
        'Primary number must start with 0, 6, 7, 8, or 9 and be 10–14 digits'
      ]
    },
    alternateMobileNo: {
      type: String,
      trim: true,
      maxlength: [14, 'Alternate mobile number cannot exceed 14 digits'],
      minlength: [10, 'Alternate mobile number must be at least 10 digits'],
      match: [
        /^(0|6|7|8|9)\d{9,13}$/,
        'Alternate mobile number must start with 0, 6, 7, 8, or 9 and be 10–14 digits',
      ],
    },
    landlineNo: {
      type: String,
      trim: true,
      maxlength: [14, 'Landline number cannot exceed 14 digits'],
      minlength: [10, 'Landline number must be at least 10 digits'],
      match: [
        /^(0|6|7|8|9)\d{9,13}$/,
        'Landline number must start with 0, 6, 7, 8, or 9 and be 10–14 digits'
      ],
    },
    emailAddress: {
      type: String,
      required: [true, 'Email address is required'],
      trim: true,
      lowercase: true,
      maxlength: [40, 'Email address cannot exceed 40 characters'],
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address'
      ]
    },
    // Professional Details
    education: {
      type: String,
      required: [false, 'Education is required'],
      enum: {
        values: [
          'No Formal Schooling',
          'Primary Education',
          'Secondary Education',
          'Higher Secondary',
          'Graduate',
          'Post Graduate',
          'Professional Degree'
        ],
        message: 'Invalid education value'
      }
    },
    professionType: {
      type: String,
      required: [false, 'Profession type is required'],
      enum: {
        values: [
          'Agriculturist/Farmer',
          'Business Owner',
          'Salaried Employee',
          'Professional',
          'Student',
          'Homemaker',
          'Retired',
          'Others'
        ],
        message: 'Invalid profession type'
      }
    },
    incomeGroup: {
      type: String,
      required: [false, 'Income group is required'],
      enum: {
        values: [
          'Below ₱ 10,000',
          '₱ 10,000 - ₱ 20,000',
          '₱ 20,000 - ₱ 30,000',
          '₱ 30,000 - ₱ 50,000',
          'Above ₱ 50,000'
        ],
        message: 'Invalid income group'
      }
    },
    vehicleType: {
      type: String,
      required: [false, 'Vehicle type is required'],
      enum: {
        values: [
          'Private Car (Sedan/Hatchback)',
          'SUV/MUV',
          'Two Wheeler',
          'Commercial Vehicle',
          'No Vehicle'
        ],
        message: 'Invalid vehicle type'
      }
    },
    leadType: {
      type: String,
      required: [true, 'Lead type is required'],
      trim: true,
      enum: {
        values: ['Sales', 'Individual', 'Group'],
        message: 'Lead type must be either Sales, Individual, or Group'
      }
    },
    stage: {
      type: String,
      required: [true, 'Stage is required'],
      trim: true,
      enum: {
        values: ['In-Call', 'Post-Call', 'Closed', 'Lost'],
        message: 'Stage must be either In-Call, Post-Call, Closed, or Lost'
      }
    },
    currentLeadStatus: {
      type: leadStatusSchema,
      required: true
    },
    leadStatusHistory: {
      type: [leadStatusSchema],
      default: []
    },
    leadProgress: {
      type: String,
      required: [true, 'Lead progress is required'],
      trim: true,
      validate: {
        validator: async function(value: string) {
          const config = await LeadConfigurationModel.findOne({
            productId: this.productId,
            isActive: true,
            isDeleted: false,
            'leadProgress.id': value,
            'leadProgress.enabled': true
          });
          return !!config;
        },
        message: 'Invalid lead progress for this product'
      }
    },
    leadDisposition: {
      type: String,
      required: function(this: ILead) {
        return ['No Contact', 'Contact'].includes(this.leadProgress);
      },
      trim: true,
      validate: {
        validator: async function(value: string) {
          const config = await LeadConfigurationModel.findOne({
            productId: this.productId,
            isActive: true,
            isDeleted: false,
            'leadDisposition.id': value,
            'leadDisposition.enabled': true,
            'leadDisposition.progressId': this.leadProgress
          });
          return !!config;
        },
        message: 'Invalid lead disposition for this progress'
      }
    },
    leadSubDisposition: {
      type: String,
      required: function(this: ILead) {
        return !!this.leadDisposition;
      },
      trim: true,
      validate: {
        validator: async function(value: string) {
          const config = await LeadConfigurationModel.findOne({
            productId: this.productId,
            isActive: true,
            isDeleted: false,
            'leadSubDisposition.id': value,
            'leadSubDisposition.enabled': true,
            'leadSubDisposition.dispositionId': this.leadDisposition
          });
          return !!config;
        },
        message: 'Invalid lead sub-disposition for this disposition'
      }
    },
    appointmentDate: {
      type: Date,
      validate: {
        validator: async function(value: Date) {
          if (!value) return true;
          
          const config = await LeadConfigurationModel.findOne({
            productId: this.productId,
            isActive: true,
            isDeleted: false,
            conditions: {
              $elemMatch: {
                field: 'appointmentDate',
                action: 'require',
                whenField: 'leadDisposition',
                whenValue: this.leadDisposition
              }
            }
          });

          if (config) {
            return value >= new Date();
          }
          return true;
        },
        message: 'Appointment date must be in the future'
      }
    },
    startTime: {
      type: String,
      validate: {
        validator: async function(value: string) {
          if (!value) return true;

          const config = await LeadConfigurationModel.findOne({
            productId: this.productId,
            isActive: true,
            isDeleted: false,
            conditions: {
              $elemMatch: {
                field: 'startTime',
                action: 'require',
                whenField: 'leadDisposition',
                whenValue: this.leadDisposition
              }
            }
          });

          if (config) {
            return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
          }
          return true;
        },
        message: 'Start time must be in HH:MM format (24-hour)'
      }
    },
    allocatedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Lead must be allocated to a user']
    },
    allocatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Allocator information is required']
    },
    allocatedAt: {
      type: Date,
      default: Date.now
    },
    allocatorsRemark: {
      type: String,
      trim: true,
      maxlength: [30, 'Allocator\'s remark cannot exceed 30 characters'],
      match: [
        /^[A-Za-z0-9 ]*$/,
        'Allocator\'s remark must be alphanumeric'
      ]
    },
    remarkFromUser: {
      type: String,
      trim: true,
      maxlength: [30, 'Remark from user cannot exceed 30 characters'],
      match: [
        /^[A-Za-z0-9 ]*$/,
        'Remark from user must be alphanumeric'
      ]
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'leads'
  }
);

// Indexes
leadSchema.index({ productId: 1 });
leadSchema.index({ emailAddress: 1 });
leadSchema.index({ primaryNumber: 1 });
leadSchema.index({ allocatedTo: 1 });
leadSchema.index({ allocatedBy: 1 });
leadSchema.index({ allocatedAt: -1 });
leadSchema.index({ leadProgress: 1 });
leadSchema.index({ stage: 1 });
leadSchema.index({ isDeleted: 1 });
leadSchema.index({ createdAt: -1 });

leadSchema.set('toJSON', { virtuals: true });
leadSchema.set('toObject', { virtuals: true });

export const LeadModel = model<ILead>('Lead', leadSchema);
