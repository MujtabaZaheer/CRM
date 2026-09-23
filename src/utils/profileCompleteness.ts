import { Student } from "../types/student";

export interface ProfileSectionStatus {
  id: string;
  title: string;
  weight: number;
  completed: boolean;
  score: number;
  hint: string;
}

export interface ProfileCompletenessResult {
  percentage: number;
  isComplete: boolean;
  sections: ProfileSectionStatus[];
  missingFields: string[];
}

/**
 * Calculates student profile completeness based on streamlined onboarding requirements.
 * Excludes Passport, English, Employment, Financial Sponsor, Dependants, References.
 * 
 * Core admissions onboarding components:
 * - Personal Information (40%)
 * - Academic History (35%)
 * - Desired Study Level (25%)
 */
export function calculateProfileCompleteness(
  student: Partial<Student> | null | undefined
): ProfileCompletenessResult {
  if (!student) {
    return {
      percentage: 0,
      isComplete: false,
      sections: [],
      missingFields: ["Personal Information", "Academic Records", "Desired Study Level"],
    };
  }

  const sections: ProfileSectionStatus[] = [];
  const missing: string[] = [];

  // 1. Personal Info (40%)
  const hasName = Boolean(student.fullName?.trim());
  const hasEmail = Boolean(student.email?.trim());
  const hasPhone = Boolean(student.phone?.trim());
  const hasNationality = Boolean(student.nationality?.trim());
  const hasCountry = Boolean(student.countryOfResidence?.trim());
  const hasDob = Boolean(student.dob?.trim());
  
  const personalCount = [hasName, hasEmail, hasPhone, hasNationality, hasCountry, hasDob].filter(Boolean).length;
  const personalScore = Math.round((personalCount / 6) * 40);
  const personalComplete = personalCount >= 6;
  
  sections.push({
    id: "personal",
    title: "Personal Information",
    weight: 40,
    completed: personalComplete,
    score: personalScore,
    hint: personalComplete ? "Complete" : `${6 - personalCount} fields remaining`,
  });
  if (!personalComplete) {
    const missingFields = [];
    if (!hasName) missingFields.push("Full Name");
    if (!hasEmail) missingFields.push("Email");
    if (!hasPhone) missingFields.push("Phone Number");
    if (!hasDob) missingFields.push("Date of Birth");
    if (!hasNationality) missingFields.push("Nationality");
    if (!hasCountry) missingFields.push("Country of Residence");
    missing.push(`Personal Details (${missingFields.join(", ")})`);
  }

  // 2. Academic History (35%)
  const records = student.academicHistory || [];
  const hasAcademicRecord = records.length > 0 && Boolean(records[0].institution && records[0].gradeGpa && records[0].completionYear);
  const academicScore = hasAcademicRecord ? 35 : 0;
  
  sections.push({
    id: "academic",
    title: "Academic History",
    weight: 35,
    completed: hasAcademicRecord,
    score: academicScore,
    hint: hasAcademicRecord ? `${records.length} record(s) recorded` : "Add your previous degree/grades",
  });
  if (!hasAcademicRecord) missing.push("Academic History (At least 1 qualification with grades)");

  // 3. Desired Study Level (25%)
  const hasStudyLevel = Boolean((student as any).desiredStudyLevel?.trim());
  const studyLevelScore = hasStudyLevel ? 25 : 0;
  
  sections.push({
    id: "desiredStudyLevel",
    title: "Desired Study Level",
    weight: 25,
    completed: hasStudyLevel,
    score: studyLevelScore,
    hint: hasStudyLevel ? (student as any).desiredStudyLevel : "Select intended study level",
  });
  if (!hasStudyLevel) missing.push("Desired Study Level (Please select your degree goal)");

  const totalPercentage = Math.min(100, sections.reduce((sum, s) => sum + s.score, 0));
  
  // 100% completeness is strictly required to proceed to Step 2
  const isComplete = totalPercentage === 100;

  return {
    percentage: totalPercentage,
    isComplete,
    sections,
    missingFields: missing,
  };
}
