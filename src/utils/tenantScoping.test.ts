import { describe, it, expect } from "vitest";
import {
  scopeDocumentWithTenant,
  getTenantQueryConstraints,
  canAccessTenant,
  filterRecordsByTenant,
  TENANT_DEFINITIONS,
} from "./tenantScoping";
import { AppUser } from "../types/role";

describe("Multi-Tenant Scoping Utility", () => {
  it("should attach tenantId and campusCity to new documents for org users", () => {
    const user: AppUser = {
      uid: "user-123",
      email: "counsellor@org.com",
      displayName: "Jane Counsellor",
      role: "counsellor",
      tenantId: "tenant-manchester",
      office: "Manchester Branch",
      createdAt: 1000,
    };

    const docData = { name: "Test Lead", stage: "New" };
    const scoped = scopeDocumentWithTenant(docData, user);

    expect(scoped.tenantId).toBe("tenant-manchester");
    expect(scoped.tenantType).toBe("city");
    expect(scoped.campusCity).toBe("Manchester");
    expect(scoped.name).toBe("Test Lead");
  });

  it("should return empty query constraints for platform super admin with no override", () => {
    const adminUser: AppUser = {
      uid: "admin-1",
      email: "admin@platform.com",
      role: "platform_super_admin",
      createdAt: 1000,
    };

    const constraints = getTenantQueryConstraints(adminUser);
    expect(constraints.length).toBe(0);
  });

  it("should return tenant-scoped query constraints for local staff", () => {
    const counsellor: AppUser = {
      uid: "couns-1",
      email: "david@educrm.demo",
      role: "counsellor",
      tenantId: "tenant-manchester",
      office: "Manchester Branch",
      createdAt: 1000,
    };

    const constraints = getTenantQueryConstraints(counsellor);
    expect(constraints.length).toBe(1);
  });

  it("should return activeTenantOverride constraint for platform super admin when specified", () => {
    const adminUser: AppUser = {
      uid: "admin-1",
      email: "admin@platform.com",
      role: "platform_super_admin",
      createdAt: 1000,
    };

    const constraints = getTenantQueryConstraints(adminUser, "tenant-delhi");
    expect(constraints.length).toBe(1);
  });

  it("should enforce strict boundary check with canAccessTenant", () => {
    const londonStaff: AppUser = {
      uid: "staff-ldn",
      email: "emma@educrm.demo",
      role: "office_manager",
      tenantId: "tenant-london",
      createdAt: 1000,
    };

    const superAdmin: AppUser = {
      uid: "super-1",
      email: "admin@educrm.com",
      role: "platform_super_admin",
      createdAt: 1000,
    };

    // London staff can access London tenant but NOT Manchester tenant
    expect(canAccessTenant(londonStaff, "tenant-london")).toBe(true);
    expect(canAccessTenant(londonStaff, "tenant-manchester")).toBe(false);
    expect(canAccessTenant(londonStaff, "tenant-delhi")).toBe(false);

    // Super admin can access all tenants
    expect(canAccessTenant(superAdmin, "tenant-london")).toBe(true);
    expect(canAccessTenant(superAdmin, "tenant-manchester")).toBe(true);
    expect(canAccessTenant(superAdmin, "tenant-delhi")).toBe(true);
  });

  it("should guarantee zero cross-tenant data leakage with filterRecordsByTenant", () => {
    const mockApplications = [
      { id: "app-1", studentName: "Student A", tenantId: "tenant-london" },
      { id: "app-2", studentName: "Student B", tenantId: "tenant-manchester" },
      { id: "app-3", studentName: "Student C", tenantId: "tenant-manchester" },
      { id: "app-4", studentName: "Student D", tenantId: "tenant-delhi" },
    ];

    const manchesterCounsellor: AppUser = {
      uid: "couns-man",
      email: "david@educrm.demo",
      role: "counsellor",
      tenantId: "tenant-manchester",
      createdAt: 1000,
    };

    const filtered = filterRecordsByTenant(mockApplications, manchesterCounsellor);

    // Manchester counsellor must ONLY see app-2 and app-3
    expect(filtered.length).toBe(2);
    expect(filtered.map((a) => a.id)).toEqual(["app-2", "app-3"]);
    expect(filtered.some((a) => a.tenantId === "tenant-london")).toBe(false);
    expect(filtered.some((a) => a.tenantId === "tenant-delhi")).toBe(false);
  });

  it("should allow platform super admin to view all records or filter by activeTenantId", () => {
    const mockApplications = [
      { id: "app-1", studentName: "Student A", tenantId: "tenant-london" },
      { id: "app-2", studentName: "Student B", tenantId: "tenant-manchester" },
      { id: "app-3", studentName: "Student C", tenantId: "tenant-delhi" },
    ];

    const superAdmin: AppUser = {
      uid: "super-1",
      email: "admin@educrm.com",
      role: "platform_super_admin",
      createdAt: 1000,
    };

    // When activeTenantOverride is "ALL" or undefined
    const allRecords = filterRecordsByTenant(mockApplications, superAdmin, "ALL");
    expect(allRecords.length).toBe(3);

    // When filtered to tenant-delhi
    const delhiRecords = filterRecordsByTenant(mockApplications, superAdmin, "tenant-delhi");
    expect(delhiRecords.length).toBe(1);
    expect(delhiRecords[0].id).toBe("app-3");
  });

  it("should contain standard predefined tenant definitions for cities and universities", () => {
    expect(TENANT_DEFINITIONS.length).toBeGreaterThanOrEqual(6);
    const tenantIds = TENANT_DEFINITIONS.map((t) => t.id);
    expect(tenantIds).toContain("tenant-london");
    expect(tenantIds).toContain("tenant-manchester");
    expect(tenantIds).toContain("tenant-delhi");
    expect(tenantIds).toContain("tenant-univ-manchester");
  });
});
