import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

interface ChannelInfo {
  channelId: mongoose.Types.ObjectId;
  channelName: string;
}

interface TagInfo {
  tagName: string;
  tagId: mongoose.Types.ObjectId;
}

interface RoleInfo {
  roleId: mongoose.Types.ObjectId;
  roleName: string;
}

export interface IResourceCenter extends Document {
  channelId: ChannelInfo[];
  projectId: mongoose.Types.ObjectId;
  resourceCategory: mongoose.Types.ObjectId;
  subCategory: string[];
  isActive: boolean;
  title: string;
  description: string;
  documentId: string;
  publish: 'publish' | 'draft';
  tags: TagInfo[];
  roles: RoleInfo[];
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  files?: {
    s3Key: string;
    s3Link: string;
    documentFormat: string;
    isActive: boolean;
  }[];
}

const channelInfoSchema = new Schema<ChannelInfo>({
  channelId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  channelName: {
    type: String,
    required: true,
  },
});

const tagInfoSchema = new Schema<TagInfo>({
  tagName: {
    type: String,
    required: true,
  },
  tagId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
});

const roleInfoSchema = new Schema<RoleInfo>({
  roleId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  roleName: {
    type: String,
    required: true,
  },
});

const resourceCenterSchema = new Schema<IResourceCenter>(
  {
    channelId: {
      type: [channelInfoSchema],
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'project',
      required: true,
    },
    resourceCategory: {
      type: Schema.Types.ObjectId,
      ref: 'resourceCenterMaster',
      required: true,
    },
    subCategory: {
      type: [String],
      enum: ['VIDEOS', 'PDF', 'ARTICLE', 'INFOGRAPHICS'],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    documentId: {
      type: String,
      required: true,
      unique: true,
    },
    publish: {
      type: String,
      enum: ['publish', 'draft'],
      required: true,
    },
    tags: {
      type: [tagInfoSchema],
      required: true,
    },
    roles: {
      type: [roleInfoSchema],
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      required: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      required: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    files: [
      {
        s3Key: { type: String, required: true },
        s3Link: { type: String, required: true },
        documentFormat: { type: String, required: true },
        isActive: { type: Boolean, default: true },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const ResourceCenterModel = mongoose.model<IResourceCenter>(
  'resourceCenter',
  resourceCenterSchema,
);
