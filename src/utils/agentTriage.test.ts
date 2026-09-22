import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  canAccessAgentTriage,
  isAdmissionsVisible,
  filterForAdmissionsDesk,
  submitStudentToAdmissions,
} from "./agentTriage";
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

describe("Agent Referral Isolation & Triage Engine", () => {
  const superAdmin: AppUser = {
    uid: "admin-1",
    email: "superadmin@educrm.com",
    displayName: "Platform Admin",
    role: "platform_super_admin",
    createdAt: 1000,
  };

  const counsellor: AppUser = {
    uid: "couns-1",
    email: "counsellor@educrm.com",
    displayName: "Sarah Counsellor",
    role: "counsellor",
    createdAt: 1000,
  };

  const teamLeader: AppUser = {
    uid: "tl-1",
    email: "tl@educrm.com",
    displayName: "Team Lead",
    role: "team_leader",
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
    email: "agent@globalpathways.com",
    displayName: "Global Pathways Agency",
    role: "external_agent",
    createdAt: 1000,
  };

  const studentUser: AppUser = {
    uid: "stu-1",
    email: "applicant@gmail.com",
    displayName: "Student Applicant",
    role: "student",
    createdAt: 1000,
  };

  describe("canAccessAgentTriage() Access Control Gate", () => {
    it("allows Counsellors, Team Leaders, Office Managers, and Admins", () => {
      expect(canAccessAgentTriage(counsellor)).toBe(true);
      expect(canAccessAgentTriage(teamLeader)).toBe(true);
      expect(canAccessAgentTriage(superAdmin)).toBe(true);
      expect(
        canAccessAgentTriage({ ...superAdmin, role: "office_manager" })
      ).toBe(true);
      expect(canAccessAgentTriage({ ...superAdmin, role: "org_admin" })).toBe(
        true
      );
    });

    it("strictly blocks Admissions Officers, Agents, and Students", () => {
      expect(canAccessAgentTriage(admissionsOfficer)).toBe(false);
      expect(canAccessAgentTriage(externalAgent)).toBe(false);
      expect(canAccessAgentTriage(studentUser)).toBe(false);
      expect(canAccessAgentTriage(null)).toBe(false);
    });
  });

  describe("isAdmissionsVisible() Visibility Isolation", () => {
    it("hides unvetted agent referrals from Admissions Officers", () => {
      const unvettedAgentRecord = {
        agentReferred: true,
        admissionsVisibility: false,
      };
      expect(isAdmissionsVisible(unvettedAgentRecord, "admissions_officer")).toBe(
        false
      );

      const pendingImplicitRecord = {
        agentReferred: true,
      };
      expect(isAdmissionsVisible(pendingImplicitRecord, "admissions_officer")).toBe(
        false
      );
    });

    it("reveals vetted agent referrals to Admissions Officers", () => {
      const vettedAgentRecord = {
        agentReferred: true,
        admissionsVisibility: true,
      };
      expect(isAdmissionsVisible(vettedAgentRecord, "admissions_officer")).toBe(
        true
      );
    });

    it("allows standard direct applicant records without agent referral tags", () => {
      const standardStudent = {
        agentReferred: false,
      };
      expect(isAdmissionsVisible(standardStudent, "admissions_officer")).toBe(
        true
      );

      const directRecord = {};
      expect(isAdmissionsVisible(directRecord, "admissions_officer")).toBe(true);
    });

    it("always permits Counsellors and Triage Officers to view unvetted dossiers", () => {
      const unvettedAgentRecord = {
        agentReferred: true,
        admissionsVisibility: false,
      };
      expect(isAdmissionsVisible(unvettedAgentRecord, "counsellor")).toBe(true);
      expect(isAdmissionsVisible(unvettedAgentRecord, "team_leader")).toBe(true);
      expect(isAdmissionsVisible(unvettedAgentRecord, "platform_super_admin")).toBe(
        true
      );
    });
  });

  describe("filterForAdmissionsDesk() Queue Isolation", () => {
    const dataset = [
      { id: "direct-1", agentReferred: false, name: "Direct Student" },
      {
        id: "agent-pending-1",
        agentReferred: true,
        admissionsVisibility: false,
        name: "Unvetted Referral A",
      },
      {
        id: "agent-pending-2",
        agentReferred: true,
        name: "Unvetted Referral B (implicit false)",
      },
      {
        id: "agent-vetted-1",
        agentReferred: true,
        admissionsVisibility: true,
        name: "Vetted Referral C",
      },
    ];

    it("excludes unvetted agent dossiers when user is admissions_officer", () => {
      const filtered = filterForAdmissionsDesk(dataset, "admissions_officer");
      expect(filtered).toHaveLength(2);
      expect(filtered.map((d) => d.id)).toEqual(["direct-1", "agent-vetted-1"]);
    });

    it("preserves the complete queue for counsellors and reviewers", () => {
      const filtered = filterForAdmissionsDesk(dataset, "counsellor");
      expect(filtered).toHaveLength(4);
    });

    it("preserves the complete queue when role is undefined", () => {
      const filtered = filterForAdmissionsDesk(dataset, undefined);
      expect(filtered).toHaveLength(4);
    });
  });

  describe("submitStudentToAdmissions() Vetting Action & Audit Logging", () => {
    it("updates student, linked application, logs audit event, and notifies desk", async () => {
      const { updateDoc, addDoc } = await import("firebase/firestore");

      const studentId = "stu-test-99";
      const applicationId = "app-test-99";
      const notes = "Transcripts and IELTS band 7.5 verified.";

      const result = await submitStudentToAdmissions(
        studentId,
        applicationId,
        notes,
        counsellor,
        "David O'Connor"
      );

      expect(result.success).toBe(true);
      expect(result.studentId).toBe(studentId);
      expect(result.applicationId).toBe(applicationId);

      // Verify updateDoc was called for student
      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: "students/stu-test-99" }),
        expect.objectContaining({
          admissionsVisibility: true,
          vettingStatus: "submitted_to_admissions",
          vettedBy: "Sarah Counsellor",
          vettingNotes: notes,
        })
      );

      // Verify updateDoc was called for application
      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: "applications/app-test-99" }),
        expect.objectContaining({
          admissionsVisibility: true,
          vettingStatus: "submitted_to_admissions",
        })
      );

      // Verify audit log creation
      expect(addDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: "audit_logs" }),
        expect.objectContaining({
          action: "AGENT_STUDENT_VETTED_AND_SUBMITTED",
          performedBy: "counsellor@educrm.com",
          targetEntity: "Student",
          targetId: studentId,
        })
      );

      // Verify notification emission for Admissions Desk
      expect(addDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: "notifications" }),
        expect.objectContaining({
          targetUser: "admissions_officer",
        })
      );
    });

    it("rejects submission if actor lacks triage authorization", async () => {
      const result = await submitStudentToAdmissions(
        "stu-100",
        "app-100",
        "Unauthorized submission attempt",
        admissionsOfficer,
        "Hacker Student"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("credentials");
    });
  });
});
