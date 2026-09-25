import { ApplicationStage } from "../types/application";
import { UserRole } from "../types/role";
import { WORKFLOW_STAGE_MATRIX } from "./applicationWorkflowConfig";

export interface StageRoleConfig {
  allowedRoles: UserRole[];
  ownerLabel: string;
  department: "Counselling" | "Admissions" | "Finance" | "Visa" | "Admin";
  actionDescription: string;
}

export const STAGE_AUTHORIZATION_MAP: Record<ApplicationStage, StageRoleConfig> = {
  Draft: {
    allowedRoles: WORKFLOW_STAGE_MATRIX.Draft.whoUpdates,
    ownerLabel: "Student / Agent",
    department: "Counselling",
    actionDescription: WORKFLOW_STAGE_MATRIX.Draft.systemBehavior,
  },
  "Initial Review": {
    allowedRoles: WORKFLOW_STAGE_MATRIX["Initial Review"].whoUpdates,
    ownerLabel: "Counsellor",
    department: "Counselling",
    actionDescription: WORKFLOW_STAGE_MATRIX["Initial Review"].systemBehavior,
  },
  "Documents Pending": {
    allowedRoles: WORKFLOW_STAGE_MATRIX["Documents Pending"].whoUpdates,
    ownerLabel: "Student / Counsellor",
    department: "Counselling",
    actionDescription: WORKFLOW_STAGE_MATRIX["Documents Pending"].systemBehavior,
  },
  "Ready for Submission": {
    allowedRoles: WORKFLOW_STAGE_MATRIX["Ready for Submission"].whoUpdates,
    ownerLabel: "Admissions Officer",
    department: "Admissions",
    actionDescription: WORKFLOW_STAGE_MATRIX["Ready for Submission"].systemBehavior,
  },
  Submitted: {
    allowedRoles: WORKFLOW_STAGE_MATRIX.Submitted.whoUpdates,
    ownerLabel: "Admissions Officer",
    department: "Admissions",
    actionDescription: WORKFLOW_STAGE_MATRIX.Submitted.systemBehavior,
  },
  "University Reviewing": {
    allowedRoles: WORKFLOW_STAGE_MATRIX["University Reviewing"].whoUpdates,
    ownerLabel: "University Partner",
    department: "Admissions",
    actionDescription: WORKFLOW_STAGE_MATRIX["University Reviewing"].systemBehavior,
  },
  "Additional Info Requested": {
    allowedRoles: WORKFLOW_STAGE_MATRIX["Additional Info Requested"].whoUpdates,
    ownerLabel: "University Partner / Student",
    department: "Admissions",
    actionDescription: WORKFLOW_STAGE_MATRIX["Additional Info Requested"].systemBehavior,
  },
  "Conditional Offer": {
    allowedRoles: WORKFLOW_STAGE_MATRIX["Conditional Offer"].whoUpdates,
    ownerLabel: "University Partner",
    department: "Admissions",
    actionDescription: WORKFLOW_STAGE_MATRIX["Conditional Offer"].systemBehavior,
  },
  "Unconditional Offer": {
    allowedRoles: WORKFLOW_STAGE_MATRIX["Unconditional Offer"].whoUpdates,
    ownerLabel: "University Partner",
    department: "Admissions",
    actionDescription: WORKFLOW_STAGE_MATRIX["Unconditional Offer"].systemBehavior,
  },
  "Deposit Pending": {
    allowedRoles: WORKFLOW_STAGE_MATRIX["Deposit Pending"].whoUpdates,
    ownerLabel: "Finance Officer / Student",
    department: "Finance",
    actionDescription: WORKFLOW_STAGE_MATRIX["Deposit Pending"].systemBehavior,
  },
  "Deposit Paid": {
    allowedRoles: WORKFLOW_STAGE_MATRIX["Deposit Paid"].whoUpdates,
    ownerLabel: "Finance Officer",
    department: "Finance",
    actionDescription: WORKFLOW_STAGE_MATRIX["Deposit Paid"].systemBehavior,
  },
  "CAS / COE Pending": {
    allowedRoles: WORKFLOW_STAGE_MATRIX["CAS / COE Pending"].whoUpdates,
    ownerLabel: "Compliance / Admissions",
    department: "Visa",
    actionDescription: WORKFLOW_STAGE_MATRIX["CAS / COE Pending"].systemBehavior,
  },
  "CAS Issued": {
    allowedRoles: WORKFLOW_STAGE_MATRIX["CAS Issued"].whoUpdates,
    ownerLabel: "University Partner",
    department: "Visa",
    actionDescription: WORKFLOW_STAGE_MATRIX["CAS Issued"].systemBehavior,
  },
  "Visa Preparation": {
    allowedRoles: WORKFLOW_STAGE_MATRIX["Visa Preparation"].whoUpdates,
    ownerLabel: "Counsellor / Student",
    department: "Visa",
    actionDescription: WORKFLOW_STAGE_MATRIX["Visa Preparation"].systemBehavior,
  },
  "Visa Submitted": {
    allowedRoles: WORKFLOW_STAGE_MATRIX["Visa Submitted"].whoUpdates,
    ownerLabel: "Student / Counsellor",
    department: "Visa",
    actionDescription: WORKFLOW_STAGE_MATRIX["Visa Submitted"].systemBehavior,
  },
  "Visa Approved": {
    allowedRoles: WORKFLOW_STAGE_MATRIX["Visa Approved"].whoUpdates,
    ownerLabel: "Counsellor / Student",
    department: "Visa",
    actionDescription: WORKFLOW_STAGE_MATRIX["Visa Approved"].systemBehavior,
  },
  Enrolled: {
    allowedRoles: WORKFLOW_STAGE_MATRIX.Enrolled.whoUpdates,
    ownerLabel: "University Partner / Admissions",
    department: "Admissions",
    actionDescription: WORKFLOW_STAGE_MATRIX.Enrolled.systemBehavior,
  },
  Deferred: {
    allowedRoles: WORKFLOW_STAGE_MATRIX.Deferred.whoUpdates,
    ownerLabel: "Admissions / Team Leader",
    department: "Admissions",
    actionDescription: WORKFLOW_STAGE_MATRIX.Deferred.systemBehavior,
  },
  Withdrawn: {
    allowedRoles: WORKFLOW_STAGE_MATRIX.Withdrawn.whoUpdates,
    ownerLabel: "Student / Counsellor",
    department: "Counselling",
    actionDescription: WORKFLOW_STAGE_MATRIX.Withdrawn.systemBehavior,
  },
  Rejected: {
    allowedRoles: WORKFLOW_STAGE_MATRIX.Rejected.whoUpdates,
    ownerLabel: "University Partner / Admissions / Visa Officer",
    department: "Admissions",
    actionDescription: WORKFLOW_STAGE_MATRIX.Rejected.systemBehavior,
  },
};

/**
 * Checks if a given user role has permission to set/transition to the target stage.
 */
export function canUserSetStage(userRole: UserRole | undefined | null, targetStage: ApplicationStage): boolean {
  if (!userRole) return false;
  // Super admins & Org admins have universal override
  if (
    userRole === "platform_super_admin" ||
    userRole === "org_admin" ||
    userRole === "office_manager"
  ) {
    return true;
  }
  const config = STAGE_AUTHORIZATION_MAP[targetStage];
  if (!config) return true; // Fallback allow if stage is unmapped
  return config.allowedRoles.includes(userRole);
}

/**
 * Returns the friendly owner role label responsible for this stage.
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
  if (
    userRole === "platform_super_admin" ||
    userRole === "org_admin" ||
    userRole === "office_manager"
  ) {
    return allStages;
  }
  return allStages.filter((stage) => STAGE_AUTHORIZATION_MAP[stage].allowedRoles.includes(userRole));
}
