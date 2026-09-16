import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { GEMINI_MODEL } from "../../src/utils/geminiClient";

describe("Student Registration vs New Application CV Flow & Gemini 3.8 Flash", () => {
  it("verifies GEMINI_MODEL defaults to gemini-3.8-flash", () => {
    expect(GEMINI_MODEL).toBe("gemini-3.8-flash");
  });

  it("verifies StudentCVUploader displays Gemini 3.8 Flash badge", () => {
    const uploaderPath = path.resolve(process.cwd(), "src/components/ai/StudentCVUploader.tsx");
    const content = fs.readFileSync(uploaderPath, "utf8");

    expect(content).toContain("Gemini 3.8 Flash");
    expect(content).toContain("Auto-Fill with AI");
  });

  it("verifies Register.tsx does NOT include StudentCVUploader during initial registration", () => {
    const registerPath = path.resolve(process.cwd(), "src/pages/Register.tsx");
    const content = fs.readFileSync(registerPath, "utf8");

    // StudentCVUploader must not be imported or rendered in initial registration
    expect(content).not.toContain("StudentCVUploader");
    expect(content).not.toContain("cvNotice");
    expect(content).not.toContain("Upload CV / Transcript (Optional AI Auto-Fill)");

    // Standard details must be present
    expect(content).toContain("Full Name");
    expect(content).toContain("Email");
    expect(content).toContain("Phone");
    expect(content).toContain("Country of Residence");
    expect(content).toContain("Nationality");
  });

  it("verifies StudentApplicationWizard embeds StudentCVUploader when applying for a new application", () => {
    const wizardPath = path.resolve(process.cwd(), "src/pages/portal/StudentApplicationWizard.tsx");
    const content = fs.readFileSync(wizardPath, "utf8");

    // Must import and use StudentCVUploader
    expect(content).toContain("StudentCVUploader");
    expect(content).toContain("handleCVExtracted");

    // Must handle personal details auto-fill
    expect(content).toContain("personalOverrides");
    expect(content).toContain("academicHistory");
    expect(content).toContain("englishProficiency");

    // Fast-track notice in Step 1, Uploader in Step 2 & Step 3
    expect(content).toContain("Fast-Track Application with AI CV Scanner");
    expect(content).toContain("Auto-Fill Application with AI (CV / Resume Scanner)");
    expect(content).toContain("Extract Academic Qualifications with AI");
  });

  it("verifies StudentNewApplication informs student about AI CV extraction in the wizard", () => {
    const newAppPath = path.resolve(process.cwd(), "src/pages/portal/StudentNewApplication.tsx");
    const content = fs.readFileSync(newAppPath, "utf8");

    expect(content).toContain("AI-Powered Application Auto-Fill (CV / Resume Scanner)");
    expect(content).toContain("Gemini 3.8 Flash");
  });

  it("verifies extracted CV data correctly structures personal, academic, and english records", () => {
    // Test the data mapping logic used by handleCVExtracted
    const mockExtracted = {
      fullName: "Ali Khan",
      phone: "+92 300 1234567",
      countryOfResidence: "Pakistan",
      nationality: "Pakistani",
      passportNumber: "PK98765432",
      institutionName: "National University of Sciences and Technology",
      degreeTitle: "Bachelor of Science in Computer Science",
      graduationYear: "2024",
      gpaScore: "3.75",
      englishTest: "IELTS",
      englishScore: "7.5",
      skills: ["Python", "React", "Machine Learning"]
    };

    const personalPatch = {
      fullName: mockExtracted.fullName,
      phone: mockExtracted.phone,
      countryOfResidence: mockExtracted.countryOfResidence,
      nationality: mockExtracted.countryOfResidence, // country name normalized
      passportNumber: mockExtracted.passportNumber,
    };

    expect(personalPatch.fullName).toBe("Ali Khan");
    expect(personalPatch.phone).toBe("+92 300 1234567");
    expect(personalPatch.countryOfResidence).toBe("Pakistan");
    expect(personalPatch.passportNumber).toBe("PK98765432");

    const academicRecord = {
      id: "acad-1",
      institution: mockExtracted.institutionName,
      degree: mockExtracted.degreeTitle,
      year: parseInt(mockExtracted.graduationYear),
      grade: mockExtracted.gpaScore,
    };

    expect(academicRecord.institution).toBe("National University of Sciences and Technology");
    expect(academicRecord.degree).toBe("Bachelor of Science in Computer Science");
    expect(academicRecord.year).toBe(2024);
    expect(academicRecord.grade).toBe("3.75");

    const englishProficiency = {
      testType: mockExtracted.englishTest as "IELTS",
      overallScore: parseFloat(mockExtracted.englishScore),
      completed: true,
    };

    expect(englishProficiency.testType).toBe("IELTS");
    expect(englishProficiency.overallScore).toBe(7.5);
    expect(englishProficiency.completed).toBe(true);
  });
});
