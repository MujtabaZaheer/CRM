export type ApplicationStage =
  | "Draft"
  | "Initial Review"
  | "Documents Pending"
  | "Ready for Submission"
  | "Submitted"
  | "University Reviewing"
  | "Additional Info Requested"
  | "Conditional Offer"
  | "Unconditional Offer"
  | "Deposit Pending"
  | "Deposit Paid"
  | "CAS / COE Pending"
  | "CAS Issued"
  | "Visa Preparation"
  | "Visa Submitted"
  | "Visa Approved"
  | "Enrolled"
  | "Deferred"
  | "Withdrawn"
  | "Rejected";

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
