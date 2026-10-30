import { UserRole } from "../types/role";

export const DEMO_STUDENT_REGISTERED_EMAIL = "student.registered@educrm.demo";

export const DEMO_ACCOUNT_ROLES: Readonly<Record<string, UserRole>> = {
  "platform_super_admin@educrm.demo": "platform_super_admin",
  "superadmin@educrm.demo": "platform_super_admin",
  "admin@educrm.demo": "platform_super_admin",
  "orgadmin@educrm.demo": "org_admin",
  "org_admin@educrm.demo": "org_admin",
  "counsellor@educrm.demo": "counsellor",
  "team_leader@educrm.demo": "team_leader",
  "teamleader@educrm.demo": "team_leader",
  "admissions@educrm.demo": "admissions_officer",
  "admissions_officer@educrm.demo": "admissions_officer",
  "finance@educrm.demo": "finance_officer",
  "finance_officer@educrm.demo": "finance_officer",
  "support@educrm.demo": "support_user",
  "support_user@educrm.demo": "support_user",
  "auditor@educrm.demo": "auditor",
  "compliance@educrm.demo": "compliance_officer",
  "visa@educrm.demo": "visa_officer",
  "visa_officer@educrm.demo": "visa_officer",
  "external_agent@educrm.demo": "external_agent",
  "agent@educrm.demo": "external_agent",
  "university_partner@educrm.demo": "university_partner",
  "university@educrm.demo": "university_partner",
  "student@educrm.demo": "student",
  [DEMO_STUDENT_REGISTERED_EMAIL]: "student",
};

export const EXACT_DEMO_ROLE_MAP = DEMO_ACCOUNT_ROLES;

export const normalizeEmail = (email: string | null | undefined): string =>
  (email || "").toLowerCase().trim();

export const getDemoRole = (email: string | null | undefined): UserRole | null =>
  DEMO_ACCOUNT_ROLES[normalizeEmail(email)] || null;

export const isKnownDemoEmail = (email: string | null | undefined): boolean =>
  getDemoRole(email) !== null;
