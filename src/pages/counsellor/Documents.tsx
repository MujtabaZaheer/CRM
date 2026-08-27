import React, { useState } from "react";
import { useCounsellorData } from "../../hooks/useCounsellorData";
import { DocumentType } from "../Documents";
import { validateDocumentFile } from "../../utils/documentStorage";
import {
  Upload,
  Search,
  CheckCircle,
  XCircle,
  File
} from "lucide-react";

export const CounsellorDocuments: React.FC = () => {
  const { documents, students, uploadDocument, verifyDocument, loading } = useCounsellorData();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [docType, setDocType] = useState<DocumentType>("Passport");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      (doc.studentName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.fileName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.docType || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedFile) {
      setError("Please select a student and a document file.");
      return;
    }

    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) {
      setError("Student not found.");
      return;
    }

    try {
      setUploading(true);
      await uploadDocument(selectedStudentId, student.fullName, docType, selectedFile);
      setIsUploadModalOpen(false);
      setSelectedStudentId("");
      setSelectedFile(null);
      setError("");
    } catch (uploadError: any) {
      setError(uploadError.message || "Failed to upload document.");
    } finally {
      setUploading(false);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">Document Vault & Verification</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Upload, inspect, and verify student compliance documents, academic transcripts, and identity passports.
          </p>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold sq-btn text-xs shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search documents by student or file name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="flex items-center space-x-2">
          {["All", "Received", "Verified", "Rejected"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 sq-badge text-xs transition-all ${
                statusFilter === st
                  ? "bg-emerald-500 text-zinc-950 font-bold shadow-sm shadow-emerald-500/20"
                  : "bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[var(--text-secondary)]">
            <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-default)] text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">File Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Verification Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-[var(--text-muted)]">
                    No documents found in vault matching current search or status filter.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((docItem) => (
                  <tr key={docItem.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                      <div className="flex items-center space-x-2">
                        <File className="w-4 h-4 text-emerald-400" />
                        <span>{docItem.fileName}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-xs">
                      <span className="px-2 py-0.5 sq-badge bg-[var(--bg-elevated)] border border-[var(--border-default)] font-mono text-[10px]">
                        {docItem.docType}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{docItem.studentName}</td>

                    <td className="px-4 py-3 text-xs">
                      <span
                        className={`px-2 py-0.5 sq-badge font-semibold text-[10px] ${
                          docItem.status === "Verified"
                            ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                            : docItem.status === "Rejected"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {docItem.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right space-x-2">
                      {docItem.status !== "Verified" && (
                        <button
                          onClick={() => verifyDocument(docItem.id, "Verified")}
                          className="px-2.5 py-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 sq-btn text-[11px] inline-flex items-center space-x-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                      )}

                      {docItem.status !== "Rejected" && (
                        <button
                          onClick={() => verifyDocument(docItem.id, "Rejected")}
                          className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 sq-btn text-[11px] inline-flex items-center space-x-1"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-modal w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold font-heading text-[var(--text-primary)] border-b border-[var(--border-default)] pb-3">
              Upload Student Document
            </h3>

            <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
              {error && <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 sq-badge">{error}</div>}
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
                <label className="block text-[var(--text-secondary)] mb-1">Document file *</label>
                <input
                  type="file"
                  required
                  accept="application/pdf,image/jpeg,image/png,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelectedFile(file);
                    setError(file ? validateDocumentFile(file) || "" : "");
                  }}
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 bg-[var(--bg-elevated)] text-[var(--text-secondary)] sq-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 text-zinc-950 font-bold sq-btn shadow-lg shadow-emerald-500/20"
                >
                  {uploading ? "Uploading..." : "Save Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
