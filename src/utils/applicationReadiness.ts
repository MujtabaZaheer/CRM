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
  if (d.includes(r) || r.includes(d)) return true;
  
  // High School Transcript matching: matches high school, secondary, or academic transcript
  if (r.includes("highschool") || r.includes("secondary")) {
    return d.includes("highschool") || d.includes("secondary") || d.includes("transcript");
  }
  // General Transcript matching
  if (r.includes("transcript") && d.includes("transcript")) return true;
  // Degree / Graduation Certificate matching
  if ((r.includes("degree") || r.includes("graduation") || r.includes("certificate")) &&
      (d.includes("degree") || d.includes("graduation") || d.includes("certificate"))) {
    return true;
  }
  // Statement of Purpose / SOP / Essay / Personal Statement matching
  if ((r.includes("statement") || r.includes("sop") || r.includes("purpose") || r.includes("essay")) &&
      (d.includes("statement") || d.includes("sop") || d.includes("purpose") || d.includes("essay"))) {
    return true;
  }
  // Passport matching
  if (r.includes("passport") && d.includes("passport")) return true;
  // English Language Test matching
  if ((r.includes("english") || r.includes("ielts") || r.includes("toefl") || r.includes("pte")) &&
      (d.includes("english") || d.includes("ielts") || d.includes("toefl") || d.includes("pte"))) {
    return true;
  }
  // CV / Resume matching
  if ((r.includes("cv") || r.includes("resume")) && (d.includes("cv") || d.includes("resume"))) {
    return true;
  }
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
