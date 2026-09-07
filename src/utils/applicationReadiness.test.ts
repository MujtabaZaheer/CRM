import { describe, it, expect } from "vitest";
import { isDocumentMatch } from "./applicationReadiness";

describe("isDocumentMatch", () => {
  it("correctly matches High School Transcript and does NOT cross-match to Academic Transcript", () => {
    // User upload: High School Transcript file
    const docType = "High School Transcript";
    const docFileName = "Amna Matric degree.pdf";

    // High School Transcript slot MUST match
    expect(isDocumentMatch(docType, "High School Transcript")).toBe(true);
    expect(isDocumentMatch(docFileName, "High School Transcript")).toBe(true);

    // Academic Transcript slot MUST NOT match
    expect(isDocumentMatch(docType, "Academic Transcript")).toBe(false);
    expect(isDocumentMatch(docFileName, "Academic Transcript")).toBe(false);
  });

  it("correctly matches Academic Transcript and does NOT match High School Transcript", () => {
    const docType = "Academic Transcript";
    const docFileName = "BSCS Official Academic Transcript.pdf";

    expect(isDocumentMatch(docType, "Academic Transcript")).toBe(true);
    expect(isDocumentMatch(docFileName, "Academic Transcript")).toBe(true);

    expect(isDocumentMatch(docType, "High School Transcript")).toBe(false);
  });

  it("correctly matches Degree Certificate and does NOT cross-match to English Language Certificate", () => {
    const docType = "Degree Certificate";
    const docFileName = "Amna B.ed transcript.pdf";

    // Degree Certificate slot MUST match
    expect(isDocumentMatch(docType, "Degree Certificate")).toBe(true);

    // English Language Certificate slot MUST NOT match
    expect(isDocumentMatch(docType, "English Language Certificate")).toBe(false);
    expect(isDocumentMatch(docFileName, "English Language Certificate")).toBe(false);
  });

  it("correctly matches English Language Certificate and does NOT match Degree Certificate", () => {
    const docType = "English Language Certificate";
    const docFileName = "IELTS Test Report Form.pdf";

    expect(isDocumentMatch(docType, "English Language Certificate")).toBe(true);
    expect(isDocumentMatch(docFileName, "English Language Certificate")).toBe(true);

    expect(isDocumentMatch(docType, "Degree Certificate")).toBe(false);
    expect(isDocumentMatch(docFileName, "Degree Certificate")).toBe(false);
  });

  it("matches Passport, SOP, and CV correctly", () => {
    expect(isDocumentMatch("Passport", "Passport")).toBe(true);
    expect(isDocumentMatch("passport_scan.jpg", "Passport")).toBe(true);

    expect(isDocumentMatch("Statement of Purpose", "Statement of Purpose")).toBe(true);
    expect(isDocumentMatch("sop_personal_essay.pdf", "Statement of Purpose")).toBe(true);

    expect(isDocumentMatch("CV / Resume", "CV / Resume")).toBe(true);
    expect(isDocumentMatch("my_resume.pdf", "CV / Resume")).toBe(true);
  });
});
