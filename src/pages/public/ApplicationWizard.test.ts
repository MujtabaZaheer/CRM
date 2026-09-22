import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateWizardDocumentFile,
  validateStep1Personal,
  validateStep2Emergency,
  validateStep3Academic,
  validateStep4GapsAndImmigration,
  validateStep5Documents,
  validateStep6Declaration,
  cleanPayload,
  submitPublicApplication,
  WizardDocumentUpload,
} from "../../utils/applicationIntakeTriage";

// Mock Firebase Firestore functions
vi.mock("firebase/firestore", () => {
  return {
    doc: vi.fn((_db, coll, id) => ({ path: `${coll}/${id}`, id })),
    getDoc: vi.fn(async (docRef) => ({
      exists: () => docRef.id.includes("existing"),
      data: () => ({ id: docRef.id, studentName: "Existing Applicant" }),
    })),
    updateDoc: vi.fn(async () => {}),
    setDoc: vi.fn(async () => {}),
    addDoc: vi.fn(async (_collRef, data) => ({ id: `mock-${data.action || data.type || "id"}` })),
    collection: vi.fn((_db, name) => ({ path: name })),
  };
});

describe("EduBridge Public Application Intake Wizard Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("File Upload Vault Validation (10MB Limit & Formats)", () => {
    it("should accept valid PDF, JPG, and PNG files under 10MB", () => {
      const pdf = { name: "passport.pdf", size: 3 * 1024 * 1024, type: "application/pdf" };
      const jpg = { name: "photo.jpg", size: 1.5 * 1024 * 1024, type: "image/jpeg" };
      const png = { name: "transcript.png", size: 9.8 * 1024 * 1024, type: "image/png" };

      expect(validateWizardDocumentFile(pdf).valid).toBe(true);
      expect(validateWizardDocumentFile(jpg).valid).toBe(true);
      expect(validateWizardDocumentFile(png).valid).toBe(true);
    });

    it("should reject files exceeding the 10MB EduBridge compliance limit", () => {
      const oversizedPdf = {
        name: "heavy_scan.pdf",
        size: 10 * 1024 * 1024 + 1024, // 10MB + 1KB
        type: "application/pdf",
      };

      const result = validateWizardDocumentFile(oversizedPdf);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("exceeds the 10MB compliance limit");
    });

    it("should reject 0-byte empty files", () => {
      const emptyFile = { name: "empty.pdf", size: 0, type: "application/pdf" };
      const result = validateWizardDocumentFile(emptyFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("cannot be empty");
    });

    it("should reject disallowed MIME types and unauthorized extensions", () => {
      const exe = { name: "malware.exe", size: 1024, type: "application/x-msdownload" };
      const zip = { name: "archive.zip", size: 1024, type: "application/zip" };

      expect(validateWizardDocumentFile(exe).valid).toBe(false);
      expect(validateWizardDocumentFile(exe).error).toContain("Only PDF, JPG, and PNG documents are accepted");
      expect(validateWizardDocumentFile(zip).valid).toBe(false);
    });
  });

  describe("Step Form Validations", () => {
    it("Step 1: validates mandatory personal and passport fields", () => {
      const emptyErrors = validateStep1Personal({});
      expect(emptyErrors.fullName).toBeDefined();
      expect(emptyErrors.email).toBeDefined();
      expect(emptyErrors.phone).toBeDefined();
      expect(emptyErrors.dob).toBeDefined();
      expect(emptyErrors.nationality).toBeDefined();
      expect(emptyErrors.countryOfResidence).toBeDefined();
      expect(emptyErrors.passportNumber).toBeDefined();
      expect(emptyErrors.passportExpiry).toBeDefined();

      const validErrors = validateStep1Personal({
        fullName: "Fatima Al-Mansoor",
        email: "fatima@example.com",
        phone: "+971 50 123 4567",
        dob: "2002-05-14",
        nationality: "Emirati",
        countryOfResidence: "United Arab Emirates",
        passportNumber: "A98765432",
        passportExpiry: "2030-05-14",
      });
      expect(Object.keys(validErrors).length).toBe(0);
    });

    it("Step 1: rejects invalid email syntax", () => {
      const errors = validateStep1Personal({ email: "invalid-email-string" });
      expect(errors.email).toBe("Please enter a valid email address");
    });

    it("Step 2: validates emergency and guardian details", () => {
      const invalid = validateStep2Emergency({});
      expect(invalid.name).toBeDefined();
      expect(invalid.relation).toBeDefined();
      expect(invalid.phone).toBeDefined();
      expect(invalid.email).toBeDefined();
      expect(invalid.address).toBeDefined();

      const valid = validateStep2Emergency({
        name: "Tariq Al-Mansoor",
        relation: "Father",
        phone: "+971 50 999 8888",
        email: "tariq@example.com",
        address: "Villa 14, Al Safa 2, Dubai, UAE",
      });
      expect(Object.keys(valid).length).toBe(0);
    });

    it("Step 3: validates academic qualifications and English test requirements", () => {
      // Missing qualifications
      const noAcad = validateStep3Academic([], undefined);
      expect(noAcad.academicHistory).toBeDefined();

      // Incomplete qualification
      const incomplete = validateStep3Academic(
        [
          {
            institution: "",
            qualification: "",
            passingYear: 1950,
            gradeScale: "CGPA",
            score: "",
            country: "UAE",
          },
        ],
        { testType: "IELTS", overallScore: "" }
      );
      expect(incomplete.academic_0_institution).toBeDefined();
      expect(incomplete.academic_0_qualification).toBeDefined();
      expect(incomplete.academic_0_passingYear).toBeDefined();
      expect(incomplete.academic_0_score).toBeDefined();
      expect(incomplete.englishScore).toBeDefined();

      // Valid qualification & waiver
      const validWithWaiver = validateStep3Academic(
        [
          {
            institution: "Dubai International Academy",
            qualification: "High School Diploma (IB)",
            passingYear: 2024,
            gradeScale: "Points (45)",
            score: "38/45",
            country: "UAE",
          },
        ],
        { testType: "None" }
      );
      expect(Object.keys(validWithWaiver).length).toBe(0);
    });

    it("Step 4: validates study gaps and mandatory visa refusal disclosures", () => {
      // Gap missing explanation
      const invalidGap = validateStep4GapsAndImmigration(
        [
          {
            startDate: "2023-01-01",
            endDate: "2023-12-01",
            explanation: "No", // < 5 chars
            documentationAttached: false,
          },
        ],
        { hasPriorRefusal: false }
      );
      expect(invalidGap.gap_0_explanation).toBeDefined();

      // Refusal declared without details or country
      const refusalMissingDetails = validateStep4GapsAndImmigration([], {
        hasPriorRefusal: true,
        refusalDetails: "",
        refusalCountries: [],
      });
      expect(refusalMissingDetails.refusalDetails).toBeDefined();
      expect(refusalMissingDetails.refusalCountries).toBeDefined();

      // Valid disclosure
      const validDisclosure = validateStep4GapsAndImmigration([], {
        hasPriorRefusal: true,
        refusalDetails: "Refused standard visitor visa in 2021 due to insufficient tie evidence.",
        refusalCountries: ["United Kingdom"],
      });
      expect(Object.keys(validDisclosure).length).toBe(0);
    });

    it("Step 5: ensures passport and academic transcript documents exist", () => {
      const emptyDocs = validateStep5Documents([]);
      expect(emptyDocs.passportDoc).toBeDefined();
      expect(emptyDocs.transcriptDoc).toBeDefined();

      const validDocs: WizardDocumentUpload[] = [
        {
          id: "doc-1",
          category: "passport",
          fileName: "passport.pdf",
          fileSize: 1024,
          mimeType: "application/pdf",
          previewUrl: "data:application/pdf;base64,...",
          uploadedAt: Date.now(),
        },
        {
          id: "doc-2",
          category: "transcript",
          fileName: "transcript.pdf",
          fileSize: 2048,
          mimeType: "application/pdf",
          previewUrl: "data:application/pdf;base64,...",
          uploadedAt: Date.now(),
        },
      ];
      expect(Object.keys(validateStep5Documents(validDocs)).length).toBe(0);
    });

    it("Step 6: enforces consent acknowledgment and typed legal signature", () => {
      const invalid = validateStep6Declaration({ consentGiven: false, signedName: "", agreedAt: "" });
      expect(invalid.consentGiven).toBeDefined();
      expect(invalid.signedName).toBeDefined();

      const valid = validateStep6Declaration({
        consentGiven: true,
        signedName: "Fatima Al-Mansoor",
        agreedAt: new Date().toISOString(),
      });
      expect(Object.keys(valid).length).toBe(0);
    });
  });

  describe("CRM Triage & Dossier Handoff Handler", () => {
    it("should sanitize undefined values to avoid Firestore rejection", () => {
      const dirty = {
        name: "Test",
        missingField: undefined,
        nested: {
          subMissing: undefined,
          val: 123,
        },
      };
      const cleaned = cleanPayload(dirty);
      expect(cleaned).toEqual({
        name: "Test",
        nested: {
          val: 123,
        },
      });
      expect((cleaned as any).missingField).toBeUndefined();
    });

    it("submits direct student application: sets admissionsVisibility=true and notifies admissions desk", async () => {
      const mockDb = {};
      const res = await submitPublicApplication(
        mockDb,
        "existing-app-123",
        {
          fullName: "Liam Davies",
          email: "liam@example.co.uk",
          agentReferred: false,
          declaration: {
            signedName: "Liam Davies",
            agreedAt: new Date().toISOString(),
            consentGiven: true,
          },
        },
        "tenant-london"
      );

      expect(res.success).toBe(true);
      expect(res.isAgentReferred).toBe(false);
      expect(res.admissionsVisibility).toBe(true);
      expect(res.vettingStatus).toBe("documents_verified");
      expect(res.auditLogId).toBe("mock-PUBLIC_APPLICATION_SUBMITTED");
      expect(res.notificationId).toBe("mock-public_application_submitted");
    });

    it("submits agent-referred application: isolates from admissions (admissionsVisibility=false) and routes to agent_triage", async () => {
      const mockDb = {};
      const res = await submitPublicApplication(
        mockDb,
        "new-app-agent-999",
        {
          fullName: "Amina Yusuf",
          email: "amina@example.com",
          agentReferred: true,
          agentUid: "agent-007",
          agentName: "Global Edu Agents Ltd",
          declaration: {
            signedName: "Amina Yusuf",
            agreedAt: new Date().toISOString(),
            consentGiven: true,
          },
        },
        "tenant-manchester"
      );

      expect(res.success).toBe(true);
      expect(res.isAgentReferred).toBe(true);
      expect(res.admissionsVisibility).toBe(false); // Strict Agent Referral Isolation!
      expect(res.vettingStatus).toBe("pending_triage");
      expect(res.auditLogId).toBe("mock-PUBLIC_APPLICATION_SUBMITTED");
      expect(res.notificationId).toBe("mock-agent_application_triage");
    });
  });
});
