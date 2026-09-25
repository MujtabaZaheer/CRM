import { z } from "zod";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

// Step 1: Personal & Contact Information Schema
export const personalInfoSchema = z.object({
  firstName: z.string().trim().min(2, "First name must be at least 2 characters"),
  middleName: z.string().trim().optional(),
  lastName: z.string().trim().min(2, "Last name must be at least 2 characters"),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((dob) => {
      const birthDate = new Date(dob);
      const minAgeDate = new Date();
      minAgeDate.setFullYear(minAgeDate.getFullYear() - 15);
      return birthDate <= minAgeDate;
    }, "Applicant must be at least 15 years old"),
  gender: z.enum(["Male", "Female", "Other"]),
  nationality: z.string().trim().min(2, "Nationality is required"),
  countryOfBirth: z.string().trim().min(2, "Country of birth is required"),
  hasDualNationality: z.boolean(),
  dualNationalityDetails: z.string().optional(),
  passportNumber: z.string().trim().min(5, "Valid passport number is required"),
  passportIssueDate: z.string().min(1, "Passport issue date is required"),
  passportExpiryDate: z
    .string()
    .min(1, "Passport expiry date is required")
    .refine((exp) => new Date(exp) > new Date(), "Passport expiry date must be in the future"),
  passportIssuingAuthority: z.string().trim().min(2, "Issuing authority is required"),
  email: z.string().trim().email("Please provide a valid email address"),
  phone: z.string().trim().min(6, "Valid contact telephone number is required"),
  phoneCountryCode: z.string().default("+44"),
  permanentAddress: z.object({
    street: z.string().trim().min(3, "Street address is required"),
    city: z.string().trim().min(2, "City is required"),
    state: z.string().trim().min(2, "State or Province is required"),
    postalCode: z.string().trim().min(2, "Postal / ZIP code is required"),
    country: z.string().trim().min(2, "Country is required"),
  }),
  mailingAddress: z.object({
    sameAsPermanent: z.boolean(),
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }),
  emergencyContact: z.object({
    name: z.string().trim().min(2, "Emergency contact name is required"),
    relation: z.string().trim().min(2, "Relationship is required"),
    phone: z.string().trim().min(6, "Emergency contact phone is required"),
    email: z.string().trim().email("Valid emergency contact email required"),
  }),
});

// Step 2: Academic Background Schema
export const qualificationEntrySchema = z.object({
  id: z.string(),
  level: z.enum(["High School / O-Levels", "A-Levels / Intermediate", "Bachelor's", "Master's", "Other"]),
  institutionName: z.string().trim().min(2, "Institution name is required"),
  country: z.string().trim().min(2, "Country is required"),
  degreeEarned: z.string().trim().min(2, "Degree or certificate title is required"),
  fieldOfStudy: z.string().trim().min(2, "Field of study / major is required"),
  startDate: z.string().min(1, "Start date is required"),
  completionDate: z.string().min(1, "Completion date is required"),
  gradingScale: z.string().trim().min(1, "Grading scale is required"),
  obtainedScore: z.string().trim().min(1, "Score / GPA is required"),
});

export const academicBackgroundSchema = z
  .object({
    qualifications: z
      .array(qualificationEntrySchema)
      .min(1, "At least one academic qualification must be listed"),
    hasAcademicGap: z.boolean(),
    gapExplanation: z.string().optional(),
    gapDetails: z
      .array(
        z.object({
          startDate: z.string(),
          endDate: z.string(),
          explanation: z.string().min(5, "Gap explanation is required"),
          activityType: z.enum([
            "Employment",
            "Family Care",
            "Test Preparation",
            "Travel",
            "Medical",
            "Other",
          ]),
          employerOrDetails: z.string().optional(),
        })
      )
      .optional(),
  })
  .refine(
    (data) => {
      if (data.hasAcademicGap && (!data.gapExplanation || data.gapExplanation.length < 10)) {
        return false;
      }
      return true;
    },
    {
      message: "Please explain the academic study gap in detail (minimum 10 characters).",
      path: ["gapExplanation"],
    }
  );

// Step 3: English Language & Tests Schema
export const languageTestsSchema = z
  .object({
    englishProficiencyStatus: z.enum([
      "IELTS Academic",
      "IELTS Indicator",
      "TOEFL iBT",
      "PTE Academic",
      "Duolingo (DET)",
      "Medium of Instruction (MOI) Certificate",
      "Exempt / Not Yet Taken",
    ]),
    overallBand: z.string().optional(),
    listening: z.string().optional(),
    reading: z.string().optional(),
    writing: z.string().optional(),
    speaking: z.string().optional(),
    testDate: z.string().optional(),
    trfReference: z.string().optional(),
    hasStandardizedTest: z.boolean(),
    standardizedTestType: z.enum(["GRE", "GMAT", "SAT", "None"]).optional(),
    standardizedScore: z.string().optional(),
    standardizedTestDate: z.string().optional(),
  })
  .refine(
    (data) => {
      const testsRequiringScore = [
        "IELTS Academic",
        "IELTS Indicator",
        "TOEFL iBT",
        "PTE Academic",
        "Duolingo (DET)",
      ];
      if (testsRequiringScore.includes(data.englishProficiencyStatus)) {
        return !!data.overallBand && data.overallBand.trim().length > 0;
      }
      return true;
    },
    {
      message: "Overall score or band is required for the selected English test",
      path: ["overallBand"],
    }
  );

// Step 4: Work Experience & Background Compliance Schema
export const experienceComplianceSchema = z
  .object({
    hasWorkExperience: z.boolean(),
    workHistory: z.array(
      z.object({
        id: z.string(),
        jobTitle: z.string().trim().min(2, "Job title is required"),
        employerName: z.string().trim().min(2, "Employer name is required"),
        country: z.string().trim().min(2, "Country is required"),
        startDate: z.string().min(1, "Start date is required"),
        endDate: z.string().optional(),
        isCurrent: z.boolean(),
        keyResponsibilities: z.string().optional(),
      })
    ),
    hasVisaRefusal: z.boolean(),
    visaRefusalDetails: z
      .object({
        country: z.string(),
        year: z.string(),
        reason: z.string(),
      })
      .optional(),
    priorStudyOrTravelInTargetCountry: z.boolean(),
    priorTravelDetails: z.string().optional(),
    criminalBackgroundDeclaration: z.boolean().refine((val) => val === true, {
      message: "You must certify compliance and truthfulness of immigration declarations.",
    }),
  })
  .refine(
    (data) => {
      if (data.hasVisaRefusal) {
        return (
          !!data.visaRefusalDetails?.country &&
          !!data.visaRefusalDetails?.year &&
          !!data.visaRefusalDetails?.reason &&
          data.visaRefusalDetails.reason.trim().length > 5
        );
      }
      return true;
    },
    {
      message: "Please specify refusal country, year, and detailed refusal reason",
      path: ["visaRefusalDetails"],
    }
  );

// Step 5: Programme & University Selection Schema
export const programChoiceSchema = z.object({
  universityId: z.string().min(1, "University selection is required"),
  universityName: z.string().min(1, "University name is required"),
  campusCity: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  programmeId: z.string().min(1, "Programme selection is required"),
  programmeTitle: z.string().min(1, "Programme title is required"),
  level: z.string().min(1, "Study level is required"),
  intake: z.string().min(1, "Intake term is required"),
  tuitionFee: z.union([z.number(), z.string()]).optional(),
  applicationFee: z.union([z.number(), z.string()]).optional(),
  entryRequirements: z.string().optional(),
  priority: z.enum(["Primary Choice", "Secondary Choice"]),
});

export const programSelectionSchema = z.object({
  primaryChoice: programChoiceSchema,
  secondaryChoice: programChoiceSchema.optional(),
});

// Step 6: Document Uploads Schema
export const agentUploadedDocumentSchema = z.object({
  id: z.string(),
  slotType: z.string(),
  label: z.string(),
  isMandatory: z.boolean(),
  fileName: z.string().min(1),
  fileUrl: z.string().min(1),
  filePath: z.string().optional(),
  fileSize: z.number().max(MAX_FILE_SIZE_BYTES, "File must not exceed 10MB"),
  mimeType: z
    .string()
    .refine((type) => ALLOWED_MIME_TYPES.includes(type) || type === "", "Unsupported file type"),
  uploadedBy: z.string(),
  uploadedAt: z.number(),
  verificationStatus: z.enum(["pending", "verified", "rejected"]),
});

export const documentUploadsSchema = z.object({
  documents: z.array(agentUploadedDocumentSchema),
});

// Full Admission Submission Schema (for "Submit for Initial Review")
export const fullAdmissionSubmissionSchema = z.object({
  personalInfo: personalInfoSchema,
  academic: academicBackgroundSchema,
  language: languageTestsSchema,
  compliance: experienceComplianceSchema,
  programs: programSelectionSchema,
  documents: z
    .array(agentUploadedDocumentSchema)
    .refine((docs) => {
      // Must contain Passport and Transcripts at minimum
      const types = docs.map((d) => d.slotType);
      return types.includes("Passport") && types.includes("Academic Transcript");
    }, "Passport identification page and official academic transcripts are mandatory before submission"),
});
