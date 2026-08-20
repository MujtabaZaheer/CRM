/**
 * EduCRM Multi-University Application Cloning Engine
 * Enables counsellors and applicants to clone completed student application dossiers
 * (qualifications, transcripts, personal statement, passport) to apply to additional
 * university choices with a single click.
 */

import { addDoc, collection, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { Application, ApplicationDocumentRequirement } from "../types/application";
import { logAuditEvent } from "./auditLogger";

/**
 * Returns required document checklist customized for destination country.
 */
export function getRequiredDocumentsForCountry(country: string): ApplicationDocumentRequirement[] {
  const c = country.toLowerCase();

  const common: ApplicationDocumentRequirement[] = [
    { docType: "Passport", required: true, uploaded: true },
    { docType: "Academic Transcript", required: true, uploaded: true },
    { docType: "Degree Certificate", required: true, uploaded: true },
    { docType: "Personal Statement", required: true, uploaded: true },
  ];

  if (c.includes("united kingdom") || c.includes("uk")) {
    return [
      ...common,
      { docType: "IELTS / English Test (UKVI)", required: true, uploaded: false },
      { docType: "TB Medical Certificate", required: true, uploaded: false },
      { docType: "Reference Letter (Academic)", required: true, uploaded: false },
      { docType: "Bank Statement (28-Day Holding)", required: true, uploaded: false },
    ];
  }

  if (c.includes("canada")) {
    return [
      ...common,
      { docType: "IELTS / English Test", required: true, uploaded: false },
      { docType: "GIC Certificate ($20,635 CAD)", required: true, uploaded: false },
      { docType: "Letter of Explanation (SOP)", required: true, uploaded: false },
      { docType: "CAQ Certificate (Quebec only)", required: false, uploaded: false },
    ];
  }

  if (c.includes("australia")) {
    return [
      ...common,
      { docType: "IELTS / PTE Academic Score", required: true, uploaded: false },
      { docType: "Genuine Student (GS) Statement", required: true, uploaded: false },
      { docType: "Financial Matrix & Source Proof", required: true, uploaded: false },
      { docType: "Overseas Student Health Cover (OSHC)", required: true, uploaded: false },
    ];
  }

  if (c.includes("united states") || c.includes("usa")) {
    return [
      ...common,
      { docType: "TOEFL / IELTS Score Report", required: true, uploaded: false },
      { docType: "Affidavit of Financial Support (I-20 Proof)", required: true, uploaded: false },
      { docType: "Bank Statement ($45,000+ USD)", required: true, uploaded: false },
      { docType: "WES Evaluation (If applicable)", required: false, uploaded: false },
    ];
  }

  return common;
}

/**
 * Clones an existing application to a new target university & programme.
 */
export async function cloneApplication(
  sourceApplicationId: string,
  targetUniversityName: string,
  targetProgrammeName: string,
  targetIntake: string,
  userEmail = "Counsellor",
  userRole?: string
): Promise<string> {
  const snap = await getDoc(doc(db, "applications", sourceApplicationId));
  if (!snap.exists()) {
    throw new Error("Source application does not exist.");
  }

  const src = snap.data() as Application;
  const targetCountry = src.targetCountry || "United Kingdom";

  const clonedPayload: Omit<Application, "id"> = {
    applicationNumber: `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    studentId: src.studentId,
    studentName: src.studentName,
    universityId: "univ-custom",
    universityName: targetUniversityName,
    programmeId: "prog-custom",
    programmeName: targetProgrammeName,
    intake: targetIntake,
    targetCountry,
    stage: "Draft",
    assignedCounsellor: src.assignedCounsellor,
    clonedFrom: sourceApplicationId,
    requiredDocuments: getRequiredDocumentsForCountry(targetCountry),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const docRef = await addDoc(collection(db, "applications"), clonedPayload);
  await logAuditEvent(
    "APPLICATION_CLONED",
    userEmail,
    "Application",
    `Cloned application #${sourceApplicationId.slice(-6)} to ${targetUniversityName} (${targetProgrammeName})`,
    docRef.id,
    userRole
  );

  return docRef.id;
}
