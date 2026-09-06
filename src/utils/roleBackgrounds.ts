import { UserRole } from "../types/role";

/**
 * Role-to-Background Image Mapping
 * Provides subtle, role-tailored ambient photography across the platform.
 */
export const ROLE_BACKGROUND_MAP: Record<UserRole, string> = {
  student: "/images/student_campus_hero.jpg",
  counsellor: "/images/role_counsellor.jpg",
  team_leader: "/images/role_counsellor.jpg",
  admissions_officer: "/images/campus_us.jpg",
  university_partner: "/images/campus_us.jpg",
  finance_officer: "/images/role_finance.jpg",
  visa_officer: "/images/role_visa.jpg",
  compliance_officer: "/images/role_visa.jpg",
  external_agent: "/images/role_agent.jpg",
  platform_super_admin: "/images/role_admin.jpg",
  org_admin: "/images/role_admin.jpg",
  office_manager: "/images/role_admin.jpg",
  auditor: "/images/role_admin.jpg",
  support_user: "/images/role_admin.jpg",
};

/**
 * Resolves the background image for a given user role.
 */
export function getRoleBackground(role?: UserRole | string | null): string {
  if (!role) return "/images/campus_uk.jpg";
  return ROLE_BACKGROUND_MAP[role as UserRole] || "/images/campus_uk.jpg";
}
