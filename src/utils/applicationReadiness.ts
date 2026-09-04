import { Student } from "../types/student";
import type { PortalDocument } from "../hooks/usePortalData";
import { Programme } from "../types/university";
import { EligibilityResult } from "./eligibility";

export interface ReadinessItem { key: string; label: string; state: "complete" | "missing" | "warning"; detail: string; }
export interface ApplicationReadiness { percentage: number; ready: boolean; items: ReadinessItem[]; }

const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

export const getApplicationReadiness = (student: Student | undefined, programme: Programme | undefined, documents: PortalDocument[], eligibility: EligibilityResult | undefined, responses: Record<string, unknown>, declarationAccepted: boolean): ApplicationReadiness => {
  const items: ReadinessItem[] = [];
  const profileReady = Boolean(student?.fullName && student.email && student.dob && student.academicHistory?.length);
  items.push({ key: "profile", label: "Profile", state: profileReady ? "complete" : "missing", detail: profileReady ? "Personal and academic information is available." : "Complete your personal and academic profile." });
  items.push({ key: "eligibility", label: "Eligibility", state: eligibility?.status === "eligible" ? "complete" : eligibility?.status === "not_eligible" ? "warning" : "missing", detail: eligibility?.disclaimer || "Select a programme to assess eligibility." });
  for (const name of programme?.requiredDocuments || []) {
    const present = documents.some((document) => normalise(document.documentType).includes(normalise(name)) || normalise(document.fileName).includes(normalise(name)));
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
