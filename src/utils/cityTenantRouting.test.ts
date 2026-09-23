import { describe, it, expect, vi } from "vitest";

const { addedDocs, updatedDocs } = vi.hoisted(() => ({
  addedDocs: [] as { collection: string; data: any }[],
  updatedDocs: [] as { path: string; data: any }[],
}));

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...actual,
    doc: vi.fn((_db, coll, id) => ({ path: `${coll}/${id}`, id })),
    collection: vi.fn((_db, name) => ({ name })),
    getDoc: vi.fn(async (ref: any) => ({
      exists: () => false,
      data: () => null,
      id: ref.id,
    })),
    setDoc: vi.fn(async (ref: any, data: any) => {
      addedDocs.push({ collection: ref.path, data });
    }),
    updateDoc: vi.fn(async (ref: any, data: any) => {
      updatedDocs.push({ path: ref.path, data });
    }),
    addDoc: vi.fn(async (colRef: any, data: any) => {
      addedDocs.push({ collection: colRef.name, data });
      return { id: `mock-${colRef.name}-id` };
    }),
    getDocs: vi.fn(async () => ({
      empty: true,
      forEach: () => {},
    })),
  };
});

import {
  resolveCityTenant,
  getCityByTenantId,
  autoAssignCityStaff,
} from "./cityTenantRouting";
import { filterRecordsByTenant, canAccessTenant } from "./tenantScoping";
import { submitPublicApplication, validateStep1Personal } from "./applicationIntakeTriage";
import { AppUser } from "../types/role";

describe("Dynamic City-Based Auto-Tenant Routing & Data Isolation", () => {
  describe("1. City-to-Tenant Resolution Engine", () => {
    it("should resolve supported cities to canonical tenant IDs", () => {
      expect(resolveCityTenant("Islamabad")).toBe("tenant-islamabad");
      expect(resolveCityTenant("Lahore")).toBe("tenant-lahore");
      expect(resolveCityTenant("Karachi")).toBe("tenant-karachi");
      expect(resolveCityTenant("London")).toBe("tenant-london");
      expect(resolveCityTenant("Dubai")).toBe("tenant-dubai");
    });

    it("should handle case-insensitivity, trims, and common abbreviations", () => {
      expect(resolveCityTenant("  islamabad  ")).toBe("tenant-islamabad");
      expect(resolveCityTenant("isb")).toBe("tenant-islamabad");
      expect(resolveCityTenant("Rawalpindi")).toBe("tenant-islamabad");
      expect(resolveCityTenant("lhr")).toBe("tenant-lahore");
      expect(resolveCityTenant("khi")).toBe("tenant-karachi");
      expect(resolveCityTenant("ldn")).toBe("tenant-london");
      expect(resolveCityTenant("dxb")).toBe("tenant-dubai");
      expect(resolveCityTenant("UAE")).toBe("tenant-dubai");
    });

    it("should return the input if already formatted as canonical tenantId", () => {
      expect(resolveCityTenant("tenant-islamabad")).toBe("tenant-islamabad");
      expect(resolveCityTenant("tenant-karachi")).toBe("tenant-karachi");
      expect(resolveCityTenant("tenant-lahore")).toBe("tenant-lahore");
    });

    it("should gracefully fallback unknown cities to tenant-london", () => {
      expect(resolveCityTenant("Reykjavik")).toBe("tenant-london");
      expect(resolveCityTenant("")).toBe("tenant-london");
      expect(resolveCityTenant(undefined)).toBe("tenant-london");
    });

    it("should resolve correct canonical city name from tenantId", () => {
      expect(getCityByTenantId("tenant-islamabad")).toBe("Islamabad");
      expect(getCityByTenantId("tenant-lahore")).toBe("Lahore");
      expect(getCityByTenantId("tenant-karachi")).toBe("Karachi");
      expect(getCityByTenantId("tenant-london")).toBe("London");
      expect(getCityByTenantId("tenant-dubai")).toBe("Dubai");
    });
  });

  describe("2. Branch Staff Auto-Assignment Pipeline", () => {
    it("should allocate an Islamabad Counsellor and designated Team Leader for Islamabad", async () => {
      const assignment = await autoAssignCityStaff("Islamabad");

      expect(assignment.tenantId).toBe("tenant-islamabad");
      expect(assignment.assignedCity).toBe("Islamabad");
      expect(assignment.assignedCounsellor).toBe("Zainab Malik");
      expect(assignment.assignedCounsellorEmail).toBe("zainab.malik@educrm.demo");
      expect(assignment.assignedTeamLeader).toBe("Hamza Tariq");
      expect(assignment.assignedTeamLeaderEmail).toBe("hamza.tariq@educrm.demo");
      expect(assignment.assignedOfficerEmail).toBe("zainab.malik@educrm.demo");
    });

    it("should allocate a Lahore Counsellor and designated Team Leader for Lahore", async () => {
      const assignment = await autoAssignCityStaff("Lahore");

      expect(assignment.tenantId).toBe("tenant-lahore");
      expect(assignment.assignedCity).toBe("Lahore");
      expect(assignment.assignedCounsellor).toBe("Ayesha Khan");
      expect(assignment.assignedCounsellorEmail).toBe("ayesha.khan@educrm.demo");
      expect(assignment.assignedTeamLeader).toBe("Omar Farooq");
      expect(assignment.assignedTeamLeaderEmail).toBe("omar.farooq@educrm.demo");
    });

    it("should allocate a Karachi Counsellor and designated Team Leader for Karachi", async () => {
      const assignment = await autoAssignCityStaff("Karachi");

      expect(assignment.tenantId).toBe("tenant-karachi");
      expect(assignment.assignedCity).toBe("Karachi");
      expect(assignment.assignedCounsellor).toBe("Murtaza Shah");
      expect(assignment.assignedTeamLeader).toBe("Sara Siddiqui");
    });

    it("should select the counsellor with lowest active caseload when multiple exist", async () => {
      // In default roster, Zainab Malik has caseload 4, Bilal Haider has caseload 6
      const assignment = await autoAssignCityStaff("tenant-islamabad");
      expect(assignment.assignedCounsellor).toBe("Zainab Malik");
    });
  });

  describe("3. Strict Cross-City Multi-Tenant Partitioning & Data Isolation", () => {
    const islamabadStudent = {
      id: "stu-isb-001",
      fullName: "Ali Raza",
      city: "Islamabad",
      tenantId: "tenant-islamabad",
      assignedCounsellor: "Zainab Malik",
    };

    const lahoreStudent = {
      id: "stu-lhr-002",
      fullName: "Fatima Noor",
      city: "Lahore",
      tenantId: "tenant-lahore",
      assignedCounsellor: "Ayesha Khan",
    };

    const lahoreStaff: AppUser = {
      uid: "usr-lhr-couns",
      email: "ayesha.khan@educrm.demo",
      role: "counsellor",
      tenantId: "tenant-lahore",
      office: "Lahore Branch",
      createdAt: 1000,
    };

    const islamabadStaff: AppUser = {
      uid: "usr-isb-couns",
      email: "zainab.malik@educrm.demo",
      role: "counsellor",
      tenantId: "tenant-islamabad",
      office: "Islamabad Branch",
      createdAt: 1000,
    };

    const superAdmin: AppUser = {
      uid: "usr-super-admin",
      email: "admin@educrm.com",
      role: "platform_super_admin",
      createdAt: 1000,
    };

    it("should enforce canAccessTenant boundary between cities", () => {
      // Lahore staff CANNOT access Islamabad tenant
      expect(canAccessTenant(lahoreStaff, "tenant-islamabad")).toBe(false);
      // Lahore staff CAN access Lahore tenant
      expect(canAccessTenant(lahoreStaff, "tenant-lahore")).toBe(true);

      // Islamabad staff CANNOT access Lahore tenant
      expect(canAccessTenant(islamabadStaff, "tenant-lahore")).toBe(false);
      // Islamabad staff CAN access Islamabad tenant
      expect(canAccessTenant(islamabadStaff, "tenant-islamabad")).toBe(true);

      // Platform Super Admin can access all cities
      expect(canAccessTenant(superAdmin, "tenant-islamabad")).toBe(true);
      expect(canAccessTenant(superAdmin, "tenant-lahore")).toBe(true);
    });

    it("should filter out Islamabad students for Lahore staff with zero leakage", () => {
      const allStudents = [islamabadStudent, lahoreStudent];

      const visibleToLahore = filterRecordsByTenant(allStudents, lahoreStaff);
      expect(visibleToLahore.length).toBe(1);
      expect(visibleToLahore[0].id).toBe("stu-lhr-002");
      expect(visibleToLahore.some((s) => s.tenantId === "tenant-islamabad")).toBe(false);

      const visibleToIslamabad = filterRecordsByTenant(allStudents, islamabadStaff);
      expect(visibleToIslamabad.length).toBe(1);
      expect(visibleToIslamabad[0].id).toBe("stu-isb-001");
      expect(visibleToIslamabad.some((s) => s.tenantId === "tenant-lahore")).toBe(false);
    });

    it("should ensure City External Agents cannot see students from other cities", () => {
      const lahoreAgent: AppUser = {
        uid: "agent-lhr-99",
        email: "agent.lahore@agency.com",
        role: "external_agent",
        tenantId: "tenant-lahore",
        createdAt: 1000,
      };

      const visibleToAgent = filterRecordsByTenant([islamabadStudent, lahoreStudent], lahoreAgent);
      expect(visibleToAgent.length).toBe(1);
      expect(visibleToAgent[0].id).toBe("stu-lhr-002");
      expect(visibleToAgent.some((s) => s.tenantId === "tenant-islamabad")).toBe(false);
    });
  });

  describe("4. Finance Desk Localized City Scoping", () => {
    const isbInvoice = {
      id: "inv-isb-101",
      invoiceNumber: "INV-ISB-2026-001",
      studentName: "Ali Raza",
      amount: 15000,
      tenantId: "tenant-islamabad",
      status: "Pending",
    };

    const lhrInvoice = {
      id: "inv-lhr-202",
      invoiceNumber: "INV-LHR-2026-002",
      studentName: "Fatima Noor",
      amount: 12000,
      tenantId: "tenant-lahore",
      status: "Paid",
    };

    const islamabadFinanceOfficer: AppUser = {
      uid: "fin-isb-1",
      email: "usman.farooq@educrm.demo",
      role: "finance_officer",
      tenantId: "tenant-islamabad",
      office: "Islamabad Branch",
      createdAt: 1000,
    };

    const lahoreFinanceOfficer: AppUser = {
      uid: "fin-lhr-1",
      email: "faizan.ali@educrm.demo",
      role: "finance_officer",
      tenantId: "tenant-lahore",
      office: "Lahore Branch",
      createdAt: 1000,
    };

    it("should strictly partition invoices by finance officer city tenant", () => {
      const invoices = [isbInvoice, lhrInvoice];

      // Islamabad Finance Officer only sees Islamabad invoices
      const isbFiltered = filterRecordsByTenant(invoices, islamabadFinanceOfficer);
      expect(isbFiltered.length).toBe(1);
      expect(isbFiltered[0].id).toBe("inv-isb-101");
      expect(isbFiltered.some((i) => i.tenantId === "tenant-lahore")).toBe(false);

      // Lahore Finance Officer only sees Lahore invoices
      const lhrFiltered = filterRecordsByTenant(invoices, lahoreFinanceOfficer);
      expect(lhrFiltered.length).toBe(1);
      expect(lhrFiltered[0].id).toBe("inv-lhr-202");
      expect(lhrFiltered.some((i) => i.tenantId === "tenant-islamabad")).toBe(false);
    });
  });

  describe("5. Intake Wizard Validation & Public Submission Auto-Routing", () => {
    it("should fail Step 1 validation if processingCity is missing", () => {
      const errors = validateStep1Personal({
        fullName: "Test Applicant",
        email: "test@example.com",
        phone: "+92 300 1234567",
        dob: "2000-01-01",
        nationality: "Pakistani",
        countryOfResidence: "Pakistan",
        processingCity: "", // Missing
        passportNumber: "PK1234567",
        passportExpiry: "2030-01-01",
      });

      expect(errors.processingCity).toBe("Please select your preferred branch / processing city");
    });

    it("should pass Step 1 validation when processingCity is provided", () => {
      const errors = validateStep1Personal({
        fullName: "Test Applicant",
        email: "test@example.com",
        phone: "+92 300 1234567",
        dob: "2000-01-01",
        nationality: "Pakistani",
        countryOfResidence: "Pakistan",
        processingCity: "Islamabad",
        passportNumber: "PK1234567",
        passportExpiry: "2030-01-01",
      });

      expect(errors.processingCity).toBeUndefined();
    });

    it("should auto-route application to tenant-islamabad and emit STUDENT_AUTO_ROUTED_TO_CITY audit log", async () => {
      addedDocs.length = 0;
      updatedDocs.length = 0;
      const mockDb: any = {};

      const result = await submitPublicApplication(mockDb, "app-isb-999", {
        fullName: "Hamza Abbasi",
        email: "hamza.abbasi@gmail.com",
        processingCity: "Islamabad",
        countryOfResidence: "Pakistan",
        nationality: "Pakistani",
        studentId: "stu-isb-999",
        declaration: {
          signedName: "Hamza Abbasi",
          agreedAt: new Date().toISOString(),
          consentGiven: true,
        },
      });

      expect(result.success).toBe(true);
      expect(result.applicationId).toBe("app-isb-999");

      // Verify Application Document was saved with tenant-islamabad and Islamabad staff
      const savedApp = addedDocs.find((d) => d.collection.includes("applications/app-isb-999"));
      expect(savedApp).toBeDefined();
      expect(savedApp?.data.tenantId).toBe("tenant-islamabad");
      expect(savedApp?.data.assignedCity).toBe("Islamabad");
      expect(savedApp?.data.assignedCounsellor).toBe("Zainab Malik");
      expect(savedApp?.data.assignedOfficerEmail).toBe("zainab.malik@educrm.demo");
      expect(savedApp?.data.assignedTeamLeader).toBe("Hamza Tariq");

      // Verify STUDENT_AUTO_ROUTED_TO_CITY audit log was generated
      const auditLog = addedDocs.find(
        (d) => d.collection === "audit_logs" && d.data.action === "STUDENT_AUTO_ROUTED_TO_CITY"
      );
      expect(auditLog).toBeDefined();
      expect(auditLog?.data.tenantId).toBe("tenant-islamabad");
      expect(auditLog?.data.city).toBe("Islamabad");
      expect(auditLog?.data.assignedCounsellor).toBe("Zainab Malik");
      expect(auditLog?.data.assignedTeamLead).toBe("Hamza Tariq");

      // Verify Notifications were dispatched to Counsellor and Team Lead
      const counsellorNotif = addedDocs.find(
        (d) =>
          d.collection === "notifications" &&
          d.data.targetUser === "zainab.malik@educrm.demo" &&
          d.data.type === "new_student_assigned_city"
      );
      expect(counsellorNotif).toBeDefined();
      expect(counsellorNotif?.data.tenantId).toBe("tenant-islamabad");
      expect(counsellorNotif?.data.message).toContain("Islamabad Branch");

      const teamLeadNotif = addedDocs.find(
        (d) =>
          d.collection === "notifications" &&
          d.data.targetUser === "hamza.tariq@educrm.demo" &&
          d.data.type === "new_student_assigned_city"
      );
      expect(teamLeadNotif).toBeDefined();
      expect(teamLeadNotif?.data.tenantId).toBe("tenant-islamabad");
    });
  });
});
