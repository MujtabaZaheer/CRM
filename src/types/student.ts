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
  
  preferredDestination?: string;
  preferredIntake?: string;
  budgetAnnualUsd?: number;
  
  profileCompleteness: number; // 0-100%
  assignedCounsellorId?: string;
  notes?: string;

  createdAt: number;
  updatedAt: number;
}
