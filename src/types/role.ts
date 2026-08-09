export type UserRole =
  | "platform_super_admin"
  | "org_admin"
  | "office_manager"
  | "team_leader"
  | "counsellor"
  | "admissions_officer"
  | "compliance_officer"
  | "finance_officer"
  | "visa_officer"
  | "student"
  | "auditor"
  | "support_user"
  | "external_agent"
  | "university_partner";

export const ROLE_LABELS: Record<UserRole, string> = {
  platform_super_admin: "Platform Super Admin",
  org_admin: "Organization Admin",
  office_manager: "Office Manager",
  team_leader: "Team Leader",
  counsellor: "Counsellor",
  admissions_officer: "Admissions Officer",
  compliance_officer: "Compliance Officer",
  finance_officer: "Finance Officer",
  visa_officer: "Visa Officer",
  student: "Student / Applicant",
  auditor: "Auditor / Read-only",
  support_user: "Support User",
  external_agent: "External Referral Agent",
  university_partner: "University Admissions Partner",
};

// Roles with dedicated application modules.
export const ACTIVE_ROLES: UserRole[] = [
  "platform_super_admin",
  "org_admin",
  "counsellor",
  "team_leader",
  "finance_officer",
  "admissions_officer",
  "visa_officer",
  "student",
  "support_user",
  "auditor",
  "external_agent",
  "university_partner",
];

export interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  createdAt: number;
  office?: string;
  team?: string;
  agencyName?: string;
  universityName?: string;
}
