import React, { useEffect, useState, useMemo } from "react";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import {
  FileText,
  Upload,
  Eye,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
} from "lucide-react";
import { db } from "../../firebase/config";
import { useAuth } from "../../contexts/AuthContext";
import { uploadStudentDocument } from "../../utils/documentStorage";

export interface VaultDocument {
  id: string;
  studentId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  filePath: string;
  fileSize?: number;
  status: "Verified" | "Pending" | "Rejected" | "Missing";
  remarks?: string;
  expiryDate?: string;
  createdAt: number;
  updatedAt?: number;
}

const REQUIRED_STANDARD_DOCS = [
  { type: "Passport", label: "International Passport (Data Page)", mandatory: true },
  { type: "Academic Transcript", label: "Official Academic Transcript", mandatory: true },
  { type: "Degree Certificate", label: "Graduation / Degree Certificate", mandatory: true },
  { type: "Statement of Purpose", label: "Statement of Purpose (SOP)", mandatory: true },
  { type: "English Language Certificate", label: "English Test Certificate (IELTS/PTE/TOEFL/Duolingo)", mandatory: false },
  { type: "Letter of Recommendation", label: "Academic / Employer Reference Letter", mandatory: false },
  { type: "CV / Resume", label: "Updated Academic & Professional CV", mandatory: false },
];

export const StudentDocumentVault: React.FC = () => {
  const { appUser, firebaseUser } = useAuth();
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Custom document upload modal
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customDocType, setCustomDocType] = useState("");
  const [customExpiryDate, setCustomExpiryDate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const uid = firebaseUser?.uid || appUser?.uid;

  const loadDocuments = async () => {
    if (!uid) return;
    try {
      const q = query(collection(db, "student_documents"), where("studentId", "==", uid));
      const snap = await getDocs(q);
      const docsList: VaultDocument[] = [];
      snap.docs.forEach((d) => {
        docsList.push({ id: d.id, ...d.data() } as VaultDocument);
      });
      setDocuments(docsList);
    } catch (err) {
      console.warn("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [uid]);

  // Upload handler for standard slots
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    if (!e.target.files || e.target.files.length === 0 || !uid) return;
    const file = e.target.files[0];
    setUploadingType(docType);
    setError(null);

    try {
      // 1. Upload to Firebase Storage
      const uploadRes = await uploadStudentDocument(uid, file);

      // 2. Save document record in Firestore
      const newDoc = {
        studentId: uid,
        studentName: appUser?.displayName || "Student",
        studentEmail: appUser?.email || "",
        documentType: docType,
        fileName: uploadRes.fileName,
        filePath: uploadRes.filePath,
        fileUrl: uploadRes.fileUrl,
        fileSize: uploadRes.fileSize,
        fileType: uploadRes.fileType,
        status: "Pending",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const ref = await addDoc(collection(db, "student_documents"), newDoc);
      setDocuments((prev) => [
        { id: ref.id, ...newDoc } as VaultDocument,
        ...prev.filter((d) => d.documentType !== docType),
      ]);
      setNotice(`Uploaded ${file.name} successfully!`);
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload document.");
    } finally {
      setUploadingType(null);
      e.target.value = "";
    }
  };

  // Delete document handler
  const handleDelete = async (docId: string) => {
    if (!window.confirm("Are you sure you want to remove this document?")) return;
    try {
      await deleteDoc(doc(db, "student_documents", docId));
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      setNotice("Document removed.");
      setTimeout(() => setNotice(null), 2500);
    } catch (err: any) {
      setError("Could not delete document.");
    }
  };

  // Custom upload modal submission
  const handleCustomUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !customDocType || !uid) return;

    setUploadingType(customDocType);
    setError(null);

    try {
      const uploadRes = await uploadStudentDocument(uid, selectedFile);
      const newDoc = {
        studentId: uid,
        studentName: appUser?.displayName || "Student",
        studentEmail: appUser?.email || "",
        documentType: customDocType.trim(),
        fileName: uploadRes.fileName,
        filePath: uploadRes.filePath,
        fileUrl: uploadRes.fileUrl,
        fileSize: uploadRes.fileSize,
        fileType: uploadRes.fileType,
        expiryDate: customExpiryDate || undefined,
        status: "Pending",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const ref = await addDoc(collection(db, "student_documents"), newDoc);
      setDocuments((prev) => [{ id: ref.id, ...newDoc } as VaultDocument, ...prev]);
      setIsCustomModalOpen(false);
      setSelectedFile(null);
      setCustomDocType("");
      setCustomExpiryDate("");
      setNotice("Document uploaded successfully.");
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploadingType(null);
    }
  };

  // Document matching metrics
  const completedStandardDocs = useMemo(() => {
    const uploadedTypes = documents.map((d) => d.documentType.toLowerCase());
    return REQUIRED_STANDARD_DOCS.filter((req) =>
      uploadedTypes.some((u) => u.includes(req.type.toLowerCase()) || req.type.toLowerCase().includes(u))
    );
  }, [documents]);

  const mandatoryCount = REQUIRED_STANDARD_DOCS.filter((r) => r.mandatory).length;
  const completedMandatoryCount = completedStandardDocs.filter((r) => r.mandatory).length;

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-7 pb-12 font-sans">
      {/* Header */}
      <header className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Student Document Vault • Firebase Storage
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white mt-1">
            Official Documents Center
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 max-w-xl">
            Upload, preview, and verify your credentials once. Uploaded files are matched automatically across your university applications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCustomModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Custom Document
          </button>
        </div>
      </header>

      {notice && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Readiness Summary Card */}
      <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">Document Compliance Status</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {completedMandatoryCount} of {mandatoryCount} mandatory admissions documents ready
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-zinc-400">Vault Readiness</span>
            <p className="text-lg font-bold text-emerald-400">
              {Math.round((completedMandatoryCount / mandatoryCount) * 100)}%
            </p>
          </div>
          <div className="w-32 bg-zinc-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.round((completedMandatoryCount / mandatoryCount) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Standard Required Slots */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-white">Standard Admissions Documents</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {REQUIRED_STANDARD_DOCS.map((req) => {
            const uploaded = documents.find(
              (d) =>
                d.documentType.toLowerCase().includes(req.type.toLowerCase()) ||
                req.type.toLowerCase().includes(d.documentType.toLowerCase())
            );

            const isUploading = uploadingType === req.type;

            return (
              <div
                key={req.type}
                className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-bold text-white">{req.label}</h3>
                    </div>
                    <span className="text-[11px] text-zinc-500">
                      {req.mandatory ? "Mandatory for Submission" : "Optional / Supplementary"}
                    </span>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      uploaded
                        ? uploaded.status === "Verified"
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                        : "bg-zinc-800 text-zinc-500 border-zinc-700"
                    }`}
                  >
                    {uploaded ? uploaded.status : "Missing"}
                  </span>
                </div>

                {uploaded && (
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 flex items-center justify-between">
                    <span className="truncate max-w-xs">{uploaded.fileName}</span>
                    {uploaded.fileSize && (
                      <span className="text-[11px] text-zinc-500">
                        {Math.round(uploaded.fileSize / 1024)} KB
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                  {uploaded ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={uploaded.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                      </a>

                      <button
                        type="button"
                        onClick={() => handleDelete(uploaded.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-rose-500/20 text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-500">No document uploaded yet</span>
                  )}

                  <label className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm">
                    {isUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        {uploaded ? "Replace" : "Upload"}
                      </>
                    )}
                    <input
                      type="file"
                      disabled={isUploading}
                      className="hidden"
                      onChange={(e) => handleUpload(e, req.type)}
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Additional / Custom Uploaded Documents */}
      {documents.some((d) => !REQUIRED_STANDARD_DOCS.some((r) => r.type === d.documentType)) && (
        <section className="space-y-4">
          <h2 className="text-base font-bold text-white">Additional Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents
              .filter((d) => !REQUIRED_STANDARD_DOCS.some((r) => r.type === d.documentType))
              .map((doc) => (
                <div key={doc.id} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{doc.documentType}</h4>
                    <p className="text-xs text-zinc-400 truncate max-w-xs">{doc.fileName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 text-xs text-zinc-300"
                    >
                      Preview
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 text-xs text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Custom Document Upload Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4 text-white shadow-2xl">
            <h3 className="text-base font-bold">Add Custom Document</h3>
            <form onSubmit={handleCustomUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Document Name / Type *</label>
                <input
                  type="text"
                  required
                  value={customDocType}
                  onChange={(e) => setCustomDocType(e.target.value)}
                  placeholder="e.g. Portfolio / Work Experience Letter"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={customExpiryDate}
                  onChange={(e) => setCustomExpiryDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Select File *</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingType !== null}
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-bold cursor-pointer disabled:opacity-50"
                >
                  {uploadingType ? "Uploading..." : "Upload Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDocumentVault;
