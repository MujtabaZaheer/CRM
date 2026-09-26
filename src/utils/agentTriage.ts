/**
 * EduCRM Agent Referral Triage & Isolation Engine
 * Prevents unverified/draft agent-referred candidates from leaking into the Admissions queue.
 * Controls the Triage Desk gate and executes compliance sign-off.
 */

import { doc, updateDoc, collection, addDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { AppUser } from "../types/role";

export interface TriageSubmissionResult {
  success: boolean;
  studentId: string;
  applicationId?: string;
  auditLogId?: string;
  error?: string;
}

/**
 * Validates whether the user is authorized to access the Agent Triage Desk.
 * Allowed: Team Leaders, Office Managers, Org Admins, Platform Super Admins.
 * Explicitly denied: Counsellors, Admissions Officers, External Agents, and Students.
 */
export function canAccessAgentTriage(user: AppUser | null): boolean {
  if (!user) return false;
  const permittedRoles = [
    "team_leader",
    "office_manager",
    "org_admin",
    "platform_super_admin",
  ];
  return permittedRoles.includes(user.role);
}

/**
 * Evaluates whether a record (student or application) is visible to a given user role.
 * Admissions Officers CANNOT view records where admissionsVisibility is false.
 */
export function isAdmissionsVisible(
  record: { admissionsVisibility?: boolean; agentReferred?: boolean },
  userRole?: string
): boolean {
  if (userRole === "admissions_officer") {
    // If explicitly marked as not visible to admissions
    if (record.admissionsVisibility === false) return false;
    // If agent-referred and not yet vetted/approved
    if (record.agentReferred && record.admissionsVisibility !== true) return false;
    return true;
  }
  // Other staff roles (counsellor, triage officers, super admins) can see all records
  return true;
}

/**
 * Filters a list of records to enforce admissions queue isolation.
 * Automatically excludes unvetted agent dossiers when viewed by an Admissions Officer.
 */
export function filterForAdmissionsDesk<
  T extends { admissionsVisibility?: boolean; agentReferred?: boolean }
>(records: T[], userRole?: string): T[] {
  if (!userRole || userRole !== "admissions_officer") {
    return records;
  }
  return records.filter((r) => isAdmissionsVisible(r, userRole));
}

/**
 * Submits an agent-referred student (and associated application) to the Admissions Desk.
 * Marks record admissionsVisibility: true, logs an immutable audit event,
 * and triggers a handoff notification to Admissions.
 */
export async function submitStudentToAdmissions(
  studentId: string,
  applicationId: string | undefined,
  notes: string,
  actor: AppUser,
  studentName?: string
): Promise<TriageSubmissionResult> {
  if (!canAccessAgentTriage(actor) && actor.role !== "counsellor") {
    return {
      success: false,
      studentId,
      error: "You do not possess the required credentials to vet and submit agent referrals to Admissions.",
    };
  }

  const now = Date.now();
  const actorName = actor.displayName || actor.email;

  try {
    // 1. Update Student record in Firestore
    const studentRef = doc(db, "students", studentId);
    await updateDoc(studentRef, {
      admissionsVisibility: true,
      vettingStatus: "submitted_to_admissions",
      vettedBy: actorName,
      vettedAt: now,
      vettingNotes: notes || "Document verification and academic compliance checks passed.",
      updatedAt: now,
    });

    // 2. Update Application record in Firestore if specified
    if (applicationId) {
      const appRef = doc(db, "applications", applicationId);
      await updateDoc(appRef, {
        admissionsVisibility: true,
        vettingStatus: "submitted_to_admissions",
        vettedBy: actorName,
        vettedAt: now,
        vettingNotes: notes || "Document verification and academic compliance checks passed.",
        assignedDepartment: "Admissions",
        updatedAt: now,
      });
    }

    // 3. Append immutable audit event to audit_logs
    let auditLogId: string | undefined;
    try {
      const auditRef = await addDoc(collection(db, "audit_logs"), {
        action: "AGENT_STUDENT_VETTED_AND_SUBMITTED",
        performedBy: actor.email,
        performedByRole: actor.role,
        targetEntity: "Student",
        targetId: studentId,
        details: `Vetted agent referral for ${studentName || studentId} and released to Admissions Desk. Verification notes: ${notes || "None"}`,
        metadata: {
          studentId,
          applicationId: applicationId || null,
          studentName: studentName || "Unknown",
          vettedBy: actorName,
          vettedAt: now,
          notes,
        },
        timestamp: now,
        source: "agent_triage_desk",
      });
      auditLogId = auditRef.id;
    } catch (auditErr) {
      console.warn("Audit log notice during triage submission:", auditErr);
    }

    // 4. Dispatch notification to Admissions staff
    try {
      await addDoc(collection(db, "notifications"), {
        title: `🎓 Vetted Agent Dossier: ${studentName || "New Student"}`,
        message: `Candidate has passed document & academic compliance checks by ${actorName} and is now ready for admissions review.`,
        type: "system",
        targetUser: "admissions_officer",
        link: "/applications",
        read: false,
        createdAt: now,
      });
    } catch (notifErr) {
      console.warn("Notification notice during triage handoff:", notifErr);
    }

    return {
      success: true,
      studentId,
      applicationId,
      auditLogId,
    };
  } catch (err: any) {
    console.error("Failed to submit student to admissions:", err);
    return {
      success: false,
      studentId,
      error: err.message || "Failed to persist admissions release.",
    };
  }
}
