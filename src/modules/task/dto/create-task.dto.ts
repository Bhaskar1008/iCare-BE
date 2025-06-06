import type { PriorityType } from '../enums/task.enum';

export class CreateTaskDto {
  teamMember!: string[];
  taskDescription!: string;
  priorityType!: PriorityType;
  dueReminder!: Date;
  remark?: string;
}
