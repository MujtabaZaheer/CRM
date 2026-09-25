/**
 * EduCRM Application Workflow & Stage Handoff Engine
 * Based on CRM.pdf (Sections 2, 3.7, 3.14, 3.15, 3.16)
 *
 * Implements:
 * 1. 20-Stage Lifecycle Progression & Mutex Transitions
 * 2. Role-Scoped Visibility & Inbox Routing (The "Who Sees What When" Rule)
 * 3. Field Locking & System Behaviors per stage
 * 4. Validation guards & Automated Task/Notification Generation
 */

import { Application, ApplicationStage } from "../types/application";
import { AppUser, UserRole } from "../types/role";

export type FieldLockMode = "none" | "student_locked" | "all_locked" | "unlocked_slots";

export interface StageWorkflowRule {
  stage: ApplicationStage;
  label: string;
  whoUpdates: UserRole[];
  whoSees: UserRole[];
  inboxVisibility: UserRole[];
  fieldLockMode: FieldLockMode;
  systemBehavior: string;
  allowedNextStages: ApplicationStage[];
  actionRequiredRole?: UserRole;
  requiresReason?: boolean;
}

export const ALL_APPLICATION_STAGES: ApplicationStage[] = [
  "Draft",
  "Initial Review",
  "Documents Pending",
  "Ready for Submission",
  "Submitted",
  "University Reviewing",
  "Additional Info Requested",
  "Conditional Offer",
  "Unconditional Offer",
  "Deposit Pending",
  "Deposit Paid",
  "CAS / COE Pending",
  "CAS Issued",
  "Visa Preparation",
  "Visa Submitted",
  "Visa Approved",
  "Enrolled",
  "Deferred",
  "Withdrawn",
  "Rejected",
];

export const WORKFLOW_STAGE_MATRIX: Record<ApplicationStage, StageWorkflowRule> = {
  Draft: {
    stage: "Draft",
    label: "Draft",
    whoUpdates: ["student", "external_agent", "platform_super_admin", "org_admin"],
    whoSees: ["student", "external_agent", "counsellor", "team_leader", "platform_super_admin", "org_admin"],
    inboxVisibility: ["student", "external_agent", "counsellor"],
    fieldLockMode: "none",
    systemBehavior: "Full edit access. Hidden from Admissions and University.",
    allowedNextStages: ["Initial Review", "Documents Pending", "Withdrawn"],
  },
  "Initial Review": {
    stage: "Initial Review",
    label: "Initial Review",
    whoUpdates: ["counsellor", "team_leader", "student", "external_agent", "platform_super_admin", "org_admin"],
    whoSees: ["counsellor", "team_leader", "platform_super_admin", "org_admin", "student", "external_agent", "compliance_officer"],
    inboxVisibility: ["counsellor", "team_leader", "compliance_officer"],
    fieldLockMode: "none",
    systemBehavior: "Counsellor checks minimum GPA, English level, and passport/transcripts.",
    allowedNextStages: ["Documents Pending", "Ready for Submission", "Withdrawn", "Deferred"],
    actionRequiredRole: "counsellor",
  },
  "Documents Pending": {
    stage: "Documents Pending",
    label: "Documents Pending",
    whoUpdates: ["student", "external_agent", "counsellor", "compliance_officer", "platform_super_admin", "org_admin"],
    whoSees: ["student", "external_agent", "counsellor", "compliance_officer", "team_leader", "platform_super_admin", "org_admin"],
    inboxVisibility: ["student", "external_agent", "counsellor", "compliance_officer"],
    fieldLockMode: "unlocked_slots",
    systemBehavior: "Reopens document upload slots for flagged/missing items. Action Required badge on Student Locker.",
    allowedNextStages: ["Initial Review", "Ready for Submission", "Withdrawn"],
    actionRequiredRole: "student",
  },
  "Ready for Submission": {
    stage: "Ready for Submission",
    label: "Ready for Submission",
    whoUpdates: ["counsellor", "admissions_officer", "team_leader", "platform_super_admin", "org_admin"],
    whoSees: ["admissions_officer", "counsellor", "team_leader", "platform_super_admin", "org_admin", "student", "external_agent"],
    inboxVisibility: ["admissions_officer", "counsellor", "team_leader"],
    fieldLockMode: "student_locked",
    systemBehavior: "Profile locked for Student/Agent. Admissions Officer verifies full compliance dossier on Submissions Desk.",
    allowedNextStages: ["Submitted", "Documents Pending", "Initial Review", "Withdrawn", "Deferred"],
    actionRequiredRole: "admissions_officer",
  },
  Submitted: {
    stage: "Submitted",
    label: "Submitted",
    whoUpdates: ["admissions_officer", "platform_super_admin", "org_admin"],
    whoSees: ["admissions_officer", "university_partner", "counsellor", "team_leader", "student", "external_agent", "platform_super_admin", "org_admin"],
    inboxVisibility: ["admissions_officer", "university_partner"],
    fieldLockMode: "all_locked",
    systemBehavior: "All fields hard-locked. Dispatched via API/portal. Shows in University inbox with full verified dossier.",
    allowedNextStages: ["University Reviewing", "Additional Info Requested", "Conditional Offer", "Unconditional Offer", "Rejected", "Withdrawn"],
    actionRequiredRole: "university_partner",
  },
  "University Reviewing": {
    stage: "University Reviewing",
    label: "University Reviewing",
    whoUpdates: ["university_partner", "admissions_officer", "platform_super_admin", "org_admin"],
    whoSees: ["university_partner", "admissions_officer", "counsellor", "team_leader", "student", "external_agent", "platform_super_admin", "org_admin"],
    inboxVisibility: ["university_partner", "admissions_officer"],
    fieldLockMode: "student_locked",
    systemBehavior: "University logs evaluation notes; internal agency team sees 'Under Uni Assessment'.",
    allowedNextStages: ["Additional Info Requested", "Conditional Offer", "Unconditional Offer", "Rejected", "Withdrawn"],
    actionRequiredRole: "university_partner",
  },
  "Additional Info Requested": {
    stage: "Additional Info Requested",
    label: "Additional Info Requested",
    whoUpdates: ["university_partner", "student", "counsellor", "admissions_officer", "platform_super_admin", "org_admin"],
    whoSees: ["student", "counsellor", "university_partner", "admissions_officer", "team_leader", "external_agent", "platform_super_admin", "org_admin"],
    inboxVisibility: ["student", "counsellor", "university_partner"],
    fieldLockMode: "unlocked_slots",
    systemBehavior: "Specific requested field/document unlocked for upload; notifies Counsellor immediately. Urgent Banner in Student Locker.",
    allowedNextStages: ["University Reviewing", "Conditional Offer", "Unconditional Offer", "Rejected", "Withdrawn"],
    actionRequiredRole: "student",
  },
  "Conditional Offer": {
    stage: "Conditional Offer",
    label: "Conditional Offer",
    whoUpdates: ["university_partner", "admissions_officer", "platform_super_admin", "org_admin"],
    whoSees: ["university_partner", "admissions_officer", "counsellor", "student", "team_leader", "external_agent", "platform_super_admin", "org_admin"],
    inboxVisibility: ["student", "counsellor", "admissions_officer", "university_partner"],
    fieldLockMode: "student_locked",
    systemBehavior: "Offer letter generated/uploaded. Conditions logged in structured table (e.g., target IELTS score).",
    allowedNextStages: ["Unconditional Offer", "Deposit Pending", "Additional Info Requested", "Rejected", "Deferred", "Withdrawn"],
  },
  "Unconditional Offer": {
    stage: "Unconditional Offer",
    label: "Unconditional Offer",
    whoUpdates: ["university_partner", "admissions_officer", "platform_super_admin", "org_admin"],
    whoSees: ["university_partner", "admissions_officer", "counsellor", "student", "team_leader", "external_agent", "platform_super_admin", "org_admin"],
    inboxVisibility: ["student", "counsellor", "admissions_officer", "university_partner"],
    fieldLockMode: "student_locked",
    systemBehavior: "Unconditional Offer PDF published. Triggers 'Accept Offer' CTA for Student/Counsellor.",
    allowedNextStages: ["Deposit Pending", "Deferred", "Withdrawn"],
    actionRequiredRole: "student",
  },
  "Deposit Pending": {
    stage: "Deposit Pending",
    label: "Deposit Pending",
    whoUpdates: ["student", "counsellor", "finance_officer", "platform_super_admin", "org_admin"],
    whoSees: ["finance_officer", "student", "counsellor", "team_leader", "external_agent", "platform_super_admin", "org_admin"],
    inboxVisibility: ["finance_officer", "student", "counsellor"],
    fieldLockMode: "unlocked_slots",
    systemBehavior: "Payment challan/wire transfer instructions presented; student uploads proof of payment.",
    allowedNextStages: ["Deposit Paid", "Withdrawn", "Deferred"],
    actionRequiredRole: "finance_officer",
  },
  "Deposit Paid": {
    stage: "Deposit Paid",
    label: "Deposit Paid",
    whoUpdates: ["finance_officer", "platform_super_admin", "org_admin"],
    whoSees: ["finance_officer", "admissions_officer", "compliance_officer", "counsellor", "student", "team_leader", "platform_super_admin", "org_admin"],
    inboxVisibility: ["finance_officer", "admissions_officer", "compliance_officer"],
    fieldLockMode: "student_locked",
    systemBehavior: "Finance reconciles payment ledger. Automatically unlocks the CAS / COE generation pipeline.",
    allowedNextStages: ["CAS / COE Pending", "Deferred", "Withdrawn"],
    actionRequiredRole: "compliance_officer",
  },
  "CAS / COE Pending": {
    stage: "CAS / COE Pending",
    label: "CAS / COE Pending",
    whoUpdates: ["compliance_officer", "admissions_officer", "platform_super_admin", "org_admin"],
    whoSees: ["compliance_officer", "university_partner", "admissions_officer", "counsellor", "student", "team_leader", "platform_super_admin", "org_admin"],
    inboxVisibility: ["compliance_officer", "university_partner", "admissions_officer"],
    fieldLockMode: "student_locked",
    systemBehavior: "Genuine Student (GTE/GS) checklist vetted; formal CAS/COE request dispatched to Uni.",
    allowedNextStages: ["CAS Issued", "Additional Info Requested", "Withdrawn"],
    actionRequiredRole: "university_partner",
  },
  "CAS Issued": {
    stage: "CAS Issued",
    label: "CAS Issued",
    whoUpdates: ["university_partner", "admissions_officer", "platform_super_admin", "org_admin"],
    whoSees: ["university_partner", "compliance_officer", "counsellor", "student", "admissions_officer", "team_leader", "platform_super_admin", "org_admin"],
    inboxVisibility: ["compliance_officer", "counsellor", "student"],
    fieldLockMode: "student_locked",
    systemBehavior: "University inputs CAS/COE reference number & expiry date; PDF attachment available.",
    allowedNextStages: ["Visa Preparation", "Deferred", "Withdrawn"],
    actionRequiredRole: "counsellor",
  },
  "Visa Preparation": {
    stage: "Visa Preparation",
    label: "Visa Preparation",
    whoUpdates: ["counsellor", "student", "compliance_officer", "visa_officer", "platform_super_admin", "org_admin"],
    whoSees: ["counsellor", "student", "compliance_officer", "visa_officer", "team_leader", "platform_super_admin", "org_admin"],
    inboxVisibility: ["counsellor", "student", "compliance_officer"],
    fieldLockMode: "unlocked_slots",
    systemBehavior: "Pre-visa checklist unlocked (financial statements, TB test, SOP, sponsorship letters).",
    allowedNextStages: ["Visa Submitted", "Deferred", "Withdrawn"],
    actionRequiredRole: "student",
  },
  "Visa Submitted": {
    stage: "Visa Submitted",
    label: "Visa Submitted",
    whoUpdates: ["student", "counsellor", "visa_officer", "platform_super_admin", "org_admin"],
    whoSees: ["counsellor", "admissions_officer", "student", "visa_officer", "team_leader", "platform_super_admin", "org_admin"],
    inboxVisibility: ["counsellor", "admissions_officer", "student"],
    fieldLockMode: "student_locked",
    systemBehavior: "Captures visa application reference (GWF/VFS), appointment date, and biometric confirmation.",
    allowedNextStages: ["Visa Approved", "Rejected", "Deferred", "Withdrawn"],
  },
  "Visa Approved": {
    stage: "Visa Approved",
    label: "Visa Approved",
    whoUpdates: ["counsellor", "student", "visa_officer", "admissions_officer", "platform_super_admin", "org_admin"],
    whoSees: ["counsellor", "admissions_officer", "finance_officer", "student", "team_leader", "platform_super_admin", "org_admin"],
    inboxVisibility: ["counsellor", "admissions_officer", "finance_officer", "student"],
    fieldLockMode: "student_locked",
    systemBehavior: "Vignette / BRP decision letter uploaded; system flags student as ready for arrival.",
    allowedNextStages: ["Enrolled", "Deferred", "Withdrawn"],
  },
  Enrolled: {
    stage: "Enrolled",
    label: "Enrolled",
    whoUpdates: ["university_partner", "admissions_officer", "platform_super_admin", "org_admin"],
    whoSees: ["university_partner", "finance_officer", "admissions_officer", "counsellor", "student", "external_agent", "team_leader", "platform_super_admin", "org_admin"],
    inboxVisibility: ["university_partner", "finance_officer"],
    fieldLockMode: "all_locked",
    systemBehavior: "Student confirmed registered on campus. Triggers automated commission calculation for Finance & Agent.",
    allowedNextStages: ["Deferred"],
  },
  Deferred: {
    stage: "Deferred",
    label: "Deferred",
    whoUpdates: ["admissions_officer", "team_leader", "platform_super_admin", "org_admin"],
    whoSees: ["admissions_officer", "counsellor", "student", "team_leader", "platform_super_admin", "org_admin"],
    inboxVisibility: ["admissions_officer", "counsellor", "student"],
    fieldLockMode: "student_locked",
    systemBehavior: "Intake shifted to next academic cycle; historical logs preserved.",
    allowedNextStages: ["Draft", "Initial Review", "Ready for Submission"],
    requiresReason: true,
  },
  Withdrawn: {
    stage: "Withdrawn",
    label: "Withdrawn",
    whoUpdates: ["student", "counsellor", "team_leader", "platform_super_admin", "org_admin"],
    whoSees: ["counsellor", "team_leader", "admissions_officer", "student", "platform_super_admin", "org_admin"],
    inboxVisibility: [],
    fieldLockMode: "all_locked",
    systemBehavior: "Requires mandatory reason code (Financial, Personal, Alternative Offer, Visa Refusal).",
    allowedNextStages: [],
    requiresReason: true,
  },
  Rejected: {
    stage: "Rejected",
    label: "Rejected",
    whoUpdates: ["university_partner", "admissions_officer", "visa_officer", "platform_super_admin", "org_admin"],
    whoSees: ["university_partner", "admissions_officer", "visa_officer", "counsellor", "student", "external_agent", "team_leader", "platform_super_admin", "org_admin"],
    inboxVisibility: [],
    fieldLockMode: "all_locked",
    systemBehavior: "Declines logged with official reason category for audit and analytics.",
    allowedNextStages: [],
    requiresReason: true,
  },
};

/**
 * Checks if a user role is authorized to transition an application from currentStage to targetStage.
 */
export function canUserTransitionStage(
  currentStage: ApplicationStage,
  targetStage: ApplicationStage,
  userRole?: UserRole | null
): boolean {
  if (!userRole) return false;

  // Universal administrative override
  if (
    userRole === "platform_super_admin" ||
    userRole === "org_admin" ||
    userRole === "office_manager"
  ) {
    return true;
  }

  const targetConfig = WORKFLOW_STAGE_MATRIX[targetStage];
  if (!targetConfig) return false;

  // Check if role is authorized to trigger target stage
  const isAuthorizedRole = targetConfig.whoUpdates.includes(userRole);
  if (!isAuthorizedRole) return false;

  // Mutex transition rule check: Target stage must be among currentStage's allowed next stages
  const currentConfig = WORKFLOW_STAGE_MATRIX[currentStage];
  if (currentConfig && currentConfig.allowedNextStages.length > 0) {
    const isAllowedNext = currentConfig.allowedNextStages.includes(targetStage);
    if (!isAllowedNext) {
      // Allow Team Leader to override sequence transitions if authorized for that stage
      if (userRole === "team_leader" && targetConfig.whoUpdates.includes("team_leader")) {
        return true;
      }
      return false;
    }
  }

  return true;
}

/**
 * Returns allowed next stages for an application given current stage and user role.
 */
export function getAllowedNextStages(
  currentStage: ApplicationStage,
  userRole?: UserRole | null
): ApplicationStage[] {
  const currentRule = WORKFLOW_STAGE_MATRIX[currentStage];
  if (!currentRule) return [];

  const isAdmin =
    userRole === "platform_super_admin" ||
    userRole === "org_admin" ||
    userRole === "office_manager";

  if (isAdmin) {
    return currentRule.allowedNextStages;
  }

  return currentRule.allowedNextStages.filter((targetStage) => {
    const targetRule = WORKFLOW_STAGE_MATRIX[targetStage];
    return targetRule && (!userRole || targetRule.whoUpdates.includes(userRole));
  });
}

/**
 * Validates transition preconditions and returns an error message if invalid.
 */
export function validateStageTransition(
  app: Application,
  targetStage: ApplicationStage,
  payload?: {
    note?: string;
    reason?: string;
    offerLetterUrl?: string;
    offerConditions?: string;
    depositAmount?: number;
    casRefNumber?: string;
    visaRefNumber?: string;
  }
): { isValid: boolean; errorMessage?: string } {
  const targetRule = WORKFLOW_STAGE_MATRIX[targetStage];
  if (!targetRule) {
    return { isValid: false, errorMessage: `Unknown application stage: ${targetStage}` };
  }

  if (targetRule.requiresReason && !payload?.reason && !payload?.note) {
    return {
      isValid: false,
      errorMessage: `A mandatory reason code or explanatory note is required to transition to "${targetStage}".`,
    };
  }

  if (targetStage === "Conditional Offer" && !payload?.offerConditions && !app.offerConditions) {
    return {
      isValid: false,
      errorMessage: "Specific offer conditions (e.g. academic prerequisites, IELTS minimums) must be specified.",
    };
  }

  if (targetStage === "CAS Issued" && !payload?.casRefNumber && !app.casRefNumber) {
    return {
      isValid: false,
      errorMessage: "Official CAS / COE reference number is required to confirm issuance.",
    };
  }

  return { isValid: true };
}

/**
 * Computes field lock status for the current user and application stage.
 */
export function getApplicationLockStatus(
  stage: ApplicationStage,
  userRole?: UserRole | null,
  lockedAt?: number
): { isLocked: boolean; reason?: string; lockMode: FieldLockMode } {
  const rule = WORKFLOW_STAGE_MATRIX[stage];
  const lockMode = rule ? rule.fieldLockMode : "none";

  const isSuperUser =
    userRole === "platform_super_admin" ||
    userRole === "org_admin" ||
    userRole === "office_manager";

  if (isSuperUser) {
    return { isLocked: false, lockMode };
  }

  if (lockMode === "all_locked" || (typeof lockedAt === "number" && lockedAt > 0)) {
    return {
      isLocked: true,
      reason: `Application fields are hard-locked in "${stage}" stage.`,
      lockMode,
    };
  }

  if (lockMode === "student_locked") {
    if (userRole === "student" || userRole === "external_agent") {
      return {
        isLocked: true,
        reason: `Application dossier is locked for student/agent modification during ${stage}.`,
        lockMode,
      };
    }
  }

  return { isLocked: false, lockMode };
}

/**
 * Query Scoping Schema (Section 3 of CRM specification)
 * Returns the query filter criteria according to user role jurisdiction.
 */
export function getApplicationQueryFilters(user: AppUser | null | undefined): Record<string, any> {
  if (!user) return { id: "__UNAUTHORIZED__" };

  switch (user.role) {
    case "student":
      return { studentId: user.uid };

    case "external_agent":
      return {
        $or: [{ agentUid: user.uid }, { agentId: (user as any).agentId || user.uid }],
      };

    case "counsellor":
      return {
        $or: [
          { assignedCounsellorId: user.uid },
          { assignedCounsellor: user.email },
          { assignedCounsellor: user.uid },
        ],
      };

    case "admissions_officer":
      return {
        stage: {
          $in: [
            "Ready for Submission",
            "Submitted",
            "University Reviewing",
            "Additional Info Requested",
            "Conditional Offer",
            "Unconditional Offer",
            "Deposit Paid",
            "CAS / COE Pending",
            "Enrolled",
            "Deferred",
          ],
        },
      };

    case "university_partner":
      return {
        universityId: user.partnerUniversityId || (user as any).universityId,
        stage: {
          $in: [
            "Submitted",
            "University Reviewing",
            "Additional Info Requested",
            "Conditional Offer",
            "Unconditional Offer",
            "CAS Issued",
            "Enrolled",
            "Rejected",
          ],
        },
      };

    case "compliance_officer":
      return {
        stage: {
          $in: [
            "Documents Pending",
            "Initial Review",
            "CAS / COE Pending",
            "Visa Preparation",
          ],
        },
      };

    case "finance_officer":
      return {
        stage: {
          $in: ["Deposit Pending", "Deposit Paid", "Enrolled"],
        },
      };

    case "visa_officer":
      return {
        stage: {
          $in: [
            "CAS / COE Pending",
            "CAS Issued",
            "Visa Preparation",
            "Visa Submitted",
            "Visa Approved",
            "Rejected",
          ],
        },
      };

    case "team_leader":
    case "office_manager":
    case "org_admin":
    case "platform_super_admin":
    case "auditor":
    default:
      return {}; // Global visibility across all branches and stages
  }
}

/**
 * In-memory jurisdiction filtering for an application.
 * Evaluates whether the given application should be visible to the specified user role.
 */
export function isApplicationVisibleForRole(
  app: Application,
  user: AppUser | null | undefined
): boolean {
  if (!user) return false;

  // Universal visibility for management & governance roles
  if (
    user.role === "platform_super_admin" ||
    user.role === "org_admin" ||
    user.role === "office_manager" ||
    user.role === "team_leader" ||
    user.role === "auditor" ||
    user.role === "support_user"
  ) {
    return true;
  }

  // Student jurisdiction
  if (user.role === "student") {
    if (app.studentId === user.uid) return true;
    if (app.studentEmail && user.email && app.studentEmail.toLowerCase().trim() === user.email.toLowerCase().trim()) {
      return true;
    }
    return false;
  }

  // External Agent jurisdiction
  if (user.role === "external_agent") {
    if (app.agentUid === user.uid) return true;
    if ((user as any).agentId && app.agentUid === (user as any).agentId) return true;
    if (app.sourceAgentName && user.agencyName && app.sourceAgentName.toLowerCase().trim() === user.agencyName.toLowerCase().trim()) {
      return true;
    }
    return false;
  }

  // Counsellor jurisdiction
  if (user.role === "counsellor") {
    if (app.assignedCounsellorId === user.uid || app.assignedCounsellorId === user.email) return true;
    if (app.assignedCounsellor === user.email || app.assignedCounsellor === user.uid) return true;
    if ((app as any).counsellorId === user.uid || (app as any).counsellorId === user.email) return true;
    if (app.assignedCounsellor && user.email && app.assignedCounsellor.toLowerCase().trim() === user.email.toLowerCase().trim()) return true;
    return false;
  }

  // Admissions Officer jurisdiction
  if (user.role === "admissions_officer") {
    const admittedStages: ApplicationStage[] = [
      "Ready for Submission",
      "Submitted",
      "University Reviewing",
      "Additional Info Requested",
      "Conditional Offer",
      "Unconditional Offer",
      "Deposit Paid",
      "CAS / COE Pending",
      "Enrolled",
      "Deferred",
    ];
    const isStageMatch = admittedStages.includes(app.stage);
    // Respect agent triage gate if present
    if (app.agentReferred && app.admissionsVisibility === false) {
      return false;
    }
    return isStageMatch;
  }

  // University Partner jurisdiction
  if (user.role === "university_partner") {
    const uniPartnerStages: ApplicationStage[] = [
      "Submitted",
      "University Reviewing",
      "Additional Info Requested",
      "Conditional Offer",
      "Unconditional Offer",
      "CAS Issued",
      "Enrolled",
      "Rejected",
    ];
    const isStageMatch = uniPartnerStages.includes(app.stage);
    if (!isStageMatch) return false;

    const userUniId = user.partnerUniversityId || (user as any).universityId;
    if (userUniId && app.universityId === userUniId) return true;

    if (user.universityName && app.universityName) {
      const uName = user.universityName.toLowerCase().trim();
      const aName = app.universityName.toLowerCase().trim();
      if (aName.includes(uName) || uName.includes(aName)) return true;
    }

    // If university identifier is unspecified, allow stage match
    return !userUniId && !user.universityName;
  }

  // Compliance Officer jurisdiction
  if (user.role === "compliance_officer") {
    const complianceStages: ApplicationStage[] = [
      "Documents Pending",
      "Initial Review",
      "CAS / COE Pending",
      "Visa Preparation",
    ];
    return complianceStages.includes(app.stage);
  }

  // Finance Officer jurisdiction
  if (user.role === "finance_officer") {
    const financeStages: ApplicationStage[] = [
      "Deposit Pending",
      "Deposit Paid",
      "Enrolled",
    ];
    return financeStages.includes(app.stage);
  }

  // Visa Officer jurisdiction
  if (user.role === "visa_officer") {
    const visaStages: ApplicationStage[] = [
      "CAS / COE Pending",
      "CAS Issued",
      "Visa Preparation",
      "Visa Submitted",
      "Visa Approved",
      "Rejected",
    ];
    return visaStages.includes(app.stage);
  }

  return true;
}

/**
 * Filter an array of applications based on user jurisdiction.
 */
export function filterApplicationsByJurisdiction(
  applications: Application[],
  user: AppUser | null | undefined
): Application[] {
  if (!user) return [];
  return applications.filter((app) => isApplicationVisibleForRole(app, user));
}

/**
 * Filter an array of applications into the specific "Inbox / Attention Required" queue for this role.
 */
export function getInboxApplicationsForRole(
  applications: Application[],
  user: AppUser | null | undefined
): Application[] {
  if (!user) return [];
  const scoped = filterApplicationsByJurisdiction(applications, user);

  return scoped.filter((app) => {
    const rule = WORKFLOW_STAGE_MATRIX[app.stage];
    if (!rule) return false;
    return rule.inboxVisibility.includes(user.role);
  });
}
