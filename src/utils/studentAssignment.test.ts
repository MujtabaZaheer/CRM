import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  canAssignStudentCounsellor,
  assignStudentCounsellor,
} from "./studentAssignment";
import { AppUser } from "../types/role";

// Mock Firestore methods with importOriginal to preserve getFirestore and other exports
vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...actual,
    doc: vi.fn((_db, coll, id) => ({ path: `${coll}/${id}`, id })),
    collection: vi.fn((_db, name) => ({ path: name, id: name })),
    updateDoc: vi.fn().mockResolvedValue(true),
    addDoc: vi.fn().mockResolvedValue({ id: "mock-log-id" }),
  };
});

describe("Student Intake Counsellor Assignment Engine", () => {
  const superAdmin: AppUser = {
    uid: "admin-1",
    email: "superadmin@educrm.com",
    displayName: "Platform Admin",
    role: "platform_super_admin",
    createdAt: 1000,
  };

  const orgAdmin: AppUser = {
    uid: "org-1",
    email: "orgadmin@educrm.com",
    displayName: "Org Admin",
    role: "org_admin",
    createdAt: 1000,
  };

  const officeManager: AppUser = {
    uid: "om-1",
    email: "manager@educrm.com",
    displayName: "Office Manager",
    role: "office_manager",
    createdAt: 1000,
  };

  const teamLeader: AppUser = {
    uid: "tl-1",
    email: "tl@educrm.com",
    displayName: "Sarah TeamLead",
    role: "team_leader",
    createdAt: 1000,
  };

  const counsellor: AppUser = {
    uid: "couns-1",
    email: "counsellor@educrm.com",
    displayName: "Elena Counsellor",
    role: "counsellor",
    createdAt: 1000,
  };

  const admissionsOfficer: AppUser = {
    uid: "adm-1",
    email: "admissions@educrm.com",
    displayName: "Alex Admissions",
    role: "admissions_officer",
    createdAt: 1000,
  };

  const externalAgent: AppUser = {
    uid: "agent-1",
    email: "agent@partners.com",
    displayName: "External Agent",
    role: "external_agent",
    createdAt: 1000,
  };

  const studentUser: AppUser = {
    uid: "stu-1",
    email: "student@gmail.com",
    displayName: "Student",
    role: "student",
    createdAt: 1000,
  };

  describe("canAssignStudentCounsellor() Authorization Boundary", () => {
    it("allows Office Managers, Org Admins, and Platform Super Admins", () => {
      expect(canAssignStudentCounsellor(officeManager)).toBe(true);
      expect(canAssignStudentCounsellor(orgAdmin)).toBe(true);
      expect(canAssignStudentCounsellor(superAdmin)).toBe(true);
    });

    it("strictly blocks Team Leads from designating or reassigning student intake counsellors", () => {
      expect(canAssignStudentCounsellor(teamLeader)).toBe(false);
    });

    it("blocks Counsellors, Admissions Officers, Agents, Students, and null actors", () => {
      expect(canAssignStudentCounsellor(counsellor)).toBe(false);
      expect(canAssignStudentCounsellor(admissionsOfficer)).toBe(false);
      expect(canAssignStudentCounsellor(externalAgent)).toBe(false);
      expect(canAssignStudentCounsellor(studentUser)).toBe(false);
      expect(canAssignStudentCounsellor(null)).toBe(false);
      expect(canAssignStudentCounsellor(undefined)).toBe(false);
    });
  });

  describe("assignStudentCounsellor() Execution & Audit Trail", () => {
    const studentId = "student-test-77";
    const targetCounsellor = {
      uid: "couns-target-88",
      displayName: "Marcus Brody",
      email: "marcus.brody@educrm.com",
    };

    it("strictly throws an authorization error when actor is a Team Leader", async () => {
      await expect(
        assignStudentCounsellor(
          studentId,
          targetCounsellor,
          teamLeader,
          "John Candidate"
        )
      ).rejects.toThrow(
        "Assigning counsellors to students requires Office Manager or Admin authorization."
      );
    });

    it("successfully assigns counsellor when actor is Office Manager and persists audit log & notification", async () => {
      const { updateDoc, addDoc } = await import("firebase/firestore");

      const result = await assignStudentCounsellor(
        studentId,
        targetCounsellor,
        officeManager,
        "Amina Begum"
      );

      expect(result.success).toBe(true);
      expect(result.studentId).toBe(studentId);
      expect(result.counsellorId).toBe(targetCounsellor.uid);
      expect(result.counsellorEmail).toBe(targetCounsellor.email);

      // Verify Firestore update on students collection
      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: `students/${studentId}` }),
        expect.objectContaining({
          assignedCounsellorId: targetCounsellor.uid,
          assignedCounsellor: "Marcus Brody",
          assignedCounsellorEmail: "marcus.brody@educrm.com",
        })
      );

      // Verify audit log creation
      expect(addDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: "audit_logs" }),
        expect.objectContaining({
          action: "STUDENT_COUNSELLOR_ASSIGNED",
          performedBy: "manager@educrm.com",
          performedByRole: "office_manager",
          targetEntity: "Student",
          targetId: studentId,
        })
      );

      // Verify notification emission for the assigned counsellor
      expect(addDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: "notifications" }),
        expect.objectContaining({
          targetUser: targetCounsellor.uid,
          type: "student_assigned",
        })
      );
    });

    it("successfully assigns counsellor when actor is Org Admin", async () => {
      const result = await assignStudentCounsellor(
        studentId,
        targetCounsellor,
        orgAdmin,
        "David Chen"
      );

      expect(result.success).toBe(true);
    });
  });
});
