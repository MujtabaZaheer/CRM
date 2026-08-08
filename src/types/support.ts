export type TicketPriority = "Low" | "Medium" | "High" | "Urgent";
export type TicketStatus = "Open" | "In Progress" | "Pending User" | "Resolved" | "Closed";
export type SupportCategory =
  | "Technical Issue"
  | "Account Access"
  | "Data Discrepancy"
  | "Application Bug"
  | "Feature Request"
  | "General Query";

export interface TicketComment {
  id: string;
  authorEmail: string;
  authorRole?: string;
  comment: string;
  isInternal: boolean;
  createdAt: number;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string; // e.g. TKT-2026-1042
  title: string;
  description: string;
  category: SupportCategory;
  priority: TicketPriority;
  status: TicketStatus;
  userEmail: string;
  userName?: string;
  assignedTo?: string; // support agent email
  comments: TicketComment[];
  resolutionNotes?: string;
  resolvedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface SupportArticle {
  id: string;
  title: string;
  category: SupportCategory;
  content: string;
  authorEmail: string;
  tags: string[];
  views: number;
  helpfulCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface SupportMetrics {
  totalOpen: number;
  inProgress: number;
  highPriorityCount: number;
  resolvedToday: number;
  avgResolutionHours: number;
}
