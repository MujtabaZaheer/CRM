import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { assessEligibility } from "../../utils/eligibility";
import { usePortalData } from "../../hooks/usePortalData";
import { useGlobalData } from "../../contexts/GlobalDataContext";
import {
  GraduationCap, Building2, BookOpen, Globe, Calendar, FileText, Send,
  AlertCircle, CheckCircle2, ArrowLeft, Sparkles, Upload, X, Loader2,
} from "lucide-react";

const INTAKES = ["Fall 2026", "Spring 2027", "Summer 2027", "Fall 2027", "Spring 2028"];

const COUNTRIES = [
  "United Kingdom", "United States", "Canada", "Australia", "Germany", "France",
  "Netherlands", "Ireland", "New Zealand", "Sweden", "Denmark", "Switzerland",
  "Italy", "Spain", "Japan", "South Korea", "Singapore", "Malaysia", "UAE", "Other",
];

export const StudentNewApplication: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const portalData = usePortalData();
  const { universities } = useGlobalData();

  const [formData, setFormData] = useState({
    universityName: "",
    programmeName: "",
    intake: "Fall 2026",
    targetCountry: "United Kingdom",
    personalStatement: "",
  });

  const [documents, setDocuments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // University suggestions from global data
  const universityOptions = useMemo(() => {
    const names = universities.map((u) => u.name || u.id);
    return [...new Set(names)].sort();
  }, [universities]);

  const selectedUniversity = useMemo(() => universities.find((university) => university.id === searchParams.get("universityId") || university.name === formData.universityName), [formData.universityName, searchParams, universities]);
  const selectedProgramme = useMemo(() => selectedUniversity?.programmes.find((programme) => programme.id === searchParams.get("programmeId") || programme.title === formData.programmeName), [formData.programmeName, searchParams, selectedUniversity]);
  const eligibility = selectedProgramme ? assessEligibility(portalData.ownStudent, selectedProgramme) : undefined;
  useEffect(() => {
    if (!selectedUniversity || !selectedProgramme) return;
    setFormData((previous) => ({
      ...previous,
      universityName: previous.universityName || selectedUniversity.name,
      programmeName: previous.programmeName || selectedProgramme.title,
      targetCountry: previous.targetCountry || selectedUniversity.country,
      intake: previous.intake || selectedProgramme.intakes[0] || "",
    }));
  }, [selectedProgramme, selectedUniversity]);

  const isFormValid = formData.universityName.trim() && formData.programmeName.trim() && formData.intake && formData.targetCountry;

  const handleAddDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setDocuments((prev) => [...prev, ...newFiles]);
    }
    e.target.value = "";
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isFormValid) {
      setError("Please fill in all required fields: University, Programme, Intake, and Country.");
      return;
    }

    setLoading(true);
    try {
      // Create the application
      await portalData.createApplication({
        universityId: selectedUniversity?.id || `manual-${formData.universityName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        universityName: formData.universityName.trim(),
        programmeId: selectedProgramme?.id || `manual-${formData.programmeName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        programmeName: formData.programmeName.trim(),
        intake: formData.intake,
        targetCountry: formData.targetCountry,
        personalStatement: formData.personalStatement.trim() || undefined,
        eligibilityStatus: eligibility?.status,
        eligibilityScore: eligibility?.score,
        formResponses: { personalStatement: formData.personalStatement.trim() },
        declarationAccepted: true,
        submit: true,
      });

      // Upload any attached documents
      if (documents.length > 0 && portalData.ownStudent) {
        for (const file of documents) {
          try {
            await portalData.uploadDocument(
              {
                studentId: portalData.ownStudent.id,
                studentName: portalData.ownStudent.fullName,
                documentType: file.name.replace(/\.[^/.]+$/, ""),
              },
              file
            );
          } catch (docErr) {
            console.warn("Document upload failed (application still created):", docErr);
          }
        }
      }

      setSuccess(true);
    } catch (err: any) {
      console.error("Application submission error:", err);
      setError(err.message || "Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Success Screen ──────────────────────────────────────────────
  if (success) {
    return (
      <div className="max-w-xl mx-auto mt-8 space-y-6 animate-fade-in">
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-card p-8 text-center space-y-5">
          <div className="w-16 h-16 mx-auto bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold font-heading text-[var(--text-primary)]">
            Application Submitted Successfully!
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-md mx-auto">
            Your application for <span className="text-emerald-400 font-semibold">{formData.programmeName}</span> at{" "}
            <span className="text-emerald-400 font-semibold">{formData.universityName}</span> has been submitted.
            It will be reviewed by a counsellor and you can track its progress in "My Applications".
          </p>

          <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card p-4 text-left space-y-2 text-xs">
            <h3 className="font-bold text-[var(--text-primary)] uppercase tracking-wider">What happens next?</h3>
            <div className="space-y-1.5 text-[var(--text-secondary)]">
              <p>1. A counsellor will review your application and may request additional documents.</p>
              <p>2. Your application will move through the review stages — you'll see updates in real-time.</p>
              <p>3. Once ready, it will be submitted to the university on your behalf.</p>
              <p>4. You'll be notified of any offers, conditions, or next steps.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => navigate("/student/applications")}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm sq-btn shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              View My Applications
            </button>
            <button
              onClick={() => {
                setSuccess(false);
                setFormData({ universityName: "", programmeName: "", intake: "Fall 2026", targetCountry: "United Kingdom", personalStatement: "" });
                setDocuments([]);
              }}
              className="px-5 py-2.5 bg-[var(--bg-hover)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold text-sm sq-btn transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Submit Another Application
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Application Form ─────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/student/applications")}
          className="p-2 bg-[var(--bg-card)] border border-[var(--border-default)] sq-btn text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            New Application
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Submit a new university application directly from your portal
          </p>
        </div>
      </div>

      {/* Student Info Card */}
      {portalData.ownStudent && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-400 sq-badge flex items-center justify-center text-zinc-950 font-bold text-lg flex-shrink-0">
            {portalData.ownStudent.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="text-xs space-y-0.5">
            <p className="text-[var(--text-primary)] font-bold">{portalData.ownStudent.fullName}</p>
            <p className="text-[var(--text-muted)]">{portalData.ownStudent.email} · {portalData.ownStudent.nationality}</p>
          </div>
          <div className="ml-auto">
            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 sq-badge text-[10px] font-bold uppercase">
              Applicant
            </span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 sq-card flex items-start gap-2 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-card p-6 space-y-5">
        {/* University */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
            <Building2 className="w-3.5 h-3.5 inline-block mr-1.5 text-emerald-400" />
            University Name *
          </label>
          <input
            type="text"
            required
            value={formData.universityName}
            onChange={(e) => { updateField("universityName", e.target.value); updateField("programmeName", ""); }}
            list="university-suggestions"
            placeholder="e.g. University of Oxford"
            className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
          />
          {universityOptions.length > 0 && (
            <datalist id="university-suggestions">
              {universityOptions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          )}
        </div>

        {selectedProgramme && eligibility && (
          <div className={`p-4 rounded-xl border ${eligibility.status === "eligible" ? "bg-emerald-500/10 border-emerald-500/30" : eligibility.status === "not_eligible" ? "bg-rose-500/10 border-rose-500/30" : "bg-amber-500/10 border-amber-500/30"}`}>
            <p className="text-sm font-bold text-[var(--text-primary)]">Eligibility: {eligibility.status.replace("_", " ")}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{eligibility.disclaimer}</p>
          </div>
        )}

        {/* Programme */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
            <BookOpen className="w-3.5 h-3.5 inline-block mr-1.5 text-emerald-400" />
            Programme / Course Name *
          </label>
          <input
            type="text"
            required
            value={formData.programmeName}
            onChange={(e) => updateField("programmeName", e.target.value)}
            placeholder="e.g. MSc Computer Science"
            className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
          />
        </div>

        {/* Intake & Country row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              <Calendar className="w-3.5 h-3.5 inline-block mr-1.5 text-emerald-400" />
              Intake *
            </label>
            <select
              required
              value={formData.intake}
              onChange={(e) => updateField("intake", e.target.value)}
              className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            >
              {INTAKES.map((intake) => (
                <option key={intake} value={intake}>{intake}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              <Globe className="w-3.5 h-3.5 inline-block mr-1.5 text-emerald-400" />
              Target Country *
            </label>
            <select
              required
              value={formData.targetCountry}
              onChange={(e) => updateField("targetCountry", e.target.value)}
              className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            >
              {COUNTRIES.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Personal Statement */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
            <FileText className="w-3.5 h-3.5 inline-block mr-1.5 text-emerald-400" />
            Personal Statement / SOP <span className="text-[var(--text-muted)] normal-case">(Optional)</span>
          </label>
          <textarea
            value={formData.personalStatement}
            onChange={(e) => updateField("personalStatement", e.target.value)}
            placeholder="Write a brief personal statement or statement of purpose to support your application..."
            rows={5}
            className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 resize-none"
          />
          <p className="text-[10px] text-[var(--text-muted)] mt-1">
            {formData.personalStatement.length} / 5000 characters
          </p>
        </div>

        {/* Document Upload */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
            <Upload className="w-3.5 h-3.5 inline-block mr-1.5 text-emerald-400" />
            Supporting Documents <span className="text-[var(--text-muted)] normal-case">(Optional)</span>
          </label>
          <p className="text-[10px] text-[var(--text-muted)] mb-2">
            Attach transcripts, English test certificates, passport copies, or other supporting documents.
          </p>

          {/* File list */}
          {documents.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {documents.map((file, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card text-xs">
                  <FileText className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="text-[var(--text-primary)] truncate flex-1">{file.name}</span>
                  <span className="text-[var(--text-muted)]">{(file.size / 1024).toFixed(0)} KB</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDocument(index)}
                    className="p-0.5 text-[var(--text-muted)] hover:text-rose-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-[var(--border-default)] sq-card text-[var(--text-muted)] hover:text-emerald-400 hover:border-emerald-500/30 transition-all cursor-pointer">
            <Upload className="w-4 h-4" />
            <span className="text-xs font-medium">Click to add files</span>
            <input
              type="file"
              multiple
              onChange={handleAddDocument}
              accept="application/pdf,image/jpeg,image/png,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
            />
          </label>
        </div>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-[var(--border-default)]">
          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="flex-1 py-3 px-5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm sq-btn shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting Application...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Application
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate("/student/applications")}
            className="px-5 py-3 bg-[var(--bg-hover)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium text-sm sq-btn transition-all"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-card p-4 text-xs text-[var(--text-secondary)] space-y-2">
        <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
          <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
          Application Tips
        </h3>
        <ul className="space-y-1 list-disc list-inside text-[var(--text-muted)]">
          <li>Ensure your profile is complete before submitting — this helps counsellors process your application faster.</li>
          <li>Upload any relevant documents now or add them later from "My Documents".</li>
          <li>Your application starts as a "Draft" and will be reviewed by a counsellor before university submission.</li>
          <li>You can submit multiple applications to different universities/programmes.</li>
        </ul>
      </div>
    </div>
  );
};
