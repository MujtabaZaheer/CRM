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

export type DocumentChecklistStatus = 'received' | 'missing' | 'verification_pending' | 'action_required';

export interface DocumentChecklistItem {
  docType: string;
  label: string;
  status: DocumentChecklistStatus;
  required: boolean;
  notes?: string;
  uploadedAt?: number;
  fileUrl?: string;
}

export interface ApplicationCondition {
  id: string;
  condition: string;
  fulfilled: boolean;
  fulfilledAt?: number;
  evidence?: string;
}

export interface ApplicationPartnerComment {
  id: string;
  authorName: string;
  authorRole: string;
  isInternal: boolean;
  text: string;
  createdAt: number;
}

export interface ApplicationDocumentRequest {
  id: string;
  docType: string;
  reason: string;
  deadline?: string;
  requestedAt: number;
  status: "pending" | "fulfilled";
}

export interface ApplicationScholarship {
  name: string;
  amount: number | string;
  description?: string;
  awardedDate: number;
}

export interface ApplicationTransferEvent {
  id: string;
  timestamp: number;
  previousAssignee: string;
  newAssignee: string;
  previousTeam?: string;
  newTeam?: string;
  previousDepartment?: string;
  newDepartment?: string;
  authorizingUser: string;
  authorizingRole?: string;
  reason: string;
  isCrossTenant: boolean;
  originTenantId?: string;
  destinationTenantId?: string;
}

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
  email: string;
  address: string;
}

export interface AcademicHistoryRecord {
  institution: string;
  qualification: string;
  passingYear: number;
  gradeScale: string;
  score: string;
  country: string;
  degreeTitle?: string;
  completionYear?: number;
  gradeGpa?: string;
}

export interface EnglishProficiencyData {
  testType: 'IELTS' | 'PTE' | 'TOEFL' | 'Duolingo' | 'WAEC' | 'None';
  overallScore?: string;
  trfNumber?: string;
  testDate?: string;
}

export interface StudyGapRecord {
  startDate: string;
  endDate: string;
  explanation: string;
  documentationAttached: boolean;
}

export interface ImmigrationHistoryData {
  hasPriorRefusal: boolean;
  refusalDetails?: string;
  refusalCountries?: string[];
}

export interface DeclarationData {
  signedName: string;
  agreedAt: string;
  consentGiven: boolean;
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
  eligibilityStatus?: "eligible" | "competitive" | "conditional" | "not_eligible" | "not_checked";
  eligibilityScore?: number;
  applicationStatus?: ApplicationStage;
  assignedOfficer?: string;
  assignedOfficerEmail?: string;
  assignedOfficerName?: string;
  assignedTeam?: string;
  assignedDepartment?: string;
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
  documentChecklist?: DocumentChecklistItem[];
  conditions?: ApplicationCondition[];
  lockedAt?: number; // timestamp when locked for submission
  clonedFrom?: string; // applicationId this was cloned from
  casRefNumber?: string;
  casIssuedAt?: number;
  tenantId?: string;
  tenantType?: "city" | "university" | "regional_hub";
  campusCity?: string;
  assignedCity?: string;
  processingCity?: string;
  assignedCounsellorId?: string;
  assignedTeamLeaderId?: string;
  assignedTeamLeaderEmail?: string;
  assignedTeamLeader?: string;
  transferHistory?: ApplicationTransferEvent[];
  history?: ApplicationHistoryItem[];
  offerLetterUrl?: string;
  offerLetterFileName?: string;
  offerType?: "Conditional Offer" | "Unconditional Offer";
  offerConditions?: string;
  depositAmount?: number;
  offerDate?: number;
  offerDeadline?: string;
  decisionNotes?: string;
  scholarshipAwarded?: ApplicationScholarship;
  partnerComments?: ApplicationPartnerComment[];
  requestedDocuments?: ApplicationDocumentRequest[];
  sourceAgentName?: string;
  // Agent Referral & Admissions Triage Isolation
  agentUid?: string;
  agentId?: string;
  agentEmail?: string;
  agentName?: string;
  agentReferred?: boolean;
  admissionsVisibility?: boolean;
  vettedBy?: string;
  vettedAt?: number;
  vettingNotes?: string;
  vettingStatus?: "pending_triage" | "documents_verified" | "submitted_to_admissions" | "rejected";

  // Public Intake & EduBridge Compliance Extensions
  emergencyContact?: EmergencyContact;
  academicHistory?: AcademicHistoryRecord[];
  englishProficiency?: EnglishProficiencyData;
  studyGaps?: StudyGapRecord[];
  immigrationHistory?: ImmigrationHistoryData;
  declaration?: DeclarationData;
  wizardStepCompleted?: number;
  intakeToken?: string;

  createdAt: number;
  updatedAt: number;
}

