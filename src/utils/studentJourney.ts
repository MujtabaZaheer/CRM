/**
 * EduCRM Unified Student Journey Timeline Engine
 * Aggregates multi-channel events (lead intake, form submissions, document uploads,
 * application status milestones, tasks, notes, invoices, and visa grants) into a chronological journey.
 */

import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";

export interface JourneyMilestone {
  key: string;
  label: string;
  isCompleted: boolean;
  completedAt?: number;
  description: string;
}

export interface JourneyEvent {
  id: string;
  type: "lead" | "application" | "document" | "finance" | "communication" | "task" | "consent";
  title: string;
  description: string;
  author: string;
  timestamp: number;
  badgeColor?: "emerald" | "blue" | "amber" | "purple" | "rose";
}

export const STANDARD_JOURNEY_MILESTONES: JourneyMilestone[] = [
  { key: "LEAD_CAPTURED", label: "Lead Ingested", isCompleted: true, description: "Applicant registered or submitted enquiry form." },
  { key: "PROFILE_COMPLETED", label: "Profile Completed", isCompleted: false, description: "Academic history, passport, and English scores submitted." },
  { key: "DOCUMENTS_VERIFIED", label: "Documents Verified", isCompleted: false, description: "All required compliance credentials passed QA audit." },
  { key: "APPLICATION_SUBMITTED", label: "Applications Lodged", isCompleted: false, description: "Dossier submitted to partner universities." },
  { key: "OFFER_RECEIVED", label: "Offer Received", isCompleted: false, description: "Conditional or unconditional acceptance letter issued." },
  { key: "DEPOSIT_PAID", label: "Tuition Deposit Paid", isCompleted: false, description: "Seat confirmation deposit processed." },
  { key: "CAS_ISSUED", label: "CAS / I-20 / COE Issued", isCompleted: false, description: "Official visa sponsorship reference released." },
  { key: "VISA_APPROVED", label: "Visa Granted", isCompleted: false, description: "Student entry visa approved." },
  { key: "ENROLLED", label: "Arrived & Enrolled", isCompleted: false, description: "Student campus arrival & enrollment confirmed." },
];

/**
 * Fetches and stitches together all student events into an interactive journey feed.
 */
export async function getStudentJourneyFeed(studentId: string): Promise<JourneyEvent[]> {
  const events: JourneyEvent[] = [];

  try {
    // 1. Fetch Audit Logs for this student
    const auditQ = query(
      collection(db, "audit_logs"),
      where("entityId", "==", studentId),
      orderBy("timestamp", "desc")
    );
    const auditSnap = await getDocs(auditQ);
    auditSnap.forEach((doc) => {
      const data = doc.data();
      events.push({
        id: doc.id,
        type: "lead",
        title: data.action?.replace(/_/g, " ") || "Activity Logged",
        description: data.details || "",
        author: data.userEmail || "Staff",
        timestamp: data.timestamp || Date.now(),
        badgeColor: "emerald",
      });
    });
  } catch (err) {
    console.warn("Could not query audit logs for journey:", err);
  }

  // 2. Fetch Application History for this student
  try {
    const appQ = query(collection(db, "applications"), where("studentId", "==", studentId));
    const appSnap = await getDocs(appQ);
    appSnap.forEach((doc) => {
      const app = doc.data();
      if (app.history && Array.isArray(app.history)) {
        app.history.forEach((h: any, idx: number) => {
          events.push({
            id: `${doc.id}-hist-${idx}`,
            type: "application",
            title: `Application #${app.applicationNumber || doc.id.slice(-6)}: ${h.stage}`,
            description: `${app.universityName} (${app.programmeName}) - ${h.note || ""}`,
            author: h.updatedBy || "System",
            timestamp: h.timestamp || Date.now(),
            badgeColor: "blue",
          });
        });
      }
    });
  } catch (err) {
    console.warn("Could not query applications for journey:", err);
  }

  // 3. Fetch Document events for this student
  try {
    const docQ = query(collection(db, "student_documents"), where("studentId", "==", studentId));
    const docSnap = await getDocs(docQ);
    docSnap.forEach((d) => {
      const data = d.data();
      events.push({
        id: d.id,
        type: "document",
        title: `Uploaded ${data.docType}`,
        description: `${data.fileName} (v${data.versionNumber || 1}) - Status: ${data.status}`,
        author: data.uploadedBy || "Student",
        timestamp: data.createdAt || Date.now(),
        badgeColor: "purple",
      });
    });
  } catch (err) {
    console.warn("Could not query documents for journey:", err);
  }

  // Sort all events newest first
  events.sort((a, b) => b.timestamp - a.timestamp);
  return events;
}
