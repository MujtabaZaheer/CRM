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
 * Calculates student profile completeness based on strict Master Profile requirements.
 * Excludes Destination/University discovery which happens post-onboarding.
 * 
 * Core admissions components:
 * - Personal Information (20%)
 * - Passport Details (20%)
 * - Academic History (20%)
 * - English Proficiency (20%)
 * - Sponsorship & Background (20%)
 */
export function calculateProfileCompleteness(
  student: Partial<Student> | null | undefined
): ProfileCompletenessResult {
  if (!student) {
    return {
      percentage: 0,
      isComplete: false,
      sections: [],
      missingFields: ["Personal Information", "Passport", "Academic Records", "English Language", "Sponsorship & Background"],
    };
  }

  const sections: ProfileSectionStatus[] = [];
  const missing: string[] = [];

  // 1. Personal Info (20%)
  const hasName = Boolean(student.fullName?.trim());
  const hasEmail = Boolean(student.email?.trim());
  const hasPhone = Boolean(student.phone?.trim());
  const hasNationality = Boolean(student.nationality?.trim());
  const hasCountry = Boolean(student.countryOfResidence?.trim());
  const hasDob = Boolean(student.dob?.trim());
  
  const personalCount = [hasName, hasEmail, hasPhone, hasNationality, hasCountry, hasDob].filter(Boolean).length;
  const personalScore = Math.round((personalCount / 6) * 20);
  const personalComplete = personalCount >= 6;
  
  sections.push({
    id: "personal",
    title: "Personal Information",
    weight: 20,
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

  // 2. Passport (20%)
  const hasPassportNum = Boolean(student.passportNumber?.trim());
  const hasPassportExp = Boolean(student.passportExpiry?.trim());
  const passportHandled = Boolean(
    (hasPassportNum && hasPassportExp) ||
    student.notes?.includes("no_passport_yet") ||
    (student as any).passportAvailable === false
  );
  const passportScore = passportHandled ? 20 : (hasPassportNum ? 10 : 0);
  
  sections.push({
    id: "passport",
    title: "Passport Details",
    weight: 20,
    completed: passportHandled,
    score: passportScore,
    hint: passportHandled ? "Configured" : "Add passport or indicate pending",
  });
  if (!passportHandled) missing.push("Complete Passport Information or indicate if pending");

  // 3. Academic History (20%)
  const records = student.academicHistory || [];
  const hasAcademicRecord = records.length > 0 && Boolean(records[0].institution && records[0].gradeGpa && records[0].completionYear);
  const academicScore = hasAcademicRecord ? 20 : 0;
  
  sections.push({
    id: "academic",
    title: "Academic History",
    weight: 20,
    completed: hasAcademicRecord,
    score: academicScore,
    hint: hasAcademicRecord ? `${records.length} record(s) recorded` : "Add your previous degree/grades",
  });
  if (!hasAcademicRecord) missing.push("Academic History (At least 1 qualification with grades)");

  // 4. English Proficiency (20%)
  const english = student.englishProficiency;
  const hasEnglish = Boolean(
    (english?.testType && english?.overallScore) ||
    english?.testType === "MOI Evidence" ||
    (student as any)?.noEnglishTestYet === true
  );
  const englishScore = hasEnglish ? 20 : 0;
  
  sections.push({
    id: "english",
    title: "English Language",
    weight: 20,
    completed: hasEnglish,
    score: englishScore,
    hint: hasEnglish ? "Recorded" : "Select test or indicate status",
  });
  if (!hasEnglish) missing.push("English test scores or language proficiency status");

  // 5. Sponsorship & Background (20%)
  // Simple check for intended study level to verify they reached the end of the form
  const hasStudyLevel = Boolean((student as any).desiredStudyLevel?.trim());
  
  sections.push({
    id: "background",
    title: "Background & Goals",
    weight: 20,
    completed: hasStudyLevel,
    score: hasStudyLevel ? 20 : 0,
    hint: hasStudyLevel ? "Recorded" : "Complete background questions",
  });
  if (!hasStudyLevel) missing.push("Study level goal and background information");

  const totalPercentage = Math.min(100, sections.reduce((sum, s) => sum + s.score, 0));
  
  // 100% completeness is strictly required to proceed to the application engine
  const isComplete = totalPercentage === 100;

  return {
    percentage: totalPercentage,
    isComplete,
    sections,
    missingFields: missing,
  };
}
