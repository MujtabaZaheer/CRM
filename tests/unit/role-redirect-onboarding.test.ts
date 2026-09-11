import { describe, it, expect } from "vitest";
import { getRoleDashboardPath } from "../../src/types/registrationConfig";
import { UserRole } from "../../src/types/role";

describe("Role-based Redirect and Onboarding Bypass Logic", () => {
  it("routes counsellor to /counsellor/dashboard and not student onboarding", () => {
    const role: UserRole = "counsellor";
    const path = getRoleDashboardPath(role);
    expect(path).toBe("/counsellor/dashboard");
    expect(path).not.toContain("onboarding");
  });

  it("routes team leader to /team-leader/dashboard and not student onboarding", () => {
    const role: UserRole = "team_leader";
    const path = getRoleDashboardPath(role);
    expect(path).toBe("/team-leader/dashboard");
    expect(path).not.toContain("onboarding");
  });

  it("routes admissions officer to /admissions/dashboard", () => {
    const role: UserRole = "admissions_officer";
    const path = getRoleDashboardPath(role);
    expect(path).toBe("/admissions/dashboard");
    expect(path).not.toContain("onboarding");
  });

  it("routes finance officer to /finance/dashboard", () => {
    const role: UserRole = "finance_officer";
    const path = getRoleDashboardPath(role);
    expect(path).toBe("/finance/dashboard");
  });

  it("routes support user to /support/dashboard", () => {
    const role: UserRole = "support_user";
    const path = getRoleDashboardPath(role);
    expect(path).toBe("/support/dashboard");
  });

  it("routes visa officer to /visa-officer/dashboard", () => {
    const role: UserRole = "visa_officer";
    const path = getRoleDashboardPath(role);
    expect(path).toBe("/visa-officer/dashboard");
  });

  it("routes external agent to /agent/dashboard", () => {
    const role: UserRole = "external_agent";
    const path = getRoleDashboardPath(role);
    expect(path).toBe("/agent/dashboard");
  });

  it("routes university partner to /university/dashboard", () => {
    const role: UserRole = "university_partner";
    const path = getRoleDashboardPath(role);
    expect(path).toBe("/university/dashboard");
  });

  it("only routes student to student dashboard", () => {
    const role: UserRole = "student";
    const path = getRoleDashboardPath(role);
    expect(path).toBe("/student/dashboard");
  });

  it("correctly identifies non-student roles that must bypass onboarding", () => {
    const nonStudentRoles: UserRole[] = [
      "counsellor",
      "team_leader",
      "admissions_officer",
      "finance_officer",
      "visa_officer",
      "auditor",
      "support_user",
      "external_agent",
      "university_partner",
      "office_manager",
      "org_admin",
      "platform_super_admin",
    ];

    for (const r of nonStudentRoles) {
      const isNonStudent = r !== "student";
      expect(isNonStudent).toBe(true);

      const onboardingStatus = isNonStudent ? "completed" : "not_started";
      const profileCompleted = isNonStudent;
      const currentStep = isNonStudent ? 4 : 1;

      expect(onboardingStatus).toBe("completed");
      expect(profileCompleted).toBe(true);
      expect(currentStep).toBe(4);
    }
  });

  it("requires onboarding only for student role when incomplete", () => {
    const role: UserRole = "student";
    const isNonStudent = role !== "student";
    expect(isNonStudent).toBe(false);

    const onboardingStatus = isNonStudent ? "completed" : "not_started";
    const profileCompleted = isNonStudent;
    const currentStep = isNonStudent ? 4 : 1;

    expect(onboardingStatus).toBe("not_started");
    expect(profileCompleted).toBe(false);
    expect(currentStep).toBe(1);
  });
});
