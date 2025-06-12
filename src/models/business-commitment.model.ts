import { Schema, model } from 'mongoose';
import type { IBaseModel } from './base.model';

export interface IBusinessCommitment extends IBaseModel {
  agentId: string;
  commitmentDate: Date;
  commitmentCount: number;
  achievedCount: number;
  achievementPercentage: number;
  createdBy: string;
}

const businessCommitmentSchema = new Schema(
  {
    agentId: {
      type: Schema.Types.ObjectId,
      ref: 'Agent',
      required: true,
    },
    commitmentDate: {
      type: Date,
      required: true,
    },
    commitmentCount: {
      type: Number,
      required: true,
      min: 0,
    },
    achievedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    achievementPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Agent',
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Pre-save middleware to calculate achievement percentage
businessCommitmentSchema.pre('save', function (next) {
  if (this.commitmentCount > 0) {
    this.achievementPercentage =
      (this.achievedCount / this.commitmentCount) * 100;
  }
  next();
});

export const BusinessCommitment = model<IBusinessCommitment>(
  'BusinessCommitment',
  businessCommitmentSchema,
);
