import { UserRole } from "../types/role";

/**
 * Strict Role-Based Chat Target Mapping
 * 
 * Rules:
 * - All users chat with support officer
 * - Counsellor: student, support only (other user chat not show)
 * - Team leader: support only (other user chat not show)
 * - Admission officer: support, student only (other user chat not show)
 * - Auditor (and compliance): support only (other user chat not show)
 * - Visa: student, support only (other user chat not show)
 * - Super admin: support only (other user chat not show)
 * - Org admin (and office manager): support only (other user chat not show)
 * - Student: counsellor, admission, visa, support only (other user chat not show)
 * - University partner: support only (other user chat not show)
 * - Agent: support only (other user chat not show)
 * - Support officer: all users
 */
export const ALLOWED_CHAT_TARGET_ROLES: Record<UserRole, UserRole[]> = {
  // Support Officer can chat with ALL users
  support_user: [
    "student",
    "counsellor",
    "team_leader",
    "admissions_officer",
    "auditor",
    "compliance_officer",
    "visa_officer",
    "platform_super_admin",
    "org_admin",
    "office_manager",
    "university_partner",
    "external_agent",
    "finance_officer",
  ],

  // Counsellor: student, support only
  counsellor: ["student", "support_user"],

  // Team leader: support only
  team_leader: ["support_user"],

  // Admission officer: support, student only
  admissions_officer: ["student", "support_user"],

  // Auditor / Compliance: support only
  auditor: ["support_user"],
  compliance_officer: ["support_user"],

  // Visa: student, support only
  visa_officer: ["student", "support_user"],

  // Super admin: support only
  platform_super_admin: ["support_user"],

  // Org admin / Office manager: support only
  org_admin: ["support_user"],
  office_manager: ["support_user"],

  // Student: counsellor, admission, visa, support only
  student: ["counsellor", "admissions_officer", "visa_officer", "support_user"],

  // University partner: support only
  university_partner: ["support_user"],

  // External agent: support only
  external_agent: ["support_user"],

  // Finance officer: support only
  finance_officer: ["support_user"],
};

/**
 * Checks if Role A is allowed to chat with Role B
 */
export function isChatAllowed(roleA?: UserRole | string, roleB?: UserRole | string): boolean {
  if (!roleA || !roleB) return false;
  const a = roleA as UserRole;
  const b = roleB as UserRole;
  const allowedA = ALLOWED_CHAT_TARGET_ROLES[a] || [];
  const allowedB = ALLOWED_CHAT_TARGET_ROLES[b] || [];
  return allowedA.includes(b) && allowedB.includes(a);
}

/**
 * Returns user-friendly label for permitted counterpart roles
 */
export const COUNTERPART_ROLE_LABELS: Record<string, string> = {
  support_user: "Global Support Desk",
  student: "Student / Applicant",
  counsellor: "Dedicated Counsellor",
  admissions_officer: "Admissions Officer",
  visa_officer: "Visa Officer",
  team_leader: "Team Leader",
  auditor: "Compliance Auditor",
  platform_super_admin: "Super Admin",
  org_admin: "Organization Admin",
  university_partner: "University Partner",
  external_agent: "Recruitment Agent",
  finance_officer: "Finance Officer",
};
