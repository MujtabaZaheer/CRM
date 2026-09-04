export type StudyLevel =
  | "Undergraduate"
  | "Postgraduate"
  | "Doctorate"
  | "Foundation"
  | "Pre-Master";

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
    acceptedQualifications?: string[];
    prerequisites?: string[];
    workExperienceRequired?: boolean;
  };
  applicationForm?: { id: string; label: string; type: "text" | "textarea" | "number" | "select"; required?: boolean; options?: string[]; helpText?: string }[];
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
}
