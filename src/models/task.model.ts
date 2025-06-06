import type { Document } from 'mongoose';
import { Schema, model } from 'mongoose';
import { TaskType, PriorityType } from '../modules/task/enums/task.enum';

export interface ITask extends Document {
  taskType: TaskType;
  teamMember: string[];
  taskDescription: string;
  priorityType: PriorityType;
  dueReminder: Date;
  remark?: string;
  isArchived: boolean;
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

const taskSchema = new Schema<ITask>({
  taskType: {
    type: String,
    enum: Object.values(TaskType),
    required: true,
  },
  teamMember: [
    {
      type: String,
      required: true,
    },
  ],
  taskDescription: {
    type: String,
    required: true,
  },
  priorityType: {
    type: String,
    enum: Object.values(PriorityType),
    required: true,
  },
  dueReminder: {
    type: Date,
    required: true,
  },
  remark: {
    type: String,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: String,
  },
  updatedAt: {
    type: Date,
  },
});

export const Task = model<ITask>('Task', taskSchema);
