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

// Only these two have real behavior wired up today.
export const ACTIVE_ROLES: UserRole[] = ["org_admin", "counsellor"];

export interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  createdAt: number;
}
