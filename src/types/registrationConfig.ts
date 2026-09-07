import { UserRole } from "./role";

/**
 * Roles that can register via the /register page.
 */
export const EXTERNAL_ROLES: UserRole[] = [
  "student",
  "external_agent",
  "university_partner",
];

export const STAFF_ROLES: UserRole[] = [
  "counsellor",
  "admissions_officer",
  "finance_officer",
  "auditor",
  "support_user",
  "team_leader",
  "visa_officer",
];

export const SELF_REGISTERABLE_ROLES: UserRole[] = [
  ...EXTERNAL_ROLES,
  ...STAFF_ROLES,
];

/** Metadata describing a role's registration experience. */
export interface RoleRegistrationConfig {
  role: UserRole;
  label: string;
  tagline: string;
  description: string;
  /** lucide-react icon name (rendered in the component) */
  iconName:
    | "GraduationCap"
    | "Handshake"
    | "Building2"
    | "MessageSquare"
    | "DollarSign"
    | "ShieldCheck"
    | "LifeBuoy"
    | "FileCheck"
    | "Users"
    | "FileText";
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
  counsellor: {
    role: "counsellor",
    label: "Education Counsellor",
    tagline: "Student advisory desk & casework",
    description:
      "Access student caseloads, verify academic documents, recommend target universities, and provide direct two-way messaging guidance.",
    iconName: "MessageSquare",
    accentColor: "emerald",
    profileCollection: "users",
  },
  admissions_officer: {
    role: "admissions_officer",
    label: "Admissions Officer",
    tagline: "Application processing & offer releases",
    description:
      "Screen student credentials, verify entry criteria, liaise directly with university partners, and issue conditional/unconditional offers.",
    iconName: "FileCheck",
    accentColor: "cyan",
    profileCollection: "users",
  },
  finance_officer: {
    role: "finance_officer",
    label: "Finance & Accounts Officer",
    tagline: "Invoicing, tuition deposits & commissions",
    description:
      "Manage student tuition invoices, verify fee deposit receipts, track currency conversions, and process agent commission disbursements.",
    iconName: "DollarSign",
    accentColor: "amber",
    profileCollection: "users",
  },
  auditor: {
    role: "auditor",
    label: "Compliance Officer & Auditor",
    tagline: "Audit trails, regulatory logs & GDPR",
    description:
      "Inspect immutable system logs, verify admissions compliance regulations, inspect GDPR data requests, and monitor overall integrity.",
    iconName: "ShieldCheck",
    accentColor: "purple",
    profileCollection: "users",
  },
  support_user: {
    role: "support_user",
    label: "Support Desk Specialist",
    tagline: "Helpdesk tickets & system troubleshooting",
    description:
      "Manage user tickets, resolve technical queries, publish knowledge base solutions, and assist both internal staff and students.",
    iconName: "LifeBuoy",
    accentColor: "sky",
    profileCollection: "users",
  },
  team_leader: {
    role: "team_leader",
    label: "Branch Team Leader",
    tagline: "Caseload allocation & performance tracking",
    description:
      "Assign incoming student leads to counsellors, monitor team conversion velocity, manage tasks, and track branch targets.",
    iconName: "Users",
    accentColor: "indigo",
    profileCollection: "users",
  },
  visa_officer: {
    role: "visa_officer",
    label: "Visa & Immigration Officer",
    tagline: "CAS verification, COE & visa filing",
    description:
      "Oversee visa documentation, conduct mock embassy interview sessions, track CAS/COE releases, and log immigration decisions.",
    iconName: "FileText",
    accentColor: "teal",
    profileCollection: "users",
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
