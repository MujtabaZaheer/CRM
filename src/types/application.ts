export type ApplicationStage =
  | "Draft"
  | "Initial Review"
  | "Documents Pending"
  | "Submitted"
  | "University Reviewing"
  | "Conditional Offer"
  | "Unconditional Offer"
  | "Deposit Paid"
  | "CAS Issued"
  | "Visa Approved"
  | "Enrolled"
  | "Rejected"
  | "Withdrawn";

export interface ApplicationHistoryItem {
  stage: ApplicationStage;
  updatedBy: string; // user email/name
  timestamp: number;
  note?: string;
}

export interface Application {
  id: string;
  applicationNumber: string; // e.g. APP-2026-0042
  studentId: string;
  studentName: string;
  universityId: string;
  universityName: string;
  programmeId: string;
  programmeName: string;
  intake: string; // e.g. "Fall 2026"
  stage: ApplicationStage;
  assignedCounsellor?: string;
  history: ApplicationHistoryItem[];
  createdAt: number;
  updatedAt: number;
}
