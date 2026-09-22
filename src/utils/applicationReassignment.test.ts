import { describe, it, expect, vi } from "vitest";
import {
  canReassignApplications,
  validateCrossTenantTransfer,
  bulkReassignApplications,
  reassignApplication,
} from "./applicationReassignment";
import { Application } from "../types/application";
import { AppUser } from "../types/role";

// Mock Firebase Firestore methods so tests run in memory without connecting to a live cluster
vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...actual,
    writeBatch: () => ({
      update: vi.fn(),
      set: vi.fn(),
      commit: vi.fn().mockResolvedValue(true),
    }),
    doc: vi.fn((_db, _coll, id) => ({ id: id || "mock-doc-id" })),
    collection: vi.fn((_db, collName) => ({ id: collName })),
    addDoc: vi.fn().mockResolvedValue({ id: "mock-audit-id" }),
    serverTimestamp: vi.fn(),
  };
});

describe("Application Reassignment Workflow Engine", () => {
  const superAdmin: AppUser = {
    uid: "admin-1",
    email: "superadmin@educrm.com",
    role: "platform_super_admin",
    createdAt: 1000,
  };

  const teamLeader: AppUser = {
    uid: "tl-1",
    email: "tl@educrm.com",
    role: "team_leader",
    createdAt: 1000,
  };

  const counsellor: AppUser = {
    uid: "couns-1",
    email: "counsellor@educrm.com",
    role: "counsellor",
    createdAt: 1000,
  };

  const studentUser: AppUser = {
    uid: "stu-1",
    email: "student@gmail.com",
    role: "student",
    createdAt: 1000,
  };

  const sampleApp: Application = {
    id: "app-100",
    applicationNumber: "APP-2026-0100",
    studentId: "stu-1",
    studentName: "John Doe",
    universityId: "univ-1",
    universityName: "University of Manchester",
    programmeId: "prog-1",
    programmeName: "MSc Computer Science",
    intake: "Fall 2026",
    stage: "Initial Review",
    assignedOfficer: "Jane Prev",
    assignedOfficerEmail: "jane.prev@educrm.com",
    assignedTeam: "General Admissions",
    assignedDepartment: "Admissions",
    tenantId: "tenant-london",
    history: [],
    transferHistory: [],
    createdAt: 1000,
    updatedAt: 1000,
  };

  describe("canReassignApplications RBAC Validation", () => {
    it("should allow Platform Super Admin, Org Admin, Office Manager, and Team Leader", () => {
      expect(canReassignApplications(superAdmin)).toBe(true);
      expect(canReassignApplications(teamLeader)).toBe(true);
      expect(canReassignApplications({ ...teamLeader, role: "org_admin" })).toBe(true);
      expect(canReassignApplications({ ...teamLeader, role: "office_manager" })).toBe(true);
    });

    it("should reject student, counsellor, and auditor roles from reassigning", () => {
      expect(canReassignApplications(studentUser)).toBe(false);
      expect(canReassignApplications(counsellor)).toBe(false);
      expect(canReassignApplications({ ...studentUser, role: "auditor" })).toBe(false);
      expect(canReassignApplications(null)).toBe(false);
    });
  });

  describe("validateCrossTenantTransfer Rules", () => {
    it("should allow transfers within the same tenant for authorized roles", () => {
      const res = validateCrossTenantTransfer(sampleApp, "tenant-london", teamLeader);
      expect(res.allowed).toBe(true);
    });

    it("should allow cross-tenant escalation by Super Admin or Org Admin", () => {
      const res = validateCrossTenantTransfer(sampleApp, "tenant-manchester", superAdmin);
      expect(res.allowed).toBe(true);
    });

    it("should reject cross-tenant escalation by team leader or junior staff", () => {
      const res = validateCrossTenantTransfer(sampleApp, "tenant-manchester", teamLeader);
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain("not authorized");
    });
  });

  describe("Reassignment Execution & Audit Trails", () => {
    it("should reject reassignment if reason is missing or too short", async () => {
      const result = await reassignApplication(
        sampleApp,
        {
          newAssigneeEmail: "new.officer@educrm.com",
          newAssigneeName: "New Officer",
          reason: "no",
        },
        teamLeader
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("minimum 5 characters");
    });

    it("should successfully execute single reassignment with complete audit trail", async () => {
      const result = await reassignApplication(
        sampleApp,
        {
          newAssigneeEmail: "new.officer@educrm.com",
          newAssigneeName: "New Officer",
          newDepartment: "Counselling",
          newTeam: "Fast-Track Advisory",
          reason: "Caseworker capacity rebalancing",
        },
        superAdmin
      );

      expect(result.success).toBe(true);
      expect(result.reassignedCount).toBe(1);
      expect(result.applicationIds).toContain("app-100");
    });

    it("should execute bulk reassignment across multiple applications", async () => {
      const app1: Application = { ...sampleApp, id: "app-101", applicationNumber: "APP-101" };
      const app2: Application = { ...sampleApp, id: "app-102", applicationNumber: "APP-102" };
      const app3: Application = { ...sampleApp, id: "app-103", applicationNumber: "APP-103" };

      const result = await bulkReassignApplications(
        [app1, app2, app3],
        {
          newAssigneeEmail: "specialist@educrm.com",
          newAssigneeName: "Specialist Officer",
          newDepartment: "Admissions",
          newTeam: "UK High-Priority",
          reason: "Bulk handoff to intake lead",
        },
        superAdmin
      );

      expect(result.success).toBe(true);
      expect(result.reassignedCount).toBe(3);
      expect(result.applicationIds).toEqual(["app-101", "app-102", "app-103"]);
    });
  });
});
