import { UserRole } from "./role";

/**
 * Roles that can self-register via the public /register page.
 * Internal staff roles are provisioned via admin invitation only.
 */
export const SELF_REGISTERABLE_ROLES: UserRole[] = [
  "student",
  "external_agent",
  "university_partner",
];

/** Metadata describing a role's public registration experience. */
export interface RoleRegistrationConfig {
  role: UserRole;
  label: string;
  tagline: string;
  description: string;
  /** lucide-react icon name (rendered in the component) */
  iconName: "GraduationCap" | "Handshake" | "Building2";
  /** Accent color class applied to the role card */
  accentColor: string;
  /** Firestore collection where the role-specific profile is stored */
  profileCollection: string;
}

export const REGISTRATION_CONFIGS: Record<string, RoleRegistrationConfig> = {
  student: {
    role: "student",
    label: "Student / Applicant",
    tagline: "Apply to universities worldwide",
    description:
      "Create an account to build your academic profile, submit university applications, upload documents, and track your progress in real-time.",
    iconName: "GraduationCap",
    accentColor: "emerald",
    profileCollection: "students",
  },
  external_agent: {
    role: "external_agent",
    label: "External Referral Agent",
    tagline: "Refer students & earn commissions",
    description:
      "Register as a referral agent to submit student leads, track application outcomes, and manage commission payouts from your dedicated portal.",
    iconName: "Handshake",
    accentColor: "amber",
    profileCollection: "agents",
  },
  university_partner: {
    role: "university_partner",
    label: "University Admissions Partner",
    tagline: "Review applications & issue offers",
    description:
      "Register as a university representative to receive and review student applications, issue admission decisions, and release CAS/COE references.",
    iconName: "Building2",
    accentColor: "indigo",
    profileCollection: "university_partners",
  },
};

/**
 * Returns the dashboard path for a given user role.
 * Centralised so Login, AuthContext, and Register all agree.
 */
export function getRoleDashboardPath(role: UserRole): string {
  switch (role) {
    case "student":
      return "/student/dashboard";
    case "external_agent":
      return "/agent/dashboard";
    case "university_partner":
      return "/university/dashboard";
    case "team_leader":
      return "/team-leader/dashboard";
    case "counsellor":
      return "/counsellor/dashboard";
    case "admissions_officer":
      return "/admissions/dashboard";
    case "finance_officer":
      return "/finance/dashboard";
    case "support_user":
      return "/support/dashboard";
    case "auditor":
    case "compliance_officer":
      return "/auditor/dashboard";
    case "platform_super_admin":
      return "/super-admin/dashboard";
    case "visa_officer":
      return "/visa-officer/dashboard";
    case "org_admin":
      return "/";
    case "office_manager":
      return "/users";
    default:
      return "/";
  }
}
