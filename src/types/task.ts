export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";
export type TaskStatus = "Open" | "In Progress" | "Completed" | "Overdue";

export interface Task {
  id: string;
  title: string;
  description?: string;
  linkedEntityType?: "lead" | "student" | "application" | "document";
  linkedEntityId?: string;
  linkedEntityName?: string;
  dueDate: string; // YYYY-MM-DD
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo?: string; // email/uid
  recurrence?: "none" | "daily" | "weekly" | "monthly";
  reminderMinutes?: number;
  escalateAfterHours?: number;
  escalatedTo?: string;
  escalatedAt?: number;
  reminderSentToday?: boolean;
  completedAt?: number;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

