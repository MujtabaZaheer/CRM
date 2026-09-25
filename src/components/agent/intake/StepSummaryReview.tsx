import React from "react";
import {
  CheckCircle2,
  AlertCircle,
  Edit3,
  User,
  GraduationCap,
  BookOpen,
  Briefcase,
  Building2,
  FileCheck,
  Save,
  Send,
} from "lucide-react";
import { AgentStudentIntakePayload } from "../../../types/agentApplication";

interface StepSummaryReviewProps {
  payload: AgentStudentIntakePayload;
  onJumpToStep: (stepNumber: number) => void;
  onSaveDraft: () => Promise<void>;
  onSubmitInitialReview: () => Promise<void>;
  isSubmitting: boolean;
  submissionErrors?: string[];
}

export const StepSummaryReview: React.FC<StepSummaryReviewProps> = ({
  payload,
  onJumpToStep,
  onSaveDraft,
  onSubmitInitialReview,
  isSubmitting,
  submissionErrors = [],
}) => {
  const { personalInfo, academic, language, compliance, programs, documents } = payload;

  const mandatoryDocsCount = documents.filter((d) => d.isMandatory).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER BANNER */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl space-y-2 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Consolidated Admission Dossier Summary & Final Review
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Review all applicant credentials, academic transcripts, and compliance statements before submitting for university evaluation.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            Dossier Ready
          </span>
        </div>

        {submissionErrors.length > 0 && (
          <div className="mt-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-1 text-xs text-rose-300">
            <h4 className="font-bold flex items-center gap-1.5 text-rose-400">
              <AlertCircle className="w-4 h-4" /> Please resolve the following before submission:
            </h4>
            <ul className="list-disc pl-5 space-y-0.5 pt-1">
              {submissionErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* SUMMARY SECTIONS */}
      <div className="space-y-4">
        {/* 1. Personal & Contact Info */}
        <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
            <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              Step 1: Personal & Passport Credentials
            </span>
            <button
              type="button"
              onClick={() => onJumpToStep(1)}
              className="text-emerald-400 hover:text-emerald-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block">Full Legal Name</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {personalInfo.firstName} {personalInfo.middleName} {personalInfo.lastName}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block">Date of Birth & Gender</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {personalInfo.dateOfBirth || "—"} ({personalInfo.gender})
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block">Nationality</span>
              <span className="font-semibold text-[var(--text-primary)]">{personalInfo.nationality || "—"}</span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block">Passport Number</span>
              <span className="font-mono font-bold text-emerald-400">{personalInfo.passportNumber || "—"}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1 border-t border-[var(--border-default)]/60">
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block">Email Address</span>
              <span className="font-medium text-[var(--text-primary)] truncate block">{personalInfo.email || "—"}</span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block">Phone / WhatsApp</span>
              <span className="font-medium text-[var(--text-primary)]">
                {personalInfo.phoneCountryCode} {personalInfo.phone || "—"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block">Permanent City & Country</span>
              <span className="font-medium text-[var(--text-primary)]">
                {personalInfo.permanentAddress.city || "—"}, {personalInfo.permanentAddress.country || "—"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block">Emergency Contact</span>
              <span className="font-medium text-[var(--text-primary)]">
                {personalInfo.emergencyContact.name || "—"} ({personalInfo.emergencyContact.relation || "—"})
              </span>
            </div>
          </div>
        </div>

        {/* 2. Academic Background */}
        <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
            <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-2">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
              Step 2: Academic Qualifications & Gaps ({academic.qualifications.length})
            </span>
            <button
              type="button"
              onClick={() => onJumpToStep(2)}
              className="text-emerald-400 hover:text-emerald-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {academic.qualifications.map((q) => (
              <div key={q.id} className="flex justify-between items-center py-1 border-b border-[var(--border-default)]/60 last:border-0">
                <div>
                  <span className="font-bold text-[var(--text-primary)]">{q.degreeEarned || "Degree"}</span>
                  <span className="text-[var(--text-muted)]"> — {q.institutionName} ({q.country})</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-emerald-400">{q.obtainedScore}</span>
                  <span className="text-[10px] text-[var(--text-muted)] block">Graduated {q.completionDate}</span>
                </div>
              </div>
            ))}
          </div>

          {academic.hasAcademicGap && (
            <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              <strong>Study Gap Justification:</strong> {academic.gapExplanation}
            </div>
          )}
        </div>

        {/* 3. Language & Standardized Tests */}
        <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
            <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              Step 3: English Proficiency & Test Scores
            </span>
            <button
              type="button"
              onClick={() => onJumpToStep(3)}
              className="text-emerald-400 hover:text-emerald-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block">Proficiency Status</span>
              <span className="font-bold text-[var(--text-primary)]">{language.englishProficiencyStatus}</span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block">Overall Band / Score</span>
              <span className="font-mono font-bold text-emerald-400">{language.overallBand || "N/A"}</span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block">Sub-Scores (L/R/W/S)</span>
              <span className="font-mono text-[var(--text-primary)]">
                {language.listening || "-"}/{language.reading || "-"}/{language.writing || "-"}/{language.speaking || "-"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block">TRF / Reference #</span>
              <span className="font-mono text-[var(--text-primary)]">{language.trfReference || "—"}</span>
            </div>
          </div>
        </div>

        {/* 4. Experience & Compliance */}
        <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
            <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
              Step 4: Employment & Visa Compliance
            </span>
            <button
              type="button"
              onClick={() => onJumpToStep(4)}
              className="text-emerald-400 hover:text-emerald-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block">Work Experience</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {compliance.hasWorkExperience ? `${compliance.workHistory.length} Position(s) Listed` : "None"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block">Prior Visa Refusals</span>
              <span className={`font-bold ${compliance.hasVisaRefusal ? "text-rose-400" : "text-emerald-400"}`}>
                {compliance.hasVisaRefusal
                  ? `Yes (${compliance.visaRefusalDetails?.country} - ${compliance.visaRefusalDetails?.year})`
                  : "No Refusals"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block">Criminal Declaration</span>
              <span className="font-bold text-emerald-400">Certified Clean Record</span>
            </div>
          </div>
        </div>

        {/* 5. Target Programmes */}
        <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
            <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              Step 5: Target Programme Preferences
            </span>
            <button
              type="button"
              onClick={() => onJumpToStep(5)}
              className="text-emerald-400 hover:text-emerald-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {programs.primaryChoice?.programmeId && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-400 block">Primary Choice</span>
                  <span className="font-bold text-sm text-[var(--text-primary)]">{programs.primaryChoice.programmeTitle}</span>
                  <span className="text-xs text-[var(--text-secondary)] block">
                    {programs.primaryChoice.universityName} • {programs.primaryChoice.country}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-emerald-400">
                    £{programs.primaryChoice.tuitionFee?.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] block">Intake: {programs.primaryChoice.intake}</span>
                </div>
              </div>
            )}

            {programs.secondaryChoice?.programmeId && (
              <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-sky-400 block">Secondary Backup</span>
                  <span className="font-bold text-sm text-[var(--text-primary)]">{programs.secondaryChoice.programmeTitle}</span>
                  <span className="text-xs text-[var(--text-secondary)] block">
                    {programs.secondaryChoice.universityName} • {programs.secondaryChoice.country}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sky-400">
                    £{programs.secondaryChoice.tuitionFee?.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] block">Intake: {programs.secondaryChoice.intake}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 6. Uploaded Documents */}
        <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
            <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-2">
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              Step 6: Document Dossier ({documents.length} Files Uploaded, {mandatoryDocsCount} Mandatory)
            </span>
            <button
              type="button"
              onClick={() => onJumpToStep(6)}
              className="text-emerald-400 hover:text-emerald-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {documents.map((doc) => (
              <div key={doc.id} className="p-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-default)] flex items-center justify-between">
                <div className="space-y-0.5 truncate">
                  <span className="font-semibold text-[var(--text-primary)] block truncate">{doc.label}</span>
                  <span className="text-[11px] font-mono text-emerald-400 truncate block">{doc.fileName}</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                  Attached
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SUBMISSION ACTIONS BAR */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="space-y-0.5 text-xs text-[var(--text-secondary)]">
          <p className="font-bold text-[var(--text-primary)]">Ready to finalize candidate submission?</p>
          <p>You can either save progress as a draft or dispatch immediately to the agency admissions desk.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onSaveDraft}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--bg-input)] hover:bg-[var(--border-default)] text-[var(--text-primary)] font-bold rounded-xl text-xs border border-[var(--border-default)] transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4 text-amber-400" />
            <span>Save as Draft</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onSubmitInitialReview}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? "Submitting Dossier..." : "Submit for Initial Review"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
