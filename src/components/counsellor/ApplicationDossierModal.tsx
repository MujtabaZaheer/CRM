import React, { useState, useMemo } from "react";
import { Application, ApplicationStage, ApplicationDocumentRequest, ApplicationScholarship, ApplicationPartnerComment } from "../../types/application";
import { StudentDocument } from "../../pages/Documents";
import { useGlobalData } from "../../contexts/GlobalDataContext";
import { useAuth } from "../../contexts/AuthContext";
import { canUserSetStage, getStageOwnerLabel } from "../../utils/stageAuthorization";
import {
  X,
  User,
  GraduationCap,
  FileText,
  FileCheck,
  Send,
  Award,
  MessageSquare,
  CheckCircle2,
  Eye,
  ArrowRight,
  Globe,
  FileQuestion,
} from "lucide-react";

export interface ApplicationDossierModalProps {
  application: Application;
  onClose: () => void;
  onAdvanceStage?: (app: Application, targetStage: ApplicationStage, note: string) => Promise<void>;
}

type TabType = "profile" | "documents" | "request_docs" | "decision" | "scholarship_comms";

export const ApplicationDossierModal: React.FC<ApplicationDossierModalProps> = ({
  application,
  onClose,
  onAdvanceStage,
}) => {
  const { appUser } = useAuth();
  const {
    students,
    documents,
    updateApplication,
    updateDocument,
  } = useGlobalData();

  const [activeTab, setActiveTab] = useState<TabType>("profile");

  // Advance Stage modal state
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [targetStage, setTargetStage] = useState<ApplicationStage>(application.stage);
  const [stageNote, setStageNote] = useState("");
  const [isAdvancing, setIsAdvancing] = useState(false);

  // Document Request Form State
  const [newReqDocType, setNewReqDocType] = useState("Academic Transcript");
  const [newReqReason, setNewReqReason] = useState("");
  const [newReqDeadline, setNewReqDeadline] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]
  );
  const [isSubmittingDocReq, setIsSubmittingDocReq] = useState(false);

  // Decision & Offer Form State
  const [offerType, setOfferType] = useState<"Conditional Offer" | "Unconditional Offer">(
    application.offerType || "Conditional Offer"
  );
  const [depositAmount, setDepositAmount] = useState<number>(application.depositAmount || 2000);
  const [offerConditions, setOfferConditions] = useState<string>(
    application.offerConditions || "Maintain minimum 3.0 GPA and submit final official transcripts."
  );
  const [offerDeadline, setOfferDeadline] = useState<string>(
    application.offerDeadline || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]
  );
  const [decisionNotes, setDecisionNotes] = useState<string>(application.decisionNotes || "");
  const [isSavingDecision, setIsSavingDecision] = useState(false);

  // Scholarship State
  const [scholarshipName, setScholarshipName] = useState(
    application.scholarshipAwarded?.name || ""
  );
  const [scholarshipAmount, setScholarshipAmount] = useState(
    application.scholarshipAwarded?.amount || ""
  );
  const [scholarshipDesc, setScholarshipDesc] = useState(
    application.scholarshipAwarded?.description || ""
  );
  const [isSavingScholarship, setIsSavingScholarship] = useState(false);

  // Communications Note State
  const [newInternalNote, setNewInternalNote] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Document preview state
  const [previewDoc, setPreviewDoc] = useState<StudentDocument | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Find linked student record
  const student = useMemo(() => {
    return (
      students.find((s) => s.id === application.studentId) ||
      students.find((s) => s.fullName.toLowerCase() === application.studentName.toLowerCase()) ||
      null
    );
  }, [students, application]);

  // Find linked documents for this candidate/application
  const candidateDocuments = useMemo(() => {
    return documents.filter(
      (d) =>
        d.studentId === application.studentId ||
        (d.studentName && d.studentName.toLowerCase() === application.studentName.toLowerCase()) ||
        (d as any).applicationId === application.id
    );
  }, [documents, application]);

  // Source / Agent attribution
  const agentBadgeLabel = useMemo(() => {
    if (application.agentName) return `Agent: ${application.agentName}`;
    if (application.sourceAgentName) return `Agent: ${application.sourceAgentName}`;
    if (student?.agentName) return `Agent: ${student.agentName}`;
    if (application.agentReferred || student?.agentReferred) return "Agent: External Referral";
    return "Agent: Direct Applicant";
  }, [application, student]);

  // Handlers
  const handleToggleDocVerification = async (
    docId: string,
    newStatus: "Verified" | "Rejected" | "Pending"
  ) => {
    updateDocument(docId, { status: newStatus });
    showToast(`Document status updated to ${newStatus}`);
  };

  const handleCreateDocumentRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReqDocType || !newReqReason.trim()) return;

    setIsSubmittingDocReq(true);
    const newRequest: ApplicationDocumentRequest = {
      id: `req_${Date.now()}`,
      docType: newReqDocType,
      reason: newReqReason.trim(),
      deadline: newReqDeadline,
      requestedAt: Date.now(),
      status: "pending",
    };

    const existingReqs = application.requestedDocuments || [];
    const updatedReqs = [...existingReqs, newRequest];

    updateApplication(application.id, {
      requestedDocuments: updatedReqs,
      updatedAt: Date.now(),
    });

    setNewReqReason("");
    setIsSubmittingDocReq(false);
    showToast(`Document request for "${newReqDocType}" dispatched to student.`);
  };

  const handleToggleRequestFulfilled = (requestId: string) => {
    const existingReqs = application.requestedDocuments || [];
    const updatedReqs = existingReqs.map((req) =>
      req.id === requestId
        ? { ...req, status: req.status === "pending" ? ("fulfilled" as const) : ("pending" as const) }
        : req
    );

    updateApplication(application.id, {
      requestedDocuments: updatedReqs,
      updatedAt: Date.now(),
    });
    showToast("Document request status updated.");
  };

  const handleSaveDecision = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDecision(true);

    const updates: Partial<Application> = {
      offerType,
      depositAmount: Number(depositAmount),
      offerConditions,
      offerDeadline,
      decisionNotes,
      stage: offerType === "Unconditional Offer" ? "Unconditional Offer" : "Conditional Offer",
      updatedAt: Date.now(),
    };

    updateApplication(application.id, updates);
    setIsSavingDecision(false);
    showToast(`Official decision saved: ${offerType}`);
  };

  const handleSaveScholarship = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scholarshipName.trim()) return;

    setIsSavingScholarship(true);
    const scholarship: ApplicationScholarship = {
      name: scholarshipName.trim(),
      amount: scholarshipAmount,
      description: scholarshipDesc.trim(),
      awardedDate: Date.now(),
    };

    updateApplication(application.id, {
      scholarshipAwarded: scholarship,
      updatedAt: Date.now(),
    });

    setIsSavingScholarship(false);
    showToast(`Scholarship award recorded: ${scholarshipName}`);
  };

  const handleAddInternalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInternalNote.trim()) return;

    setIsSubmittingNote(true);
    const newComment: ApplicationPartnerComment = {
      id: `comm_${Date.now()}`,
      authorName: appUser?.displayName || appUser?.email || "Counsellor",
      authorRole: appUser?.role || "counsellor",
      isInternal: true,
      text: newInternalNote.trim(),
      createdAt: Date.now(),
    };

    const existingComments = application.partnerComments || [];
    const updatedComments = [...existingComments, newComment];

    updateApplication(application.id, {
      partnerComments: updatedComments,
      updatedAt: Date.now(),
    });

    setNewInternalNote("");
    setIsSubmittingNote(false);
    showToast("Internal communication note posted.");
  };

  const handleAdvanceStageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUserSetStage("counsellor", targetStage)) {
      const owner = getStageOwnerLabel(targetStage);
      alert(`Permission Denied: Only ${owner} is authorized to transition applications to "${targetStage}".`);
      return;
    }

    setIsAdvancing(true);
    if (onAdvanceStage) {
      await onAdvanceStage(application, targetStage, stageNote);
    } else {
      const historyItem = {
        stage: targetStage,
        updatedBy: appUser?.email || "Counsellor",
        timestamp: Date.now(),
        note: stageNote || `Stage progressed to ${targetStage}`,
      };
      updateApplication(application.id, {
        stage: targetStage,
        history: [...(application.history || []), historyItem],
        updatedAt: Date.now(),
      });
    }
    setIsAdvancing(false);
    setShowAdvanceModal(false);
    showToast(`Application advanced to "${targetStage}" successfully.`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-modal w-full max-w-5xl my-auto shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-emerald-500 text-zinc-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-default)] bg-[var(--bg-elevated)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold font-heading text-[var(--text-primary)]">
                {application.studentName}
              </h2>
              <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 sq-badge font-mono text-xs font-bold">
                {application.applicationNumber || application.id}
              </span>
              <span
                className={`px-2 py-0.5 sq-badge text-xs font-semibold ${
                  agentBadgeLabel.includes("Direct")
                    ? "bg-zinc-800 text-zinc-300 border border-zinc-700"
                    : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {agentBadgeLabel}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] flex items-center space-x-2">
              <span>{application.programmeName}</span>
              <span>•</span>
              <span className="font-semibold text-[var(--text-secondary)]">{application.universityName}</span>
              <span>•</span>
              <span className="font-mono text-teal-400">{application.intake}</span>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-default)] transition-colors"
              title="Close Dossier"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 sm:px-6 border-b border-[var(--border-default)] bg-[var(--bg-card)] flex items-center space-x-2 sm:space-x-4 overflow-x-auto flex-shrink-0 text-xs">
          <button
            onClick={() => setActiveTab("profile")}
            className={`py-3 px-2 border-b-2 font-semibold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === "profile"
                ? "border-sky-500 text-sky-400"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Academics</span>
          </button>

          <button
            onClick={() => setActiveTab("documents")}
            className={`py-3 px-2 border-b-2 font-semibold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === "documents"
                ? "border-sky-500 text-sky-400"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Dossier Documents ({candidateDocuments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("request_docs")}
            className={`py-3 px-2 border-b-2 font-semibold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === "request_docs"
                ? "border-sky-500 text-sky-400"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <FileQuestion className="w-3.5 h-3.5" />
            <span>
              Request Documents
              {application.requestedDocuments && application.requestedDocuments.length > 0
                ? ` (${application.requestedDocuments.filter((r) => r.status === "pending").length})`
                : ""}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("decision")}
            className={`py-3 px-2 border-b-2 font-semibold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === "decision"
                ? "border-sky-500 text-sky-400"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Official Decision & Offer</span>
          </button>

          <button
            onClick={() => setActiveTab("scholarship_comms")}
            className={`py-3 px-2 border-b-2 font-semibold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === "scholarship_comms"
                ? "border-sky-500 text-sky-400"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Award Scholarship & Comms</span>
          </button>
        </div>

        {/* Modal Body / Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* TAB 1: Profile & Academics */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              {/* Candidate Personal Details Card */}
              <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card p-4 sm:p-5 space-y-4">
                <div className="flex items-center space-x-2 text-sky-400 font-bold border-b border-[var(--border-default)] pb-2">
                  <User className="w-4 h-4" />
                  <h3 className="text-sm font-heading">Candidate Personal Details</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase">Full Legal Name</span>
                    <div className="font-semibold text-[var(--text-primary)]">
                      {student?.fullName || application.studentName}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase">Email Address</span>
                    <div className="font-semibold text-[var(--text-primary)]">
                      {student?.email || application.studentEmail || "Not provided"}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase">Contact Phone</span>
                    <div className="font-semibold text-[var(--text-primary)]">
                      {student?.phone || "Not provided"}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase">Nationality</span>
                    <div className="font-semibold text-[var(--text-primary)]">
                      {student?.nationality || "Not specified"}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase">Country of Residence</span>
                    <div className="font-semibold text-[var(--text-primary)]">
                      {student?.countryOfResidence || "Not specified"}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase">Date of Birth</span>
                    <div className="font-semibold text-[var(--text-primary)]">
                      {student?.dob || "Not specified"}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase">Passport Number</span>
                    <div className="font-mono font-bold text-teal-400">
                      {student?.passportNumber || "Pending verification"}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase">Passport Expiry</span>
                    <div className="font-mono text-[var(--text-secondary)]">
                      {student?.passportExpiry || "N/A"}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase">Emergency Contact</span>
                    <div className="font-semibold text-[var(--text-primary)]">
                      {application.emergencyContact?.name
                        ? `${application.emergencyContact.name} (${application.emergencyContact.relation || "Kin"})`
                        : "Not specified"}
                    </div>
                  </div>
                </div>
              </div>

              {/* English Language Proficiency Card */}
              <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
                  <div className="flex items-center space-x-2 text-teal-400 font-bold">
                    <Globe className="w-4 h-4" />
                    <h3 className="text-sm font-heading">English Language Proficiency</h3>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-teal-400">
                    {student?.englishProficiency?.testType || application.englishProficiency?.testType || "IELTS"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase">Standardized Test</span>
                    <div className="font-semibold text-[var(--text-primary)]">
                      {student?.englishProficiency?.testType || application.englishProficiency?.testType || "IELTS Academic"}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase">Overall Band / Score</span>
                    <div className="font-mono font-bold text-emerald-400 text-sm">
                      {student?.englishProficiency?.overallScore || application.englishProficiency?.overallScore || "7.0 Overall"}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase">TRF / Reference #</span>
                    <div className="font-mono text-[var(--text-secondary)]">
                      {(student?.englishProficiency as any)?.trfNumber || application.englishProficiency?.trfNumber || "TRF-2026-UKVI-88"}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase">Test Date</span>
                    <div className="text-[var(--text-secondary)]">
                      {(student?.englishProficiency as any)?.testDate || application.englishProficiency?.testDate || "2025-11-14"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Prior Academic Qualifications Card */}
              <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card p-4 sm:p-5 space-y-4">
                <div className="flex items-center space-x-2 text-sky-400 font-bold border-b border-[var(--border-default)] pb-2">
                  <GraduationCap className="w-4 h-4" />
                  <h3 className="text-sm font-heading">Prior Academic Qualifications</h3>
                </div>

                {((student?.academicHistory && student.academicHistory.length > 0) ||
                  (application.academicHistory && application.academicHistory.length > 0)) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(student?.academicHistory || application.academicHistory || []).map((acad, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[var(--text-primary)]">
                            {acad.degreeTitle || acad.qualification}
                          </span>
                          <span className="font-mono font-bold text-emerald-400">
                            {acad.gradeGpa || acad.score || "3.7 GPA"}
                          </span>
                        </div>
                        <div className="text-[11px] text-sky-400">{acad.institution}</div>
                        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-default)]">
                          <span>Country: {acad.country || "International"}</span>
                          <span>Passed: {acad.completionYear || acad.passingYear || "2023"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card text-center text-[var(--text-muted)]">
                    No academic records explicitly logged. Academic certificates available in Dossier Documents tab.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Dossier Documents */}
          {activeTab === "documents" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold font-heading text-[var(--text-primary)]">
                    Candidate Document Dossier
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Review candidate files, preview documents inline, and toggle verification flags.
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-[var(--text-muted)]">Total Uploads:</span>
                  <span className="font-mono font-bold text-sky-400">{candidateDocuments.length}</span>
                </div>
              </div>

              {candidateDocuments.length === 0 ? (
                <div className="p-8 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card text-center space-y-2">
                  <FileText className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
                  <p className="font-semibold text-[var(--text-primary)]">No documents uploaded yet.</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Use the "Request Documents" tab to trigger missing requirements from the student.
                  </p>
                </div>
              ) : (
                <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--bg-card)] border-b border-[var(--border-default)] text-[10px] text-[var(--text-muted)] uppercase">
                      <tr>
                        <th className="px-4 py-3">Document Category</th>
                        <th className="px-4 py-3">File Name</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Uploaded</th>
                        <th className="px-4 py-3 text-right">Verification & Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-default)]">
                      {candidateDocuments.map((doc) => (
                        <tr key={doc.id} className="hover:bg-[var(--bg-card)] transition-colors">
                          <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                            {doc.docType}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-sky-400 flex items-center space-x-1.5">
                              <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate max-w-[200px]">{doc.fileName}</span>
                            </div>
                            {doc.remarks && (
                              <div className="text-[10px] text-amber-400 italic">{doc.remarks}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 sq-badge text-[10px] font-semibold ${
                                doc.status === "Verified"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : doc.status === "Rejected"
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}
                            >
                              {doc.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[10px] text-[var(--text-muted)]">
                            {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "Uploaded"}
                          </td>
                          <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => setPreviewDoc(doc)}
                              className="px-2 py-1 bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-default)] sq-btn text-xs inline-flex items-center space-x-1"
                            >
                              <Eye className="w-3 h-3 text-sky-400" />
                              <span>Preview</span>
                            </button>

                            <button
                              onClick={() =>
                                handleToggleDocVerification(
                                  doc.id,
                                  doc.status === "Verified" ? "Pending" : "Verified"
                                )
                              }
                              className={`px-2 py-1 sq-btn text-xs font-semibold ${
                                doc.status === "Verified"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-emerald-500 text-zinc-950 font-bold"
                              }`}
                            >
                              {doc.status === "Verified" ? "Verified ✓" : "Mark Verified"}
                            </button>

                            <button
                              onClick={() => handleToggleDocVerification(doc.id, "Rejected")}
                              className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 sq-btn text-xs"
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Request Documents */}
          {activeTab === "request_docs" && (
            <div className="space-y-6">
              {/* Request Form */}
              <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card p-4 sm:p-5 space-y-4">
                <div className="flex items-center space-x-2 text-sky-400 font-bold border-b border-[var(--border-default)] pb-2">
                  <FileQuestion className="w-4 h-4" />
                  <h3 className="text-sm font-heading">Trigger Missing Document Request</h3>
                </div>

                <form onSubmit={handleCreateDocumentRequest} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1 font-semibold">
                        Document Requirement *
                      </label>
                      <select
                        value={newReqDocType}
                        onChange={(e) => setNewReqDocType(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none"
                      >
                        <option value="Academic Transcript">Academic Transcript (Semesters 1-8)</option>
                        <option value="Degree Certificate">Final Degree Certificate / Provisional Award</option>
                        <option value="Passport Bio Page">Passport Bio Page (Valid 6+ months)</option>
                        <option value="IELTS / English Test">English Language Proficiency Certificate</option>
                        <option value="Statement of Purpose">Statement of Purpose / Personal Statement</option>
                        <option value="Academic Reference Letter">Academic Reference Letter (Letterhead signed)</option>
                        <option value="Bank Statement / Proof of Funds">Bank Financial Statement / Proof of Funds</option>
                        <option value="Curriculum Vitae / Resume">Updated Academic Curriculum Vitae (CV)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1 font-semibold">
                        Submission Deadline *
                      </label>
                      <input
                        type="date"
                        value={newReqDeadline}
                        onChange={(e) => setNewReqDeadline(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1 font-semibold">
                      Reason & Instructions for Student *
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="e.g. Scanned copy is illegible or missing back page. Please re-upload in high resolution PDF."
                      value={newReqReason}
                      onChange={(e) => setNewReqReason(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingDocReq}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold sq-btn text-xs inline-flex items-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Document Request to Student Portal</span>
                  </button>
                </form>
              </div>

              {/* Outstanding Document Requests List */}
              <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card p-4 sm:p-5 space-y-3">
                <h3 className="text-sm font-bold font-heading text-[var(--text-primary)]">
                  Active & Fulfilled Document Requests
                </h3>

                {(!application.requestedDocuments || application.requestedDocuments.length === 0) ? (
                  <p className="text-xs text-[var(--text-muted)] italic">
                    No document requests currently pending for this candidate.
                  </p>
                ) : (
                  <div className="divide-y divide-[var(--border-default)]">
                    {application.requestedDocuments.map((req) => (
                      <div key={req.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-[var(--text-primary)]">{req.docType}</span>
                            <span
                              className={`px-2 py-0.5 sq-badge text-[10px] font-semibold ${
                                req.status === "fulfilled"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}
                            >
                              {req.status === "fulfilled" ? "Fulfilled" : "Pending Upload"}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--text-secondary)]">{req.reason}</p>
                          <div className="text-[10px] text-[var(--text-muted)]">
                            Deadline: {req.deadline} • Requested on{" "}
                            {new Date(req.requestedAt).toLocaleDateString()}
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleRequestFulfilled(req.id)}
                          className={`px-3 py-1.5 sq-btn text-xs font-semibold whitespace-nowrap ${
                            req.status === "fulfilled"
                              ? "bg-[var(--bg-card)] border border-[var(--border-default)] text-[var(--text-secondary)]"
                              : "bg-emerald-500 text-zinc-950 font-bold"
                          }`}
                        >
                          {req.status === "fulfilled" ? "Re-open" : "Mark Received"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Official Decision & Offer */}
          {activeTab === "decision" && (
            <div className="space-y-6">
              <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card p-4 sm:p-5 space-y-4">
                <div className="flex items-center space-x-2 text-teal-400 font-bold border-b border-[var(--border-default)] pb-2">
                  <FileCheck className="w-4 h-4" />
                  <h3 className="text-sm font-heading">Log University Decision & Offer Letter</h3>
                </div>

                <form onSubmit={handleSaveDecision} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1 font-semibold">
                        Official Decision Type *
                      </label>
                      <select
                        value={offerType}
                        onChange={(e) => setOfferType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none"
                      >
                        <option value="Conditional Offer">Conditional Offer Letter Issued</option>
                        <option value="Unconditional Offer">Unconditional Offer Letter Issued</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1 font-semibold">
                        Tuition Deposit Requirement ($ / £) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1 font-semibold">
                        Offer Acceptance Deadline *
                      </label>
                      <input
                        type="date"
                        value={offerDeadline}
                        onChange={(e) => setOfferDeadline(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1 font-semibold">
                        Conditional Requirements (if applicable)
                      </label>
                      <input
                        type="text"
                        value={offerConditions}
                        onChange={(e) => setOfferConditions(e.target.value)}
                        placeholder="e.g. Provide original degree certificate & passport scan"
                        className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1 font-semibold">
                      Admissions Officer / Decision Notes
                    </label>
                    <textarea
                      rows={3}
                      value={decisionNotes}
                      onChange={(e) => setDecisionNotes(e.target.value)}
                      placeholder="Log formal university notes or conditional terms..."
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingDecision}
                    className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold sq-btn text-xs inline-flex items-center space-x-1.5"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Save Official Decision & Update Stage</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 5: Award Scholarship & Communications */}
          {activeTab === "scholarship_comms" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Award Scholarship Card */}
              <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card p-4 sm:p-5 space-y-4">
                <div className="flex items-center space-x-2 text-amber-400 font-bold border-b border-[var(--border-default)] pb-2">
                  <Award className="w-4 h-4" />
                  <h3 className="text-sm font-heading">Award Institutional Scholarship</h3>
                </div>

                <form onSubmit={handleSaveScholarship} className="space-y-3">
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1 font-semibold">
                      Scholarship Award Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vice-Chancellor's International Merit Scholarship"
                      value={scholarshipName}
                      onChange={(e) => setScholarshipName(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1 font-semibold">
                      Amount Awarded (£ / $ / %) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. £3,500 or 25% Tuition Fee Waiver"
                      value={scholarshipAmount}
                      onChange={(e) => setScholarshipAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1 font-semibold">
                      Criteria & Award Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Based on academic distinction (3.8+ GPA) and early acceptance."
                      value={scholarshipDesc}
                      onChange={(e) => setScholarshipDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingScholarship}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold sq-btn text-xs inline-flex items-center space-x-1.5"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Log Scholarship Award</span>
                  </button>
                </form>
              </div>

              {/* Internal Notes & Communications Card */}
              <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card p-4 sm:p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-sky-400 font-bold border-b border-[var(--border-default)] pb-2 mb-3">
                    <MessageSquare className="w-4 h-4" />
                    <h3 className="text-sm font-heading">Internal Staff Communications</h3>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {(!application.partnerComments || application.partnerComments.length === 0) ? (
                      <p className="text-xs text-[var(--text-muted)] italic">
                        No internal notes recorded yet for this application.
                      </p>
                    ) : (
                      application.partnerComments.map((note) => (
                        <div
                          key={note.id}
                          className="p-2.5 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-[var(--text-primary)]">
                              {note.authorName} ({note.authorRole})
                            </span>
                            <span className="text-[var(--text-muted)]">
                              {new Date(note.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)]">{note.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <form onSubmit={handleAddInternalNote} className="space-y-2 pt-2 border-t border-[var(--border-default)]">
                  <textarea
                    rows={2}
                    required
                    placeholder="Add an internal note or communication with Admissions/Agent..."
                    value={newInternalNote}
                    onChange={(e) => setNewInternalNote(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none resize-none"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingNote}
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold sq-btn text-xs inline-flex items-center space-x-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>Post Internal Note</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className="p-4 sm:p-5 border-t border-[var(--border-default)] bg-[var(--bg-elevated)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-xs text-[var(--text-muted)]">Lifecycle Stage:</span>
            <span className="px-3 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 sq-badge text-xs font-bold">
              {application.stage}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-default)] sq-btn text-xs"
            >
              Close Dossier
            </button>

            <button
              onClick={() => {
                setTargetStage(application.stage);
                setShowAdvanceModal(true);
              }}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold sq-btn text-xs shadow-md shadow-sky-500/20 inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Advance Stage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Modal: Advance Stage Confirmation */}
        {showAdvanceModal && (
          <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-modal w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                <h3 className="text-base font-bold font-heading text-[var(--text-primary)]">
                  Advance Stage: {application.applicationNumber}
                </h3>
                <button
                  onClick={() => setShowAdvanceModal(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAdvanceStageSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-semibold">
                    Target Milestone *
                  </label>
                  <select
                    value={targetStage}
                    onChange={(e) => setTargetStage(e.target.value as ApplicationStage)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    {[
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
                    ].map((stg) => (
                      <option key={stg} value={stg}>
                        {stg}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-semibold">
                    Progression Note / Comment
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Explain milestone verification..."
                    value={stageNote}
                    onChange={(e) => setStageNote(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[var(--border-default)]">
                  <button
                    type="button"
                    onClick={() => setShowAdvanceModal(false)}
                    className="px-4 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-default)] sq-btn text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdvancing}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold sq-btn text-xs"
                  >
                    {isAdvancing ? "Updating..." : "Confirm Stage"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Document Preview */}
        {previewDoc && (
          <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-modal w-full max-w-lg p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-sky-400" />
                  <h3 className="text-base font-bold font-heading text-[var(--text-primary)] truncate max-w-xs">
                    {previewDoc.fileName}
                  </h3>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card flex flex-col items-center justify-center text-center space-y-3">
                <FileCheck className="w-12 h-12 text-emerald-400 opacity-80" />
                <div className="space-y-1">
                  <div className="font-bold text-[var(--text-primary)] text-sm">{previewDoc.fileName}</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Type: {previewDoc.docType} • Status: {previewDoc.status}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)]">
                    Uploaded by: {previewDoc.uploadedBy}
                  </div>
                </div>
                <span className="px-3 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 sq-badge text-xs font-mono">
                  Verified Official Document Scan
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[var(--border-default)]">
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-default)] sq-btn text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationDossierModal;
