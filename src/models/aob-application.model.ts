import { Schema, model, type Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IQcAndDiscrepancyList {
  documentType?: string;
  documentFormat?: string;
  documentName?: string;
  remarks?: string;
  type?: string;
  infoName?: string;
  createdAt: Date;
}

export interface IAobApplication {
  _id: Types.ObjectId;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  emailAddress: string;
  mobileNumber: string;
  address?: string;
  passedLifeInsuranceExam?: boolean;
  passedLifeInsuranceExamRating?: string;
  passedLifeInsuranceExamDateOfExam?: string;
  passedLifeInsuranceExamVenueOfExam?: string;
  hasLifeInsuranceCompany?: boolean;
  hasLifeInsuranceCompanyName?: string;
  hasNonLifeInsuranceCompany?: boolean;
  hasNonLifeInsuranceCompanyName?: string;
  hasVariableInsuranceCompany?: boolean;
  hasVariableInsuranceCompanyName?: string;
  relatedToEmployee?: boolean;
  relatedToEmployeeName?: string;
  relatedToEmployeeRelationShip?: string;
  applicationStatus?:
    | 'applicationSubmitted'
    | 'underReview'
    | 'rejected'
    | 'qcRejected'
    | 'approved'
    | 'returned';
  rejectRemark?: string;
  applicationId?: string;
  documentId?: string;
  projectId?: Types.ObjectId;
  qcAndDiscrepencyList?: IQcAndDiscrepancyList[];
  createdAt: Date;
  updatedAt: Date;
}

const QcAndDiscrepancyListSchema = new Schema<IQcAndDiscrepancyList>({
  documentType: {
    type: String,
    required: false,
  },
  documentFormat: {
    type: String,
    enum: ['pdf', 'png', 'jpg'],
    required: false,
  },
  documentName: {
    type: String,
    required: false,
  },
  remarks: {
    type: String,
    required: false,
  },
  type: {
    type: String,
    required: false,
    trim: true,
  },
  infoName: {
    type: String,
    required: false,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const AobApplicationSchema = new Schema<IAobApplication>(
  {
    firstName: {
      type: String,
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    emailAddress: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    address: {
      type: String,
      trim: true,
    },
    passedLifeInsuranceExam: {
      type: Boolean,
      default: false,
    },
    passedLifeInsuranceExamRating: {
      type: String,
      trim: true,
    },
    passedLifeInsuranceExamDateOfExam: {
      type: String,
      trim: true,
    },
    passedLifeInsuranceExamVenueOfExam: {
      type: String,
      trim: true,
    },
    hasLifeInsuranceCompany: {
      type: Boolean,
      default: false,
    },
    hasLifeInsuranceCompanyName: {
      type: String,
      trim: true,
    },
    hasNonLifeInsuranceCompany: {
      type: Boolean,
      default: false,
    },
    hasNonLifeInsuranceCompanyName: {
      type: String,
      trim: true,
    },
    hasVariableInsuranceCompany: {
      type: Boolean,
      default: false,
    },
    hasVariableInsuranceCompanyName: {
      type: String,
      trim: true,
    },
    relatedToEmployee: {
      type: Boolean,
      default: false,
    },
    relatedToEmployeeName: {
      type: String,
      trim: true,
    },
    relatedToEmployeeRelationShip: {
      type: String,
      trim: true,
    },
    applicationStatus: {
      type: String,
      enum: [
        'applicationSubmitted',
        'underReview',
        'rejected',
        'qcRejected',
        'approved',
        'returned',
      ],
      default: 'applicationSubmitted',
    },
    rejectRemark: {
      type: String,
      trim: true,
    },
    applicationId: {
      type: String,
      trim: true,
    },
    documentId: {
      type: String,
      unique: true,
      default: () => uuidv4(),
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
    qcAndDiscrepencyList: [QcAndDiscrepancyListSchema],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Index for better query performance
AobApplicationSchema.index({ emailAddress: 1 });
AobApplicationSchema.index({ mobileNumber: 1 });
AobApplicationSchema.index({ applicationStatus: 1 });
AobApplicationSchema.index({ createdAt: -1 });
AobApplicationSchema.index({ projectId: 1 });

export const AobApplicationModel = model<IAobApplication>(
  'AobApplication',
  AobApplicationSchema,
);
