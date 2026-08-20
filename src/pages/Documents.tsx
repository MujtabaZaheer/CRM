import React, { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot, addDoc, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { Student } from "../types/student";
import { RoleGate } from "../components/layout/RoleGate";
import { useAuth } from "../contexts/AuthContext";
import { logAuditEvent } from "../utils/auditLogger";
import { uploadStudentDocument, validateDocumentFile } from "../utils/documentStorage";
import { watermarkImage, downloadBlob } from "../utils/documentWatermark";
import { checkDocumentQuality, DocumentQualityReport } from "../utils/documentQA";
import { Upload, Search, AlertTriangle, X, File, Sparkles, Download, History, ShieldCheck } from "lucide-react";

export type DocumentType =
  | "Passport"
  | "Academic Transcript"
  | "Degree Certificate"
  | "IELTS / English Test"
  | "Personal Statement"
  | "Reference Letter"
  | "Financial Proof"
  | "Visa Document"
  | "Other";

export interface DocumentVersion {
  versionNumber: number;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  uploadedBy: string;
  uploadedAt: number;
}

export interface StudentDocument {
  id: string;
  studentId: string;
  studentName: string;
  docType: DocumentType;
  fileName: string;
  fileUrl: string;
  filePath?: string;
  fileSize?: number;
  fileType?: string;
  versionNumber?: number;
  versions?: DocumentVersion[];
  expiryDate?: string; // YYYY-MM-DD
  expiryAlertSent?: boolean;
  qualityReport?: DocumentQualityReport;
  status: "Received" | "Verified" | "Rejected" | "Pending";
  remarks?: string;
  feedback?: string;
  uploadedBy: string;
  createdAt: number;
}

export const Documents: React.FC = () => {
  const { appUser } = useAuth();
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [docType, setDocType] = useState<DocumentType>("Passport");
  const [expiryDate, setExpiryDate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [filterTab, setFilterTab] = useState<"All" | "Expiring Soon" | "Verified" | "Pending">("All");

  // AI QA State
  const [qaModalDoc, setQaModalDoc] = useState<StudentDocument | null>(null);
  const [auditingQa, setAuditingQa] = useState(false);

  // Version History State
  const [versionModalDoc, setVersionModalDoc] = useState<StudentDocument | null>(null);
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);

  useEffect(() => {
    // Documents snapshot
    const q = query(collection(db, "student_documents"), orderBy("createdAt", "desc"));
    const unsubscribeDocs = onSnapshot(q, (snapshot) => {
      const docs: StudentDocument[] = [];
      snapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() } as StudentDocument);
      });
      setDocuments(docs);
      setLoading(false);
    });

    // Students snapshot
    const unsubscribeStudents = onSnapshot(collection(db, "students"), (snapshot) => {
      const docs: Student[] = [];
      snapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() } as Student);
      });
      setStudents(docs);
    });

    return () => {
      unsubscribeDocs();
      unsubscribeStudents();
    };
  }, []);

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedFile) {
      setErrorMsg("Please select a student and a document file.");
      return;
    }

    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) {
      setErrorMsg("Student not found.");
      return;
    }

    try {
      setUploading(true);
      const uploadedFile = await uploadStudentDocument(selectedStudentId, selectedFile);
      const newDoc: Omit<StudentDocument, "id"> = {
        studentId: selectedStudentId,
        studentName: student.fullName,
        docType,
        ...uploadedFile,
        versionNumber: 1,
        versions: [
          {
            versionNumber: 1,
            fileName: uploadedFile.fileName,
            fileUrl: uploadedFile.fileUrl,
            fileSize: uploadedFile.fileSize,
            uploadedBy: appUser?.email || "Counsellor",
            uploadedAt: Date.now(),
          },
        ],
        expiryDate: expiryDate || undefined,
        status: "Received",
        uploadedBy: appUser?.email || "Counsellor",
        createdAt: Date.now(),
      };

      const docRef = await addDoc(collection(db, "student_documents"), newDoc);
      await logAuditEvent(
        "DOCUMENT_UPLOADED",
        appUser?.email || "Unknown",
        "Document",
        `Uploaded ${docType} v1 (${selectedFile.name}) for ${student.fullName}`,
        docRef.id,
        appUser?.role
      );

      // Reset
      setSelectedStudentId("");
      setSelectedFile(null);
      setExpiryDate("");
      setErrorMsg("");
      setIsUploadModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const handleUploadNewVersion = async (targetDoc: StudentDocument) => {
    if (!newVersionFile) return;
    setUploading(true);
    try {
      const uploadedFile = await uploadStudentDocument(targetDoc.studentId, newVersionFile);
      const currentVersions = targetDoc.versions || [];
      const newVersionNum = (targetDoc.versionNumber || 1) + 1;

      const newVersionRecord: DocumentVersion = {
        versionNumber: newVersionNum,
        fileName: uploadedFile.fileName,
        fileUrl: uploadedFile.fileUrl,
        fileSize: uploadedFile.fileSize,
        uploadedBy: appUser?.email || "Counsellor",
        uploadedAt: Date.now(),
      };

      const updatedVersions = [newVersionRecord, ...currentVersions];

      await updateDoc(doc(db, "student_documents", targetDoc.id), {
        fileName: uploadedFile.fileName,
        fileUrl: uploadedFile.fileUrl,
        filePath: uploadedFile.filePath,
        fileSize: uploadedFile.fileSize,
        versionNumber: newVersionNum,
        versions: updatedVersions,
        status: "Received",
        uploadedBy: appUser?.email || "Counsellor",
      });

      await logAuditEvent(
        "DOCUMENT_VERSION_UPLOADED",
        appUser?.email || "Unknown",
        "Document",
        `Uploaded version ${newVersionNum} for ${targetDoc.docType} (${targetDoc.studentName})`,
        targetDoc.id,
        appUser?.role
      );

      setVersionModalDoc(null);
      setNewVersionFile(null);
    } catch (err: any) {
      alert("Failed to upload new version: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadWatermarked = async (d: StudentDocument) => {
    try {
      await logAuditEvent(
        "DOCUMENT_DOWNLOADED",
        appUser?.email || "Unknown",
        "Document",
        `Downloaded ${d.docType} (${d.fileName}) with watermark`,
        d.id,
        appUser?.role
      );

      const isImage = d.fileName.match(/\.(jpg|jpeg|png|webp)$/i);
      if (isImage) {
        const watermarkedBlob = await watermarkImage(d.fileUrl, `EduCRM • Confidential • ${appUser?.email || "Staff"}`);
        downloadBlob(watermarkedBlob, `WATERMARKED_${d.fileName}`);
      } else {
        window.open(d.fileUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.warn("Watermark download fallback to direct URL:", err);
      window.open(d.fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleRunQA = async (d: StudentDocument) => {
    setAuditingQa(true);
    setQaModalDoc(d);
    try {
      const report = await checkDocumentQuality(d.fileName, d.docType, d.studentName);
      await updateDoc(doc(db, "student_documents", d.id), {
        qualityReport: report,
      });
      setQaModalDoc((prev) => prev ? { ...prev, qualityReport: report } : null);
    } catch (err) {
      console.error("QA error:", err);
    } finally {
      setAuditingQa(false);
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const thirtyDaysStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const filteredDocs = documents.filter((d) => {
    const matchesSearch =
      d.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.docType.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === "Expiring Soon") {
      return d.expiryDate && d.expiryDate <= thirtyDaysStr && d.expiryDate >= todayStr;
    }
    if (filterTab === "Verified") return d.status === "Verified";
    if (filterTab === "Pending") return d.status === "Received" || d.status === "Pending";
    return true;
  });

  return (
    <RoleGate allowedRoles={["platform_super_admin", "org_admin", "counsellor", "office_manager", "admissions_officer"]}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)]">
          <div>
            <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)] flex items-center space-x-2">
              <File className="w-7 h-7 text-emerald-400" />
              <span>Document Vault & AI Verification</span>
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Store, version, watermark, and automatically verify student compliance credentials with AI QA.
            </p>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(["All", "Expiring Soon", "Verified", "Pending"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  filterTab === tab
                    ? "bg-emerald-500 text-slate-950 border-emerald-400 font-bold"
                    : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-zinc-600"
                }`}
              >
                {tab === "Expiring Soon" ? "⚠️ Expiring Soon (<30d)" : tab}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[var(--text-secondary)]">
              <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-default)] text-xs text-[var(--text-muted)] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Document & Version</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Expiry Date</th>
                  <th className="px-4 py-3">Status / QA</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-[var(--text-muted)]">
                      Loading vault documents...
                    </td>
                  </tr>
                ) : filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-[var(--text-muted)]">
                      No documents found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((d) => {
                    const isExpired = d.expiryDate && d.expiryDate < todayStr;
                    const isExpiringSoon = d.expiryDate && d.expiryDate <= thirtyDaysStr && !isExpired;

                    return (
                      <tr key={d.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                        <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                          <div className="flex items-center space-x-2.5">
                            <File className="w-4 h-4 text-emerald-400" />
                            <div>
                              <span className="block">{d.fileName}</span>
                              <span className="text-[10px] text-[var(--text-muted)] font-normal">
                                v{d.versionNumber || 1} • {d.fileSize ? `${Math.round(d.fileSize / 1024)} KB` : ""}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span className="px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-default)] font-mono text-[10px]">
                            {d.docType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-[var(--text-primary)]">
                          {d.studentName}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {d.expiryDate ? (
                            <span className={`font-mono text-[11px] font-bold ${
                              isExpired ? "text-rose-400" : isExpiringSoon ? "text-amber-400" : "text-emerald-400"
                            }`}>
                              {d.expiryDate} {isExpired ? "(Expired)" : isExpiringSoon ? "(Expiring)" : ""}
                            </span>
                          ) : (
                            <span className="text-[var(--text-muted)] italic">No expiry</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold text-[10px]">
                              {d.status}
                            </span>
                            {d.qualityReport && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 font-mono">
                                QA {d.qualityReport.qualityScore}%
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* AI QA Button */}
                            <button
                              onClick={() => handleRunQA(d)}
                              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold flex items-center space-x-1 border border-emerald-500/20 transition-colors"
                              title="Run AI Quality Audit"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">AI QA</span>
                            </button>

                            {/* Version History Button */}
                            <button
                              onClick={() => setVersionModalDoc(d)}
                              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs flex items-center space-x-1 border border-[var(--border-default)] transition-colors"
                              title="Version History"
                            >
                              <History className="w-3.5 h-3.5 text-zinc-400" />
                              <span className="hidden sm:inline">v{d.versionNumber || 1}</span>
                            </button>

                            {/* Watermarked Download */}
                            <button
                              onClick={() => handleDownloadWatermarked(d)}
                              className="p-1.5 bg-zinc-800 hover:bg-emerald-500/10 text-[var(--text-secondary)] hover:text-emerald-400 rounded-lg transition-colors border border-[var(--border-default)] text-xs"
                              title="Watermarked Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
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

        {/* Modal: Upload Document */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-modal w-full max-w-lg p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                <h3 className="text-lg font-bold font-heading text-[var(--text-primary)] flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-emerald-400" />
                  <span>Upload Student Document</span>
                </h3>
                <button onClick={() => setIsUploadModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 sq-badge text-rose-400 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleUploadDoc} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1">Select Student *</label>
                  <select
                    required
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                  >
                    <option value="">-- Choose student profile --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1">Document Category *</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value as DocumentType)}
                      className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                    >
                      <option value="Passport">Passport</option>
                      <option value="Academic Transcript">Academic Transcript</option>
                      <option value="Degree Certificate">Degree Certificate</option>
                      <option value="IELTS / English Test">IELTS / English Test</option>
                      <option value="Personal Statement">Personal Statement</option>
                      <option value="Reference Letter">Reference Letter</option>
                      <option value="Financial Proof">Financial Proof</option>
                      <option value="Visa Document">Visa Document</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1">Expiry Date (Optional)</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1">Document File *</label>
                  <input
                    type="file"
                    required
                    accept="application/pdf,image/jpeg,image/png,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setSelectedFile(file);
                      setErrorMsg(file ? validateDocumentFile(file) || "" : "");
                    }}
                    className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-[var(--border-default)]">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-4 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] font-medium sq-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold sq-btn shadow-lg shadow-emerald-500/20"
                  >
                    {uploading ? "Uploading..." : "Save to Document Vault"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: AI QA Quality Report */}
        {qaModalDoc && (
          <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-heading font-bold text-base text-[var(--text-primary)]">AI Document Quality Audit</h3>
                </div>
                <button onClick={() => setQaModalDoc(null)} className="text-[var(--text-muted)] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[var(--bg-elevated)] rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[var(--text-primary)] block">{qaModalDoc.fileName}</span>
                    <span className="text-[11px] text-[var(--text-secondary)]">Student: {qaModalDoc.studentName}</span>
                  </div>
                  {qaModalDoc.qualityReport && (
                    <div className="text-right">
                      <span className="text-2xl font-extrabold font-heading text-emerald-400">
                        {qaModalDoc.qualityReport.qualityScore}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] block">/ 100 Quality</span>
                    </div>
                  )}
                </div>

                {auditingQa ? (
                  <div className="p-6 text-center text-[var(--text-muted)]">
                    <Sparkles className="w-6 h-6 text-emerald-400 animate-spin mx-auto mb-2" />
                    Analyzing document legibility, authenticity, and expiry with Gemini Vision...
                  </div>
                ) : qaModalDoc.qualityReport ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 bg-[var(--bg-main)] rounded-xl border border-[var(--border-default)]">
                        <span className="text-[10px] text-[var(--text-muted)] block">Blurry?</span>
                        <span className={`font-bold ${qaModalDoc.qualityReport.isBlurred ? "text-rose-400" : "text-emerald-400"}`}>
                          {qaModalDoc.qualityReport.isBlurred ? "Yes ⚠️" : "No ✓"}
                        </span>
                      </div>
                      <div className="p-2.5 bg-[var(--bg-main)] rounded-xl border border-[var(--border-default)]">
                        <span className="text-[10px] text-[var(--text-muted)] block">Expired?</span>
                        <span className={`font-bold ${qaModalDoc.qualityReport.isExpired ? "text-rose-400" : "text-emerald-400"}`}>
                          {qaModalDoc.qualityReport.isExpired ? "Yes ⚠️" : "No ✓"}
                        </span>
                      </div>
                      <div className="p-2.5 bg-[var(--bg-main)] rounded-xl border border-[var(--border-default)]">
                        <span className="text-[10px] text-[var(--text-muted)] block">Name Match?</span>
                        <span className={`font-bold ${qaModalDoc.qualityReport.nameDiscrepancy ? "text-rose-400" : "text-emerald-400"}`}>
                          {qaModalDoc.qualityReport.nameDiscrepancy ? "Mismatch ⚠️" : "Matched ✓"}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20 space-y-1.5">
                      <span className="font-bold text-emerald-400 flex items-center space-x-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Audit Findings & Recommendations</span>
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-zinc-300 text-[11px]">
                        {qaModalDoc.qualityReport.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex justify-end pt-2 border-t border-[var(--border-default)]">
                <button
                  onClick={() => setQaModalDoc(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl"
                >
                  Close Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Version History */}
        {versionModalDoc && (
          <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                <div className="flex items-center space-x-2">
                  <History className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-heading font-bold text-base text-[var(--text-primary)]">
                    Version History: {versionModalDoc.docType}
                  </h3>
                </div>
                <button onClick={() => setVersionModalDoc(null)} className="text-[var(--text-muted)] hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Upload New Version */}
              <div className="p-3 bg-[var(--bg-elevated)] rounded-xl space-y-2 text-xs">
                <span className="font-bold text-[var(--text-primary)] block">Upload Revised Version</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    onChange={(e) => setNewVersionFile(e.target.files?.[0] || null)}
                    className="flex-1 text-xs text-zinc-400"
                  />
                  <button
                    onClick={() => handleUploadNewVersion(versionModalDoc)}
                    disabled={uploading || !newVersionFile}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-all disabled:opacity-50"
                  >
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </div>

              {/* Version History List */}
              <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
                {(versionModalDoc.versions || []).map((ver) => (
                  <div
                    key={ver.versionNumber}
                    className="p-3 bg-[var(--bg-main)] border border-[var(--border-default)] rounded-xl flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-emerald-400">v{ver.versionNumber}</span>
                        <span className="font-medium text-[var(--text-primary)] truncate">{ver.fileName}</span>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] block">
                        Uploaded by {ver.uploadedBy} on {new Date(ver.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={() => window.open(ver.fileUrl, "_blank", "noopener,noreferrer")}
                      className="p-1.5 bg-[var(--bg-card)] hover:bg-emerald-500/10 text-emerald-400 rounded-lg border border-[var(--border-default)]"
                      title="Download this version"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2 border-t border-[var(--border-default)]">
                <button
                  onClick={() => setVersionModalDoc(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGate>
  );
};
