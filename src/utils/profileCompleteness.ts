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
 * Calculates student profile completeness based on centralized criteria.
 * Core admissions components:
 * - Personal Information (30%)
 * - Passport Details (15%)
 * - Academic History (25%)
 * - English Proficiency (15%)
 * - Study Goals & Preferences (15%)
 */
export function calculateProfileCompleteness(
  student: Partial<Student> | null | undefined
): ProfileCompletenessResult {
  if (!student) {
    return {
      percentage: 0,
      isComplete: false,
      sections: [],
      missingFields: ["Personal Information", "Academic Records", "English Language", "Study Goals"],
    };
  }

  const sections: ProfileSectionStatus[] = [];
  const missing: string[] = [];

  // 1. Personal Info (30%)
  const hasName = Boolean(student.fullName?.trim());
  const hasEmail = Boolean(student.email?.trim());
  const hasPhone = Boolean(student.phone?.trim());
  const hasNationality = Boolean(student.nationality?.trim());
  const hasCountry = Boolean(student.countryOfResidence?.trim());
  const personalCount = [hasName, hasEmail, hasPhone, hasNationality, hasCountry].filter(Boolean).length;
  const personalScore = Math.round((personalCount / 5) * 30);
  sections.push({
    id: "personal",
    title: "Personal Information",
    weight: 30,
    completed: personalCount >= 4,
    score: personalScore,
    hint: personalCount >= 4 ? "Complete" : `${5 - personalCount} fields remaining`,
  });
  if (personalCount < 4) missing.push("Personal details (Name, Phone, Nationality)");

  // 2. Passport (15%)
  // Either has valid passport details OR has explicitly marked no passport yet
  const hasPassportNum = Boolean(student.passportNumber?.trim());
  const hasPassportExp = Boolean(student.passportExpiry?.trim());
  const passportHandled = Boolean(
    (hasPassportNum && hasPassportExp) ||
    student.notes?.includes("no_passport_yet") ||
    (student as any).passportAvailable === false
  );
  const passportScore = passportHandled ? 15 : hasPassportNum ? 10 : 0;
  sections.push({
    id: "passport",
    title: "Passport Details",
    weight: 15,
    completed: passportHandled,
    score: passportScore,
    hint: passportHandled ? "Configured" : "Add passport or indicate pending",
  });
  if (!passportHandled) missing.push("Passport Information");

  // 3. Academic History (25%)
  const records = student.academicHistory || [];
  const hasAcademicRecord = records.length > 0 && Boolean(records[0].institution && records[0].gradeGpa);
  const academicScore = hasAcademicRecord ? 25 : records.length > 0 ? 15 : 0;
  sections.push({
    id: "academic",
    title: "Academic History",
    weight: 25,
    completed: hasAcademicRecord,
    score: academicScore,
    hint: hasAcademicRecord ? `${records.length} record(s) recorded` : "Add your previous degree/grades",
  });
  if (!hasAcademicRecord) missing.push("Academic History (At least 1 qualification with grades)");

  // 4. English Proficiency (15%)
  const english = student.englishProficiency;
  const hasEnglish = Boolean(
    english?.overallScore ||
    english?.testType === "MOI Evidence" ||
    (english as any)?.noTestYet
  );
  const englishScore = hasEnglish ? 15 : 0;
  sections.push({
    id: "english",
    title: "English Language",
    weight: 15,
    completed: hasEnglish,
    score: englishScore,
    hint: hasEnglish ? `${english?.testType || "Language status"}: ${english?.overallScore || "Recorded"}` : "Select test or indicate status",
  });
  if (!hasEnglish) missing.push("English test or language proficiency");

  // 5. Study Preferences & Destination (15%)
  const hasDestination = Boolean(student.preferredDestination?.trim() || (student as any).preferredDestinations?.length);
  const hasIntake = Boolean(student.preferredIntake?.trim());
  const prefCount = [hasDestination, hasIntake].filter(Boolean).length;
  const prefScore = Math.round((prefCount / 2) * 15);
  sections.push({
    id: "preferences",
    title: "Study Destinations & Goals",
    weight: 15,
    completed: prefCount >= 1,
    score: prefScore,
    hint: hasDestination ? "Destination preferences set" : "Choose target study destinations",
  });
  if (prefCount === 0) missing.push("Study destination preferences");

  const totalPercentage = Math.min(100, sections.reduce((sum, s) => sum + s.score, 0));
  const isComplete = totalPercentage >= 70 && hasAcademicRecord && hasName;

  return {
    percentage: totalPercentage,
    isComplete,
    sections,
    missingFields: missing,
  };
}
