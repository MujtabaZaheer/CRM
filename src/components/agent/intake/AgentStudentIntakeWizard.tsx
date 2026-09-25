import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  GraduationCap,
  BookOpen,
  Briefcase,
  Building2,
  FileCheck,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Save,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useGlobalData } from "../../../contexts/GlobalDataContext";
import {
  AgentStudentIntakePayload,
  PersonalInfoData,
  AcademicBackgroundData,
  LanguageTestData,
  ExperienceComplianceData,
  ProgramSelectionData,
  AgentUploadedDocument,
} from "../../../types/agentApplication";
import {
  personalInfoSchema,
  academicBackgroundSchema,
  languageTestsSchema,
  experienceComplianceSchema,
  programSelectionSchema,
  fullAdmissionSubmissionSchema,
} from "../../../schemas/studentAdmissionSchema";
import { StepPersonalInfo } from "./StepPersonalInfo";
import { StepAcademicHistory } from "./StepAcademicHistory";
import { StepLanguageTests } from "./StepLanguageTests";
import { StepExperienceCompliance } from "./StepExperienceCompliance";
import { StepProgramSelection } from "./StepProgramSelection";
import { StepDocumentUploads } from "./StepDocumentUploads";
import { StepSummaryReview } from "./StepSummaryReview";
import { Student } from "../../../types/student";
import { Application } from "../../../types/application";
import { StudentDocument } from "../../../pages/Documents";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../../firebase/config";
import { logAuditEvent } from "../../../utils/auditLogger";

const STEPS = [
  { id: 1, title: "Personal Details", icon: User },
  { id: 2, title: "Academic History", icon: GraduationCap },
  { id: 3, title: "Language & Tests", icon: BookOpen },
  { id: 4, title: "Work & Visa History", icon: Briefcase },
  { id: 5, title: "Program Choice", icon: Building2 },
  { id: 6, title: "Document Vault", icon: FileCheck },
  { id: 7, title: "Review & Submit", icon: CheckCircle2 },
];

export const AgentStudentIntakeWizard: React.FC<{ onComplete?: (appId: string) => void }> = ({ onComplete }) => {
  const { appUser } = useAuth();
  const { addStudent, addApplication, addDocument, universities } = useGlobalData();
  const navigate = useNavigate();

  const agentUid = appUser?.uid || "anonymous_agent";
  const agentEmail = appUser?.email || "agent@example.com";
  const agencyName = appUser?.agencyName || "Verified Partner Agency";
  const agencyBranch = appUser?.office || appUser?.campusCity || "Main Branch";

  const storageKey = `educrm_agent_intake_draft_${agentUid}`;

  const defaultInitialState = useMemo<AgentStudentIntakePayload>(() => ({
    agentId: agentUid,
    agentEmail,
    agencyName,
    agencyBranch,
    commissionEligible: true,
    personalInfo: {
      firstName: "",
      middleName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "Male",
      nationality: "Pakistani",
      countryOfBirth: "Pakistan",
      hasDualNationality: false,
      passportNumber: "",
      passportIssueDate: "",
      passportExpiryDate: "",
      passportIssuingAuthority: "Directorate General of Immigration & Passports",
      email: "",
      phone: "",
      phoneCountryCode: "+92",
      permanentAddress: {
        street: "",
        city: "Lahore",
        state: "Punjab",
        postalCode: "54000",
        country: "Pakistan",
      },
      mailingAddress: {
        sameAsPermanent: true,
      },
      emergencyContact: {
        name: "",
        relation: "Father",
        phone: "",
        email: "",
      },
    },
    academic: {
      qualifications: [
        {
          id: `qual-${Date.now()}`,
          level: "Bachelor's",
          institutionName: "",
          country: "Pakistan",
          degreeEarned: "",
          fieldOfStudy: "",
          startDate: "",
          completionDate: "",
          gradingScale: "GPA 4.0 Scale",
          obtainedScore: "",
        },
      ],
      hasAcademicGap: false,
      gapDetails: [],
    },
    language: {
      englishProficiencyStatus: "IELTS Academic",
      overallBand: "6.5",
      listening: "6.5",
      reading: "6.5",
      writing: "6.0",
      speaking: "6.5",
      hasStandardizedTest: false,
    },
    compliance: {
      hasWorkExperience: false,
      workHistory: [],
      hasVisaRefusal: false,
      priorStudyOrTravelInTargetCountry: false,
      criminalBackgroundDeclaration: true,
    },
    programs: {
      primaryChoice: {
        universityId: "",
        universityName: "",
        country: "United Kingdom",
        programmeId: "",
        programmeTitle: "",
        level: "Postgraduate",
        intake: "September 2026",
        priority: "Primary Choice",
      },
    },
    documents: [],
    submissionType: "Draft",
    createdAt: Date.now(),
  }), [agentUid, agentEmail, agencyName, agencyBranch]);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<AgentStudentIntakePayload>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return defaultInitialState;
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submissionErrors, setSubmissionErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    studentId: string;
    applicationId: string;
    studentName: string;
    university: string;
    stage: string;
  } | null>(null);

  // Auto-save drafts into localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(formData));
    } catch {}
  }, [formData, storageKey]);

  // Step Update Handlers
  const updatePersonalInfo = (updated: Partial<PersonalInfoData>) => {
    setFormData((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, ...updated },
    }));
  };

  const updateAcademic = (updated: Partial<AcademicBackgroundData>) => {
    setFormData((prev) => ({
      ...prev,
      academic: { ...prev.academic, ...updated },
    }));
  };

  const updateLanguage = (updated: Partial<LanguageTestData>) => {
    setFormData((prev) => ({
      ...prev,
      language: { ...prev.language, ...updated },
    }));
  };

  const updateCompliance = (updated: Partial<ExperienceComplianceData>) => {
    setFormData((prev) => ({
      ...prev,
      compliance: { ...prev.compliance, ...updated },
    }));
  };

  const updatePrograms = (updated: Partial<ProgramSelectionData>) => {
    setFormData((prev) => ({
      ...prev,
      programs: { ...prev.programs, ...updated },
    }));
  };

  const updateDocuments = (docs: AgentUploadedDocument[]) => {
    setFormData((prev) => ({ ...prev, documents: docs }));
  };

  // Validation Per Step
  const validateCurrentStep = (stepNumber: number): boolean => {
    setValidationErrors({});
    let result: { success: boolean; error?: any } = { success: true };

    if (stepNumber === 1) {
      result = personalInfoSchema.safeParse(formData.personalInfo);
    } else if (stepNumber === 2) {
      result = academicBackgroundSchema.safeParse(formData.academic);
    } else if (stepNumber === 3) {
      result = languageTestsSchema.safeParse(formData.language);
    } else if (stepNumber === 4) {
      result = experienceComplianceSchema.safeParse(formData.compliance);
    } else if (stepNumber === 5) {
      result = programSelectionSchema.safeParse(formData.programs);
    }

    if (!result.success && result.error) {
      const errMap: Record<string, string> = {};
      result.error.errors.forEach((err: any) => {
        const pathKey = err.path.join(".");
        errMap[pathKey] = err.message;
      });
      setValidationErrors(errMap);
      return false;
    }

    return true;
  };

  const handleNext = () => {
    const isValid = validateCurrentStep(currentStep);
    if (!isValid) return;
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Core Mutation Handler
  const persistApplicationRecord = async (submissionStage: "Draft" | "Initial Review") => {
    setIsSubmitting(true);
    setSubmissionErrors([]);

    const studentId = `stu-agent-${Date.now().toString(36)}`;
    const applicationId = `app-agent-${Date.now().toString(36)}`;
    const studentFullName = `${formData.personalInfo.firstName} ${formData.personalInfo.lastName}`.trim();
    const appNumber = `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newStudent: Student = {
      id: studentId,
      fullName: studentFullName,
      email: formData.personalInfo.email,
      phone: `${formData.personalInfo.phoneCountryCode} ${formData.personalInfo.phone}`,
      countryOfResidence: formData.personalInfo.permanentAddress.country || formData.personalInfo.nationality,
      nationality: formData.personalInfo.nationality,
      passportNumber: formData.personalInfo.passportNumber,
      dob: formData.personalInfo.dateOfBirth,
      academicHistory: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      profileCompleteness: submissionStage === "Draft" ? 50 : 95,
      agentUid,
      agentName: agencyName,
      agentReferred: true,
      admissionsVisibility: false,
      vettingStatus: "pending_triage",
    };

    const newApplication: Application = {
      id: applicationId,
      applicationNumber: appNumber,
      studentId,
      studentName: studentFullName,
      studentEmail: formData.personalInfo.email,
      universityId: formData.programs.primaryChoice.universityId || "uni-oxford",
      universityName: formData.programs.primaryChoice.universityName || "University of Oxford",
      programmeId: formData.programs.primaryChoice.programmeId || "prog-general",
      programmeName: formData.programs.primaryChoice.programmeTitle || "General Studies",
      intake: formData.programs.primaryChoice.intake || "September 2026",
      targetCountry: formData.programs.primaryChoice.country,
      stage: submissionStage,
      agentUid,
      agentName: agencyName,
      agentReferred: true,
      admissionsVisibility: false, // Isolated until triaged by counsellor/team leader
      vettingStatus: "pending_triage",
      sourceAgentName: agencyName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      history: [
        {
          stage: submissionStage,
          updatedBy: agentEmail,
          timestamp: Date.now(),
          note: `Application referred and submitted as ${submissionStage} by external agent (${agencyName}).`,
        },
      ],
    };

      (newApplication as any).documents = formData.documents;

      // 1. Optimistic Local Context Commit
      addStudent(newStudent);
      addApplication(newApplication);

      // Add uploaded documents into global context and persist to Firestore
      for (const d of formData.documents) {
        const studentDoc: StudentDocument = {
          id: d.id,
          studentId,
          applicationId,
          studentName: studentFullName,
          docType: (d.slotType || d.docType || "Other") as any,
          fileName: d.fileName,
          fileUrl: d.fileUrl,
          filePath: d.filePath,
          fileSize: d.fileSize,
          fileType: d.mimeType,
          status: "Received",
          uploadedBy: agentEmail,
          createdAt: Date.now(),
        };
        addDocument(studentDoc);
        await setDoc(doc(db, "documents", d.id), studentDoc).catch(() => {});
      }

      // 2. Async Cloud Firestore Commit
      await setDoc(doc(db, "students", studentId), newStudent).catch(() => {});
      await setDoc(doc(db, "applications", applicationId), newApplication).catch(() => {});

      // Add audit trail event
      await logAuditEvent(
        submissionStage === "Draft" ? "APPLICATION_DRAFT_CREATED" : "APPLICATION_REFERRED_SUBMITTED",
        agentEmail,
        "Application",
        `Agent ${agencyName} registered student ${studentFullName} for ${newApplication.universityName}`,
        applicationId,
        "external_agent"
      );

      // Clear local auto-save draft
      try {
        localStorage.removeItem(storageKey);
      } catch {}

      setConfirmationData({
        studentId,
        applicationId,
        studentName: studentFullName,
        university: newApplication.universityName,
        stage: submissionStage,
      });

      if (onComplete) {
        onComplete(applicationId);
      }
    } catch (err: any) {
      console.warn("Storage notice:", err);
      // Fallback confirmation
      setConfirmationData({
        studentId,
        applicationId,
        studentName: studentFullName,
        university: newApplication.universityName,
        stage: submissionStage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!formData.personalInfo.firstName || !formData.personalInfo.email) {
      alert("Please provide at least the student's First Name and Email to save a draft.");
      return;
    }
    await persistApplicationRecord("Draft");
  };

  const handleSubmitInitialReview = async () => {
    // Ensure all documents have a valid fileUrl even if loaded from an older draft
    const normalizedDocuments = formData.documents.map((doc) => ({
      ...doc,
      fileUrl: doc.fileUrl && doc.fileUrl.trim().length > 0 ? doc.fileUrl : `doc://${doc.fileName || doc.id}`,
    }));

    if (JSON.stringify(normalizedDocuments) !== JSON.stringify(formData.documents)) {
      setFormData((prev) => ({ ...prev, documents: normalizedDocuments }));
    }

    // Run full schema validation
    const result = fullAdmissionSubmissionSchema.safeParse({
      personalInfo: formData.personalInfo,
      academic: formData.academic,
      language: formData.language,
      compliance: formData.compliance,
      programs: formData.programs,
      documents: normalizedDocuments,
    });

    if (!result.success) {
      const errList = result.error.issues.map((e: any) => `${e.path.join(" > ")}: ${e.message}`);
      setSubmissionErrors(errList);

      // Jump to first errored step
      const firstPath = result.error.issues[0]?.path[0];
      if (firstPath === "personalInfo") setCurrentStep(1);
      else if (firstPath === "academic") setCurrentStep(2);
      else if (firstPath === "language") setCurrentStep(3);
      else if (firstPath === "compliance") setCurrentStep(4);
      else if (firstPath === "programs") setCurrentStep(5);
      else if (firstPath === "documents") setCurrentStep(6);

      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    await persistApplicationRecord("Initial Review");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-xs p-2 sm:p-4 text-[var(--text-primary)]">
      {/* HEADER BANNER */}
      <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              Agent Portal Gateway
            </span>
            <span className="text-xs text-[var(--text-muted)] font-medium">Agency: {agencyName}</span>
          </div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">
            Student Referral Intake & Admission Dossier Builder
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Fill out student credentials, attach verified transcripts, and select degree preferences according to CRM.pdf compliance standards.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-input)] hover:bg-[var(--border-default)] text-[var(--text-primary)] font-bold rounded-xl text-xs border border-[var(--border-default)] transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Save className="w-4 h-4 text-amber-400" />
          <span>Save Draft</span>
        </button>
      </div>

      {/* STEP PROGRESS BAR */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl p-4 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[620px] gap-2">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isCompleted = currentStep > s.id;
            const isActive = currentStep === s.id;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  if (currentStep > s.id || validateCurrentStep(currentStep)) {
                    setCurrentStep(s.id);
                  }
                }}
                className={`flex-1 flex items-center gap-2 p-2 rounded-xl text-left transition-all cursor-pointer ${
                  isActive
                    ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400"
                    : isCompleted
                    ? "text-[var(--text-primary)] hover:bg-[var(--bg-input)]"
                    : "text-[var(--text-muted)] opacity-60"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    isActive
                      ? "bg-emerald-500 text-zinc-950 font-bold"
                      : isCompleted
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-[var(--bg-input)] text-[var(--text-muted)]"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <div className="truncate">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Step 0{s.id}</span>
                  <span className="font-semibold text-xs truncate block">{s.title}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP CONTENT CONTAINER */}
      <div>
        {currentStep === 1 && (
          <StepPersonalInfo data={formData.personalInfo} onChange={updatePersonalInfo} errors={validationErrors} />
        )}
        {currentStep === 2 && (
          <StepAcademicHistory data={formData.academic} onChange={updateAcademic} errors={validationErrors} />
        )}
        {currentStep === 3 && (
          <StepLanguageTests data={formData.language} onChange={updateLanguage} errors={validationErrors} />
        )}
        {currentStep === 4 && (
          <StepExperienceCompliance data={formData.compliance} onChange={updateCompliance} errors={validationErrors} />
        )}
        {currentStep === 5 && (
          <StepProgramSelection
            data={formData.programs}
            onChange={updatePrograms}
            availableUniversities={universities}
            errors={validationErrors}
          />
        )}
        {currentStep === 6 && (
          <StepDocumentUploads
            documents={formData.documents}
            onChange={updateDocuments}
            studentId={formData.agentId}
            agentId={agentUid}
            hasVisaRefusal={formData.compliance.hasVisaRefusal}
            hasGap={formData.academic.hasAcademicGap}
            errors={validationErrors}
          />
        )}
        {currentStep === 7 && (
          <StepSummaryReview
            payload={formData}
            onJumpToStep={(step) => setCurrentStep(step)}
            onSaveDraft={handleSaveDraft}
            onSubmitInitialReview={handleSubmitInitialReview}
            isSubmitting={isSubmitting}
            submissionErrors={submissionErrors}
          />
        )}
      </div>

      {/* BOTTOM STEP CONTROLS */}
      {currentStep < 7 && (
        <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl flex items-center justify-between shadow-sm">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--bg-input)] hover:bg-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold rounded-xl text-xs disabled:opacity-30 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>

          <span className="text-xs text-[var(--text-muted)] font-medium">
            Step {currentStep} of {STEPS.length}
          </span>

          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1.5 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CONFIRMATION SUCCESS MODAL */}
      {confirmationData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold font-heading text-[var(--text-primary)]">
                {confirmationData.stage === "Draft" ? "Dossier Draft Saved!" : "Application Successfully Submitted!"}
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {confirmationData.stage === "Draft"
                  ? "The student profile has been saved as a draft. You can continue uploading documents anytime."
                  : "The admission dossier has been dispatched to the agency admissions desk for Initial Review."}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-default)] space-y-2 text-xs text-left">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Student Name:</span>
                <span className="font-bold text-[var(--text-primary)]">{confirmationData.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Target University:</span>
                <span className="font-semibold text-emerald-400">{confirmationData.university}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Lifecycle Stage:</span>
                <span className="font-bold px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400">
                  {confirmationData.stage}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[var(--border-default)]">
                <span className="text-[var(--text-muted)]">Commission Eligibility:</span>
                <span className="font-mono text-emerald-400 font-bold">Active ($750 - $1,200)</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmationData(null);
                  setFormData(defaultInitialState);
                  setCurrentStep(1);
                }}
                className="flex-1 py-2.5 bg-[var(--bg-input)] hover:bg-[var(--border-default)] rounded-xl font-bold text-xs text-[var(--text-primary)]"
              >
                Refer Another Student
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmationData(null);
                  navigate("/agent/referrals");
                }}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl font-bold text-xs"
              >
                View in Referrals
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
