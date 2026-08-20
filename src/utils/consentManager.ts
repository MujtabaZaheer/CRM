/**
 * EduCRM Consent & Privacy Management
 * Handles consent recording, revocation, data subject access requests (DSAR),
 * and right-to-erasure (anonymization) across all collections.
 */

import { collection, query, where, getDocs, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export interface ConsentRecord {
  id?: string;
  userId: string;
  userEmail: string;
  consentType: "data_processing" | "marketing" | "third_party_sharing" | "cookies";
  version: string;
  grantedAt: number;
  revokedAt?: number;
  ipFingerprint?: string;
}

export interface DataExportPackage {
  exportDate: string;
  userId: string;
  userProfile: any;
  studentProfile: any;
  leads: any[];
  applications: any[];
  documents: any[];
  communications: any[];
  tasks: any[];
  consentRecords: any[];
  auditLogs: any[];
}

/**
 * Record a new consent grant for a user.
 */
export async function recordConsent(
  userId: string,
  userEmail: string,
  consentType: ConsentRecord["consentType"],
  version: string = "v1.0"
): Promise<string> {
  const ipFingerprint = typeof navigator !== "undefined" ? btoa(navigator.userAgent).slice(0, 32) : "unknown";
  const docRef = await addDoc(collection(db, "consent_records"), {
    userId,
    userEmail: userEmail.toLowerCase(),
    consentType,
    version,
    grantedAt: Date.now(),
    ipFingerprint,
  });
  return docRef.id;
}

/**
 * Revoke a specific consent type for a user.
 */
export async function revokeConsent(
  userId: string,
  consentType: ConsentRecord["consentType"]
): Promise<number> {
  const q = query(
    collection(db, "consent_records"),
    where("userId", "==", userId),
    where("consentType", "==", consentType)
  );
  const snap = await getDocs(q);
  let count = 0;
  for (const d of snap.docs) {
    if (!d.data().revokedAt) {
      await updateDoc(doc(db, "consent_records", d.id), { revokedAt: Date.now() });
      count++;
    }
  }
  return count;
}

/**
 * Get all active (non-revoked) consents for a user.
 */
export async function getConsentStatus(userId: string): Promise<ConsentRecord[]> {
  const q = query(collection(db, "consent_records"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as ConsentRecord))
    .filter((c) => !c.revokedAt);
}

/**
 * Data Subject Access Request (DSAR):
 * Aggregates all user data from every collection into a single exportable JSON package.
 */
export async function generateDataExportPackage(userId: string, userEmail: string): Promise<DataExportPackage> {
  const email = userEmail.trim().toLowerCase();

  // User profile
  const userQ = query(collection(db, "users"), where("email", "==", email));
  const userSnap = await getDocs(userQ);
  const userProfile = userSnap.docs.map((d) => ({ id: d.id, ...d.data() }))[0] || null;

  // Student profile
  const studentQ = query(collection(db, "students"), where("email", "==", email));
  const studentSnap = await getDocs(studentQ);
  const studentProfile = studentSnap.docs.map((d) => ({ id: d.id, ...d.data() }))[0] || null;

  // Leads
  const leadQ = query(collection(db, "leads"), where("email", "==", email));
  const leadSnap = await getDocs(leadQ);
  const leads = leadSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Applications (by studentId if found)
  let applications: any[] = [];
  if (studentProfile) {
    const appQ = query(collection(db, "applications"), where("studentId", "==", studentProfile.id));
    const appSnap = await getDocs(appQ);
    applications = appSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  // Documents
  let documents: any[] = [];
  if (studentProfile) {
    const docQ = query(collection(db, "student_documents"), where("studentId", "==", studentProfile.id));
    const docSnap = await getDocs(docQ);
    documents = docSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  // Communications
  const commQ = query(collection(db, "communications"), where("recipientEmail", "==", email));
  const commSnap = await getDocs(commQ);
  const communications = commSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Tasks
  const taskQ = query(collection(db, "tasks"), where("assignedTo", "==", email));
  const taskSnap = await getDocs(taskQ);
  const tasks = taskSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Consent records
  const consentQ = query(collection(db, "consent_records"), where("userId", "==", userId));
  const consentSnap = await getDocs(consentQ);
  const consentRecords = consentSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Audit logs
  const auditQ = query(collection(db, "audit_logs"), where("performedBy", "==", email));
  const auditSnap = await getDocs(auditQ);
  const auditLogs = auditSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return {
    exportDate: new Date().toISOString(),
    userId,
    userProfile,
    studentProfile,
    leads,
    applications,
    documents,
    communications,
    tasks,
    consentRecords,
    auditLogs,
  };
}

/**
 * Right to Erasure: Anonymize all PII fields across all collections.
 * Returns the total number of documents anonymized.
 */
export async function anonymizeUserData(userId: string, userEmail: string): Promise<number> {
  const email = userEmail.trim().toLowerCase();
  let total = 0;

  const ANON = "[REDACTED]";
  const anonEmail = `anonymized_${userId}@gdpr-erased.invalid`;

  // Leads
  const leadQ = query(collection(db, "leads"), where("email", "==", email));
  const leadSnap = await getDocs(leadQ);
  for (const d of leadSnap.docs) {
    await updateDoc(doc(db, "leads", d.id), {
      fullName: ANON, email: anonEmail, phone: ANON, passportNumber: ANON,
      gdprAnonymized: true, anonymizedAt: Date.now(),
    });
    total++;
  }

  // Students
  const studentQ = query(collection(db, "students"), where("email", "==", email));
  const studentSnap = await getDocs(studentQ);
  for (const d of studentSnap.docs) {
    await updateDoc(doc(db, "students", d.id), {
      fullName: ANON, email: anonEmail, phone: ANON, passportNumber: ANON,
      dob: ANON, notes: ANON,
      gdprAnonymized: true, anonymizedAt: Date.now(),
    });
    total++;
  }

  // Users
  const userQ = query(collection(db, "users"), where("email", "==", email));
  const userSnap = await getDocs(userQ);
  for (const d of userSnap.docs) {
    await updateDoc(doc(db, "users", d.id), {
      displayName: ANON, email: anonEmail,
      gdprAnonymized: true, anonymizedAt: Date.now(),
    });
    total++;
  }

  // Communications
  const commQ = query(collection(db, "communications"), where("recipientEmail", "==", email));
  const commSnap = await getDocs(commQ);
  for (const d of commSnap.docs) {
    await updateDoc(doc(db, "communications", d.id), {
      recipientEmail: anonEmail, recipientName: ANON,
      body: ANON, gdprAnonymized: true, anonymizedAt: Date.now(),
    });
    total++;
  }

  // Consent records — mark all as revoked
  const consentQ = query(collection(db, "consent_records"), where("userId", "==", userId));
  const consentSnap = await getDocs(consentQ);
  for (const d of consentSnap.docs) {
    await updateDoc(doc(db, "consent_records", d.id), {
      userEmail: anonEmail, revokedAt: Date.now(),
    });
    total++;
  }

  return total;
}

/**
 * Data Retention: Flag records older than the configured retention period.
 */
export const DATA_RETENTION_DAYS = 2555; // ~7 years

export async function flagExpiredRecords(): Promise<{ collection: string; count: number }[]> {
  const cutoffMs = Date.now() - DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const results: { collection: string; count: number }[] = [];

  const collections = ["leads", "students", "applications", "communications"];
  for (const col of collections) {
    const q = query(collection(db, col), where("createdAt", "<", cutoffMs));
    const snap = await getDocs(q);
    if (snap.size > 0) {
      results.push({ collection: col, count: snap.size });
    }
  }

  return results;
}
