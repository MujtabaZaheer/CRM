import { ApplicationStage } from "../types/application";
import { UserRole } from "../types/role";

export interface StageRoleConfig {
  allowedRoles: UserRole[];
  ownerLabel: string;
  department: "Counselling" | "Admissions" | "Finance" | "Visa" | "Admin";
  actionDescription: string;
}

/**
 * Mapping of each application stage to the roles authorized to transition INTO that stage,
 * along with display metadata for UI badges and disabled options.
 */
export const STAGE_AUTHORIZATION_MAP: Record<ApplicationStage, StageRoleConfig> = {
  Draft: {
    allowedRoles: ["counsellor", "team_leader", "office_manager", "external_agent", "platform_super_admin", "org_admin"],
    ownerLabel: "Counsellor",
    department: "Counselling",
    actionDescription: "Create or reset application draft",
  },
  "Initial Review": {
    allowedRoles: ["counsellor", "team_leader", "office_manager", "platform_super_admin", "org_admin"],
    ownerLabel: "Counsellor",
    department: "Counselling",
    actionDescription: "Review initial documents and applicant details",
  },
  "Documents Pending": {
    allowedRoles: ["counsellor", "team_leader", "office_manager", "external_agent", "platform_super_admin", "org_admin"],
    ownerLabel: "Counsellor",
    department: "Counselling",
    actionDescription: "Request missing documents from applicant",
  },
  "Ready for Submission": {
    allowedRoles: ["counsellor", "team_leader", "office_manager", "platform_super_admin", "org_admin"],
    ownerLabel: "Counsellor",
    department: "Counselling",
    actionDescription: "Mark file verified and ready to dispatch to university",
  },
  Submitted: {
    allowedRoles: ["counsellor", "team_leader", "office_manager", "platform_super_admin", "org_admin"],
    ownerLabel: "Counsellor",
    department: "Counselling",
    actionDescription: "Submit file to university portal / partner",
  },
  "University Reviewing": {
    allowedRoles: ["admissions_officer", "university_partner", "platform_super_admin", "org_admin"],
    ownerLabel: "Admissions Officer",
    department: "Admissions",
    actionDescription: "Confirm university has logged and is evaluating the application",
  },
  "Additional Info Requested": {
    allowedRoles: ["admissions_officer", "university_partner", "platform_super_admin", "org_admin"],
    ownerLabel: "Admissions Officer",
    department: "Admissions",
    actionDescription: "University requests further academic or identity proofs",
  },
  "Conditional Offer": {
    allowedRoles: ["admissions_officer", "university_partner", "platform_super_admin", "org_admin"],
    ownerLabel: "Admissions Officer",
    department: "Admissions",
    actionDescription: "Issue Conditional Offer Letter from university",
  },
  "Unconditional Offer": {
    allowedRoles: ["admissions_officer", "university_partner", "platform_super_admin", "org_admin"],
    ownerLabel: "Admissions Officer",
    department: "Admissions",
    actionDescription: "Issue Unconditional Offer Letter after prerequisites met",
  },
  "Deposit Pending": {
    allowedRoles: ["finance_officer", "platform_super_admin", "org_admin"],
    ownerLabel: "Finance Officer",
    department: "Finance",
    actionDescription: "Generate deposit invoice / fee challan for applicant",
  },
  "Deposit Paid": {
    allowedRoles: ["finance_officer", "platform_super_admin", "org_admin"],
    ownerLabel: "Finance Officer",
    department: "Finance",
    actionDescription: "Verify deposit receipt and approve fee clearance",
  },
  "CAS / COE Pending": {
    allowedRoles: ["visa_officer", "platform_super_admin", "org_admin"],
    ownerLabel: "Visa Officer",
    department: "Visa",
    actionDescription: "Initiate CAS / Confirmation of Enrolment request with university",
  },
  "CAS Issued": {
    allowedRoles: ["visa_officer", "platform_super_admin", "org_admin"],
    ownerLabel: "Visa Officer",
    department: "Visa",
    actionDescription: "Record issued CAS / COE reference number",
  },
  "Visa Preparation": {
    allowedRoles: ["visa_officer", "platform_super_admin", "org_admin"],
    ownerLabel: "Visa Officer",
    department: "Visa",
    actionDescription: "Prepare embassy file, financial statements, and biometric appointments",
  },
  "Visa Submitted": {
    allowedRoles: ["visa_officer", "platform_super_admin", "org_admin"],
    ownerLabel: "Visa Officer",
    department: "Visa",
    actionDescription: "File lodged with immigration authority / embassy",
  },
  "Visa Approved": {
    allowedRoles: ["visa_officer", "platform_super_admin", "org_admin"],
    ownerLabel: "Visa Officer",
    department: "Visa",
    actionDescription: "Visa grant clearance confirmed",
  },
  Enrolled: {
    allowedRoles: ["admissions_officer", "team_leader", "platform_super_admin", "org_admin"],
    ownerLabel: "Admissions Officer",
    department: "Admissions",
    actionDescription: "Confirm arrival and university registration complete",
  },
  Deferred: {
    allowedRoles: ["admissions_officer", "counsellor", "team_leader", "platform_super_admin", "org_admin"],
    ownerLabel: "Admissions / Counsellor",
    department: "Admissions",
    actionDescription: "Defer intake to next academic session",
  },
  Withdrawn: {
    allowedRoles: ["counsellor", "team_leader", "admissions_officer", "platform_super_admin", "org_admin"],
    ownerLabel: "Counsellor / Admissions",
    department: "Counselling",
    actionDescription: "Withdraw application per student request",
  },
  Rejected: {
    allowedRoles: ["admissions_officer", "university_partner", "visa_officer", "platform_super_admin", "org_admin"],
    ownerLabel: "Admissions / Visa Officer",
    department: "Admissions",
    actionDescription: "Mark application unsuccessful by university or immigration refusal",
  },
};

/**
 * Checks if a given user role has permission to set/transition to the target stage.
 */
export function canUserSetStage(userRole: UserRole | undefined | null, targetStage: ApplicationStage): boolean {
  if (!userRole) return false;
  // Super admins & Org admins have universal override
  if (userRole === "platform_super_admin" || userRole === "org_admin") {
    return true;
  }
  const config = STAGE_AUTHORIZATION_MAP[targetStage];
  if (!config) return true; // Fallback allow if stage is unmapped
  return config.allowedRoles.includes(userRole);
}

/**
 * Returns the friendly owner role label responsible for this stage.
 * E.g., "Admissions Officer", "Finance Officer", "Visa Officer", "Counsellor".
 */
export function getStageOwnerLabel(stage: ApplicationStage): string {
  return STAGE_AUTHORIZATION_MAP[stage]?.ownerLabel || "Staff";
}

/**
 * Returns the department responsible for this stage.
 */
export function getStageDepartment(stage: ApplicationStage): string {
  return STAGE_AUTHORIZATION_MAP[stage]?.department || "General";
}

/**
 * Returns formatted select option label with ownership indicator.
 * E.g., "Conditional Offer — Admissions Officer 🔒" or "Conditional Offer (Your Role)"
 */
export function getStageSelectOptionLabel(stage: ApplicationStage, userRole?: UserRole | null): string {
  const isAllowed = canUserSetStage(userRole, stage);
  const owner = getStageOwnerLabel(stage);
  if (isAllowed) {
    return stage;
  }
  return `${stage} — ${owner} Only 🔒`;
}

/**
 * Returns all stages authorized for a specific role.
 */
export function getAuthorizedStagesForRole(userRole: UserRole | undefined | null): ApplicationStage[] {
  const allStages = Object.keys(STAGE_AUTHORIZATION_MAP) as ApplicationStage[];
  if (!userRole) return [];
  if (userRole === "platform_super_admin" || userRole === "org_admin") {
    return allStages;
  }
  return allStages.filter((stage) => STAGE_AUTHORIZATION_MAP[stage].allowedRoles.includes(userRole));
}
