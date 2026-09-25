import {
  EmergencyContact,
  AcademicHistoryRecord,
  EnglishProficiencyData,
  StudyGapRecord,
  ImmigrationHistoryData,
  DeclarationData,
} from "./application";

export type QualificationLevel =
  | "High School / A-Levels"
  | "Bachelor's Degree"
  | "Master's Degree"
  | "Doctorate / PhD"
  | "Diploma / Certificate";

export interface AcademicRecord {
  institution: string;
  qualification: QualificationLevel | string;
  degreeTitle?: string;
  country: string;
  completionYear?: number;
  gradeGpa?: string;
  passingYear?: number;
  gradeScale?: string;
  score?: string;
}


export interface EnglishTestScore {
  testType: "IELTS" | "PTE" | "TOEFL" | "Duolingo" | "MOI Evidence";
  overallScore: string;
  testDate?: string;
  expiryDate?: string;
}

export interface EmploymentRecord {
  employer: string;
  jobTitle: string;
  country: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface FinancialSponsor {
  name: string;
  relationship: string;
  annualIncomeUSD: number;
  bankStatementUploaded: boolean;
}

export interface VisaRefusal {
  country: string;
  date: string;
  reason: string;
  appealOutcome?: string;
}

export interface Dependant {
  name: string;
  relationship: string;
  dateOfBirth: string;
  accompanyingStudent: boolean;
}

export interface Reference {
  name: string;
  designation: string;
  institution: string;
  email: string;
  phone: string;
  letterUploaded: boolean;
}

export interface ResearchProposal {
  title: string;
  abstract: string;
  supervisorPreference: string;
  fileUrl?: string;
}

export interface Student {
  id: string;
  leadId?: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  email: string;
  phone: string;
  dob?: string;
  gender?: "Male" | "Female" | "Other" | "Prefer not to say";
  nationality: string;
  countryOfResidence: string;
  passportNumber?: string;
  passportExpiry?: string;
  
  academicHistory: (AcademicRecord | AcademicHistoryRecord)[];
  englishProficiency?: EnglishTestScore | EnglishProficiencyData;
  
  // Employment & Gap
  employmentHistory?: EmploymentRecord[];
  studyGapJustification?: string;

  // Financial
  financialSponsor?: FinancialSponsor;

  // Visa History
  visaRefusalHistory?: VisaRefusal[];

  // Dependants
  dependants?: Dependant[];

  // References
  references?: Reference[];

  // Research (for PhD applicants)
  researchProposal?: ResearchProposal;

  preferredDestination?: string;
  preferredDestinations?: string[];
  preferredIntake?: string;
  budgetAnnualUsd?: number;

  // Onboarding & Discovery Preferences
  onboardingStep?: number;
  onboardingStatus?: "not_started" | "in_progress" | "completed";
  profileCompleted?: boolean;
  currentStep?: number;
  
  shortlistedPrograms?: string[];
  preferredStudyMode?: string;
  preferredCity?: string;
  scholarshipPriority?: 'High' | 'Medium' | 'Not Essential';
  institutionType?: 'Any' | 'Public' | 'Private';
  desiredStudyLevel?: string;
  
  profileCompleteness: number; // 0-100%
  assignedCounsellorId?: string;
  assignedCounsellor?: string;
  assignedCounsellorEmail?: string;
  assignedCounsellorName?: string;
  assignedTeamLeaderId?: string;
  assignedTeamLeaderEmail?: string;
  assignedTeamLeader?: string;
  assignedCity?: string;
  campusCity?: string;
  processingCity?: string;
  preferredProgram?: string;
  office?: string;
  tenantId?: string;
  notes?: string;

  // Consent
  consentGivenAt?: number;
  consentVersion?: string;

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
  studyGaps?: StudyGapRecord[];
  immigrationHistory?: ImmigrationHistoryData;
  declaration?: DeclarationData;
  wizardStepCompleted?: number;

  createdAt: number;
  updatedAt: number;
}

