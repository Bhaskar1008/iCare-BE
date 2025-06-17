import { Schema, model, type Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IQcAndDiscrepancyList {
  documentType: string;
  documentFormat: string;
  documentName: string;
  remarks: string;
  createdAt: Date;
}

export interface IAobApplication {
  _id: Types.ObjectId;
  firstName: string;
  middleName?: string;
  lastName: string;
  emailAddress: string;
  mobileNumber: string;
  address: string;
  passedLifeInsuranceExam: boolean;
  passedLifeInsuranceExamRating?: string;
  passedLifeInsuranceExamDateOfExam?: string;
  passedLifeInsuranceExamVenueOfExam?: string;
  hasLifeInsuranceCompany: boolean;
  hasLifeInsuranceCompanyName?: string;
  hasNonLifeInsuranceCompany: boolean;
  hasNonLifeInsuranceCompanyName?: string;
  hasVariableInsuranceCompany: boolean;
  hasVariableInsuranceCompanyName?: string;
  relatedToPhillifeEmployee: boolean;
  relatedToPhillifeEmployeeName?: string;
  relatedToPhillifeEmployeeRelationShip?: string;
  applicationStatus:
    | 'applicationSubmitted'
    | 'underReview'
    | 'rejected'
    | 'approved'
    | 'returned';
  rejectRemark?: string;
  applicationId: string;
  documentId: string;
  qcAndDiscrepencyList: IQcAndDiscrepancyList[];
  createdAt: Date;
  updatedAt: Date;
}

const QcAndDiscrepancyListSchema = new Schema<IQcAndDiscrepancyList>({
  documentType: {
    type: String,
    required: true,
  },
  documentFormat: {
    type: String,
    enum: ['pdf', 'png', 'jpg'],
    required: true,
  },
  documentName: {
    type: String,
    required: true,
  },
  remarks: {
    type: String,
    required: true,
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
      required: true,
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
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
      required: true,
      trim: true,
    },
    passedLifeInsuranceExam: {
      type: Boolean,
      required: true,
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
      required: true,
      default: false,
    },
    hasLifeInsuranceCompanyName: {
      type: String,
      trim: true,
    },
    hasNonLifeInsuranceCompany: {
      type: Boolean,
      required: true,
      default: false,
    },
    hasNonLifeInsuranceCompanyName: {
      type: String,
      trim: true,
    },
    hasVariableInsuranceCompany: {
      type: Boolean,
      required: true,
      default: false,
    },
    hasVariableInsuranceCompanyName: {
      type: String,
      trim: true,
    },
    relatedToPhillifeEmployee: {
      type: Boolean,
      required: true,
      default: false,
    },
    relatedToPhillifeEmployeeName: {
      type: String,
      trim: true,
    },
    relatedToPhillifeEmployeeRelationShip: {
      type: String,
      trim: true,
    },
    applicationStatus: {
      type: String,
      enum: [
        'applicationSubmitted',
        'underReview',
        'rejected',
        'approved',
        'returned',
      ],
      default: 'applicationSubmitted',
      required: true,
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
      required: true,
      unique: true,
      default: () => uuidv4(),
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

export const AobApplicationModel = model<IAobApplication>(
  'AobApplication',
  AobApplicationSchema,
);
