export type UserRole =
  | "platform_super_admin"
  | "org_admin"
  | "office_manager"
  | "team_leader"
  | "counsellor"
  | "admissions_officer"
  | "compliance_officer"
  | "finance_officer"
  | "auditor"
  | "support_user";

export const ROLE_LABELS: Record<UserRole, string> = {
  platform_super_admin: "Platform Super Admin",
  org_admin: "Organization Admin",
  office_manager: "Office Manager",
  team_leader: "Team Leader",
  counsellor: "Counsellor",
  admissions_officer: "Admissions Officer",
  compliance_officer: "Compliance Officer",
  finance_officer: "Finance Officer",
  auditor: "Auditor / Read-only",
  support_user: "Support User",
};

<<<<<<< HEAD
// Platform Super Admin, Organization Admin, and Counsellor have real behavior active
export const ACTIVE_ROLES: UserRole[] = ["platform_super_admin", "org_admin", "team_leader", "counsellor"];
=======
// Roles with dedicated application modules.
export const ACTIVE_ROLES: UserRole[] = ["platform_super_admin", "org_admin", "counsellor", "team_leader", "finance_officer"];
>>>>>>> 23d3134 (Implement Finance Officer module and latest CRM updates)

export interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  createdAt: number;
  office?: string;
  team?: string;
}
