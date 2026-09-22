/**
 * EduCRM Role-Based Access Control (RBAC) & Role Rationalization Engine
 * Manages capability matrix, deprecation lifecycles, and zero-downtime user migration.
 */

import { UserRole, AppUser } from "../types/role";

export type CrmPermission =
  | "lead:create"
  | "lead:read"
  | "lead:update"
  | "lead:delete"
  | "application:create"
  | "application:read"
  | "application:update_stage"
  | "application:reassign"
  | "application:lock"
  | "application:clone"
  | "document:verify"
  | "document:upload"
  | "offer:issue"
  | "offer:decision"
  | "tenant:cross_transfer"
  | "user:provision"
  | "user:deprecate_role"
  | "audit:view"
  | "finance:view";

export const RBAC_ROLE_MATRIX: Record<UserRole, CrmPermission[]> = {
  platform_super_admin: [
    "lead:create",
    "lead:read",
    "lead:update",
    "lead:delete",
    "application:create",
    "application:read",
    "application:update_stage",
    "application:reassign",
    "application:lock",
    "application:clone",
    "document:verify",
    "document:upload",
    "offer:issue",
    "offer:decision",
    "tenant:cross_transfer",
    "user:provision",
    "user:deprecate_role",
    "audit:view",
    "finance:view",
  ],
  org_admin: [
    "lead:create",
    "lead:read",
    "lead:update",
    "lead:delete",
    "application:create",
    "application:read",
    "application:update_stage",
    "application:reassign",
    "application:lock",
    "application:clone",
    "document:verify",
    "document:upload",
    "offer:issue",
    "offer:decision",
    "tenant:cross_transfer",
    "user:provision",
    "audit:view",
    "finance:view",
  ],
  office_manager: [
    "lead:create",
    "lead:read",
    "lead:update",
    "application:create",
    "application:read",
    "application:update_stage",
    "application:reassign",
    "application:lock",
    "application:clone",
    "document:verify",
    "document:upload",
    "offer:issue",
    "offer:decision",
    "tenant:cross_transfer",
    "audit:view",
    "finance:view",
  ],
  team_leader: [
    "lead:create",
    "lead:read",
    "lead:update",
    "application:create",
    "application:read",
    "application:update_stage",
    "application:reassign",
    "application:lock",
    "application:clone",
    "document:verify",
    "document:upload",
    "offer:issue",
    "offer:decision",
    "audit:view",
  ],
  admissions_officer: [
    // Intermediate tier: High redundancy with team_leader and counsellor
    "application:read",
    "application:update_stage",
    "application:reassign",
    "application:clone",
    "document:verify",
    "offer:issue",
    "audit:view",
  ],
  counsellor: [
    "lead:create",
    "lead:read",
    "lead:update",
    "application:create",
    "application:read",
    "application:update_stage",
    "application:clone",
    "document:upload",
    "audit:view",
  ],
  visa_officer: [
    "application:read",
    "application:update_stage",
    "document:verify",
    "document:upload",
    "audit:view",
  ],
  finance_officer: [
    "application:read",
    "finance:view",
    "audit:view",
  ],
  compliance_officer: [
    "application:read",
    "document:verify",
    "audit:view",
  ],
  auditor: [
    "application:read",
    "lead:read",
    "audit:view",
    "finance:view",
  ],
  support_user: [
    "lead:read",
    "application:read",
  ],
  external_agent: [
    "application:create",
    "application:read",
    "document:upload",
  ],
  university_partner: [
    "application:read",
    "application:update_stage",
    "document:verify",
    "offer:issue",
    "offer:decision",
  ],
  student: [
    "application:create",
    "application:read",
    "document:upload",
  ],
};

export interface RoleDeprecationConfig {
  role: UserRole;
  status: "active" | "in_deprecation" | "deprecated" | "decommissioned";
  announcedDate: string;
  effectiveDeprecationDate: string;
  recommendedFallbacks: {
    track: "admissions_triage" | "decision_and_partners";
    targetRole: UserRole;
    description: string;
  }[];
  deprecationNotice: string;
}

export const ROLE_DEPRECATION_REGISTRY: Record<string, RoleDeprecationConfig> = {
  admissions_officer: {
    role: "admissions_officer",
    status: "in_deprecation",
    announcedDate: "2026-09-01",
    effectiveDeprecationDate: "2026-12-31",
    recommendedFallbacks: [
      {
        track: "admissions_triage",
        targetRole: "counsellor",
        description:
          "Mapped to Senior Triage Counsellor with enhanced document verification and application processing permissions.",
      },
      {
        track: "decision_and_partners",
        targetRole: "team_leader",
        description:
          "Mapped to Team Leader with offer approval authority, application reassignment, and queue monitoring.",
      },
    ],
    deprecationNotice:
      "The intermediate Admissions Officer role is scheduled for consolidation to eliminate operational friction and queue latency. Active officers should be re-assigned to Senior Counsellor (Operations) or Team Leader (Academic Decisions).",
  },
};

/**
 * Checks if a given role is currently marked as deprecated or in-deprecation.
 */
export function isRoleDeprecated(role: UserRole): boolean {
  return role in ROLE_DEPRECATION_REGISTRY && ROLE_DEPRECATION_REGISTRY[role].status !== "active";
}

/**
 * Resolves the effective permissions for a user, combining standard permissions
 * with fallback capabilities if the user is in a deprecated role undergoing transition.
 */
export function getEffectivePermissions(user: AppUser | null): CrmPermission[] {
  if (!user) return [];

  const basePermissions = RBAC_ROLE_MATRIX[user.role] || [];

  // If user is operating under an active deprecation transition, merge fallback role permissions
  // to ensure zero permission gap during the migration window.
  if (user.isDeprecatedRole && user.roleEffectiveFallback) {
    const fallbackPermissions = RBAC_ROLE_MATRIX[user.roleEffectiveFallback] || [];
    return Array.from(new Set([...basePermissions, ...fallbackPermissions]));
  }

  return basePermissions;
}

/**
 * Determines whether a user has a specific permission.
 */
export function hasPermission(user: AppUser | null, permission: CrmPermission): boolean {
  const permissions = getEffectivePermissions(user);
  return permissions.includes(permission);
}

/**
 * Prepares user object for migration from a deprecated role to a standard consolidated role.
 */
export function prepareRoleMigration(
  user: AppUser,
  targetRole: UserRole,
  department?: string
): Partial<AppUser> {
  return {
    role: targetRole,
    isDeprecatedRole: false,
    roleEffectiveFallback: undefined,
    assignedDepartment: department || user.assignedDepartment || "Admissions Operations",
    updatedAt: Date.now(),
  };
}
