import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { calculateProfileCompleteness } from "../../src/utils/profileCompleteness";
import { Student } from "../../src/types/student";

describe("Streamlined Student Onboarding Stage 1 & Profile Completeness", () => {
  it("requires Personal Info (40%), Academic History (35%), and Desired Study Level (25%)", () => {
    const emptyResult = calculateProfileCompleteness(null);
    expect(emptyResult.percentage).toBe(0);
    expect(emptyResult.isComplete).toBe(false);
    expect(emptyResult.missingFields).toContain("Personal Information");
    expect(emptyResult.missingFields).toContain("Academic Records");
    expect(emptyResult.missingFields).toContain("Desired Study Level");
  });

  it("does not reach 100% and is not complete when desiredStudyLevel is not selected (empty)", () => {
    const studentWithNoLevel: Partial<Student> = {
      fullName: "Fatima Noor",
      email: "fatima@example.com",
      phone: "+92 300 1234567",
      dob: "2000-01-01",
      nationality: "Pakistan",
      countryOfResidence: "Pakistan",
      academicHistory: [
        {
          institution: "LUMS",
          qualification: "Bachelor's Degree",
          degreeTitle: "BS Computer Science",
          country: "Pakistan",
          completionYear: 2024,
          gradeGpa: "3.80",
        },
      ],
      desiredStudyLevel: "", // NOT automatically selected
    };

    const result = calculateProfileCompleteness(studentWithNoLevel);
    expect(result.percentage).toBe(75);
    expect(result.isComplete).toBe(false);
    expect(result.missingFields).toEqual(
      expect.arrayContaining([expect.stringContaining("Desired Study Level")])
    );
  });

  it("reaches 100% complete once student explicitly selects their desired study level without requiring passport or english tests", () => {
    const studentWithLevel: Partial<Student> = {
      fullName: "Fatima Noor",
      email: "fatima@example.com",
      phone: "+92 300 1234567",
      dob: "2000-01-01",
      nationality: "Pakistan",
      countryOfResidence: "Pakistan",
      academicHistory: [
        {
          institution: "LUMS",
          qualification: "Bachelor's Degree",
          degreeTitle: "BS Computer Science",
          country: "Pakistan",
          completionYear: 2024,
          gradeGpa: "3.80",
        },
      ],
      desiredStudyLevel: "Master's",
    };

    const result = calculateProfileCompleteness(studentWithLevel);
    expect(result.percentage).toBe(100);
    expect(result.isComplete).toBe(true);
    expect(result.missingFields.length).toBe(0);
  });

  it("verifies StudentOnboardingStage1.tsx has removed passport, english, employment, sponsor, dependants, references", () => {
    const filePath = path.resolve(process.cwd(), "src/pages/portal/onboarding/StudentOnboardingStage1.tsx");
    const content = fs.readFileSync(filePath, "utf8");

    // Desired study level must start empty (not automatically preselected)
    expect(content).toContain('useState("")');
    expect(content).not.toContain('useState("Master\'s")');

    // Must NOT contain removed section headings or input labels
    expect(content).not.toContain("Passport Information");
    expect(content).not.toContain("Passport Issuing Country");
    expect(content).not.toContain("English Language Proficiency");
    expect(content).not.toContain("Employment History");
    expect(content).not.toContain("Financial Sponsor");
    expect(content).not.toContain("Dependants");
    expect(content).not.toContain("Add an academic/professional reference");

    // Sections remaining must be numbered cleanly
    expect(content).toContain("1. Personal Information");
    expect(content).toContain("2. Academic Background");
    expect(content).toContain("3. Desired Study Level");
  });
});
