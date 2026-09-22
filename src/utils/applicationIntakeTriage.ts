import { doc, updateDoc, setDoc, addDoc, collection, getDoc } from "firebase/firestore";
import {
  EmergencyContact,
  AcademicHistoryRecord,
  EnglishProficiencyData,
  StudyGapRecord,
  ImmigrationHistoryData,
  DeclarationData,
} from "../types/application";

export const MAX_WIZARD_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_WIZARD_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

export const ALLOWED_WIZARD_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];

export interface WizardDocumentUpload {
  id: string;
  category: "passport" | "transcript" | "certificate" | "english_test" | "sop" | "supporting";
  fileName: string;
  fileSize: number;
  mimeType: string;
  previewUrl: string; // base64 or blob URL
  uploadedAt: number;
}

export interface ApplicationWizardFormData {
  // Step 1: Personal & Passport Details
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  gender: "Male" | "Female" | "Other" | "Prefer not to say" | "";
  nationality: string;
  countryOfResidence: string;
  passportNumber: string;
  passportExpiry: string;
  passportIssueCountry: string;

  // Step 2: Emergency Contact
  emergencyContact: EmergencyContact;

  // Step 3: Academic Qualifications & English Test
  academicHistory: AcademicHistoryRecord[];
  englishProficiency: EnglishProficiencyData;

  // Step 4: Study Gaps & Immigration Refusals
  studyGaps: StudyGapRecord[];
  immigrationHistory: ImmigrationHistoryData;

  // Step 5: Documents
  documents: WizardDocumentUpload[];

  // Step 6: Legal Declaration
  declaration: DeclarationData;

  // Application & Scoping Context
  universityId?: string;
  universityName?: string;
  programmeId?: string;
  programmeName?: string;
  intake?: string;
  studentId?: string;
  agentUid?: string;
  agentName?: string;
  agentReferred?: boolean;
  tenantId?: string;
}

/**
 * Validates a file for the Application Wizard upload vault.
 * Rejects files > 10MB or unsupported MIME types.
 */
export const validateWizardDocumentFile = (file: {
  size: number;
  type: string;
  name?: string;
}): { valid: boolean; error?: string } => {
  if (file.size === 0) {
    return { valid: false, error: "File cannot be empty (0 bytes)." };
  }
  if (file.size > MAX_WIZARD_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds the 10MB compliance limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please select a file under 10MB.`,
    };
  }

  // Type check: check MIME or file extension fallback
  const isMimeAllowed = ALLOWED_WIZARD_MIME_TYPES.includes(file.type.toLowerCase());
  const ext = file.name ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase() : "";
  const isExtAllowed = ALLOWED_WIZARD_EXTENSIONS.includes(ext);

  if (!isMimeAllowed && !isExtAllowed) {
    return {
      valid: false,
      error: `Unsupported file type (${file.type || ext}). Only PDF, JPG, and PNG documents are accepted under EduBridge compliance standards.`,
    };
  }

  return { valid: true };
};

export const validateStep1Personal = (data: Partial<ApplicationWizardFormData>): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!data.fullName?.trim()) errors.fullName = "Full legal name is required";
  if (!data.email?.trim()) {
    errors.email = "Email address is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Please enter a valid email address";
  }
  if (!data.phone?.trim()) errors.phone = "Phone number is required";
  if (!data.dob) errors.dob = "Date of birth is required";
  if (!data.nationality?.trim()) errors.nationality = "Nationality is required";
  if (!data.countryOfResidence?.trim()) errors.countryOfResidence = "Country of residence is required";
  if (!data.passportNumber?.trim()) errors.passportNumber = "Passport number is required";
  if (!data.passportExpiry) errors.passportExpiry = "Passport expiry date is required";
  return errors;
};

export const validateStep2Emergency = (contact: Partial<EmergencyContact> | undefined): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!contact?.name?.trim()) errors.name = "Emergency contact name is required";
  if (!contact?.relation?.trim()) errors.relation = "Relationship to applicant is required";
  if (!contact?.phone?.trim()) errors.phone = "Emergency contact phone is required";
  if (!contact?.email?.trim()) {
    errors.email = "Emergency contact email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
    errors.email = "Please enter a valid email address";
  }
  if (!contact?.address?.trim()) errors.address = "Residential address is required";
  return errors;
};

export const validateStep3Academic = (
  academicHistory: AcademicHistoryRecord[] | undefined,
  englishProficiency: EnglishProficiencyData | undefined
): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!academicHistory || academicHistory.length === 0) {
    errors.academicHistory = "At least one academic qualification record must be recorded";
  } else {
    academicHistory.forEach((rec, idx) => {
      if (!rec.institution?.trim()) errors[`academic_${idx}_institution`] = "Institution name is required";
      if (!rec.qualification?.trim()) errors[`academic_${idx}_qualification`] = "Qualification title is required";
      if (!rec.passingYear || rec.passingYear < 1960 || rec.passingYear > new Date().getFullYear() + 2) {
        errors[`academic_${idx}_passingYear`] = "Valid passing year is required";
      }
      if (!rec.score?.trim()) errors[`academic_${idx}_score`] = "Grade or score is required";
    });
  }

  if (englishProficiency && englishProficiency.testType !== "None") {
    if (!englishProficiency.overallScore?.trim()) {
      errors.englishScore = "Overall test score is required for the selected test";
    }
  }

  return errors;
};

export const validateStep4GapsAndImmigration = (
  studyGaps: StudyGapRecord[] | undefined,
  immigration: ImmigrationHistoryData | undefined
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (studyGaps && studyGaps.length > 0) {
    studyGaps.forEach((gap, idx) => {
      if (!gap.startDate) errors[`gap_${idx}_start`] = "Start date required";
      if (!gap.endDate) errors[`gap_${idx}_end`] = "End date required";
      if (!gap.explanation?.trim() || gap.explanation.trim().length < 5) {
        errors[`gap_${idx}_explanation`] = "Detailed gap explanation is required (min 5 characters)";
      }
    });
  }

  if (immigration?.hasPriorRefusal) {
    if (!immigration.refusalDetails?.trim() || immigration.refusalDetails.trim().length < 10) {
      errors.refusalDetails = "Please provide detailed context regarding prior visa refusal (min 10 characters)";
    }
    if (!immigration.refusalCountries || immigration.refusalCountries.length === 0) {
      errors.refusalCountries = "At least one refusal country must be specified";
    }
  }

  return errors;
};

export const validateStep5Documents = (documents: WizardDocumentUpload[] | undefined): Record<string, string> => {
  const errors: Record<string, string> = {};
  const hasPassport = documents?.some((d) => d.category === "passport");
  const hasTranscript = documents?.some((d) => d.category === "transcript" || d.category === "certificate");

  if (!hasPassport) {
    errors.passportDoc = "Official Passport copy is required";
  }
  if (!hasTranscript) {
    errors.transcriptDoc = "At least one Academic Transcript or Certificate is required";
  }
  return errors;
};

export const validateStep6Declaration = (declaration: DeclarationData | undefined): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!declaration?.consentGiven) {
    errors.consentGiven = "You must agree to the EduBridge Network legal compliance terms";
  }
  if (!declaration?.signedName?.trim()) {
    errors.signedName = "Official digital signature (full legal name) is required";
  }
  return errors;
};

/**
 * Clean object by stripping undefined values (Firestore rejects undefined)
 */
export const cleanPayload = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const clean: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      if (val !== null && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
        clean[key] = cleanPayload(val);
      } else {
        clean[key] = val;
      }
    }
  }
  return clean;
};

export interface SubmitPublicApplicationResult {
  success: boolean;
  applicationId: string;
  auditLogId?: string;
  notificationId?: string;
  isAgentReferred: boolean;
  admissionsVisibility: boolean;
  vettingStatus?: string;
  error?: string;
}

/**
 * Autonomous CRM Triage & Dossier Handoff Handler:
 * - Updates application status to 'Submitted' and stage to 'Ready for Submission'
 * - Preserves agent referral quarantine (admissionsVisibility: false) if agent-referred
 * - Emits branch/triage in-app notification
 * - Appends immutable PUBLIC_APPLICATION_SUBMITTED event in audit_logs
 */
export const submitPublicApplication = async (
  firestoreDb: any,
  applicationId: string,
  formData: Partial<ApplicationWizardFormData>,
  tenantId: string = "tenant-london"
): Promise<SubmitPublicApplicationResult> => {
  try {
    const now = Date.now();
    const isAgent = Boolean(formData.agentReferred);
    const resolvedTenant = formData.tenantId || tenantId;

    // 1. Prepare application update payload
    const applicationPayload = cleanPayload({
      studentName: formData.fullName || "Applicant",
      studentEmail: formData.email,
      status: "Submitted",
      applicationStatus: "Submitted",
      stage: "Ready for Submission",
      submittedAt: now,
      completionPercentage: 100,
      wizardStepCompleted: 6,
      currentStep: 6,
      declarationAccepted: Boolean(formData.declaration?.consentGiven),
      emergencyContact: formData.emergencyContact,
      academicHistory: formData.academicHistory,
      englishProficiency: formData.englishProficiency,
      studyGaps: formData.studyGaps,
      immigrationHistory: formData.immigrationHistory,
      declaration: formData.declaration ? {
        ...formData.declaration,
        agreedAt: formData.declaration.agreedAt || new Date(now).toISOString(),
      } : undefined,
      tenantId: resolvedTenant,
      // Agent Referral & Admissions Triage Scoping Gate
      agentReferred: isAgent,
      agentUid: formData.agentUid,
      agentName: formData.agentName,
      admissionsVisibility: isAgent ? false : true,
      vettingStatus: isAgent ? "pending_triage" : "documents_verified",
      updatedAt: now,
    });

    const appRef = doc(firestoreDb, "applications", applicationId);
    // Check if document exists first, if so updateDoc, else setDoc with createdAt
    const existingSnap = await getDoc(appRef);
    if (existingSnap.exists()) {
      await updateDoc(appRef, applicationPayload);
    } else {
      await setDoc(appRef, {
        ...applicationPayload,
        id: applicationId,
        applicationNumber: `APP-${new Date().getFullYear()}-${applicationId.slice(0, 5).toUpperCase()}`,
        universityId: formData.universityId || "univ-general",
        universityName: formData.universityName || "Partner University",
        programmeId: formData.programmeId || "prog-general",
        programmeName: formData.programmeName || "General Admissions Intake",
        intake: formData.intake || `Fall ${new Date().getFullYear()}`,
        createdAt: now,
      });
    }

    // 2. Append immutable audit event in audit_logs
    let auditLogId: string | undefined;
    try {
      const auditRef = await addDoc(collection(firestoreDb, "audit_logs"), {
        action: "PUBLIC_APPLICATION_SUBMITTED",
        performedBy: formData.email || formData.declaration?.signedName || "Applicant",
        performedByRole: "applicant",
        targetEntity: "application",
        targetId: applicationId,
        tenantId: resolvedTenant,
        details: `EduBridge public intake completed (Steps 1-6). Agent referred: ${isAgent}. Triage routing: ${isAgent ? "agent_triage" : "intake_desk"}.`,
        timestamp: now,
        source: "public_application_wizard",
      });
      auditLogId = auditRef.id;
    } catch (auditErr) {
      console.warn("Audit logging notice:", auditErr);
    }

    // 3. Dispatch in-app notification to branch intake or triage queue
    let notificationId: string | undefined;
    try {
      const notifRef = await addDoc(collection(firestoreDb, "notifications"), {
        targetRole: isAgent ? "counsellor" : "admissions_officer",
        targetDesk: isAgent ? "agent_triage" : "intake_desk",
        tenantId: resolvedTenant,
        type: isAgent ? "agent_application_triage" : "public_application_submitted",
        title: isAgent
          ? "🛡️ New Agent-Referred Application Submitted for Triage"
          : "📥 New Public Application Ready for Review",
        message: `Applicant ${formData.fullName} has completed the EduBridge intake wizard. ${
          isAgent
            ? "Triage approval required before dossier appears in Admissions Office."
            : "Application is now ready in the admissions intake queue."
        }`,
        link: isAgent ? "/agent-triage" : "/applications",
        read: false,
        createdAt: now,
      });
      notificationId = notifRef.id;
    } catch (notifErr) {
      console.warn("Notification notice:", notifErr);
    }

    return {
      success: true,
      applicationId,
      auditLogId,
      notificationId,
      isAgentReferred: isAgent,
      admissionsVisibility: isAgent ? false : true,
      vettingStatus: isAgent ? "pending_triage" : "documents_verified",
    };
  } catch (err: any) {
    console.error("Failed to submit public intake application:", err);
    return {
      success: false,
      applicationId,
      isAgentReferred: Boolean(formData.agentReferred),
      admissionsVisibility: false,
      error: err.message || "Failed to submit public application",
    };
  }
};
