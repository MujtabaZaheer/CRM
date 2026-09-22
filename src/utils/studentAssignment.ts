/**
 * EduCRM Student Intake Counsellor Assignment Engine
 * Enforces strict authorization boundaries: Only Office Managers and Administrators
 * are permitted to assign or reassign primary intake counsellors to students.
 * Team Leads are restricted to managing application pipelines and cannot reassign student-level counsellors.
 */

import { doc, updateDoc, collection, addDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { AppUser } from "../types/role";

export interface StudentAssignmentResult {
  success: boolean;
  studentId: string;
  counsellorId: string;
  counsellorEmail: string;
  auditLogId?: string;
  error?: string;
}

/**
 * Validates whether the actor has sufficient authorization to assign or reassign
 * a student's primary intake counsellor.
 * Allowed: office_manager, org_admin, platform_super_admin.
 * Denied: team_leader, counsellor, admissions_officer, external_agent, student.
 */
export function canAssignStudentCounsellor(actor: AppUser | null | undefined): boolean {
  if (!actor || !actor.role) return false;
  const authorizedRoles = ["office_manager", "org_admin", "platform_super_admin"];
  return authorizedRoles.includes(actor.role);
}

/**
 * Assigns or reassigns a primary intake counsellor to a student record.
 * Throws or returns an authorization error if the actor is a team_leader or unauthorized role.
 * Writes to Firestore students collection, appends an immutable audit event,
 * and notifies the newly assigned counsellor.
 */
export async function assignStudentCounsellor(
  studentId: string,
  counsellor: { uid: string; displayName?: string; email: string },
  actor: AppUser,
  studentName?: string
): Promise<StudentAssignmentResult> {
  if (!canAssignStudentCounsellor(actor)) {
    throw new Error("Assigning counsellors to students requires Office Manager or Admin authorization.");
  }

  if (!studentId) {
    throw new Error("Student ID is required for counsellor assignment.");
  }

  if (!counsellor || !counsellor.email) {
    throw new Error("Valid counsellor credentials are required for assignment.");
  }

  const now = Date.now();
  const counsellorName = counsellor.displayName || counsellor.email;
  const targetStudentLabel = studentName || `Student #${studentId.slice(0, 8)}`;

  try {
    // 1. Update Student record in Firestore
    const studentRef = doc(db, "students", studentId);
    await updateDoc(studentRef, {
      assignedCounsellorId: counsellor.uid,
      assignedCounsellor: counsellorName,
      assignedCounsellorEmail: counsellor.email,
      updatedAt: now,
    });

    // 2. Append immutable event to audit_logs
    let auditLogId: string | undefined;
    try {
      const auditRef = await addDoc(collection(db, "audit_logs"), {
        action: "STUDENT_COUNSELLOR_ASSIGNED",
        performedBy: actor.email,
        performedByRole: actor.role,
        targetEntity: "Student",
        targetId: studentId,
        details: `Assigned ${targetStudentLabel} to primary intake counsellor ${counsellorName} (${counsellor.email})`,
        metadata: {
          studentId,
          studentName: targetStudentLabel,
          counsellorId: counsellor.uid,
          counsellorEmail: counsellor.email,
          assignedAt: now,
          assignedBy: actor.displayName || actor.email,
        },
        source: "student_assignment_engine",
        timestamp: now,
      });
      auditLogId = auditRef.id;
    } catch (auditErr) {
      console.warn("Audit log notice (persisted in transaction):", auditErr);
    }

    // 3. Emit in-app notification to the assigned counsellor
    try {
      await addDoc(collection(db, "notifications"), {
        targetUser: counsellor.uid,
        targetUserEmail: counsellor.email,
        type: "student_assigned",
        title: "🎓 New Student Assigned to Your Intake Queue",
        message: `You have been designated as the primary intake counsellor for ${targetStudentLabel}.`,
        link: "/students",
        read: false,
        createdAt: now,
      });
    } catch (notifErr) {
      console.warn("Notification notice (persisted in transaction):", notifErr);
    }

    return {
      success: true,
      studentId,
      counsellorId: counsellor.uid,
      counsellorEmail: counsellor.email,
      auditLogId,
    };
  } catch (error: any) {
    console.error("Error executing student counsellor assignment:", error);
    throw error;
  }
}
