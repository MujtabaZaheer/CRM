import React, { useState, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useGlobalData } from "../../contexts/GlobalDataContext";
import { useAdmissionsData } from "../../hooks/useAdmissionsData";
import { StudentDocument } from "../../pages/Documents";
import { Application, ApplicationStage } from "../../types/application";
import { Student } from "../../types/student";
import {
  FolderOpen,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FileCheck,
  Eye,
  Download,
  Send,
  X,
  GraduationCap,
  ShieldCheck,
  ChevronRight,
  Filter,
  Check,
} from "lucide-react";
import { logAuditEvent } from "../../utils/auditLogger";

const ADMISSIONS_STAGES: ApplicationStage[] = [
  "Ready for Submission",
  "Submitted",
  "CAS / COE Pending",
  "Deposit Paid",
];

type DocumentCategory =
  | "Identity / Passport"
  | "Academic Credentials"
  | "English / Standardized Tests"
  | "Financial / Compliance";

interface FlagIssueModalState {
  docId: string;
  docTitle: string;
  category: "Blurry" | "Missing Page" | "Expired" | "Not Attested" | "Name Mismatch" | "Other";
  comment: string;
}

export const AdmissionsDocumentVerificationHub: React.FC = () => {
  const { appUser } = useAuth();
  const { applications, students, documents } = useGlobalData();
  const { updateStage, verifyDocument } = useAdmissionsData();

  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("All Admissions Stages");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Per-doc flagging modal
  const [flagModal, setFlagModal] = useState<FlagIssueModalState | null>(null);
  const [previewDoc, setPreviewDoc] = useState<StudentDocument | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const showToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Find applications requiring admissions oversight
  const admissionsApplications = useMemo(() => {
    return applications.filter((app) => {
      // Must not be an unvetted agent referral
      if (app.agentReferred && app.admissionsVisibility === false) return false;
      return true;
    });
  }, [applications]);

  // Aggregate unique students who have applications in admissions stages
  const studentQueue = useMemo(() => {
    const map = new Map<
      string,
      {
        student: Student | null;
        studentId: string;
        studentName: string;
        application: Application;
        allDocs: StudentDocument[];
        verifiedCount: number;
        flaggedCount: number;
        pendingCount: number;
      }
    >();

    admissionsApplications.forEach((app) => {
      // Check if matches stage filter
      const matchesStage =
        stageFilter === "All Admissions Stages"
          ? ADMISSIONS_STAGES.includes(app.stage) ||
            app.stage === "Initial Review" ||
            app.stage === "University Reviewing"
          : app.stage === stageFilter;

      if (!matchesStage) return;

      const sId = app.studentId || app.id;
      const sRecord =
        students.find((s) => s.id === app.studentId) ||
        students.find((s) => s.fullName.toLowerCase() === app.studentName.toLowerCase()) ||
        null;

      const studentDocs = documents.filter(
        (d) =>
          d.studentId === app.studentId ||
          (d.studentName && d.studentName.toLowerCase() === app.studentName.toLowerCase()) ||
          (d as any).applicationId === app.id
      );

      const verified = studentDocs.filter((d) => d.status === "Verified").length;
      const flagged = studentDocs.filter((d) => d.status === "Rejected").length;
      const pending = studentDocs.filter((d) => d.status === "Pending" || d.status === "Received").length;

      // Keep only one primary application entry per student
      if (!map.has(sId)) {
        map.set(sId, {
          student: sRecord,
          studentId: sId,
          studentName: app.studentName,
          application: app,
          allDocs: studentDocs,
          verifiedCount: verified,
          flaggedCount: flagged,
          pendingCount: pending,
        });
      }
    });

    return Array.from(map.values());
  }, [admissionsApplications, stageFilter, students, documents]);

  // Search filter on the left queue
  const filteredStudentQueue = useMemo(() => {
    if (!studentSearchQuery.trim()) return studentQueue;
    const q = studentSearchQuery.toLowerCase();
    return studentQueue.filter(
      (item) =>
        item.studentName.toLowerCase().includes(q) ||
        item.application.applicationNumber?.toLowerCase().includes(q) ||
        item.application.universityName?.toLowerCase().includes(q) ||
        item.application.programmeName?.toLowerCase().includes(q)
    );
  }, [studentQueue, studentSearchQuery]);

  // Default selection to first student in list if none selected
  const activeSelectedStudentId = useMemo(() => {
    if (selectedStudentId && filteredStudentQueue.some((i) => i.studentId === selectedStudentId)) {
      return selectedStudentId;
    }
    return filteredStudentQueue[0]?.studentId || null;
  }, [selectedStudentId, filteredStudentQueue]);

  // Current selected student item
  const selectedItem = useMemo(() => {
    return filteredStudentQueue.find((i) => i.studentId === activeSelectedStudentId) || null;
  }, [filteredStudentQueue, activeSelectedStudentId]);

  // Categorize documents for the selected student
  const categorizedDocs = useMemo(() => {
    const categories: Record<DocumentCategory, StudentDocument[]> = {
      "Identity / Passport": [],
      "Academic Credentials": [],
      "English / Standardized Tests": [],
      "Financial / Compliance": [],
    };

    if (!selectedItem) return categories;

    // Refresh docs from source documents context
    const studentDocs = documents.filter(
      (d) =>
        d.studentId === selectedItem.studentId ||
        (d.studentName && d.studentName.toLowerCase() === selectedItem.studentName.toLowerCase()) ||
        (d as any).applicationId === selectedItem.application.id
    );

    studentDocs.forEach((doc) => {
      const type = (doc.docType || "").toLowerCase();
      const fileName = (doc.fileName || "").toLowerCase();

      if (
        type.includes("passport") ||
        type.includes("id") ||
        type.includes("photo") ||
        fileName.includes("passport") ||
        fileName.includes("bio")
      ) {
        categories["Identity / Passport"].push(doc);
      } else if (
        type.includes("transcript") ||
        type.includes("degree") ||
        type.includes("certificate") ||
        type.includes("cv") ||
        type.includes("resume") ||
        type.includes("statement") ||
        fileName.includes("transcript") ||
        fileName.includes("degree") ||
        fileName.includes("sop")
      ) {
        categories["Academic Credentials"].push(doc);
      } else if (
        type.includes("english") ||
        type.includes("ielts") ||
        type.includes("toefl") ||
        type.includes("pte") ||
        type.includes("duolingo") ||
        fileName.includes("ielts") ||
        fileName.includes("toefl") ||
        fileName.includes("pte")
      ) {
        categories["English / Standardized Tests"].push(doc);
      } else {
        categories["Financial / Compliance"].push(doc);
      }
    });

    return categories;
  }, [selectedItem, documents]);

  // Total and status counts for the selected student
  const selectedDocsFlat = useMemo(() => {
    return Object.values(categorizedDocs).flat();
  }, [categorizedDocs]);

  const allMandatoryVerified = useMemo(() => {
    if (selectedDocsFlat.length === 0) return false;
    const hasFlagged = selectedDocsFlat.some((d) => d.status === "Rejected");
    const hasUnverified = selectedDocsFlat.some((d) => d.status !== "Verified");
    return !hasFlagged && !hasUnverified;
  }, [selectedDocsFlat]);

  // Actions
  const handleMarkVerified = async (docId: string) => {
    await verifyDocument(docId, "Verified", "Admissions verification passed and verified.");
    showToast("Document verified successfully.");
  };

  const handleOpenFlagModal = (docItem: StudentDocument) => {
    setFlagModal({
      docId: docItem.id,
      docTitle: docItem.fileName,
      category: "Blurry",
      comment: "",
    });
  };

  const handleConfirmFlagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flagModal) return;

    const feedback = `[Flagged Issue: ${flagModal.category}] ${flagModal.comment.trim()}`;
    await verifyDocument(flagModal.docId, "Rejected", feedback);
    showToast(`Document flagged: ${flagModal.category}`);
    setFlagModal(null);
  };

  // Batch Action: Sign-off all documents
  const handleSignOffAllDocuments = async () => {
    if (!selectedItem) return;
    setIsProcessing(true);

    try {
      for (const d of selectedDocsFlat) {
        if (d.status !== "Verified") {
          await verifyDocument(d.id, "Verified", "Admissions Officer bulk verification sign-off.");
        }
      }

      await logAuditEvent(
        "ADMISSIONS_ALL_DOCUMENTS_SIGNED_OFF",
        appUser?.email || "Admissions Officer",
        "Student",
        `Signed off and verified all ${selectedDocsFlat.length} dossier documents for ${selectedItem.studentName}`,
        selectedItem.studentId,
        appUser?.role
      );

      showToast(`All ${selectedDocsFlat.length} documents signed off and verified!`);
    } catch (err) {
      console.error("Sign-off failed:", err);
      alert("Failed to sign off all documents.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Batch Action: Download Full Dossier (ZIP)
  const handleDownloadFullDossier = () => {
    if (!selectedItem) return;

    // Simulate dossier bundle creation
    const manifest = {
      candidateName: selectedItem.studentName,
      reference: selectedItem.application.applicationNumber,
      university: selectedItem.application.universityName,
      programme: selectedItem.application.programmeName,
      intake: selectedItem.application.intake,
      generatedAt: new Date().toISOString(),
      officerSignOff: appUser?.displayName || appUser?.email || "Admissions Officer",
      verifiedDocuments: selectedDocsFlat.map((d) => ({
        fileName: d.fileName,
        type: d.docType,
        status: d.status,
        remarks: d.remarks || "Verified compliant",
      })),
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Dossier_Bundle_${selectedItem.application.applicationNumber}_${selectedItem.studentName.replace(/\s+/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Dossier package bundle generated for ${selectedItem.studentName}`);
  };

  // Batch Action: Advance to Submitted
  const handleAdvanceToSubmitted = async () => {
    if (!selectedItem) return;
    if (!allMandatoryVerified) {
      alert("Cannot advance: All mandatory documents must be marked 'Verified' first.");
      return;
    }

    setIsProcessing(true);
    try {
      await updateStage(
        selectedItem.application,
        "Submitted",
        "All candidate documents verified by Admissions Desk. Application ready for university lodgment."
      );
      showToast(`Application ${selectedItem.application.applicationNumber} advanced to "Submitted"!`);
    } catch (err) {
      console.error("Failed to advance stage:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {successToast && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 sq-card text-emerald-400 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-400/80 hover:text-emerald-300">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 sq-badge bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admissions Officer Workspace</span>
          </div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">
            Student Document Verification Hub
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-2xl">
            Student-by-student verification workspace. Inspect uploaded dossiers across identity, academic, English, and compliance categories, flag defects, and sign off for direct university lodgment.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-[var(--bg-card)] border border-[var(--border-default)] px-3 py-1.5 sq-card text-xs">
            <span className="text-[var(--text-muted)]">Active Queue:</span>
            <span className="font-mono font-bold text-emerald-400">{studentQueue.length} candidates</span>
          </div>
        </div>
      </div>

      {/* Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[650px]">
        {/* LEFT PANEL: Student Queue */}
        <div className="lg:col-span-4 space-y-3 flex flex-col">
          {/* Queue Filters */}
          <div className="p-3 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search candidate, app #..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="flex items-center space-x-1.5 text-xs">
              <Filter className="w-3 h-3 text-[var(--text-muted)] flex-shrink-0" />
              <select
                aria-label="Filter Queue by Stage"
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="w-full px-2 py-1 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none"
              >
                <option value="All Admissions Stages">All Admissions Stages</option>
                {ADMISSIONS_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Student Cards List */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-card overflow-y-auto max-h-[580px] divide-y divide-[var(--border-default)] flex-1">
            {filteredStudentQueue.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] space-y-2">
                <FolderOpen className="w-8 h-8 mx-auto opacity-40" />
                <p>No candidates currently in the verification queue matching filters.</p>
              </div>
            ) : (
              filteredStudentQueue.map((item) => {
                const isSelected = item.studentId === activeSelectedStudentId;
                const totalDocs = item.allDocs.length;
                const isComplete = totalDocs > 0 && item.verifiedCount === totalDocs;

                return (
                  <div
                    key={item.studentId}
                    onClick={() => setSelectedStudentId(item.studentId)}
                    className={`p-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-emerald-500/10 border-l-4 border-l-emerald-500"
                        : "hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="font-bold text-xs text-[var(--text-primary)] flex items-center space-x-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                          <span>{item.studentName}</span>
                        </div>
                        <div className="text-[11px] font-mono text-emerald-400">
                          {item.application.applicationNumber}
                        </div>
                      </div>

                      <span className="px-2 py-0.5 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-badge text-[10px] font-medium text-[var(--text-secondary)]">
                        {item.application.stage}
                      </span>
                    </div>

                    <div className="text-[11px] text-[var(--text-muted)] mt-1.5 truncate">
                      {item.application.universityName} • {item.application.intake}
                    </div>

                    {/* Completion Pill */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border-default)] text-[10px]">
                      <span
                        className={`px-2 py-0.5 sq-badge font-mono font-bold ${
                          isComplete
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : totalDocs > 0
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                        }`}
                      >
                        {totalDocs > 0 ? `${item.verifiedCount}/${totalDocs} Verified` : "No docs"}
                      </span>

                      {item.flaggedCount > 0 && (
                        <span className="px-1.5 py-0.5 sq-badge bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold">
                          {item.flaggedCount} Flagged
                        </span>
                      )}

                      <ChevronRight
                        className={`w-3.5 h-3.5 ${
                          isSelected ? "text-emerald-400" : "text-[var(--text-muted)]"
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Selected Student's Verification Dossier */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          {!selectedItem ? (
            <div className="p-12 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card flex flex-col items-center justify-center text-center space-y-3 flex-1">
              <FolderOpen className="w-12 h-12 text-[var(--text-muted)] opacity-30" />
              <div className="space-y-1">
                <h3 className="text-base font-bold font-heading text-[var(--text-primary)]">
                  Select a Candidate to Inspect Dossier
                </h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm">
                  Choose a student from the left queue to verify academic certificates, test scores, and compliance documents.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Batch Action Toolbar */}
              <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-bold font-heading text-[var(--text-primary)]">
                      {selectedItem.studentName}
                    </h2>
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      ({selectedItem.application.applicationNumber})
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    {selectedItem.application.programmeName} • {selectedItem.application.universityName}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleSignOffAllDocuments}
                    disabled={isProcessing || selectedDocsFlat.length === 0}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold sq-btn text-xs inline-flex items-center space-x-1.5 shadow-sm shadow-emerald-500/20"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Sign-off All Documents</span>
                  </button>

                  <button
                    onClick={handleDownloadFullDossier}
                    disabled={selectedDocsFlat.length === 0}
                    className="px-3 py-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-default)] sq-btn text-xs inline-flex items-center space-x-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-400" />
                    <span>Download Full Dossier (ZIP)</span>
                  </button>

                  <button
                    onClick={handleAdvanceToSubmitted}
                    disabled={!allMandatoryVerified || isProcessing}
                    title={
                      !allMandatoryVerified
                        ? "Verify all mandatory documents before advancing to Submitted"
                        : "Advance application to Submitted"
                    }
                    className={`px-3 py-1.5 sq-btn text-xs font-bold inline-flex items-center space-x-1.5 ${
                      allMandatoryVerified
                        ? "bg-teal-500 hover:bg-teal-400 text-zinc-950 shadow-sm shadow-teal-500/20 cursor-pointer"
                        : "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed opacity-60"
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Advance to Submitted</span>
                  </button>
                </div>
              </div>

              {/* Categorized Document Groups */}
              <div className="space-y-4 flex-1 overflow-y-auto max-h-[580px] pr-1">
                {(
                  [
                    "Identity / Passport",
                    "Academic Credentials",
                    "English / Standardized Tests",
                    "Financial / Compliance",
                  ] as DocumentCategory[]
                ).map((category) => {
                  const docsInCat = categorizedDocs[category] || [];

                  return (
                    <div
                      key={category}
                      className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-card overflow-hidden"
                    >
                      <div className="p-3 bg-[var(--bg-elevated)] border-b border-[var(--border-default)] flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-sky-400" />
                          <h3 className="font-bold text-xs font-heading text-[var(--text-primary)]">
                            {category}
                          </h3>
                        </div>
                        <span className="text-[11px] font-mono text-[var(--text-muted)]">
                          {docsInCat.length} files
                        </span>
                      </div>

                      {docsInCat.length === 0 ? (
                        <div className="p-4 text-center text-xs text-[var(--text-muted)] italic">
                          No documents uploaded under {category}.
                        </div>
                      ) : (
                        <div className="divide-y divide-[var(--border-default)] text-xs">
                          {docsInCat.map((d) => (
                            <div
                              key={d.id}
                              className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--bg-hover)] transition-colors"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-semibold text-[var(--text-primary)]">
                                    {d.fileName}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 sq-badge text-[10px] font-semibold ${
                                      d.status === "Verified"
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                        : d.status === "Rejected"
                                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    }`}
                                  >
                                    {d.status}
                                  </span>
                                </div>
                                <div className="text-[11px] text-[var(--text-muted)]">
                                  Type: {d.docType} • Uploaded by {d.uploadedBy || "Student"} on{" "}
                                  {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "Recent"}
                                </div>
                                {d.remarks && (
                                  <div className="text-[11px] text-amber-400 italic bg-amber-500/5 p-1 rounded border border-amber-500/15">
                                    Note: {d.remarks}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center space-x-2 whitespace-nowrap">
                                <button
                                  onClick={() => setPreviewDoc(d)}
                                  className="px-2.5 py-1 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-default)] sq-btn text-xs inline-flex items-center space-x-1"
                                >
                                  <Eye className="w-3 h-3 text-sky-400" />
                                  <span>Preview</span>
                                </button>

                                <button
                                  onClick={() => handleMarkVerified(d.id)}
                                  className={`px-2.5 py-1 sq-btn text-xs font-bold inline-flex items-center space-x-1 ${
                                    d.status === "Verified"
                                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                      : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
                                  }`}
                                >
                                  <Check className="w-3 h-3" />
                                  <span>{d.status === "Verified" ? "Verified" : "Mark Verified"}</span>
                                </button>

                                <button
                                  onClick={() => handleOpenFlagModal(d)}
                                  className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 sq-btn text-xs font-semibold inline-flex items-center space-x-1"
                                >
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Flag Issue / Reject</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL: Flag Issue / Reject Document */}
      {flagModal && (
        <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-modal w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center space-x-2 text-rose-400">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <h3 className="text-base font-bold font-heading text-[var(--text-primary)]">
                  Flag Document Issue
                </h3>
              </div>
              <button
                onClick={() => setFlagModal(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card space-y-1 text-xs">
              <span className="text-[var(--text-muted)]">Target Document:</span>
              <div className="font-bold text-[var(--text-primary)]">{flagModal.docTitle}</div>
            </div>

            <form onSubmit={handleConfirmFlagSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[var(--text-secondary)] mb-1 font-semibold">
                  Defect / Issue Category *
                </label>
                <select
                  value={flagModal.category}
                  onChange={(e) =>
                    setFlagModal({ ...flagModal, category: e.target.value as any })
                  }
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="Blurry">Blurry / Low Resolution Scan</option>
                  <option value="Missing Page">Missing Page / Incomplete Document</option>
                  <option value="Expired">Expired Validity / Date Passed</option>
                  <option value="Not Attested">Not Officially Attested / Certified</option>
                  <option value="Name Mismatch">Candidate Name Mismatch</option>
                  <option value="Other">Other Compliance Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1 font-semibold">
                  Required Comments & Instructions for Resubmission *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail the issue so the student/counsellor can provide the correct version..."
                  value={flagModal.comment}
                  onChange={(e) => setFlagModal({ ...flagModal, comment: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setFlagModal(null)}
                  className="px-4 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-default)] sq-btn text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold sq-btn text-xs shadow-md shadow-rose-500/20"
                >
                  Confirm Flag & Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Document Preview */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-modal w-full max-w-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold font-heading text-[var(--text-primary)] truncate max-w-sm">
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

            <div className="p-8 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card flex flex-col items-center justify-center text-center space-y-3">
              <FileCheck className="w-16 h-16 text-emerald-400 opacity-80" />
              <div className="space-y-1">
                <div className="font-bold text-sm text-[var(--text-primary)]">{previewDoc.fileName}</div>
                <div className="text-xs text-[var(--text-muted)]">
                  Category: {previewDoc.docType} • Status: {previewDoc.status}
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">
                  Uploaded by: {previewDoc.uploadedBy}
                </div>
              </div>
              <div className="p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-card text-[11px] text-[var(--text-secondary)] font-mono max-w-md">
                Securely encrypted document stored in EduCRM compliance vault.
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-default)]">
              <button
                onClick={() => {
                  const toVerify = previewDoc;
                  setPreviewDoc(null);
                  handleMarkVerified(toVerify.id);
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold sq-btn text-xs inline-flex items-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark Verified</span>
              </button>

              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-default)] sq-btn text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdmissionsDocumentVerificationHub;
