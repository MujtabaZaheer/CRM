import { describe, it, expect } from "vitest";
import {
  personalInfoSchema,
  academicBackgroundSchema,
  languageTestsSchema,
  experienceComplianceSchema,
  programSelectionSchema,
  fullAdmissionSubmissionSchema,
  agentUploadedDocumentSchema,
} from "../../src/schemas/studentAdmissionSchema";
import { getAgentStageBadge } from "../../src/components/agent/dashboard/AgentApplicationsTable";
import { AgentStudentIntakePayload } from "../../src/types/agentApplication";

describe("External Agent Student Intake Wizard & Dossier Builder", () => {
  const validPersonalInfo = {
    firstName: "Hamza",
    middleName: "Ali",
    lastName: "Khan",
    dateOfBirth: "2002-05-14", // Age ~24, >= 15
    gender: "Male" as const,
    nationality: "Pakistani",
    countryOfBirth: "Pakistan",
    hasDualNationality: false,
    passportNumber: "PK9876543",
    passportIssueDate: "2021-01-10",
    passportExpiryDate: "2031-01-09",
    passportIssuingAuthority: "Govt of Pakistan",
    email: "hamza.khan@example.com",
    phone: "3001234567",
    phoneCountryCode: "+92",
    permanentAddress: {
      street: "House 12, Street 4, Sector F-7",
      city: "Islamabad",
      state: "Federal Capital",
      postalCode: "44000",
      country: "Pakistan",
    },
    mailingAddress: {
      sameAsPermanent: true,
    },
    emergencyContact: {
      name: "Ali Khan",
      relation: "Father",
      phone: "+92 300 9876543",
      email: "ali.khan@example.com",
    },
  };

  const validAcademicHistory = {
    qualifications: [
      {
        id: "edu-1",
        level: "Bachelor's" as const,
        institutionName: "National University of Sciences and Technology (NUST)",
        country: "Pakistan",
        degreeEarned: "Bachelor of Science in Software Engineering",
        fieldOfStudy: "Computer Science",
        startDate: "2020-09",
        completionDate: "2024-06",
        gradingScale: "GPA 4.0",
        obtainedScore: "3.75",
      },
    ],
    hasAcademicGap: false,
    gapExplanation: "",
    gapDetails: [],
  };

  const validLanguageTests = {
    englishProficiencyStatus: "IELTS Academic" as const,
    overallBand: "7.5",
    listening: "8.0",
    reading: "7.5",
    writing: "7.0",
    speaking: "7.0",
    testDate: "2025-02-15",
    trfReference: "TRF-25PK0012345",
    hasStandardizedTest: false,
  };

  const validExperienceCompliance = {
    hasWorkExperience: true,
    workHistory: [
      {
        id: "exp-1",
        jobTitle: "Associate Software Engineer",
        employerName: "TechCorp Global",
        country: "Pakistan",
        startDate: "2024-07",
        endDate: "2026-08",
        isCurrent: false,
        keyResponsibilities: "Full stack web development and microservices architecture.",
      },
    ],
    hasVisaRefusal: false,
    priorStudyOrTravelInTargetCountry: false,
    criminalBackgroundDeclaration: true,
  };

  const validProgramSelection = {
    primaryChoice: {
      universityId: "uni-oxford",
      universityName: "University of Oxford",
      country: "United Kingdom",
      programmeId: "prog-msc-cs",
      programmeTitle: "MSc in Advanced Computer Science",
      level: "Postgraduate",
      intake: "Sep/Oct 2027",
      tuitionFee: 32000,
      priority: "Primary Choice" as const,
    },
  };

  const validDocuments = [
    {
      id: "doc-1",
      slotType: "Passport",
      label: "Passport Identification Pages",
      isMandatory: true,
      fileName: "hamza_passport.pdf",
      fileUrl: "https://storage.googleapis.com/educrm/hamza_passport.pdf",
      fileSize: 1024 * 500, // 500KB
      mimeType: "application/pdf",
      uploadedBy: "agent-123",
      uploadedAt: Date.now(),
      verificationStatus: "pending" as const,
    },
    {
      id: "doc-2",
      slotType: "Academic Transcript",
      label: "Official Degree Transcript",
      isMandatory: true,
      fileName: "hamza_transcript.pdf",
      fileUrl: "https://storage.googleapis.com/educrm/hamza_transcript.pdf",
      fileSize: 1024 * 700,
      mimeType: "application/pdf",
      uploadedBy: "agent-123",
      uploadedAt: Date.now(),
      verificationStatus: "pending" as const,
    },
    {
      id: "doc-3",
      slotType: "Degree Certificate",
      label: "Graduation Degree Certificate",
      isMandatory: true,
      fileName: "hamza_degree.pdf",
      fileUrl: "https://storage.googleapis.com/educrm/hamza_degree.pdf",
      fileSize: 1024 * 400,
      mimeType: "application/pdf",
      uploadedBy: "agent-123",
      uploadedAt: Date.now(),
      verificationStatus: "pending" as const,
    },
    {
      id: "doc-4",
      slotType: "English Test",
      label: "IELTS Official TRF Score Card",
      isMandatory: true,
      fileName: "hamza_ielts_trf.pdf",
      fileUrl: "https://storage.googleapis.com/educrm/hamza_ielts_trf.pdf",
      fileSize: 1024 * 350,
      mimeType: "application/pdf",
      uploadedBy: "agent-123",
      uploadedAt: Date.now(),
      verificationStatus: "pending" as const,
    },
    {
      id: "doc-5",
      slotType: "Statement of Purpose",
      label: "Academic SOP",
      isMandatory: true,
      fileName: "hamza_sop.docx",
      fileUrl: "https://storage.googleapis.com/educrm/hamza_sop.docx",
      fileSize: 1024 * 200,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      uploadedBy: "agent-123",
      uploadedAt: Date.now(),
      verificationStatus: "pending" as const,
    },
    {
      id: "doc-6",
      slotType: "CV / Resume",
      label: "Curriculum Vitae",
      isMandatory: true,
      fileName: "hamza_cv.pdf",
      fileUrl: "https://storage.googleapis.com/educrm/hamza_cv.pdf",
      fileSize: 1024 * 180,
      mimeType: "application/pdf",
      uploadedBy: "agent-123",
      uploadedAt: Date.now(),
      verificationStatus: "pending" as const,
    },
  ];

  describe("Step 1: Personal & Contact Information Schema", () => {
    it("should accept valid personal and contact details", () => {
      const res = personalInfoSchema.safeParse(validPersonalInfo);
      expect(res.success).toBe(true);
    });

    it("should reject applicant younger than 15 years old", () => {
      const underage = {
        ...validPersonalInfo,
        dateOfBirth: "2018-01-01",
      };
      const res = personalInfoSchema.safeParse(underage);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain("15 years");
      }
    });

    it("should reject invalid email formats", () => {
      const invalidEmail = {
        ...validPersonalInfo,
        email: "not-a-valid-email",
      };
      const res = personalInfoSchema.safeParse(invalidEmail);
      expect(res.success).toBe(false);
    });

    it("should require passport number with minimum 5 characters", () => {
      const shortPassport = {
        ...validPersonalInfo,
        passportNumber: "A12",
      };
      const res = personalInfoSchema.safeParse(shortPassport);
      expect(res.success).toBe(false);
    });
  });

  describe("Step 2: Academic Background & Gap Logic", () => {
    it("should validate education records with grading scales", () => {
      const res = academicBackgroundSchema.safeParse(validAcademicHistory);
      expect(res.success).toBe(true);
    });

    it("should require gap explanation if hasAcademicGap is true", () => {
      const gapWithoutExplanation = {
        ...validAcademicHistory,
        hasAcademicGap: true,
        gapExplanation: "",
      };
      const res = academicBackgroundSchema.safeParse(gapWithoutExplanation);
      expect(res.success).toBe(false);
      if (!res.success) {
        const hasGapMsg = res.error.issues.some((e) => e.message.toLowerCase().includes("gap"));
        expect(hasGapMsg).toBe(true);
      }
    });

    it("should pass when gap explanation is provided", () => {
      const gapWithExplanation = {
        ...validAcademicHistory,
        hasAcademicGap: true,
        gapExplanation: "Worked on family enterprise and completed certifications in Cloud Engineering.",
      };
      const res = academicBackgroundSchema.safeParse(gapWithExplanation);
      expect(res.success).toBe(true);
    });
  });

  describe("Step 3: English Language Proficiency & Standardized Tests", () => {
    it("should validate IELTS with overall score and subscores", () => {
      const res = languageTestsSchema.safeParse(validLanguageTests);
      expect(res.success).toBe(true);
    });

    it("should require overall band for IELTS", () => {
      const missingScore = {
        ...validLanguageTests,
        overallBand: "",
      };
      const res = languageTestsSchema.safeParse(missingScore);
      expect(res.success).toBe(false);
    });

    it("should allow MOI or Exempt without score breakdown", () => {
      const moi = {
        englishProficiencyStatus: "Medium of Instruction (MOI) Certificate" as const,
        trfReference: "MOI-NUST-2024",
        hasStandardizedTest: false,
      };
      const res = languageTestsSchema.safeParse(moi);
      expect(res.success).toBe(true);
    });
  });

  describe("Step 4: Experience & Visa Refusal Compliance", () => {
    it("should validate work history and clean compliance declarations", () => {
      const res = experienceComplianceSchema.safeParse(validExperienceCompliance);
      expect(res.success).toBe(true);
    });

    it("should enforce refusal country, year and reason if hasVisaRefusal is true", () => {
      const missingRefusalDetails = {
        ...validExperienceCompliance,
        hasVisaRefusal: true,
        visaRefusalDetails: {
          country: "",
          year: "",
          reason: "",
        },
      };
      const res = experienceComplianceSchema.safeParse(missingRefusalDetails);
      expect(res.success).toBe(false);
    });

    it("should require certifying criminal/compliance declaration", () => {
      const rejectedDeclaration = {
        ...validExperienceCompliance,
        criminalBackgroundDeclaration: false,
      };
      const res = experienceComplianceSchema.safeParse(rejectedDeclaration);
      expect(res.success).toBe(false);
    });
  });

  describe("Step 5: Target University & Program Selection", () => {
    it("should accept valid university and program choice", () => {
      const res = programSelectionSchema.safeParse(validProgramSelection);
      expect(res.success).toBe(true);
    });

    it("should reject missing primaryChoice", () => {
      const missingChoice = {};
      const res = programSelectionSchema.safeParse(missingChoice);
      expect(res.success).toBe(false);
    });
  });

  describe("Step 6: Document Item & Vault Validation", () => {
    it("should accept valid PDF and DOCX files up to 10MB", () => {
      const doc = validDocuments[0];
      const res = agentUploadedDocumentSchema.safeParse(doc);
      expect(res.success).toBe(true);
    });

    it("should reject oversized documents (> 10MB)", () => {
      const oversizedDoc = {
        ...validDocuments[0],
        fileSize: 11 * 1024 * 1024, // 11MB
      };
      const res = agentUploadedDocumentSchema.safeParse(oversizedDoc);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain("10MB");
      }
    });

    it("should reject non-compliant file extensions like .exe or .zip", () => {
      const badExtension = {
        ...validDocuments[0],
        mimeType: "application/x-msdownload",
      };
      const res = agentUploadedDocumentSchema.safeParse(badExtension);
      expect(res.success).toBe(false);
    });
  });

  describe("Step 7: Full Admission Submission Validation", () => {
    it("should pass full submission schema with all steps and mandatory documents", () => {
      const fullPayload = {
        personalInfo: validPersonalInfo,
        academic: validAcademicHistory,
        language: validLanguageTests,
        compliance: validExperienceCompliance,
        programs: validProgramSelection,
        documents: validDocuments,
      };

      const res = fullAdmissionSubmissionSchema.safeParse(fullPayload);
      expect(res.success).toBe(true);
    });

    it("should fail submission if mandatory documents (Passport, Transcripts) are missing", () => {
      const incompleteDocs = {
        personalInfo: validPersonalInfo,
        academic: validAcademicHistory,
        language: validLanguageTests,
        compliance: validExperienceCompliance,
        programs: validProgramSelection,
        documents: validDocuments.filter((d) => d.slotType !== "Passport"), // Missing passport
      };

      const res = fullAdmissionSubmissionSchema.safeParse(incompleteDocs);
      expect(res.success).toBe(false);
      if (!res.success) {
        const hasPassportErr = res.error.issues.some((e) => e.message.toLowerCase().includes("passport"));
        expect(hasPassportErr).toBe(true);
      }
    });
  });

  describe("Agent Attribution & Queue Isolation Contract", () => {
    it("should verify payload metadata contains required agent indexing fields", () => {
      const intakePayload: AgentStudentIntakePayload = {
        agentId: "agent-partner-99",
        agentEmail: "agent@partneragency.com",
        agencyName: "Global Education Consultancy Ltd",
        agencyBranch: "Lahore Central Office",
        commissionEligible: true,
        personalInfo: validPersonalInfo,
        academic: validAcademicHistory,
        language: validLanguageTests,
        compliance: {
          hasWorkExperience: validExperienceCompliance.hasWorkExperience,
          workHistory: validExperienceCompliance.workHistory,
          hasVisaRefusal: validExperienceCompliance.hasVisaRefusal,
          priorStudyOrTravelInTargetCountry: validExperienceCompliance.priorStudyOrTravelInTargetCountry,
          criminalBackgroundDeclaration: validExperienceCompliance.criminalBackgroundDeclaration,
        },
        programs: validProgramSelection,
        documents: validDocuments,
      };

      expect(intakePayload.agentId).toBe("agent-partner-99");
      expect(intakePayload.agencyName).toBe("Global Education Consultancy Ltd");
      expect(intakePayload.commissionEligible).toBe(true);
      expect(intakePayload.documents.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe("Agent Applications Table Stage Badge & Visual Resolver", () => {
    it("should resolve correct badge colors for Initial Review stage", () => {
      const badge = getAgentStageBadge("Initial Review");
      expect(badge.bg).toContain("amber");
      expect(badge.label).toBe("Initial Review");
    });

    it("should resolve correct badge colors for Draft stage", () => {
      const badge = getAgentStageBadge("Draft");
      expect(badge.bg).toContain("zinc");
      expect(badge.label).toBe("Intake Draft");
    });

    it("should resolve correct badge colors for Offers", () => {
      const conditional = getAgentStageBadge("Conditional Offer");
      expect(conditional.bg).toContain("emerald");

      const unconditional = getAgentStageBadge("Unconditional Offer");
      expect(unconditional.bg).toContain("emerald");
    });

    it("should resolve correct badge colors for Enrolled and Visa", () => {
      const enrolled = getAgentStageBadge("Enrolled");
      expect(enrolled.bg).toContain("teal");

      const visaApproved = getAgentStageBadge("Visa Approved");
      expect(visaApproved.bg).toContain("teal");
    });
  });
});
