import { describe, it, expect } from "vitest";
import {
  ALL_APPLICATION_STAGES,
  WORKFLOW_STAGE_MATRIX,
  canUserTransitionStage,
  getAllowedNextStages,
  getApplicationLockStatus,
  getApplicationQueryFilters,
  isApplicationVisibleForRole,
  filterApplicationsByJurisdiction,
  getInboxApplicationsForRole,
  validateStageTransition,
} from "../../src/utils/applicationWorkflowConfig";
import { Application, ApplicationStage } from "../../src/types/application";
import { AppUser } from "../../src/types/role";

describe("Application Workflow & Stage Handoff Engine", () => {
  const mockApplication: Application = {
    id: "app-101",
    applicationNumber: "APP-2026-00101",
    studentId: "student-user-1",
    studentName: "Amara Okonjo",
    studentEmail: "amara@example.com",
    universityId: "uni-oxford",
    universityName: "University of Oxford",
    programmeId: "prog-cs-msc",
    programmeName: "MSc Advanced Computer Science",
    intake: "Fall 2026",
    stage: "Draft",
    assignedCounsellorId: "counsellor-user-1",
    assignedCounsellor: "counsellor@agency.com",
    agentUid: "agent-user-1",
    createdAt: Date.now() - 100000,
    updatedAt: Date.now() - 50000,
  };

  const studentUser: AppUser = {
    uid: "student-user-1",
    email: "amara@example.com",
    role: "student",
    createdAt: Date.now(),
  };

  const agentUser: AppUser = {
    uid: "agent-user-1",
    email: "agent@agency.com",
    role: "external_agent",
    createdAt: Date.now(),
  };

  const counsellorUser: AppUser = {
    uid: "counsellor-user-1",
    email: "counsellor@agency.com",
    role: "counsellor",
    createdAt: Date.now(),
  };

  const admissionsUser: AppUser = {
    uid: "admissions-user-1",
    email: "admissions@agency.com",
    role: "admissions_officer",
    createdAt: Date.now(),
  };

  const uniPartnerUser: AppUser = {
    uid: "uni-rep-1",
    email: "rep@oxford.ac.uk",
    role: "university_partner",
    partnerUniversityId: "uni-oxford",
    universityName: "University of Oxford",
    createdAt: Date.now(),
  };

  const financeUser: AppUser = {
    uid: "finance-1",
    email: "finance@agency.com",
    role: "finance_officer",
    createdAt: Date.now(),
  };

  const complianceUser: AppUser = {
    uid: "compliance-1",
    email: "compliance@agency.com",
    role: "compliance_officer",
    createdAt: Date.now(),
  };

  const adminUser: AppUser = {
    uid: "admin-1",
    email: "admin@agency.com",
    role: "platform_super_admin",
    createdAt: Date.now(),
  };

  describe("1. Stage Definitions & Completeness", () => {
    it("defines exactly 20 application stages in the workflow matrix", () => {
      expect(ALL_APPLICATION_STAGES.length).toBe(20);
      expect(Object.keys(WORKFLOW_STAGE_MATRIX).length).toBe(20);
      for (const stage of ALL_APPLICATION_STAGES) {
        expect(WORKFLOW_STAGE_MATRIX[stage]).toBeDefined();
        expect(WORKFLOW_STAGE_MATRIX[stage].stage).toBe(stage);
      }
    });

    it("includes all 17 forward pipeline stages and 3 terminal stages", () => {
      const forwardStages: ApplicationStage[] = [
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
      ];
      const terminalStages: ApplicationStage[] = ["Deferred", "Withdrawn", "Rejected"];

      forwardStages.forEach((s) => expect(ALL_APPLICATION_STAGES).toContain(s));
      terminalStages.forEach((s) => expect(ALL_APPLICATION_STAGES).toContain(s));
    });
  });

  describe("2. Mutex Transition Authorities & Permissions", () => {
    it("allows student to transition Draft to Initial Review, Documents Pending, or Withdrawn", () => {
      expect(canUserTransitionStage("Draft", "Initial Review", "student")).toBe(true);
      expect(canUserTransitionStage("Draft", "Documents Pending", "student")).toBe(true);
      expect(canUserTransitionStage("Draft", "Withdrawn", "student")).toBe(true);
    });

    it("prevents student from illegally jumping Draft directly to Submitted or Enrolled", () => {
      expect(canUserTransitionStage("Draft", "Submitted", "student")).toBe(false);
      expect(canUserTransitionStage("Draft", "Enrolled", "student")).toBe(false);
      expect(canUserTransitionStage("Draft", "CAS Issued", "student")).toBe(false);
    });

    it("allows counsellor to advance Initial Review to Ready for Submission", () => {
      expect(canUserTransitionStage("Initial Review", "Ready for Submission", "counsellor")).toBe(true);
    });

    it("authorizes Admissions Officer to transition Ready for Submission to Submitted", () => {
      expect(canUserTransitionStage("Ready for Submission", "Submitted", "admissions_officer")).toBe(true);
      // Student cannot self-submit once in Ready for Submission
      expect(canUserTransitionStage("Ready for Submission", "Submitted", "student")).toBe(false);
    });

    it("authorizes University Partner to evaluate Submitted and issue decisions", () => {
      expect(canUserTransitionStage("Submitted", "University Reviewing", "university_partner")).toBe(true);
      expect(canUserTransitionStage("University Reviewing", "Conditional Offer", "university_partner")).toBe(true);
      expect(canUserTransitionStage("University Reviewing", "Unconditional Offer", "university_partner")).toBe(true);
      expect(canUserTransitionStage("University Reviewing", "Additional Info Requested", "university_partner")).toBe(true);
      expect(canUserTransitionStage("University Reviewing", "Rejected", "university_partner")).toBe(true);
    });

    it("authorizes Finance Officer to transition Deposit Pending to Deposit Paid", () => {
      expect(canUserTransitionStage("Deposit Pending", "Deposit Paid", "finance_officer")).toBe(true);
      expect(canUserTransitionStage("Deposit Pending", "Deposit Paid", "student")).toBe(false);
    });

    it("authorizes Compliance Officer and Admissions to advance Deposit Paid to CAS / COE Pending", () => {
      expect(canUserTransitionStage("Deposit Paid", "CAS / COE Pending", "compliance_officer")).toBe(true);
      expect(canUserTransitionStage("Deposit Paid", "CAS / COE Pending", "admissions_officer")).toBe(true);
    });

    it("authorizes University Partner to issue CAS with reference number", () => {
      expect(canUserTransitionStage("CAS / COE Pending", "CAS Issued", "university_partner")).toBe(true);
    });

    it("allows admin universal override", () => {
      expect(canUserTransitionStage("Draft", "Enrolled", "platform_super_admin")).toBe(true);
      expect(canUserTransitionStage("Submitted", "Enrolled", "org_admin")).toBe(true);
    });
  });

  describe("3. Field Locking Behaviors", () => {
    it("keeps all fields unlocked in Draft stage", () => {
      const lock = getApplicationLockStatus("Draft", "student");
      expect(lock.isLocked).toBe(false);
      expect(lock.lockMode).toBe("none");
    });

    it("locks student profile in Ready for Submission stage", () => {
      const studentLock = getApplicationLockStatus("Ready for Submission", "student");
      expect(studentLock.isLocked).toBe(true);
      expect(studentLock.lockMode).toBe("student_locked");

      // Staff (admissions/admin) is not locked
      const staffLock = getApplicationLockStatus("Ready for Submission", "admissions_officer");
      expect(staffLock.isLocked).toBe(false);
    });

    it("hard-locks all fields for everyone in Submitted and Enrolled stage", () => {
      const submittedLock = getApplicationLockStatus("Submitted", "counsellor");
      expect(submittedLock.isLocked).toBe(true);
      expect(submittedLock.lockMode).toBe("all_locked");

      const enrolledLock = getApplicationLockStatus("Enrolled", "admissions_officer");
      expect(enrolledLock.isLocked).toBe(true);
      expect(enrolledLock.lockMode).toBe("all_locked");
    });

    it("designates unlocked_slots mode for Documents Pending and Additional Info Requested", () => {
      const pendingLock = getApplicationLockStatus("Documents Pending", "student");
      expect(pendingLock.lockMode).toBe("unlocked_slots");

      const infoLock = getApplicationLockStatus("Additional Info Requested", "student");
      expect(infoLock.lockMode).toBe("unlocked_slots");
    });
  });

  describe("4. Transition Validation Guards", () => {
    it("requires reason code for Withdrawn, Rejected, and Deferred", () => {
      const vWithdrawn = validateStageTransition(mockApplication, "Withdrawn");
      expect(vWithdrawn.isValid).toBe(false);
      expect(vWithdrawn.errorMessage).toContain("mandatory reason code");

      const vWithReason = validateStageTransition(mockApplication, "Withdrawn", {
        reason: "Financial Constraints",
      });
      expect(vWithReason.isValid).toBe(true);
    });

    it("requires offer conditions when issuing Conditional Offer", () => {
      const vCond = validateStageTransition(mockApplication, "Conditional Offer");
      expect(vCond.isValid).toBe(false);
      expect(vCond.errorMessage).toContain("offer conditions");

      const vCondValid = validateStageTransition(mockApplication, "Conditional Offer", {
        offerConditions: "Minimum IELTS 6.5 overall with no band below 6.0",
      });
      expect(vCondValid.isValid).toBe(true);
    });

    it("requires CAS reference number when marking CAS Issued", () => {
      const vCas = validateStageTransition(mockApplication, "CAS Issued");
      expect(vCas.isValid).toBe(false);
      expect(vCas.errorMessage).toContain("CAS / COE reference number");

      const vCasValid = validateStageTransition(mockApplication, "CAS Issued", {
        casRefNumber: "CAS-2026-UK-99412",
      });
      expect(vCasValid.isValid).toBe(true);
    });
  });

  describe("5. Query Scoping & Role-Based Jurisdiction (Who Sees What When)", () => {
    const appDraft: Application = { ...mockApplication, id: "app-draft", stage: "Draft" };
    const appReady: Application = { ...mockApplication, id: "app-ready", stage: "Ready for Submission" };
    const appSubmitted: Application = { ...mockApplication, id: "app-sub", stage: "Submitted" };
    const appUniReview: Application = { ...mockApplication, id: "app-rev", stage: "University Reviewing" };
    const appDeposit: Application = { ...mockApplication, id: "app-dep", stage: "Deposit Pending" };
    const appCas: Application = { ...mockApplication, id: "app-cas", stage: "CAS / COE Pending" };
    const appVisaPrep: Application = { ...mockApplication, id: "app-visa", stage: "Visa Preparation" };
    const appEnrolled: Application = { ...mockApplication, id: "app-enr", stage: "Enrolled" };

    const allApps = [appDraft, appReady, appSubmitted, appUniReview, appDeposit, appCas, appVisaPrep, appEnrolled];

    it("scopes Student view strictly to applications matching their student UID", () => {
      const foreignApp: Application = {
        ...mockApplication,
        id: "foreign",
        studentId: "other-student-99",
        studentEmail: "other@example.com",
      };
      expect(isApplicationVisibleForRole(appDraft, studentUser)).toBe(true);
      expect(isApplicationVisibleForRole(foreignApp, studentUser)).toBe(false);
    });

    it("scopes External Agent view strictly to their referred students", () => {
      const foreignAgentApp: Application = { ...mockApplication, id: "agent-other", agentUid: "other-agent-99" };
      expect(isApplicationVisibleForRole(appDraft, agentUser)).toBe(true);
      expect(isApplicationVisibleForRole(foreignAgentApp, agentUser)).toBe(false);
    });

    it("hides Draft and Initial Review applications from Admissions Officer queue", () => {
      expect(isApplicationVisibleForRole(appDraft, admissionsUser)).toBe(false);

      // Visible once in Ready for Submission and downstream
      expect(isApplicationVisibleForRole(appReady, admissionsUser)).toBe(true);
      expect(isApplicationVisibleForRole(appSubmitted, admissionsUser)).toBe(true);
      expect(isApplicationVisibleForRole(appUniReview, admissionsUser)).toBe(true);
      expect(isApplicationVisibleForRole(appEnrolled, admissionsUser)).toBe(true);
    });

    it("hides pre-submission applications from University Partner and displays only submitted dossier", () => {
      // Hidden from Uni
      expect(isApplicationVisibleForRole(appDraft, uniPartnerUser)).toBe(false);
      expect(isApplicationVisibleForRole(appReady, uniPartnerUser)).toBe(false);

      // Visible to Uni
      expect(isApplicationVisibleForRole(appSubmitted, uniPartnerUser)).toBe(true);
      expect(isApplicationVisibleForRole(appUniReview, uniPartnerUser)).toBe(true);
      expect(isApplicationVisibleForRole(appEnrolled, uniPartnerUser)).toBe(true);

      // Uni Partner from different university cannot see Oxford applications
      const cambridgeRep: AppUser = {
        uid: "rep-cambridge",
        email: "rep@cam.ac.uk",
        role: "university_partner",
        partnerUniversityId: "uni-cambridge",
        universityName: "University of Cambridge",
        createdAt: Date.now(),
      };
      expect(isApplicationVisibleForRole(appSubmitted, cambridgeRep)).toBe(false);
    });

    it("routes applications to Compliance Officer queue during relevant audit stages", () => {
      const filtered = filterApplicationsByJurisdiction(allApps, complianceUser);
      const stages = filtered.map((a) => a.stage);
      expect(stages).toContain("CAS / COE Pending");
      expect(stages).toContain("Visa Preparation");
      expect(stages).not.toContain("Draft");
      expect(stages).not.toContain("Ready for Submission");
    });

    it("routes applications to Finance Officer queue for deposit and commission reconciliation", () => {
      const filtered = filterApplicationsByJurisdiction(allApps, financeUser);
      const stages = filtered.map((a) => a.stage);
      expect(stages).toContain("Deposit Pending");
      expect(stages).toContain("Enrolled");
      expect(stages).not.toContain("Draft");
      expect(stages).not.toContain("Submitted");
    });

    it("gives Team Leader and Admin universal visibility across all stages", () => {
      const filtered = filterApplicationsByJurisdiction(allApps, adminUser);
      expect(filtered.length).toBe(allApps.length);
    });

    it("routes newly advanced applications directly into role Inboxes", () => {
      // Ready for Submission appears in Admissions Officer inbox
      const admInbox = getInboxApplicationsForRole([appReady, appDraft], admissionsUser);
      expect(admInbox.map((a) => a.id)).toContain("app-ready");
      expect(admInbox.map((a) => a.id)).not.toContain("app-draft");

      // Submitted appears in University Partner inbox
      const uniInbox = getInboxApplicationsForRole([appSubmitted, appReady], uniPartnerUser);
      expect(uniInbox.map((a) => a.id)).toContain("app-sub");
      expect(uniInbox.map((a) => a.id)).not.toContain("app-ready");

      // Deposit Pending appears in Finance Officer inbox
      const finInbox = getInboxApplicationsForRole([appDeposit, appSubmitted], financeUser);
      expect(finInbox.map((a) => a.id)).toContain("app-dep");
      expect(finInbox.map((a) => a.id)).not.toContain("app-sub");
    });
  });
});
