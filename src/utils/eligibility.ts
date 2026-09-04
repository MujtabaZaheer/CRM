import { Student } from "../types/student";
import { Programme } from "../types/university";

export type EligibilityStatus = "eligible" | "conditional" | "not_eligible" | "not_checked";
export interface EligibilityResult { status: EligibilityStatus; score: number; checks: { label: string; status: "pass" | "review" | "fail"; detail: string }[]; disclaimer: string; }

const score = (value?: string) => Number.parseFloat(value || "");

export function assessEligibility(student: Student | undefined, programme: Programme): EligibilityResult {
  if (!student) return { status: "not_checked", score: 0, checks: [], disclaimer: "Complete your profile to compare it with configured programme requirements." };
  const checks: EligibilityResult["checks"] = [];
  const requirements = programme.requirements || {};
  const recentAcademic = student.academicHistory?.[0];
  const academicScore = score(recentAcademic?.gradeGpa);
  const requiredGpa = requirements.minGpa;
  if (requiredGpa) checks.push(!Number.isNaN(academicScore) ? { label: "Academic score", status: academicScore >= requiredGpa ? "pass" : "fail", detail: `Configured minimum: ${requiredGpa}. Your recorded score: ${academicScore}.` } : { label: "Academic score", status: "review", detail: `Configured minimum: ${requiredGpa}. Add a numeric CGPA to your profile for an exact comparison.` });
  else checks.push({ label: "Academic requirements", status: "review", detail: "Requirements have not yet been configured for this programme." });
  const requiredEnglish = requirements.minIelts ?? programme.minIeltsScore;
  const englishScore = score(student.englishProficiency?.overallScore);
  if (requiredEnglish) checks.push(!Number.isNaN(englishScore) ? { label: "English requirement", status: englishScore >= requiredEnglish ? "pass" : "fail", detail: `Configured minimum: IELTS ${requiredEnglish}. Your recorded score: ${englishScore}.` } : { label: "English requirement", status: "review", detail: `Configured minimum: IELTS ${requiredEnglish}. Add a current English test result to your profile.` });
  if (requirements.prerequisites?.length) checks.push({ label: "Prerequisites", status: "review", detail: `${requirements.prerequisites.join(", ")} require staff or university verification.` });
  const failures = checks.filter((check) => check.status === "fail").length;
  const reviews = checks.filter((check) => check.status === "review").length;
  const status: EligibilityStatus = failures ? "not_eligible" : reviews ? "conditional" : "eligible";
  return { status, score: Math.max(0, 100 - failures * 45 - reviews * 15), checks, disclaimer: "This assessment compares your profile with requirements configured in EduCRM. It is not a guarantee of admission; final decisions are made by the university." };
}
