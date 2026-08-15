/**
 * EduCRM GDPR & Data Privacy Compliance Engine
 * Provides Right of Access (Data Export JSON) and Right to be Forgotten (Anonymization).
 */

import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export interface GdprExportPayload {
  exportDate: string;
  studentId: string;
  studentProfile: any;
  leads: any[];
  applications: any[];
  auditLogs: any[];
}

/**
 * Right of Access: Export all personal data stored for a student into a structured JSON payload
 */
export async function exportStudentGdprData(studentEmail: string): Promise<GdprExportPayload> {
  const cleanEmail = studentEmail.trim().toLowerCase();

  // Fetch student profile
  const studentQ = query(collection(db, "students"), where("email", "==", cleanEmail));
  const studentSnap = await getDocs(studentQ);
  const studentProfile = studentSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Fetch leads
  const leadQ = query(collection(db, "leads"), where("email", "==", cleanEmail));
  const leadSnap = await getDocs(leadQ);
  const leads = leadSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Fetch applications
  const appQ = query(collection(db, "applications"), where("studentEmail", "==", cleanEmail));
  const appSnap = await getDocs(appQ);
  const applications = appSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return {
    exportDate: new Date().toISOString(),
    studentId: cleanEmail,
    studentProfile: studentProfile[0] || null,
    leads,
    applications,
    auditLogs: [],
  };
}

/**
 * Right to be Forgotten: Anonymize all Personally Identifiable Information (PII) in Firestore
 */
export async function anonymizeStudentGdprData(studentEmail: string): Promise<number> {
  const cleanEmail = studentEmail.trim().toLowerCase();
  let updatedCount = 0;

  // Anonymize Leads
  const leadQ = query(collection(db, "leads"), where("email", "==", cleanEmail));
  const leadSnap = await getDocs(leadQ);

  for (const leadDoc of leadSnap.docs) {
    await updateDoc(doc(db, "leads", leadDoc.id), {
      name: "ANONYMIZED_GDPR_USER",
      email: `anonymized_${leadDoc.id}@gdpr-erased.invalid`,
      phone: "[ERASED]",
      passportNumber: "[ERASED]",
      gdprAnonymized: true,
      anonymizedAt: Date.now(),
    });
    updatedCount++;
  }

  // Anonymize Students
  const studentQ = query(collection(db, "students"), where("email", "==", cleanEmail));
  const studentSnap = await getDocs(studentQ);

  for (const stDoc of studentSnap.docs) {
    await updateDoc(doc(db, "students", stDoc.id), {
      fullName: "ANONYMIZED_GDPR_USER",
      email: `anonymized_${stDoc.id}@gdpr-erased.invalid`,
      phone: "[ERASED]",
      passportNumber: "[ERASED]",
      address: "[ERASED]",
      gdprAnonymized: true,
      anonymizedAt: Date.now(),
    });
    updatedCount++;
  }

  return updatedCount;
}
