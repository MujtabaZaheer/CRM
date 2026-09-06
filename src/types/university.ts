export type StudyLevel =
  | "Undergraduate"
  | "Postgraduate"
  | "Doctorate"
  | "Foundation"
  | "Pre-Master";

export type SubjectArea =
  | "STEM"
  | "Business & Management"
  | "Health Sciences"
  | "Humanities"
  | "Computing & AI"
  | "Law & Legal Studies"
  | "Arts & Design"
  | "Social Sciences"
  | "Other";

export type AccreditationStatus = "Full Partner" | "Provisional" | "Under Review";

export interface ProgrammeScholarship {
  name: string;
  amount: string;
  criteria?: string;
  autoApplied?: boolean;
}

export interface Programme {
  id: string;
  title: string;
  level: StudyLevel;
  durationMonths: number;
  tuitionFeeAnnual: number;
  currency: string;
  intakes: string[]; // e.g. ["September", "January"]
  minIeltsScore?: number;
  entryRequirements?: string;
  field?: string;
  deadline?: string;
  applicationFee?: number;
  requiredDocuments?: string[];
  requirements?: {
    minGpa?: number;
    minIelts?: number;
    minIeltsListening?: number;
    minIeltsReading?: number;
    minIeltsWriting?: number;
    minIeltsSpeaking?: number;
    acceptedQualifications?: string[];
    prerequisites?: string[];
    workExperienceRequired?: boolean;
  };
  applicationForm?: { id: string; label: string; type: "text" | "textarea" | "number" | "select"; required?: boolean; options?: string[]; helpText?: string }[];

  // New fields for commercial-grade matcher
  subjectArea?: SubjectArea;
  studyMode?: ("On-Campus" | "Hybrid" | "Online")[];
  scholarships?: ProgrammeScholarship[];
  depositRequired?: number;
  estimatedLivingCostAnnual?: number;
}

export interface University {
  id: string;
  name: string;
  country: string;
  city: string;
  campus?: string;
  website?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  coverImageAlt?: string;
  description?: string;
  ranking?: string;
  tuitionRange?: string;
  applicationFee?: number;
  scholarships?: string[];
  programmes: Programme[];
  createdAt: number;
  updatedAt: number;

  // New fields for commercial-grade explorer
  globalRanking?: number;
  nationalRanking?: number;
  acceptanceRate?: number;
  accreditationStatus?: AccreditationStatus;
}

