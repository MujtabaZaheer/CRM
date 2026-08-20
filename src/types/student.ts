export type QualificationLevel =
  | "High School / A-Levels"
  | "Bachelor's Degree"
  | "Master's Degree"
  | "Doctorate / PhD"
  | "Diploma / Certificate";

export interface AcademicRecord {
  institution: string;
  qualification: QualificationLevel;
  degreeTitle: string;
  country: string;
  completionYear: number;
  gradeGpa: string;
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
  fullName: string;
  email: string;
  phone: string;
  dob?: string;
  gender?: "Male" | "Female" | "Other" | "Prefer not to say";
  nationality: string;
  countryOfResidence: string;
  passportNumber?: string;
  passportExpiry?: string;
  
  academicHistory: AcademicRecord[];
  englishProficiency?: EnglishTestScore;
  
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
  preferredIntake?: string;
  budgetAnnualUsd?: number;
  
  profileCompleteness: number; // 0-100%
  assignedCounsellorId?: string;
  notes?: string;

  // Consent
  consentGivenAt?: number;
  consentVersion?: string;

  createdAt: number;
  updatedAt: number;
}

