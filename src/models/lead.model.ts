import { Schema, model, type Types } from 'mongoose';
import type { IBaseModel } from './base.model';

export interface ILead extends IBaseModel {
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: 'Male' | 'Female' | 'Other';
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  province: string;
  city: string;
  zipcode: string;
  isMailingAddressSameAsPermanent: boolean;
  permanentAddressLine1?: string;
  permanentAddressLine2?: string;
  permanentLandmark?: string;
  permanentProvince?: string;
  permanentCity?: string;
  permanentZipcode?: string;
  primaryNumber: string;
  alternateMobileNo?: string;
  landlineNo?: string;
  emailAddress: string;
  education: string;
  professionType: string;
  incomeGroup: string;
  vehicleType: string;
  leadType: string;
  stage: string;
  currentLeadStatus: {
    id: string;
    name: string;
    updatedAt: Date;
    progress: string;
    disposition?: string;
    subDisposition?: string;
  };
  leadStatusHistory: Array<{
    id: string;
    name: string;
    updatedAt: Date;
    progress: string;
    disposition?: string;
    subDisposition?: string;
  }>;
  leadProgress: string;
  leadDisposition?: string;
  leadSubDisposition?: string;
  appointmentDate?: Date;
  startTime?: string;
  allocatedTo: Types.ObjectId;
  allocatedBy: Types.ObjectId;
  createdBy: Types.ObjectId;
  allocatedAt: Date;
  allocatorsRemark?: string;
  remarkFromUser?: string;
}

const leadSchema = new Schema<ILead>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: Date,
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    addressLine1: { type: String, required: false },
    addressLine2: String,
    landmark: String,
    province: { type: String, required: true },
    city: { type: String, required: true },
    zipcode: { type: String, required: false },
    isMailingAddressSameAsPermanent: { type: Boolean, default: false },
    permanentAddressLine1: String,
    permanentAddressLine2: String,
    permanentLandmark: String,
    permanentProvince: String,
    permanentCity: String,
    permanentZipcode: String,
    primaryNumber: { type: String, required: true },
    alternateMobileNo: String,
    landlineNo: String,
    emailAddress: { type: String, required: false },
    education: { type: String, required: false },
    professionType: { type: String, required: false },
    incomeGroup: { type: String, required: false },
    vehicleType: { type: String, required: false },
    leadType: { type: String, required: true },
    stage: { type: String, required: true },
    currentLeadStatus: {
      id: String,
      name: String,
      updatedAt: Date,
      progress: String,
      disposition: String,
      subDisposition: String,
    },
    leadStatusHistory: [
      {
        id: String,
        name: String,
        updatedAt: Date,
        progress: String,
        disposition: String,
        subDisposition: String,
      },
    ],
    leadProgress: { type: String, required: true },
    leadDisposition: String,
    leadSubDisposition: String,
    appointmentDate: Date,
    startTime: String,
    allocatedTo: { type: Schema.Types.ObjectId, required: true, ref: 'Agent' },
    allocatedBy: { type: Schema.Types.ObjectId, required: true, ref: 'Agent' },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'Agent' },
    allocatedAt: { type: Date, default: Date.now },
    allocatorsRemark: String,
    remarkFromUser: String,
  },
  {
    timestamps: true,
  },
);

export const Lead = model<ILead>('Lead', leadSchema);
