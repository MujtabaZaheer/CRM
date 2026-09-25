import React, { useState, useMemo } from "react";
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Lock,
  Download,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Plus,
  X,
  FileCheck,
} from "lucide-react";
import { Application, ApplicationStage } from "../../types/application";
import { StudentDocument, DocumentType } from "../../pages/Documents";
import { UserRole } from "../../types/role";
import { getApplicationLockStatus } from "../../utils/applicationWorkflowConfig";
import { uploadStudentDocument, getDocumentBlobOrUrl } from "../../utils/documentStorage";

export interface ScopedDocumentVaultProps {
  application?: Application;
  studentId: string;
  studentName?: string;
  documents: StudentDocument[];
  currentUserRole: UserRole;
  userEmail?: string;
  onUploadSuccess?: (newDoc: StudentDocument) => void;
  onVerifyDocument?: (docId: string, status: "Verified" | "Rejected", feedback?: string) => Promise<void>;
  onRequestDocument?: (docType: string, reason: string) => Promise<void>;
  isReadOnly?: boolean;
}

const STANDARD_REQUIRED_DOCS: { type: DocumentType; label: string; stageRequirement: string }[] = [
  { type: "Passport", label: "International Passport (Bio Data)", stageRequirement: "Draft / Initial Review" },
  { type: "Academic Transcript", label: "Official Academic Transcripts", stageRequirement: "Initial Review" },
  { type: "Degree Certificate", label: "Graduation / Degree Certificate", stageRequirement: "Initial Review" },
  { type: "IELTS / English Test", label: "English Proficiency (IELTS / PTE / TOEFL)", stageRequirement: "Ready for Submission" },
  { type: "Personal Statement", label: "Statement of Purpose (SOP)", stageRequirement: "Ready for Submission" },
  { type: "CV / Resume", label: "Curriculum Vitae (CV)", stageRequirement: "Initial Review" },
  { type: "Financial Proof", label: "Financial Solvency / Bank Statement (28-day rule)", stageRequirement: "Visa Preparation" },
  { type: "Visa Document", label: "Deposit Challan / Tuition Receipt", stageRequirement: "Deposit Pending" },
];

export const ScopedDocumentVault: React.FC<ScopedDocumentVaultProps> = ({
  application,
  studentId,
  studentName = "Applicant",
  documents,
  currentUserRole,
  userEmail,
  onUploadSuccess,
  onVerifyDocument,
  onRequestDocument,
  isReadOnly = false,
}) => {
  const currentStage: ApplicationStage = application?.stage || "Draft";
  const { isLocked: isFieldLocked } = getApplicationLockStatus(
    currentStage,
    currentUserRole,
    application?.lockedAt
  );

  const [previewDoc, setPreviewDoc] = useState<StudentDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Verification modal state for staff
  const [verifyingDoc, setVerifyingDoc] = useState<StudentDocument | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<"Verified" | "Rejected">("Verified");
  const [verifyFeedback, setVerifyFeedback] = useState("");
  const [isSubmittingVerify, setIsSubmittingVerify] = useState(false);

  // Request document modal state for university partner / admissions
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqDocType, setReqDocType] = useState<DocumentType>("Academic Transcript");
  const [reqReason, setReqReason] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Direct slot file upload state
  const [uploadingType, setUploadingType] = useState<DocumentType | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Filter documents for this student
  const studentDocs = useMemo(() => {
    return documents.filter((d) => d.studentId === studentId);
  }, [documents, studentId]);

  // Stage-aware banner messaging
  const stageBanner = useMemo(() => {
    switch (currentStage) {
      case "Documents Pending":
        return {
          type: "warning",
          title: "Action Required: Missing or Incomplete Documents",
          description: "One or more documents require your immediate attention before the application can proceed to submission.",
        };
      case "Additional Info Requested":
        return {
          type: "urgent",
          title: "Urgent: Institution Requested Supplementary Evidence",
          description: "The university admissions committee requested additional or updated documents. Slots below are unlocked for direct upload.",
        };
      case "Ready for Submission":
        return {
          type: "info",
          title: "Pre-Submission Dossier Vetting",
          description: isFieldLocked
            ? "Your dossier is locked for student modifications while Admissions conducts final compliance checks."
            : "Review and verify all academic and identity items prior to external dispatch.",
        };
      case "Submitted":
      case "University Reviewing":
        return {
          type: "locked",
          title: "Dossier Dispatched to University Registry",
          description: "All files are hard-locked. Changes are prohibited unless formally reopened by University Admissions.",
        };
      case "Deposit Pending":
        return {
          type: "action",
          title: "Tuition Deposit Receipt Required",
          description: "Upload your official bank wire transfer receipt or payment receipt to confirm your place and unlock CAS / COE issuance.",
        };
      case "Visa Preparation":
        return {
          type: "action",
          title: "Visa Application Compliance Dossier",
          description: "Upload your certified 28-day financial bank statement, TB medical certificate, and sponsorship affidavits.",
        };
      default:
        return null;
    }
  }, [currentStage, isFieldLocked]);

  const handlePreview = async (docItem: StudentDocument) => {
    setPreviewDoc(docItem);
    setLoadingPreview(true);
    try {
      const url = await getDocumentBlobOrUrl(docItem.id, docItem.fileUrl);
      setPreviewUrl(url);
    } catch {
      setPreviewUrl(docItem.fileUrl);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDirectUpload = async (docType: DocumentType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingType(docType);
    setUploadError(null);

    try {
      const uploaded = await uploadStudentDocument(studentId, file, docType, application?.id);
      const newRecord: StudentDocument = {
        id: uploaded.documentId,
        studentId,
        studentName,
        docType,
        fileName: file.name,
        fileUrl: uploaded.driveUrl || "",
        filePath: uploaded.driveFileId,
        fileSize: file.size,
        fileType: file.type,
        status: "Received",
        uploadedBy: userEmail || "Student Portal",
        createdAt: Date.now(),
      };
      if (onUploadSuccess) {
        onUploadSuccess(newRecord);
      }
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload document.");
    } finally {
      setUploadingType(null);
      e.target.value = "";
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingDoc || !onVerifyDocument) return;

    setIsSubmittingVerify(true);
    try {
      await onVerifyDocument(verifyingDoc.id, verifyStatus, verifyFeedback);
      setVerifyingDoc(null);
      setVerifyFeedback("");
    } finally {
      setIsSubmittingVerify(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onRequestDocument) return;

    setIsSubmittingRequest(true);
    try {
      await onRequestDocument(reqDocType, reqReason);
      setShowRequestModal(false);
      setReqReason("");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const canStaffVerify =
    currentUserRole === "admissions_officer" ||
    currentUserRole === "compliance_officer" ||
    currentUserRole === "platform_super_admin" ||
    currentUserRole === "org_admin";

  const canRequestAdditionalDocs =
    currentUserRole === "university_partner" ||
    currentUserRole === "admissions_officer" ||
    currentUserRole === "platform_super_admin";

  return (
    <div className="space-y-6">
      {/* Stage Awareness Alert Banner */}
      {stageBanner && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
            stageBanner.type === "urgent"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
              : stageBanner.type === "warning"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
              : stageBanner.type === "locked"
              ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
          }`}
        >
          {stageBanner.type === "urgent" || stageBanner.type === "warning" ? (
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : stageBanner.type === "locked" ? (
            <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs">
            <h4 className="font-semibold text-sm mb-0.5">{stageBanner.title}</h4>
            <p className="opacity-90">{stageBanner.description}</p>
          </div>
          {canRequestAdditionalDocs && (
            <button
              onClick={() => setShowRequestModal(true)}
              className="px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-default)] hover:border-amber-500/50 rounded-lg text-xs font-medium text-[var(--text-primary)] flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              Request Docs
            </button>
          )}
        </div>
      )}

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-xs flex items-center justify-between">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dossier Slots Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STANDARD_REQUIRED_DOCS.map((slot) => {
          const matchingDoc = studentDocs.find((d) => d.docType === slot.type);
          const isSlotUploading = uploadingType === slot.type;

          // Check if this slot is locked for modification
          const isSlotLocked =
            isReadOnly ||
            (isFieldLocked &&
              currentStage !== "Documents Pending" &&
              currentStage !== "Additional Info Requested" &&
              matchingDoc?.status === "Verified");

          return (
            <div
              key={slot.type}
              className={`p-4 rounded-xl border transition-all ${
                matchingDoc?.status === "Verified"
                  ? "bg-[var(--bg-card)] border-emerald-500/30"
                  : matchingDoc?.status === "Rejected"
                  ? "bg-rose-500/5 border-rose-500/30"
                  : matchingDoc
                  ? "bg-[var(--bg-card)] border-[var(--border-default)]"
                  : currentStage === "Documents Pending" || currentStage === "Additional Info Requested"
                  ? "bg-amber-500/5 border-amber-500/40"
                  : "bg-[var(--bg-card)] border-[var(--border-default)]/60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      {slot.label}
                    </span>
                    {matchingDoc?.status === "Verified" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    )}
                    {matchingDoc?.status === "Rejected" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <AlertCircle className="w-3 h-3" /> Action Required
                      </span>
                    )}
                    {matchingDoc?.status === "Received" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        <Clock className="w-3 h-3" /> Under Review
                      </span>
                    )}
                    {!matchingDoc && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-default)]">
                        Missing
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Required for: <span className="text-[var(--text-primary)]">{slot.stageRequirement}</span>
                  </p>

                  {matchingDoc && (
                    <p className="text-[11px] font-mono text-sky-400 truncate max-w-[260px] pt-1">
                      {matchingDoc.fileName}
                    </p>
                  )}

                  {matchingDoc?.remarks && matchingDoc.status === "Rejected" && (
                    <div className="mt-2 p-2 rounded bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300">
                      <strong>Rejection Note:</strong> {matchingDoc.remarks}
                    </div>
                  )}
                </div>

                {/* Slot Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {matchingDoc && (
                    <button
                      onClick={() => handlePreview(matchingDoc)}
                      className="p-2 rounded-lg bg-[var(--bg-input)] hover:bg-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      title="Preview Document"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}

                  {matchingDoc && canStaffVerify && onVerifyDocument && (
                    <button
                      onClick={() => {
                        setVerifyingDoc(matchingDoc);
                        setVerifyStatus("Verified");
                        setVerifyFeedback(matchingDoc.remarks || "");
                      }}
                      className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                      title="Verify Document"
                    >
                      <ShieldCheck className="w-4 h-4" />
                    </button>
                  )}

                  {/* Upload button if not hard-locked */}
                  {!isSlotLocked && (
                    <label
                      className={`p-2 rounded-lg cursor-pointer transition-colors flex items-center justify-center ${
                        matchingDoc
                          ? "bg-[var(--bg-input)] hover:bg-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          : "bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/40"
                      }`}
                      title={matchingDoc ? "Replace Document" : "Upload Document"}
                    >
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleDirectUpload(slot.type, e)}
                        disabled={isSlotUploading}
                      />
                      {isSlotUploading ? (
                        <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                    </label>
                  )}

                  {isSlotLocked && !matchingDoc && (
                    <span className="p-2 text-[var(--text-muted)]" title="Upload locked">
                      <Lock className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="font-semibold text-sm text-[var(--text-primary)]">{previewDoc.fileName}</h3>
                  <span className="text-[11px] text-[var(--text-muted)]">{previewDoc.docType}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setPreviewDoc(null);
                  setPreviewUrl(null);
                }}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="min-h-[320px] max-h-[500px] flex items-center justify-center bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] overflow-hidden">
              {loadingPreview ? (
                <div className="text-center space-y-2">
                  <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-[var(--text-muted)]">Retrieving document preview...</p>
                </div>
              ) : previewUrl ? (
                previewDoc.fileType?.includes("image") || previewDoc.fileName.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                  <img src={previewUrl} alt={previewDoc.fileName} className="max-h-[480px] w-auto object-contain" />
                ) : (
                  <iframe src={previewUrl} title={previewDoc.fileName} className="w-full h-[480px] border-0" />
                )
              ) : (
                <div className="text-center p-6 space-y-2">
                  <FileText className="w-12 h-12 text-[var(--text-muted)] mx-auto" />
                  <p className="text-xs text-[var(--text-secondary)]">Direct preview unavailable for this format.</p>
                  <a
                    href={previewDoc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/20 text-sky-400 rounded-lg text-xs hover:bg-sky-500/30"
                  >
                    <Download className="w-3.5 h-3.5" /> Open / Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Staff Document Verification Modal */}
      {verifyingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-default)]">
              <h3 className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Audit Document Dossier
              </h3>
              <button onClick={() => setVerifyingDoc(null)} className="text-[var(--text-secondary)] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1">Document Name</label>
                <div className="p-2.5 bg-[var(--bg-surface)] rounded-lg text-xs font-mono text-[var(--text-primary)]">
                  {verifyingDoc.fileName} ({verifyingDoc.docType})
                </div>
              </div>

              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1">Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVerifyStatus("Verified")}
                    className={`py-2 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                      verifyStatus === "Verified"
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                        : "bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-muted)]"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approved / Verified
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerifyStatus("Rejected")}
                    className={`py-2 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                      verifyStatus === "Rejected"
                        ? "bg-rose-500/20 border-rose-500/50 text-rose-400"
                        : "bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-muted)]"
                    }`}
                  >
                    <AlertCircle className="w-4 h-4" /> Reject / Incomplete
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1">
                  Verification Comments / Correction Request
                </label>
                <textarea
                  value={verifyFeedback}
                  onChange={(e) => setVerifyFeedback(e.target.value)}
                  placeholder={
                    verifyStatus === "Rejected"
                      ? "Explain why document was rejected (e.g. blurred scan, missing page 2, expired date)..."
                      : "Optional internal verification remarks..."
                  }
                  rows={3}
                  className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-sky-500/50"
                  required={verifyStatus === "Rejected"}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVerifyingDoc(null)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingVerify}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium bg-sky-500 hover:bg-sky-400 text-white transition-colors"
                >
                  {isSubmittingVerify ? "Submitting..." : "Confirm Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* University Partner Request Additional Document Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-default)]">
              <h3 className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                Request Additional Document
              </h3>
              <button onClick={() => setShowRequestModal(false)} className="text-[var(--text-secondary)] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1">Document Type Required</label>
                <select
                  value={reqDocType}
                  onChange={(e) => setReqDocType(e.target.value as DocumentType)}
                  className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-amber-500/50"
                >
                  {STANDARD_REQUIRED_DOCS.map((d) => (
                    <option key={d.type} value={d.type}>
                      {d.label}
                    </option>
                  ))}
                  <option value="Other">Other Specific Supplementary File</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1">Reason / Requirement Specifications</label>
                <textarea
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  placeholder="Detail the specific prerequisite or evidence required by the university..."
                  rows={3}
                  className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-amber-500/50"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRequest}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium bg-amber-500 hover:bg-amber-400 text-black transition-colors"
                >
                  {isSubmittingRequest ? "Sending..." : "Dispatch Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
