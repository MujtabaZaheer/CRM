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

export interface ApplicationDocumentRequirement {
  docType: string;
  required: boolean;
  uploaded: boolean;
  verifiedAt?: number;
}

export interface ApplicationCondition {
  id: string;
  condition: string;
  fulfilled: boolean;
  fulfilledAt?: number;
  evidence?: string;
}

export interface Application {
  id: string;
  applicationNumber: string; // e.g. APP-2026-0042
  studentId: string;
  studentName: string;
  studentEmail?: string;
  universityId: string;
  universityName: string;
  programmeId: string;
  programmeName: string;
  intake: string; // e.g. "Fall 2026"
  targetCountry?: string;
  eligibilityStatus?: "eligible" | "conditional" | "not_eligible" | "not_checked";
  eligibilityScore?: number;
  applicationStatus?: ApplicationStage;
  assignedOfficer?: string;
  submittedAt?: number;
  submissionRequested?: boolean;
  deadline?: string;
  nextAction?: string;
  nextActionDueDate?: string;
  currentStep?: number;
  completionPercentage?: number;
  formResponses?: Record<string, string | number | boolean>;
  declarationAccepted?: boolean;
  stage: ApplicationStage;
  assignedCounsellor?: string;
  requiredDocuments?: ApplicationDocumentRequirement[];
  conditions?: ApplicationCondition[];
  lockedAt?: number; // timestamp when locked for submission
  clonedFrom?: string; // applicationId this was cloned from
  history?: ApplicationHistoryItem[];
  createdAt: number;
  updatedAt: number;
}
