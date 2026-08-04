import React, { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot, addDoc, query, orderBy } from "firebase/firestore";
import { Student } from "../types/student";
import { RoleGate } from "../components/layout/RoleGate";
import { useAuth } from "../contexts/AuthContext";
import { logAuditEvent } from "../utils/auditLogger";
import { Upload, Search, AlertTriangle, X, File } from "lucide-react";

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

export interface StudentDocument {
  id: string;
  studentId: string;
  studentName: string;
  docType: DocumentType;
  fileName: string;
  fileUrl: string;
  status: "Received" | "Verified" | "Rejected" | "Pending";
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
  const [simulatedFileName, setSimulatedFileName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

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
    if (!selectedStudentId || !simulatedFileName) {
      setErrorMsg("Please select a student and provide a file name.");
      return;
    }

    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) {
      setErrorMsg("Student not found.");
      return;
    }

    try {
      const newDoc: Omit<StudentDocument, "id"> = {
        studentId: selectedStudentId,
        studentName: student.fullName,
        docType,
        fileName: simulatedFileName,
        fileUrl: "#", // Simulated document vault URL
        status: "Received",
        uploadedBy: appUser?.email || "Counsellor",
        createdAt: Date.now(),
      };

      const docRef = await addDoc(collection(db, "student_documents"), newDoc);
      await logAuditEvent(
        "DOCUMENT_UPLOADED",
        appUser?.email || "Unknown",
        "Document",
        `Uploaded ${docType} (${simulatedFileName}) for ${student.fullName}`,
        docRef.id,
        appUser?.role
      );

      // Reset
      setSelectedStudentId("");
      setSimulatedFileName("");
      setErrorMsg("");
      setIsUploadModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload document.");
    }
  };

  const filteredDocs = documents.filter(
    (d) =>
      d.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.docType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <RoleGate allowedRoles={["platform_super_admin", "org_admin", "counsellor", "office_manager", "admissions_officer"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">Document Vault</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Upload, verify, and store student compliance documents and transcripts.
            </p>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold sq-btn text-sm shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search documents by student name, doc type, file name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Documents Table */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[var(--text-secondary)]">
              <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-default)] text-xs text-[var(--text-muted)] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Document Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Uploaded By</th>
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
                      No documents stored in vault. Click "Upload Document" to add student files.
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((d) => (
                    <tr key={d.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                      <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                        <div className="flex items-center space-x-2.5">
                          <File className="w-4 h-4 text-emerald-400" />
                          <span>{d.fileName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="px-2 py-0.5 sq-badge bg-[var(--bg-elevated)] border border-[var(--border-default)] font-mono text-[10px]">
                          {d.docType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-[var(--text-primary)]">
                        {d.studentName}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="px-2 py-0.5 sq-badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold text-[10px]">
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{d.uploadedBy}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => alert(`Downloading vault record: ${d.fileName}`)}
                          className="p-1.5 bg-[var(--bg-elevated)] hover:bg-emerald-500/10 text-[var(--text-secondary)] hover:text-emerald-400 sq-btn transition-colors border border-[var(--border-default)] text-xs"
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))
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
                  <label className="block text-[var(--text-secondary)] mb-1">File Name / Label *</label>
                  <input
                    type="text"
                    required
                    value={simulatedFileName}
                    onChange={(e) => setSimulatedFileName(e.target.value)}
                    placeholder="e.g. Passport_Scan_Sarah_2026.pdf"
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
                    Save to Document Vault
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGate>
  );
};
