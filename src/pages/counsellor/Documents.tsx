import React, { useState } from "react";
import { useCounsellorData } from "../../hooks/useCounsellorData";
import { DocumentType, StudentDocument } from "../Documents";
import { validateDocumentFile, getDocumentBlobOrUrl, getCachedDocumentFile } from "../../utils/documentStorage";
import { checkDocumentQuality, DocumentQualityReport } from "../../utils/documentQA";
import { logAuditEvent } from "../../utils/auditLogger";
import { useAuth } from "../../contexts/AuthContext";
import {
  Upload,
  Search,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
  Clock,
  Download,
  Eye,
  Sparkles,
  ShieldCheck,
  History,
  X,
  Calendar,
  Filter,
  Check,
  Loader2,
} from "lucide-react";

export const CounsellorDocuments: React.FC = () => {
  const { appUser } = useAuth();
  const { documents, students, uploadDocument, verifyDocument, loading } = useCounsellorData();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [studentFilter, setStudentFilter] = useState<string>("All");

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [docType, setDocType] = useState<DocumentType>("Passport");
  const [expiryDate, setExpiryDate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  // Reject Modal State
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [savingReject, setSavingReject] = useState(false);

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<StudentDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // AI Quality Audit Modal State
  const [qaDoc, setQaDoc] = useState<StudentDocument | null>(null);
  const [qaReport, setQaReport] = useState<DocumentQualityReport | null>(null);
  const [auditingQa, setAuditingQa] = useState(false);

  // Version History Modal State
  const [versionDoc, setVersionDoc] = useState<StudentDocument | null>(null);
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [uploadingVersion, setUploadingVersion] = useState(false);

  // Expiry evaluation helper
  const getExpiryStatus = (expDate?: string): { label: string; status: "valid" | "soon" | "expired" | "none" } => {
    if (!expDate) return { label: "N/A", status: "none" };
    const expiry = new Date(expDate);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: `Expired (${expDate})`, status: "expired" };
    }
    if (diffDays <= 30) {
      return { label: `Expires in ${diffDays}d (${expDate})`, status: "soon" };
    }
    return { label: `Valid until ${expDate}`, status: "valid" };
  };

  // KPIs
  const pendingCount = documents.filter((d) => d.status === "Pending" || d.status === "Received").length;
  const verifiedCount = documents.filter((d) => d.status === "Verified").length;
  const rejectedCount = documents.filter((d) => d.status === "Rejected").length;
  const expiringCount = documents.filter((d) => {
    const exp = getExpiryStatus(d.expiryDate);
    return exp.status === "soon" || exp.status === "expired";
  }).length;

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      (doc.studentName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.fileName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.docType || "").toLowerCase().includes(searchQuery.toLowerCase());

    const exp = getExpiryStatus(doc.expiryDate);
    let matchesStatus = true;
    if (statusFilter === "Pending") matchesStatus = doc.status === "Pending" || doc.status === "Received";
    else if (statusFilter === "Verified") matchesStatus = doc.status === "Verified";
    else if (statusFilter === "Rejected") matchesStatus = doc.status === "Rejected";
    else if (statusFilter === "Expiring Soon") matchesStatus = exp.status === "soon" || exp.status === "expired";

    const matchesCategory = categoryFilter === "All" || doc.docType === categoryFilter;
    const matchesStudent = studentFilter === "All" || doc.studentId === studentFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesStudent;
  });

  // Handle Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedFile) {
      setError("Please select a student and a document file.");
      return;
    }

    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) {
      setError("Student profile not found.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      await uploadDocument(selectedStudentId, student.fullName, docType, selectedFile);
      setIsUploadModalOpen(false);
      setSelectedStudentId("");
      setSelectedFile(null);
      setExpiryDate("");
    } catch (uploadError: any) {
      setError(uploadError.message || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  // Handle Document Preview
  const handleOpenPreview = async (docItem: StudentDocument) => {
    setPreviewDoc(docItem);
    setLoadingPreview(true);
    setPreviewUrl(null);

    try {
      const url = await getDocumentBlobOrUrl(docItem.id, docItem.fileUrl);
      if (url) {
        setPreviewUrl(url);
      } else {
        const cached = await getCachedDocumentFile(docItem.id);
        if (cached) setPreviewUrl(cached);
      }
    } catch (err) {
      console.warn("Could not load preview:", err);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Handle Document Download
  const handleDownload = async (docItem: StudentDocument) => {
    try {
      let url = await getDocumentBlobOrUrl(docItem.id, docItem.fileUrl);
      if (!url) {
        url = await getCachedDocumentFile(docItem.id);
      }
      if (url) {
        const a = document.createElement("a");
        a.href = url;
        a.download = docItem.fileName;
        a.click();

        await logAuditEvent(
          "DOCUMENT_DOWNLOADED",
          appUser?.email || "Counsellor",
          "Document",
          `Downloaded document "${docItem.fileName}" for student ${docItem.studentName}`,
          docItem.id,
          appUser?.role
        );
      } else {
        alert("File data is not available on this device.");
      }
    } catch (err) {
      console.warn("Download error:", err);
    }
  };

  // Handle AI Quality Audit
  const handleRunAiAudit = async (docItem: StudentDocument) => {
    setQaDoc(docItem);
    setAuditingQa(true);
    setQaReport(null);

    try {
      let base64 = "";
      const cached = await getCachedDocumentFile(docItem.id);
      if (cached && cached.includes(",")) {
        base64 = cached.split(",")[1];
      }

      const report = await checkDocumentQuality(
        docItem.fileName,
        docItem.docType,
        docItem.studentName,
        base64 || undefined,
        docItem.fileType || "application/pdf"
      );
      setQaReport(report);
    } catch (err) {
      console.warn("AI QA Audit error:", err);
    } finally {
      setAuditingQa(false);
    }
  };

  // Handle Approval
  const handleApprove = async (docItem: StudentDocument) => {
    await verifyDocument(docItem.id, "Verified");
    await logAuditEvent(
      "DOCUMENT_VERIFIED",
      appUser?.email || "Counsellor",
      "Document",
      `Approved and verified compliance for "${docItem.fileName}" (${docItem.docType}) for ${docItem.studentName}`,
      docItem.id,
      appUser?.role
    );
  };

  // Handle Rejection
  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingDocId) return;

    setSavingReject(true);
    try {
      await verifyDocument(rejectingDocId, "Rejected");
      const docItem = documents.find((d) => d.id === rejectingDocId);
      await logAuditEvent(
        "DOCUMENT_REJECTED",
        appUser?.email || "Counsellor",
        "Document",
        `Rejected document "${docItem?.fileName || rejectingDocId}". Reason: ${rejectReason || "Does not meet compliance standards"}`,
        rejectingDocId,
        appUser?.role
      );
      setRejectingDocId(null);
      setRejectReason("");
    } finally {
      setSavingReject(false);
    }
  };

  // Handle Version Replacement
  const handleUploadNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionDoc || !replacementFile) return;

    setUploadingVersion(true);
    try {
      await uploadDocument(
        versionDoc.studentId,
        versionDoc.studentName,
        versionDoc.docType,
        replacementFile
      );
      setVersionDoc(null);
      setReplacementFile(null);
    } finally {
      setUploadingVersion(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[var(--text-muted)] font-mono">Loading compliance document vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 sq-badge bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>CRM.pdf Section 3.8 &bull; Compliance Vault</span>
          </div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">
            Document Vault &amp; Verification
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Upload, verify, inspect OCR quality, and manage compliance documents across 14 official categories.
          </p>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold sq-btn text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* KPI Metric Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] space-y-1">
          <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-sky-400" /> Total Files
          </span>
          <p className="text-2xl font-bold font-heading text-[var(--text-primary)]">{documents.length}</p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] space-y-1">
          <span className="text-[11px] text-amber-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Pending Review
          </span>
          <p className="text-2xl font-bold font-heading text-amber-400">{pendingCount}</p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] space-y-1">
          <span className="text-[11px] text-teal-400 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> Verified
          </span>
          <p className="text-2xl font-bold font-heading text-teal-400">{verifiedCount}</p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] space-y-1">
          <span className="text-[11px] text-rose-400 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
          <p className="text-2xl font-bold font-heading text-rose-400">{rejectedCount}</p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] text-orange-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Expiry Alerts
          </span>
          <p className="text-2xl font-bold font-heading text-orange-400">{expiringCount}</p>
        </div>
      </div>

      {/* Toolbar: Search, Filters & Tabs */}
      <div className="space-y-3 bg-[var(--bg-card)] border border-[var(--border-default)] p-4 rounded-2xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search file, student, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="p-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              >
                <option value="All">All Categories (14)</option>
                <option value="Passport">Passport</option>
                <option value="National ID">National ID</option>
                <option value="Photograph">Photograph</option>
                <option value="Academic Transcript">Academic Transcript</option>
                <option value="Degree Certificate">Degree Certificate</option>
                <option value="IELTS / English Test">IELTS / English Test</option>
                <option value="CV / Resume">CV / Resume</option>
                <option value="Personal Statement">Personal Statement (SOP)</option>
                <option value="Reference Letter">Reference Letter</option>
                <option value="Financial Proof">Financial Proof / Bank Statement</option>
                <option value="Sponsor Documents">Sponsor Documents</option>
                <option value="Visa Document">Visa Document</option>
                <option value="Offer Letter">Offer Letter</option>
                <option value="CAS or COE">CAS or COE</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Student Selector */}
            <select
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              className="p-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 max-w-[180px] truncate"
            >
              <option value="All">All Students ({students.length})</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-subtle)] overflow-x-auto no-scrollbar">
          {["All", "Pending", "Verified", "Rejected", "Expiring Soon"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === st
                  ? "bg-emerald-500 text-zinc-950 shadow-sm"
                  : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:text-[var(--text-primary)] hover:border-emerald-500/30"
              }`}
            >
              {st}
              {st === "Pending" && pendingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-zinc-950 font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[var(--text-secondary)]">
            <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-default)] text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">File Name &amp; Version</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Student</th>
                <th className="px-4 py-3.5">Expiry Tracking</th>
                <th className="px-4 py-3.5">Status &amp; Verification</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[var(--text-muted)]">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No compliance documents found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((docItem) => {
                  const exp = getExpiryStatus(docItem.expiryDate);

                  return (
                    <tr key={docItem.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                      {/* File Name & Version */}
                      <td className="px-4 py-3.5 font-semibold text-[var(--text-primary)]">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 max-w-[200px]">
                            <p className="truncate text-xs font-semibold">{docItem.fileName}</p>
                            <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5">
                              <span>v{docItem.versionNumber || "1.0"}</span>
                              {docItem.fileSize && (
                                <span>&bull; {(docItem.fileSize / 1024).toFixed(0)} KB</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5 text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] font-mono text-[10px] text-emerald-400">
                          {docItem.docType}
                        </span>
                      </td>

                      {/* Student */}
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-[var(--text-primary)]">{docItem.studentName}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">ID: {docItem.studentId.slice(0, 8)}...</p>
                      </td>

                      {/* Expiry Tracking */}
                      <td className="px-4 py-3.5 text-xs">
                        {exp.status === "none" ? (
                          <span className="text-[11px] text-[var(--text-muted)]">N/A</span>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 w-max ${
                              exp.status === "expired"
                                ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                : exp.status === "soon"
                                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                : "bg-teal-500/15 text-teal-400 border border-teal-500/30"
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            {exp.label}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-xs">
                        <div className="space-y-0.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              docItem.status === "Verified"
                                ? "bg-teal-500/15 text-teal-400 border border-teal-500/30"
                                : docItem.status === "Rejected"
                                ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {docItem.status}
                          </span>
                          {docItem.remarks && (
                            <p className="text-[10px] text-[var(--text-muted)] italic truncate max-w-[160px]">
                              {docItem.remarks}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Preview Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenPreview(docItem)}
                            className="p-1.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-emerald-400 transition-colors cursor-pointer"
                            title="Preview Document"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Download Button */}
                          <button
                            type="button"
                            onClick={() => handleDownload(docItem)}
                            className="p-1.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-emerald-400 transition-colors cursor-pointer"
                            title="Download Document"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* AI QA Audit Button */}
                          <button
                            type="button"
                            onClick={() => handleRunAiAudit(docItem)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors cursor-pointer"
                            title="AI Document Quality & OCR Audit"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>

                          {/* Version History Button */}
                          <button
                            type="button"
                            onClick={() => setVersionDoc(docItem)}
                            className="p-1.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-cyan-400 transition-colors cursor-pointer"
                            title="Replace / New Version"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {/* Approve Button */}
                          {docItem.status !== "Verified" && (
                            <button
                              type="button"
                              onClick={() => handleApprove(docItem)}
                              className="px-2 py-1 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-[11px] font-semibold inline-flex items-center space-x-1 cursor-pointer transition-colors"
                              title="Approve & Verify"
                            >
                              <Check className="w-3 h-3" />
                              <span>Verify</span>
                            </button>
                          )}

                          {/* Reject Button */}
                          {docItem.status !== "Rejected" && (
                            <button
                              type="button"
                              onClick={() => setRejectingDocId(docItem.id)}
                              className="px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-[11px] font-semibold inline-flex items-center space-x-1 cursor-pointer transition-colors"
                              title="Reject Document"
                            >
                              <X className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 1. UPLOAD MODAL (Full 14 CRM.pdf categories) */}
      {/* ==================================================== */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <h3 className="text-base font-bold font-heading text-[var(--text-primary)] flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-400" />
                Upload Compliance Document
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs">
              {error && <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">{error}</div>}

              <div>
                <label className="block text-[var(--text-secondary)] font-medium mb-1">Select Student Profile *</label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Choose student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-medium mb-1">Document Category (CRM.pdf 3.8) *</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as DocumentType)}
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                >
                  <option value="Passport">Passport</option>
                  <option value="National ID">National ID</option>
                  <option value="Photograph">Photograph</option>
                  <option value="Academic Transcript">Academic Transcript</option>
                  <option value="Degree Certificate">Degree Certificate</option>
                  <option value="IELTS / English Test">IELTS / English Test</option>
                  <option value="CV / Resume">CV / Resume</option>
                  <option value="Personal Statement">Personal Statement (SOP)</option>
                  <option value="Reference Letter">Reference Letter</option>
                  <option value="Financial Proof">Financial Proof / Bank Statement</option>
                  <option value="Sponsor Documents">Sponsor Documents</option>
                  <option value="Visa Document">Visa Document</option>
                  <option value="Offer Letter">Offer Letter</option>
                  <option value="CAS or COE">CAS or COE</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-medium mb-1">
                  Document Expiry Date (Optional - For Passport/IELTS/Visa)
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-medium mb-1">Document File (PDF, Images, DOCX) *</label>
                <input
                  type="file"
                  required
                  accept="application/pdf,image/jpeg,image/png,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelectedFile(file);
                    setError(file ? validateDocumentFile(file) || "" : "");
                  }}
                  className="w-full p-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-primary)]"
                />
              </div>

              <div className="flex justify-end space-x-2.5 pt-3 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. DOCUMENT PREVIEW MODAL */}
      {/* ==================================================== */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-default)] bg-[var(--bg-elevated)]">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold text-sm text-[var(--text-primary)] truncate">
                  {previewDoc.fileName}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {previewDoc.docType}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload(previewDoc)}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-emerald-400 transition-colors cursor-pointer"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-rose-400 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 flex items-center justify-center overflow-auto min-h-[400px] max-h-[calc(90vh-70px)] bg-black/40">
              {loadingPreview ? (
                <div className="flex flex-col items-center gap-2 text-xs text-[var(--text-muted)]">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                  <span>Loading document preview...</span>
                </div>
              ) : previewUrl ? (
                previewUrl.startsWith("data:image") || previewDoc.fileType?.startsWith("image/") ? (
                  <img
                    src={previewUrl}
                    alt={previewDoc.fileName}
                    className="max-h-[75vh] max-w-full rounded-lg object-contain shadow-md"
                  />
                ) : (
                  <iframe
                    src={previewUrl}
                    title={previewDoc.fileName}
                    className="w-full h-[70vh] rounded-lg border border-[var(--border-default)]"
                  />
                )
              ) : (
                <div className="text-center space-y-2 p-6 text-[var(--text-muted)]">
                  <FileText className="w-12 h-12 mx-auto opacity-30" />
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Preview not directly embeddable</p>
                  <p className="text-xs max-w-sm">
                    This file is securely stored. Click Download to inspect the full original file.
                  </p>
                  <button
                    onClick={() => handleDownload(previewDoc)}
                    className="mt-3 px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download File</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. REJECTION REASON MODAL */}
      {/* ==================================================== */}
      {rejectingDocId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <h3 className="text-base font-bold font-heading text-rose-400 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Reject Compliance Document
              </h3>
              <button onClick={() => setRejectingDocId(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-3.5 text-xs">
              <p className="text-[var(--text-secondary)]">
                Please provide specific feedback or reasons for rejecting this document (e.g., blurred scan, expired document, missing signature).
              </p>

              <div>
                <label className="block text-[var(--text-secondary)] font-medium mb-1">Rejection Remarks / Action Needed *</label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Scanned copy is illegible. Please upload high-resolution colored PDF of original transcript."
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end space-x-2.5 pt-3 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setRejectingDocId(null)}
                  className="px-4 py-2 rounded-xl border border-[var(--border-default)] text-[var(--text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingReject || !rejectReason.trim()}
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingReject ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. AI QUALITY AUDIT & OCR MODAL */}
      {/* ==================================================== */}
      {qaDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-emerald-500/30 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold font-heading text-[var(--text-primary)]">
                  AI Document Quality &amp; OCR Report
                </h3>
              </div>
              <button onClick={() => setQaDoc(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {auditingQa ? (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto" />
                <p className="text-xs text-[var(--text-primary)] font-semibold">Running Gemini AI inspection...</p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Evaluating legibility, blur detection, name alignment, and expiry compliance.
                </p>
              </div>
            ) : qaReport ? (
              <div className="space-y-4 text-xs">
                {/* Score Banner */}
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                      Overall Compliance Score
                    </span>
                    <p className="text-2xl font-black font-heading text-emerald-300">
                      {qaReport.qualityScore} / 100
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      qaReport.qualityScore >= 75
                        ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {qaReport.qualityScore >= 75 ? "Passed Criteria" : "Attention Recommended"}
                  </span>
                </div>

                {/* Checklist Checks */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                    <span className="text-[var(--text-secondary)]">Legibility &amp; Resolution:</span>
                    <span className={`font-semibold ${!qaReport.isBlurred ? "text-teal-400" : "text-rose-400"}`}>
                      {!qaReport.isBlurred ? "✓ Clear & Readable" : "⚠️ Blurry / Distorted"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                    <span className="text-[var(--text-secondary)]">Name Alignment:</span>
                    <span className={`font-semibold ${!qaReport.nameDiscrepancy ? "text-teal-400" : "text-rose-400"}`}>
                      {!qaReport.nameDiscrepancy ? "✓ Matches Student Record" : "⚠️ Potential Name Mismatch"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                    <span className="text-[var(--text-secondary)]">Validity &amp; Expiry:</span>
                    <span className={`font-semibold ${!qaReport.isExpired ? "text-teal-400" : "text-rose-400"}`}>
                      {!qaReport.isExpired ? "✓ Valid Date" : "⚠️ Expired Document"}
                    </span>
                  </div>
                </div>

                {/* Recommendations */}
                {qaReport.recommendations && qaReport.recommendations.length > 0 && (
                  <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-1">
                    <span className="text-[11px] font-bold text-[var(--text-primary)]">Admissions Advice:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[var(--text-secondary)]">
                      {qaReport.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)] text-center py-6">Could not generate AI report.</p>
            )}

            <div className="flex justify-end pt-3 border-t border-[var(--border-default)]">
              <button
                type="button"
                onClick={() => setQaDoc(null)}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 5. VERSIONING / REPLACEMENT MODAL */}
      {/* ==================================================== */}
      {versionDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <h3 className="text-base font-bold font-heading text-[var(--text-primary)] flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                Upload New Document Version
              </h3>
              <button onClick={() => setVersionDoc(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadNewVersion} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1">
                <p className="font-semibold text-[var(--text-primary)]">{versionDoc.fileName}</p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Student: {versionDoc.studentName} &bull; Category: {versionDoc.docType}
                </p>
                <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                  Current Version: v{versionDoc.versionNumber || "1.0"} &rarr; Next: v{(versionDoc.versionNumber || 1) + 1}.0
                </span>
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-medium mb-1">Select Replacement File *</label>
                <input
                  type="file"
                  required
                  accept="application/pdf,image/jpeg,image/png,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => setReplacementFile(e.target.files?.[0] || null)}
                  className="w-full p-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-primary)]"
                />
              </div>

              <div className="flex justify-end space-x-2.5 pt-3 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setVersionDoc(null)}
                  className="px-4 py-2 rounded-xl border border-[var(--border-default)] text-[var(--text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingVersion || !replacementFile}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {uploadingVersion ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save New Version"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CounsellorDocuments;
