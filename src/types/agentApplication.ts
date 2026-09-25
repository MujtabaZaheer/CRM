/**
 * EduCRM External Agent Intake & Admission Dossier Types
 * Based on CRM.pdf (Sections 2, 3.7, 3.14, 3.15)
 */

export interface PersonalInfoData {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: "Male" | "Female" | "Other";
  nationality: string;
  countryOfBirth: string;
  hasDualNationality: boolean;
  dualNationalityDetails?: string;
  passportNumber: string;
  passportIssueDate: string;
  passportExpiryDate: string;
  passportIssuingAuthority: string;
  email: string;
  phone: string;
  phoneCountryCode: string;
  permanentAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  mailingAddress: {
    sameAsPermanent: boolean;
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
    email: string;
  };
}

export interface AcademicHistoryEntry {
  id: string;
  level: "High School / O-Levels" | "A-Levels / Intermediate" | "Bachelor's" | "Master's" | "Other";
  institutionName: string;
  country: string;
  degreeEarned: string;
  fieldOfStudy: string;
  startDate: string; // YYYY-MM
  completionDate: string; // YYYY-MM
  gradingScale: string; // e.g. "GPA 4.0", "Percentage %", "Division"
  obtainedScore: string;
}

export interface AcademicGapEntry {
  startDate: string;
  endDate: string;
  explanation: string;
  activityType: "Employment" | "Family Care" | "Test Preparation" | "Travel" | "Medical" | "Other";
  employerOrDetails?: string;
}

export interface AcademicBackgroundData {
  qualifications: AcademicHistoryEntry[];
  hasAcademicGap: boolean;
  gapExplanation?: string;
  gapDetails?: AcademicGapEntry[];
}

export type EnglishTestType =
  | "IELTS Academic"
  | "IELTS Indicator"
  | "TOEFL iBT"
  | "PTE Academic"
  | "Duolingo (DET)"
  | "Medium of Instruction (MOI) Certificate"
  | "Exempt / Not Yet Taken";

export interface LanguageTestData {
  englishProficiencyStatus: EnglishTestType;
  overallBand?: string;
  listening?: string;
  reading?: string;
  writing?: string;
  speaking?: string;
  testDate?: string;
  trfReference?: string;
  hasStandardizedTest: boolean;
  standardizedTestType?: "GRE" | "GMAT" | "SAT" | "None";
  standardizedScore?: string;
  standardizedTestDate?: string;
}

export interface WorkExperienceEntry {
  id: string;
  jobTitle: string;
  employerName: string;
  country: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  keyResponsibilities: string;
}

export interface ExperienceComplianceData {
  hasWorkExperience: boolean;
  workHistory: WorkExperienceEntry[];
  hasVisaRefusal: boolean;
  visaRefusalDetails?: {
    country: string;
    year: string;
    reason: string;
  };
  priorStudyOrTravelInTargetCountry: boolean;
  priorTravelDetails?: string;
  criminalBackgroundDeclaration: boolean;
}

export interface ProgramChoice {
  universityId: string;
  universityName: string;
  campusCity?: string;
  country: string;
  programmeId: string;
  programmeTitle: string;
  level: string;
  intake: string;
  tuitionFee?: number | string;
  applicationFee?: number | string;
  entryRequirements?: string;
  priority: "Primary Choice" | "Secondary Choice";
}

export interface ProgramSelectionData {
  primaryChoice: ProgramChoice;
  secondaryChoice?: ProgramChoice;
}

export interface AgentUploadedDocument {
  id: string;
  slotType: string;
  label: string;
  isMandatory: boolean;
  fileName: string;
  fileUrl: string;
  filePath?: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string; // agentId
  uploadedAt: number;
  verificationStatus: "pending" | "verified" | "rejected";
  aiQualityCheck?: {
    passed: boolean;
    blurScore?: number;
    flags?: string[];
  };
}

export interface DocumentUploadsData {
  documents: AgentUploadedDocument[];
}

export interface AgentStudentIntakePayload {
  agentId: string;
  agentEmail: string;
  agencyName: string;
  agencyBranch?: string;
  commissionEligible: boolean;
  assignedCounsellorId?: string;
  personalInfo: PersonalInfoData;
  academic: AcademicBackgroundData;
  language: LanguageTestData;
  compliance: ExperienceComplianceData;
  programs: ProgramSelectionData;
  documents: AgentUploadedDocument[];
  submissionType: "Draft" | "Initial Review";
  createdAt: number;
}
