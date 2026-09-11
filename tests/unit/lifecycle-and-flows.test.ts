import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { ApplicationStage } from "../../src/types/application";

const ALL_20_STAGES: ApplicationStage[] = [
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

describe("Complete 20-Stage Application Lifecycle Audit", () => {
  it("verifies exactly 20 distinct stages are defined in the specification", () => {
    expect(ALL_20_STAGES.length).toBe(20);
    const unique = new Set(ALL_20_STAGES);
    expect(unique.size).toBe(20);
  });

  it("verifies CounsellorApplications.tsx contains all 20 lifecycle stages in its milestone selection", () => {
    const filePath = path.resolve(process.cwd(), "src/pages/counsellor/Applications.tsx");
    const content = fs.readFileSync(filePath, "utf8");

    for (const stage of ALL_20_STAGES) {
      expect(content).toContain(`value="${stage}"`);
    }
  });

  it("verifies TeamLeader Applications.tsx contains all 20 lifecycle stages", () => {
    const filePath = path.resolve(process.cwd(), "src/pages/teamleader/Applications.tsx");
    const content = fs.readFileSync(filePath, "utf8");

    for (const stage of ALL_20_STAGES) {
      expect(content).toContain(`"${stage}"`);
    }
  });

  it("verifies TeamLeader AssignApplications.tsx contains all 20 lifecycle stages", () => {
    const filePath = path.resolve(process.cwd(), "src/pages/teamleader/AssignApplications.tsx");
    const content = fs.readFileSync(filePath, "utf8");

    for (const stage of ALL_20_STAGES) {
      expect(content).toContain(`"${stage}"`);
    }
  });
});

describe("Student Onboarding & Navigation Flow Audit", () => {
  it("verifies StudentOnboardingStage4 does not contain dead-end /student/onboarding/program-matcher link", () => {
    const filePath = path.resolve(process.cwd(), "src/pages/portal/onboarding/StudentOnboardingStage4.tsx");
    const content = fs.readFileSync(filePath, "utf8");

    expect(content).not.toContain("/student/onboarding/program-matcher");
    expect(content).toContain("/student/onboarding/step-3");
  });

  it("verifies StudentApplications passes applicationId when continuing existing draft", () => {
    const filePath = path.resolve(process.cwd(), "src/pages/portal/StudentApplications.tsx");
    const content = fs.readFileSync(filePath, "utf8");

    expect(content).toContain("applicationId=${app.id}");
  });

  it("verifies StudentApplicationWizard supports direct draft loading by applicationIdParam", () => {
    const filePath = path.resolve(process.cwd(), "src/pages/portal/StudentApplicationWizard.tsx");
    const content = fs.readFileSync(filePath, "utf8");

    expect(content).toContain("applicationIdParam");
    expect(content).toContain("directApp");
  });
});

describe("Firestore Security Rules Extended Collections Audit", () => {
  const rulesPath = path.resolve(process.cwd(), "firestore.rules");
  const rules = fs.readFileSync(rulesPath, "utf8");

  it("allows newly registered student to create their student document (uid match)", () => {
    expect(rules).toContain("signedIn() && request.auth.uid == studentId");
  });

  it("allows Team Leader to read audit logs", () => {
    const auditBlock = rules.match(/match \/audit_logs\/\{logId\} \{[\s\S]*?\}/);
    expect(auditBlock).not.toBeNull();
    if (auditBlock) {
      expect(auditBlock[0]).toContain("isTeamLeader()");
    }
  });

  it("includes security rules for consent_records, agents, university_partners, invitations, config, and forms", () => {
    expect(rules).toContain("match /consent_records/{consentId}");
    expect(rules).toContain("match /agents/{agentId}");
    expect(rules).toContain("match /university_partners/{partnerId}");
    expect(rules).toContain("match /invitations/{invitationId}");
    expect(rules).toContain("match /config/{configId}");
    expect(rules).toContain("match /forms/{formId}");
    expect(rules).toContain("match /form_submissions/{submissionId}");
  });
});
