import React, { useState, useMemo } from "react";
import {
  X,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  GraduationCap,
  ShieldCheck,
  Send,
  Award,
  AlertTriangle,
  History,
  FileCheck,
  Sparkles,
  Globe,
  BookOpen,
  Calendar,
  Mail,
  Phone,
} from "lucide-react";
import { useGlobalData } from "../../contexts/GlobalDataContext";
import { Application, ApplicationStage } from "../../types/application";
import { StudentDocument } from "../../pages/Documents";
import { UserRole } from "../../types/role";
import {
  canUserSetStage,
  getStageOwnerLabel,
  getStageSelectOptionLabel,
} from "../../utils/stageAuthorization";
import { ScopedDocumentVault } from "../documents/ScopedDocumentVault";

export interface ApplicationDetailModalProps {
  application: Application;
  documents: StudentDocument[];
  onClose: () => void;
  onStageChange: (app: Application, newStage: ApplicationStage, note: string) => Promise<void>;
  role: "admissions" | "visa";
  userRole?: UserRole;
  onVerifyDocument?: (docId: string, status: "Verified" | "Rejected", feedback?: string) => Promise<void>;
}

const ADMISSIONS_SHORTCUTS: ApplicationStage[] = [
  "Conditional Offer",
  "Unconditional Offer",
  "Documents Pending",
  "Additional Info Requested",
  "Ready for Submission",
  "Submitted",
  "Enrolled",
  "Rejected",
];

const VISA_SHORTCUTS: ApplicationStage[] = [
  "Deposit Paid",
  "CAS / COE Pending",
  "CAS Issued",
  "Visa Preparation",
  "Visa Submitted",
  "Visa Approved",
  "Rejected",
];

const ALL_STAGES: ApplicationStage[] = [
  "Draft",
  "Initial Review",
  "Documents Pending",
  "Ready for Submission",
  "Submitted",
  "University Reviewing",
  "Additional Info Requested",
  "Conditional Offer",
  "Unconditional Offer",
  "Deposit Pending",
  "Deposit Paid",
  "CAS / COE Pending",
  "CAS Issued",
  "Visa Preparation",
  "Visa Submitted",
  "Visa Approved",
  "Enrolled",
  "Deferred",
  "Withdrawn",
  "Rejected",
];

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  application,
  documents,
  onClose,
  onStageChange,
  role,
  userRole,
  onVerifyDocument,
}) => {
  const effectiveRole: UserRole = userRole || (role === "admissions" ? "admissions_officer" : "visa_officer");
  const { students, updateApplication } = useGlobalData();
  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "timeline" | "conditions">("overview");
  const [selectedStage, setSelectedStage] = useState<ApplicationStage>(application.stage);
  const [stageNote, setStageNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Match student profile from global data
  const student = useMemo(() => {
    return (
      students.find((s) => s.id === application.studentId) ||
      students.find(
        (s) =>
          (application.studentEmail && s.email && s.email.toLowerCase() === application.studentEmail.toLowerCase()) ||
          (application.studentName && s.fullName && s.fullName.toLowerCase() === application.studentName.toLowerCase())
      ) ||
      null
    );
  }, [students, application]);

  // Aggregate academic history
  const academicRecords = useMemo(() => {
    if (student?.academicHistory && student.academicHistory.length > 0) {
      return student.academicHistory;
    }
    if (application.academicHistory && application.academicHistory.length > 0) {
      return application.academicHistory;
    }
    return [];
  }, [student, application]);

  // English language test data
  const englishData = useMemo(() => {
    return student?.englishProficiency || application.englishProficiency;
  }, [student, application]);

  // Filter documents belonging to this student or this application
  const studentDocs = documents.filter(
    (d) => d.studentId === application.studentId || (d as any).applicationId === application.id
  );

  const verifiedCount = studentDocs.filter((d) => d.status === "Verified").length;

  const handleQuickAdvance = async (targetStage: ApplicationStage, defaultNote: string) => {
    if (!canUserSetStage(effectiveRole, targetStage)) {
      const owner = getStageOwnerLabel(targetStage);
      setActionNotice(`Permission Denied: Only ${owner} is authorized to transition to "${targetStage}".`);
      return;
    }
    setSelectedStage(targetStage);
    setStageNote(defaultNote);
    setIsSubmitting(true);
    setActionNotice(null);
    try {
      await onStageChange(application, targetStage, defaultNote);
      if (targetStage === "Unconditional Offer" || targetStage === "Conditional Offer") {
        updateApplication(application.id, {
          admissionsVerificationCompleted: true,
          assignedDepartment: "Finance",
          vettingStatus: "documents_verified",
        });
      }
      setActionNotice(`Application stage successfully advanced to "${targetStage}".`);
      setStageNote("");
      setTimeout(() => {
        setActionNotice(null);
      }, 3500);
    } catch (err: any) {
      setActionNotice(`Failed to advance stage: ${err.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStageUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedStage) return;
    if (!canUserSetStage(effectiveRole, selectedStage)) {
      const owner = getStageOwnerLabel(selectedStage);
      setActionNotice(`Permission Denied: Only ${owner} is authorized to transition to "${selectedStage}".`);
      return;
    }
    setIsSubmitting(true);
    setActionNotice(null);
    try {
      await onStageChange(application, selectedStage, stageNote);
      if (selectedStage === "Unconditional Offer" || selectedStage === "Conditional Offer") {
        updateApplication(application.id, {
          admissionsVerificationCompleted: true,
          assignedDepartment: "Finance",
          vettingStatus: "documents_verified",
        });
      }
      setActionNotice(`Application stage successfully updated to "${selectedStage}".`);
      setStageNote("");
      setTimeout(() => {
        setActionNotice(null);
      }, 3000);
    } catch (err: any) {
      setActionNotice(`Failed to update stage: ${err.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStageBadgeColor = (stage: string) => {
    if (stage.includes("Offer") || stage.includes("CAS") || stage.includes("Approved") || stage === "Enrolled") {
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    }
    if (stage.includes("Pending") || stage.includes("Review") || stage.includes("Preparation") || stage === "Draft") {
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    }
    if (stage.includes("Rejected") || stage.includes("Withdrawn")) {
      return "bg-rose-500/15 text-rose-400 border-rose-500/30";
    }
    return "bg-sky-500/15 text-sky-400 border-sky-500/30";
  };

  const shortcuts = role === "admissions" ? ADMISSIONS_SHORTCUTS : VISA_SHORTCUTS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[var(--backdrop)] backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden">
        {/* HEADER */}
        <header className="p-4 sm:p-6 bg-[var(--bg-elevated)] border-b border-[var(--border-default)] flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                {application.applicationNumber}
              </span>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getStageBadgeColor(application.stage)}`}>
                {application.stage}
              </span>
              {application.intake && (
                <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-card)] px-2 py-0.5 rounded border border-[var(--border-default)]">
                  {application.intake}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-[var(--text-primary)]">
              {application.studentName}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-emerald-400">{application.universityName}</span>
              <span>•</span>
              <span>{application.programmeName}</span>
              {application.targetCountry && (
                <>
                  <span>•</span>
                  <span>{application.targetCountry}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* FEEDBACK NOTICE */}
        {actionNotice && (
          <div className="px-6 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between">
            <span>{actionNotice}</span>
            <button onClick={() => setActionNotice(null)} className="underline cursor-pointer">Dismiss</button>
          </div>
        )}

        {/* METRICS QUICK BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-[var(--bg-card)] border-b border-[var(--border-default)] text-xs">
          <div className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)]">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Applicant Email</span>
            <span className="font-medium text-[var(--text-primary)] truncate block">{application.studentEmail || "—"}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)]">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Assigned Counsellor</span>
            <span className="font-medium text-[var(--text-primary)] truncate block">{application.assignedCounsellor || "Unassigned"}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)]">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Documents Status</span>
            <span className="font-bold text-emerald-400">
              {verifiedCount} of {studentDocs.length} Verified
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)]">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Eligibility Score</span>
            <span className="font-bold text-[var(--text-primary)]">
              {application.eligibilityScore ? `${application.eligibilityScore}%` : application.eligibilityStatus || "Assessed"}
            </span>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <nav className="flex items-center gap-2 px-6 border-b border-[var(--border-default)] bg-[var(--bg-card)]">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "overview"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Dossier & Profile</span>
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "documents"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Documents ({studentDocs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("timeline")}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "timeline"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail ({application.history?.length || 0})</span>
          </button>
          {((application.conditions && application.conditions.length > 0) || application.documentChecklist) && (
            <button
              onClick={() => setActiveTab("conditions")}
              className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === "conditions"
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Conditions & Checklist</span>
            </button>
          )}
        </nav>

        {/* TAB CONTENT AREA (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* TAB 1: OVERVIEW & PROFILE */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Candidate Personal Details Card */}
              <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-4">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold border-b border-[var(--border-default)]/60 pb-2">
                  <User className="w-4 h-4" />
                  <h3 className="text-sm font-heading">Candidate Personal Profile</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block font-semibold">Full Legal Name</span>
                    <div className="font-semibold text-sm text-[var(--text-primary)] mt-0.5">
                      {student?.fullName || application.studentName}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block font-semibold">Email Address</span>
                    <div className="font-medium text-[var(--text-primary)] mt-0.5 flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-[var(--text-muted)]" />
                      <span>{student?.email || application.studentEmail || "Not provided"}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block font-semibold">Contact Phone</span>
                    <div className="font-medium text-[var(--text-primary)] mt-0.5 flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-[var(--text-muted)]" />
                      <span>{student?.phone || (application as any).studentPhone || "Not provided"}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block font-semibold">Date of Birth</span>
                    <div className="font-medium text-[var(--text-primary)] mt-0.5 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-[var(--text-muted)]" />
                      <span>{student?.dob || (application as any).dob || "Not specified"}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block font-semibold">Nationality</span>
                    <div className="font-medium text-[var(--text-primary)] mt-0.5 flex items-center gap-1.5">
                      <Globe className="w-3 h-3 text-[var(--text-muted)]" />
                      <span>{student?.nationality || (application as any).nationality || "International"}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block font-semibold">Country of Residence</span>
                    <div className="font-medium text-[var(--text-primary)] mt-0.5">
                      {student?.countryOfResidence || application.targetCountry || "International"}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block font-semibold">Passport Number</span>
                    <div className="font-mono font-bold text-teal-400 mt-0.5">
                      {student?.passportNumber || (application as any).passportNumber || "Pending verification"}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block font-semibold">Passport Expiry</span>
                    <div className="font-mono text-[var(--text-secondary)] mt-0.5">
                      {student?.passportExpiry || (application as any).passportExpiry || "N/A"}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block font-semibold">Emergency Contact</span>
                    <div className="font-medium text-[var(--text-primary)] mt-0.5">
                      {application.emergencyContact?.name
                        ? `${application.emergencyContact.name} (${application.emergencyContact.relation || "Kin"})`
                        : (student as any)?.emergencyContact?.name || "Not specified"}
                    </div>
                  </div>
                </div>
              </div>

              {/* English Language Proficiency Card */}
              <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-default)]/60 pb-2">
                  <div className="flex items-center space-x-2 text-teal-400 font-bold">
                    <Globe className="w-4 h-4" />
                    <h3 className="text-sm font-heading">English Language Proficiency</h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded">
                    {englishData?.testType || "IELTS Academic"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block font-semibold">Standardized Test</span>
                    <div className="font-semibold text-[var(--text-primary)] mt-0.5">
                      {englishData?.testType || "IELTS Academic"}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block font-semibold">Overall Band / Score</span>
                    <div className="font-mono font-bold text-emerald-400 text-sm mt-0.5">
                      {englishData?.overallScore || "7.0 Overall"}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block font-semibold">TRF / Reference #</span>
                    <div className="font-mono text-[var(--text-secondary)] mt-0.5">
                      {(englishData as any)?.trfNumber || (englishData as any)?.referenceNumber || "TRF-2026-UKVI-88"}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block font-semibold">Test Date</span>
                    <div className="text-[var(--text-secondary)] mt-0.5">
                      {(englishData as any)?.testDate || "2025-11-14"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Prior Academic Qualifications Card */}
              <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-4">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold border-b border-[var(--border-default)]/60 pb-2">
                  <GraduationCap className="w-4 h-4" />
                  <h3 className="text-sm font-heading">Prior Academic Qualifications & History</h3>
                </div>

                {academicRecords.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {academicRecords.map((acad: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[var(--text-primary)]">
                            {acad.degreeTitle || acad.qualification || "Degree"}
                          </span>
                          <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[11px]">
                            {acad.gradeGpa || acad.score || acad.gpa || "3.7 GPA"}
                          </span>
                        </div>
                        <div className="text-[11px] text-teal-400 font-medium">{acad.institution || "University"}</div>
                        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] pt-1.5 border-t border-[var(--border-default)]">
                          <span>Country: {acad.country || "International"}</span>
                          <span>Passed: {acad.completionYear || acad.passingYear || "2023"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] text-center text-[var(--text-muted)]">
                    No academic records explicitly logged in text fields. Official academic transcripts available in Documents tab.
                  </div>
                )}
              </div>

              {/* Programme & University Details */}
              <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-3">
                <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-default)]/60 pb-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  Target Programme & University Application
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block font-semibold">University</span>
                    <span className="font-semibold text-[var(--text-primary)] block mt-0.5">{application.universityName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block font-semibold">Programme</span>
                    <span className="font-semibold text-[var(--text-primary)] block mt-0.5">{application.programmeName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block font-semibold">Target Country</span>
                    <span className="font-semibold text-[var(--text-primary)] block mt-0.5">{application.targetCountry || "International"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block font-semibold">Intake Term</span>
                    <span className="font-semibold text-emerald-400 block mt-0.5">{application.intake || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block font-semibold">Application Number</span>
                    <span className="font-mono font-bold text-teal-400 block mt-0.5">{application.applicationNumber || application.id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block font-semibold">CAS Reference #</span>
                    <span className="font-mono font-bold text-[var(--text-primary)] block mt-0.5">{application.casRefNumber || "Not Issued"}</span>
                  </div>
                </div>
              </div>

              {/* Form Responses / Personal Statement */}
              {application.formResponses && Object.keys(application.formResponses).length > 0 && (
                <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-3">
                  <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-default)]/60 pb-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    Application Form Responses & Academic Questionnaire
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(application.formResponses).map(([key, val]) => (
                      <div key={key} className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)]">
                        <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block capitalize">
                          {key.replace(/([A-Z])/g, " $1")}
                        </span>
                        <span className="font-medium text-[var(--text-primary)] block mt-0.5">
                          {typeof val === "boolean" ? (val ? "Yes" : "No") : String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Action Box */}
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <Clock className="w-4 h-4" />
                  <span>Scheduled Next Action</span>
                </div>
                <p className="text-[var(--text-secondary)] text-xs">
                  {application.nextAction || "No pending automated actions. Application requires staff evaluation."}
                </p>
                {application.nextActionDueDate && (
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Target completion: {application.nextActionDueDate}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SUPPORTING DOCUMENTS */}
          {activeTab === "documents" && (
            <div className="space-y-4">
              <ScopedDocumentVault
                application={application}
                studentId={application.studentId}
                studentName={application.studentName}
                documents={documents}
                currentUserRole={effectiveRole}
                onVerifyDocument={onVerifyDocument}
              />
            </div>
          )}

          {/* TAB 3: TIMELINE & AUDIT TRAIL */}
          {activeTab === "timeline" && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                Application History & Lifecycle Events
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Complete audit trail of all stage transitions, decision notes, and officer actions for this application.
              </p>

              <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)]">
                <ol className="relative border-l border-[var(--border-default)] pl-6 space-y-6">
                  {(application.history || [])
                    .slice()
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .map((item, index) => (
                      <li key={`${item.timestamp}-${index}`} className="relative">
                        <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-[var(--text-primary)]">{item.stage}</span>
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                          Updated by: <span className="font-semibold text-emerald-400">{item.updatedBy || "System"}</span>
                        </p>
                        {item.note && (
                          <div className="mt-1.5 p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[11px] text-[var(--text-secondary)] leading-relaxed">
                            {item.note}
                          </div>
                        )}
                      </li>
                    ))}
                  {(!application.history || application.history.length === 0) && (
                    <li className="text-[var(--text-muted)] text-xs">No stage history recorded yet.</li>
                  )}
                </ol>
              </div>
            </div>
          )}

          {/* TAB 4: CONDITIONS & CHECKLIST */}
          {activeTab === "conditions" && (
            <div className="space-y-4">
              {application.conditions && application.conditions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-400" />
                    Conditional Offer Requirements
                  </h3>
                  <div className="divide-y divide-[var(--border-default)] border border-[var(--border-default)] rounded-xl bg-[var(--bg-card)] overflow-hidden">
                    {application.conditions.map((cond) => (
                      <div key={cond.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5">
                          {cond.fulfilled ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          )}
                          <span className="font-medium text-[var(--text-primary)]">{cond.condition}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            cond.fulfilled
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {cond.fulfilled ? "Fulfilled" : "Pending Evidence"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {application.documentChecklist && application.documentChecklist.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Institutional Document Checklist
                  </h3>
                  <div className="divide-y divide-[var(--border-default)] border border-[var(--border-default)] rounded-xl bg-[var(--bg-card)] overflow-hidden">
                    {application.documentChecklist.map((item, idx) => (
                      <div key={idx} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <p className="font-bold text-[var(--text-primary)]">{item.label}</p>
                          <p className="text-[11px] text-[var(--text-muted)]">{item.docType}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--bg-elevated)] border border-[var(--border-default)] capitalize">
                          {item.status.replace("_", " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM ACTION PANEL: STAGE TRANSITIONS */}
        <footer className="p-4 sm:p-5 bg-[var(--bg-elevated)] border-t border-[var(--border-default)] space-y-3">
          {/* Quick Action Approval Bar */}
          {role === "admissions" && (
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-indigo-200">Admissions Evaluation Actions:</span>
                  <span className="text-[11px] text-zinc-400 ml-1.5">
                    Review candidate dossier, verify documents, and advance application workflow
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                {application.stage === "Initial Review" || application.stage === "Ready for Submission" ? (
                  <button
                    type="button"
                    disabled={isSubmitting || !canUserSetStage(effectiveRole, "Submitted")}
                    onClick={() =>
                      handleQuickAdvance(
                        "Submitted",
                        "Admissions Officer: Candidate profile and academic documents verified. Lodged with University Admissions."
                      )
                    }
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-zinc-950 font-bold text-xs rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Verify & Submit</span>
                  </button>
                ) : null}

                {application.stage === "Conditional Offer" || application.stage === "Unconditional Offer" ? (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Offer Issued ({application.stage}) • Routed to Finance
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={isSubmitting || !canUserSetStage(effectiveRole, "Conditional Offer")}
                      onClick={() =>
                        handleQuickAdvance(
                          "Conditional Offer",
                          "Admissions Officer: Approved and issued Conditional Offer. Application routed to Finance Desk."
                        )
                      }
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-bold text-xs rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Issue Conditional Offer</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting || !canUserSetStage(effectiveRole, "Unconditional Offer")}
                      onClick={() =>
                        handleQuickAdvance(
                          "Unconditional Offer",
                          "Admissions Officer: Approved and issued Unconditional Offer. Application routed to Finance Desk for Challan generation."
                        )
                      }
                      className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-zinc-950 font-bold text-xs rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Issue Unconditional Offer</span>
                    </button>
                  </>
                )}

                {application.stage !== "Documents Pending" && application.stage !== "Rejected" && (
                  <button
                    type="button"
                    disabled={isSubmitting || !canUserSetStage(effectiveRole, "Documents Pending")}
                    onClick={() =>
                      handleQuickAdvance(
                        "Documents Pending",
                        "Admissions Officer: Additional documents requested from student / counsellor."
                      )
                    }
                    className="px-2.5 py-1.5 bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-default)] font-semibold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Request Docs</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {role === "visa" && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-amber-200">Visa Officer Workflow:</span>
                  <span className="text-[11px] text-zinc-400 ml-1.5">
                    Advance immigration & visa compliance stage
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {application.stage === "Deposit Paid" || application.stage === "CAS / COE Pending" ? (
                  <button
                    type="button"
                    disabled={isSubmitting || !canUserSetStage(effectiveRole, "CAS Issued")}
                    onClick={() =>
                      handleQuickAdvance(
                        "CAS Issued",
                        "Visa Officer: Confirmation of Acceptance for Studies (CAS) verified and issued."
                      )
                    }
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold text-xs rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Issue CAS / COE</span>
                  </button>
                ) : application.stage === "CAS Issued" || application.stage === "Visa Preparation" ? (
                  <button
                    type="button"
                    disabled={isSubmitting || !canUserSetStage(effectiveRole, "Visa Submitted")}
                    onClick={() =>
                      handleQuickAdvance(
                        "Visa Submitted",
                        "Visa Officer: Visa application file lodged with immigration authority."
                      )
                    }
                    className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-zinc-950 font-bold text-xs rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Lodge Visa Application</span>
                  </button>
                ) : application.stage === "Visa Submitted" ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isSubmitting || !canUserSetStage(effectiveRole, "Visa Approved")}
                      onClick={() =>
                        handleQuickAdvance(
                          "Visa Approved",
                          "Visa Officer: Visa granted. Student immigration clearance complete."
                        )
                      }
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-bold text-xs rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Grant Visa Clearance</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting || !canUserSetStage(effectiveRole, "Rejected")}
                      onClick={() =>
                        handleQuickAdvance(
                          "Rejected",
                          "Visa Officer: Visa refused / rejected by immigration authority."
                        )
                      }
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Reject Visa</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {role === "admissions" ? "Admissions Stage Selection" : "Visa Processing Stage"}
              </span>
            </div>
            {/* Quick Stage Shortcuts */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {shortcuts.map((stg) => {
                const isAllowed = canUserSetStage(effectiveRole, stg);
                return (
                  <button
                    key={stg}
                    type="button"
                    disabled={!isAllowed}
                    onClick={() => setSelectedStage(stg)}
                    title={isAllowed ? `Select ${stg}` : `${getStageOwnerLabel(stg)} Only`}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      !isAllowed
                        ? "opacity-40 cursor-not-allowed border-zinc-800 text-zinc-500"
                        : selectedStage === stg
                        ? "bg-emerald-500 text-zinc-950 font-bold border-emerald-400 shadow-sm"
                        : "bg-[var(--bg-card)] border-[var(--border-default)] hover:border-emerald-500/40 text-[var(--text-secondary)]"
                    }`}
                  >
                    {stg} {!isAllowed && "🔒"}
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleStageUpdate} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
            <div className="w-full sm:w-64 shrink-0">
              <select
                aria-label="Application Stage"
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value as ApplicationStage)}
                className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs font-semibold text-[var(--text-primary)]"
              >
                {ALL_STAGES.filter((stg) => role !== "visa" || stg !== "Enrolled").map((stg) => {
                  const isAllowed = canUserSetStage(effectiveRole, stg);
                  return (
                    <option key={stg} value={stg} disabled={!isAllowed}>
                      {getStageSelectOptionLabel(stg, effectiveRole)}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex-1">
              <input
                type="text"
                value={stageNote}
                onChange={(e) => setStageNote(e.target.value)}
                placeholder="Audit note / reason for decision (e.g. Verified transcripts, approved conditional offer)..."
                className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] text-xs font-semibold rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isSubmitting || selectedStage === application.stage || !canUserSetStage(effectiveRole, selectedStage)}
                className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedStage !== application.stage && canUserSetStage(effectiveRole, selectedStage)
                    ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md active:scale-95"
                    : "bg-[var(--bg-hover)] text-[var(--text-muted)] cursor-not-allowed"
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Updating..." : "Update Stage"}</span>
              </button>
            </div>
          </form>
        </footer>
      </div>
    </div>
  );
};
