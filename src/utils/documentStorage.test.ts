import { describe, it, expect } from "vitest";
import { validateDocumentFile } from "./documentStorage";

describe("Document Storage Validation Engine", () => {
  it("should accept valid PDF files under 15 MB", () => {
    const file = new File(["sample content"], "transcript.pdf", { type: "application/pdf" });
    const error = validateDocumentFile(file);
    expect(error).toBeNull();
  });

  it("should accept valid PNG images", () => {
    const file = new File(["sample image"], "passport.png", { type: "image/png" });
    const error = validateDocumentFile(file);
    expect(error).toBeNull();
  });

  it("should reject disallowed MIME types (e.g. executables or zip files)", () => {
    const file = new File(["bad file"], "virus.exe", { type: "application/x-msdownload" });
    const error = validateDocumentFile(file);
    expect(error).toBe("Use a PDF, JPG, PNG, WEBP, DOC, or DOCX document.");
  });

  it("should reject 0-byte empty files", () => {
    const file = new File([], "empty.pdf", { type: "application/pdf" });
    const error = validateDocumentFile(file);
    expect(error).toBe("Documents must be between 1 byte and 15 MB.");
  });
});
