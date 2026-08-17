import { describe, it, expect } from "vitest";
import { scopeDocumentWithTenant, getTenantQueryConstraints } from "./tenantScoping";
import { AppUser } from "../types/role";

describe("Multi-Tenant Scoping Utility", () => {
  it("should attach tenantId and officeId to new documents for org users", () => {
    const user: any = {
      uid: "user-123",
      email: "counsellor@org.com",
      displayName: "Jane Counsellor",
      role: "counsellor",
      tenantId: "tenant-org-99",
      officeId: "office-london",
      createdAt: 1000,
    };

    const docData = { name: "Test Lead", stage: "New" };
    const scoped = scopeDocumentWithTenant(docData, user);

    expect(scoped.tenantId).toBe("tenant-org-99");
    expect(scoped.officeId).toBe("office-london");
    expect(scoped.name).toBe("Test Lead");
  });

  it("should return empty query constraints for platform super admin", () => {
    const adminUser: AppUser = {
      uid: "admin-1",
      email: "admin@platform.com",
      role: "platform_super_admin",
      createdAt: 1000,
    };

    const constraints = getTenantQueryConstraints(adminUser);
    expect(constraints.length).toBe(0);
  });
});
