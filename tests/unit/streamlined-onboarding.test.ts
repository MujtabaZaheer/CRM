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

  it("verifies global universities dataset includes international destinations and valid programmes", async () => {
    const { GLOBAL_UNIVERSITIES } = await import("../../src/data/globalUniversities");
    const countries = Array.from(new Set(GLOBAL_UNIVERSITIES.map((u) => u.country)));

    // Major global study destinations must be present
    expect(countries).toContain("United Kingdom");
    expect(countries).toContain("United States");
    expect(countries).toContain("Canada");
    expect(countries).toContain("Australia");
    expect(countries).toContain("Germany");
    expect(countries).toContain("Pakistan");
    expect(countries).toContain("India");
    expect(countries).toContain("Malaysia");
    expect(countries).toContain("Turkey");
    expect(countries).toContain("Italy");
    expect(countries).toContain("Spain");
    expect(countries).toContain("Switzerland");
    expect(countries).toContain("China");
    expect(countries).toContain("Japan");
    expect(countries).toContain("Saudi Arabia");
    expect(countries).toContain("Cyprus");

    // Every university must have at least one programme with fee and level
    GLOBAL_UNIVERSITIES.forEach((u) => {
      expect(u.programmes.length).toBeGreaterThan(0);
      u.programmes.forEach((p) => {
        expect(p.title).toBeTruthy();
        expect(p.level).toBeTruthy();
        expect(typeof p.tuitionFeeAnnual).toBe("number");
      });
    });
  });

  it("verifies country normalization handles aliases accurately", async () => {
    const { normalizeCountry } = await import("../../src/utils/immigrationData");
    expect(normalizeCountry("UK")).toBe("united kingdom");
    expect(normalizeCountry("Great Britain")).toBe("united kingdom");
    expect(normalizeCountry("England")).toBe("united kingdom");
    expect(normalizeCountry("USA")).toBe("united states");
    expect(normalizeCountry("America")).toBe("united states");
    expect(normalizeCountry("UAE")).toBe("united arab emirates");
    expect(normalizeCountry("Pakistan")).toBe("pakistan");
    expect(normalizeCountry("Germany")).toBe("germany");
  });
});
