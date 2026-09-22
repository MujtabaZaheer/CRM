import { describe, it, expect } from "vitest";
import {
  isRoleDeprecated,
  getEffectivePermissions,
  hasPermission,
  prepareRoleMigration,
  ROLE_DEPRECATION_REGISTRY,
} from "./roleMigration";
import { AppUser } from "../types/role";

describe("RBAC Audit & Role Migration Engine", () => {
  it("should accurately identify deprecated roles", () => {
    expect(isRoleDeprecated("admissions_officer")).toBe(true);
    expect(isRoleDeprecated("counsellor")).toBe(false);
    expect(isRoleDeprecated("team_leader")).toBe(false);
    expect(isRoleDeprecated("platform_super_admin")).toBe(false);
  });

  it("should have clear fallback paths registered for intermediate admissions officer", () => {
    const config = ROLE_DEPRECATION_REGISTRY["admissions_officer"];
    expect(config).toBeDefined();
    expect(config.status).toBe("in_deprecation");
    expect(config.recommendedFallbacks.length).toBe(2);

    const targetRoles = config.recommendedFallbacks.map((f) => f.targetRole);
    expect(targetRoles).toContain("counsellor");
    expect(targetRoles).toContain("team_leader");
  });

  it("should merge fallback permissions for active users under deprecation (zero permission gap)", () => {
    const intermediateOfficer: AppUser = {
      uid: "usr-4",
      email: "admissions@educrm.demo",
      role: "admissions_officer",
      isDeprecatedRole: true,
      roleEffectiveFallback: "team_leader",
      createdAt: 1000,
    };

    const effective = getEffectivePermissions(intermediateOfficer);

    // Should include admissions_officer permissions
    expect(effective).toContain("application:update_stage");
    expect(effective).toContain("document:verify");

    // Should ALSO include team_leader fallback permissions (e.g. application:lock, offer:decision, lead:create)
    expect(effective).toContain("application:lock");
    expect(effective).toContain("offer:decision");
    expect(effective).toContain("lead:create");
  });

  it("should evaluate hasPermission accurately", () => {
    const superAdmin: AppUser = {
      uid: "admin-1",
      email: "admin@educrm.com",
      role: "platform_super_admin",
      createdAt: 1000,
    };

    const counsellor: AppUser = {
      uid: "couns-1",
      email: "counsellor@educrm.com",
      role: "counsellor",
      createdAt: 1000,
    };

    expect(hasPermission(superAdmin, "tenant:cross_transfer")).toBe(true);
    expect(hasPermission(superAdmin, "user:deprecate_role")).toBe(true);

    expect(hasPermission(counsellor, "tenant:cross_transfer")).toBe(false);
    expect(hasPermission(counsellor, "application:create")).toBe(true);
  });

  it("should prepare clean role migration payload", () => {
    const intermediateOfficer: AppUser = {
      uid: "usr-4",
      email: "admissions@educrm.demo",
      role: "admissions_officer",
      isDeprecatedRole: true,
      roleEffectiveFallback: "team_leader",
      createdAt: 1000,
    };

    const payload = prepareRoleMigration(intermediateOfficer, "team_leader", "Academic Admissions");

    expect(payload.role).toBe("team_leader");
    expect(payload.isDeprecatedRole).toBe(false);
    expect(payload.roleEffectiveFallback).toBeUndefined();
    expect(payload.assignedDepartment).toBe("Academic Admissions");
  });
});
