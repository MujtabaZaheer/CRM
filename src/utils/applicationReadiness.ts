import { Student } from "../types/student";
import type { PortalDocument } from "../hooks/usePortalData";
import { Programme } from "../types/university";
import { EligibilityResult } from "./eligibility";

export interface ReadinessItem { key: string; label: string; state: "complete" | "missing" | "warning"; detail: string; }
export interface ApplicationReadiness { percentage: number; ready: boolean; items: ReadinessItem[]; }

export const normalise = (value?: string | null) => (value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

export const isDocumentMatch = (docTypeOrName?: string | null, requiredName?: string | null): boolean => {
  const d = normalise(docTypeOrName);
  const r = normalise(requiredName);
  if (!d || !r) return false;
  if (d === r) return true;

  // Category 1: High School / Secondary / Matric / Intermediate
  const isHighSchoolReq = r.includes("highschool") || r.includes("secondary") || r.includes("matric") || r.includes("intermediate") || r.includes("olevel") || r.includes("alevel") || r.includes("10th") || r.includes("12th") || r.includes("ssc") || r.includes("hssc");
  const isHighSchoolDoc = d.includes("highschool") || d.includes("secondary") || d.includes("matric") || d.includes("intermediate") || d.includes("olevel") || d.includes("alevel") || d.includes("10th") || d.includes("12th") || d.includes("ssc") || d.includes("hssc");

  if (isHighSchoolReq) {
    return isHighSchoolDoc;
  }
  // If document is explicitly high school, never match university/academic transcript or degree
  if (isHighSchoolDoc && (r.includes("academic") || r.includes("degree") || r.includes("university") || r.includes("college"))) {
    return false;
  }

  // Category 2: English Language Proficiency (IELTS, TOEFL, PTE, Duolingo, MOI)
  const isEnglishReq = r.includes("english") || r.includes("ielts") || r.includes("toefl") || r.includes("pte") || r.includes("duolingo") || r.includes("proficiency") || r.includes("cambridge") || r.includes("languagecert");
  const isEnglishDoc = d.includes("english") || d.includes("ielts") || d.includes("toefl") || d.includes("pte") || d.includes("duolingo") || d.includes("proficiency") || d.includes("cambridge") || d.includes("languagecert");

  if (isEnglishReq) {
    return isEnglishDoc;
  }
  // English certificates should NEVER match general degree or graduation certificate slots
  if (isEnglishDoc && (r.includes("degree") || r.includes("graduation") || r.includes("diploma"))) {
    return false;
  }

  // Category 3: Degree / Graduation / Provisional Award Certificate
  const isDegreeReq = r.includes("degree") || r.includes("graduation") || r.includes("provisional");
  const isDegreeDoc = (d.includes("degree") || d.includes("graduation") || d.includes("provisional")) && !isEnglishDoc && !isHighSchoolDoc;

  if (isDegreeReq) {
    return isDegreeDoc;
  }
  if (isDegreeDoc && (r.includes("english") || r.includes("language") || isEnglishReq)) {
    return false;
  }

  // Category 4: University / Higher Education Academic Transcript
  const isAcademicTranscriptReq = r.includes("academictranscript") || (r.includes("transcript") && !isHighSchoolReq);
  const isAcademicTranscriptDoc = d.includes("transcript") && !isHighSchoolDoc;

  if (isAcademicTranscriptReq) {
    return isAcademicTranscriptDoc;
  }

  // Category 5: Statement of Purpose / SOP / Essay
  const isSopReq = r.includes("statement") || r.includes("sop") || r.includes("purpose") || r.includes("essay") || r.includes("motivation");
  const isSopDoc = d.includes("statement") || d.includes("sop") || d.includes("purpose") || d.includes("essay") || d.includes("motivation");
  if (isSopReq) {
    return isSopDoc;
  }

  // Category 6: Passport / Travel Document
  const isPassportReq = r.includes("passport") || r.includes("traveldoc");
  const isPassportDoc = d.includes("passport") || d.includes("traveldoc");
  if (isPassportReq) {
    return isPassportDoc;
  }

  // Category 7: CV / Resume
  const isCvReq = r.includes("cv") || r.includes("resume") || r.includes("curriculumvitae");
  const isCvDoc = d.includes("cv") || d.includes("resume") || d.includes("curriculumvitae");
  if (isCvReq) {
    return isCvDoc;
  }

  // Safe fallback if strings match directly and don't cross categories
  if (d.includes(r) || r.includes(d)) return true;

  return false;
};

export const getApplicationReadiness = (student: Student | undefined, programme: Programme | undefined, documents: PortalDocument[], eligibility: EligibilityResult | undefined, responses: Record<string, unknown>, declarationAccepted: boolean): ApplicationReadiness => {
  const items: ReadinessItem[] = [];
  const profileReady = Boolean(student?.fullName && student.email && student.dob && student.academicHistory?.length);
  items.push({ key: "profile", label: "Profile", state: profileReady ? "complete" : "missing", detail: profileReady ? "Personal and academic information is available." : "Complete your personal and academic profile." });
  
  // Eligibility: only warn if strictly not_eligible. Conditional/competitive/eligible reviews are non-blocking.
  const eligState = eligibility?.status === "not_eligible" ? "warning" : eligibility?.status === "not_checked" ? "missing" : "complete";
  items.push({ key: "eligibility", label: "Eligibility", state: eligState, detail: eligibility?.disclaimer || "Select a programme to assess eligibility." });
  
  for (const name of programme?.requiredDocuments || []) {
    const present = (documents || []).some((document: any) => {
      const docType = document?.documentType || document?.type || "";
      const docName = document?.fileName || document?.name || "";
      return isDocumentMatch(docType, name) || isDocumentMatch(docName, name);
    });
    items.push({ key: `document-${name}`, label: name, state: present ? "complete" : "missing", detail: present ? "Uploaded to your document vault." : "Upload this required document." });
  }
  for (const field of programme?.applicationForm || []) if (field.required) {
    const value = responses[field.id];
    items.push({ key: `question-${field.id}`, label: field.label, state: value === undefined || value === "" || value === false ? "missing" : "complete", detail: field.helpText || (value ? "Completed." : "This university question is required.") });
  }
  items.push({ key: "declaration", label: "Declaration", state: declarationAccepted ? "complete" : "missing", detail: declarationAccepted ? "Accepted." : "Confirm the accuracy and processing declaration." });
  const complete = items.filter((item) => item.state === "complete").length;
  const blocking = items.some((item) => item.state === "missing");
  return { percentage: items.length ? Math.round((complete / items.length) * 100) : 0, ready: !blocking && eligibility?.status !== "not_eligible", items };
};
