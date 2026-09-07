import React, { useState, useRef } from "react";
import {
  FileText,
  UploadCloud,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  FileCode,
  Zap,
} from "lucide-react";
import {
  extractStudentCVDetails,
  ExtractedStudentCVData,
  getSampleStudentCVText,
} from "../../utils/cvExtractor";

interface StudentCVUploaderProps {
  onExtracted: (data: ExtractedStudentCVData) => void;
  title?: string;
  subtitle?: string;
}

export const StudentCVUploader: React.FC<StudentCVUploaderProps> = ({
  onExtracted,
  title = "Auto-Fill with AI from CV / Resume",
  subtitle = "Upload or drop your CV (PDF, DOCX, TXT, Image) to extract your personal details and academic history instantly.",
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extractedSummary, setExtractedSummary] = useState<ExtractedStudentCVData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setError(null);
    setLoading(true);
    setExtractedSummary(null);

    try {
      const data = await extractStudentCVDetails(file);
      setExtractedSummary(data);
      onExtracted(data);
    } catch (err: any) {
      console.error("CV Extraction error:", err);
      setError(err?.message || "Could not parse document. Please check the file format or fill manually.");
    } finally {
      setLoading(false);
    }
  };

  const processText = async (textToProcess: string, label: string = "Pasted_Resume.txt") => {
    if (!textToProcess.trim()) {
      setError("Please provide CV or resume text.");
      return;
    }

    setError(null);
    setLoading(true);
    setExtractedSummary(null);
    setShowPasteModal(false);

    try {
      const data = await extractStudentCVDetails(textToProcess, label);
      setExtractedSummary(data);
      onExtracted(data);
    } catch (err: any) {
      console.error("Text CV Extraction error:", err);
      setError(err?.message || "Could not parse text. Please fill manually.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    const sampleText = getSampleStudentCVText();
    processText(sampleText, "Sample_Student_CV.txt");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-emerald-950/50 via-zinc-900/70 to-teal-950/50 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-xl backdrop-blur-md">
      {/* Ambient Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-heading flex items-center gap-1.5">
              <span>{title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold uppercase tracking-wider">
                AI Powered
              </span>
            </h3>
            <p className="text-xs text-zinc-400">{subtitle}</p>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={handleQuickDemo}
            className="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
            title="Auto-fill with sample student CV"
          >
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>⚡ Try Sample CV</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPasteModal(true)}
            className="text-xs text-zinc-400 hover:text-emerald-400 font-medium flex items-center gap-1 transition-colors underline cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Paste text</span>
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      {loading ? (
        <div className="py-7 px-4 bg-zinc-950/70 border border-emerald-500/40 border-dashed rounded-xl flex flex-col items-center justify-center space-y-2 text-center">
          <Loader2 className="w-7 h-7 text-emerald-400 animate-spin" />
          <p className="text-xs font-semibold text-white">Extracting your details via AI...</p>
          <p className="text-[11px] text-zinc-400">Parsing name, email, phone, nationality, and education records</p>
        </div>
      ) : extractedSummary ? (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Details Extracted & Auto-Filled!</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setExtractedSummary(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
            >
              Upload different CV
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[11px]">
            <div className="p-2 bg-zinc-950/80 rounded-lg border border-zinc-800">
              <span className="text-zinc-500 block text-[10px]">Name</span>
              <span className="text-zinc-100 font-semibold truncate block" title={extractedSummary.fullName}>{extractedSummary.fullName || "—"}</span>
            </div>
            <div className="p-2 bg-zinc-950/80 rounded-lg border border-zinc-800">
              <span className="text-zinc-500 block text-[10px]">Email</span>
              <span className="text-zinc-100 font-semibold truncate block" title={extractedSummary.email}>{extractedSummary.email || "—"}</span>
            </div>
            <div className="p-2 bg-zinc-950/80 rounded-lg border border-zinc-800">
              <span className="text-zinc-500 block text-[10px]">Phone</span>
              <span className="text-zinc-100 font-semibold truncate block">{extractedSummary.phone || "—"}</span>
            </div>
            <div className="p-2 bg-zinc-950/80 rounded-lg border border-zinc-800">
              <span className="text-zinc-500 block text-[10px]">Country / Nat.</span>
              <span className="text-zinc-100 font-semibold truncate block">{extractedSummary.countryOfResidence || extractedSummary.nationality || "—"}</span>
            </div>
            <div className="p-2 bg-zinc-950/80 rounded-lg border border-zinc-800">
              <span className="text-zinc-500 block text-[10px]">Date of Birth</span>
              <span className="text-zinc-100 font-semibold truncate block">{extractedSummary.dob || "Not specified"}</span>
            </div>
            <div className="p-2 bg-zinc-950/80 rounded-lg border border-zinc-800">
              <span className="text-zinc-500 block text-[10px]">Qualification</span>
              <span className="text-zinc-100 font-semibold truncate block" title={extractedSummary.academicRecords?.[0]?.degreeTitle || extractedSummary.desiredStudyLevel}>
                {extractedSummary.academicRecords?.[0]?.qualification || extractedSummary.desiredStudyLevel || "—"}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              processFile(e.dataTransfer.files[0]);
            }
          }}
          className={`relative py-6 px-4 bg-zinc-950/60 hover:bg-zinc-950/80 border ${
            dragOver ? "border-emerald-400 bg-emerald-500/15 ring-2 ring-emerald-500/20" : "border-zinc-800 hover:border-emerald-500/50"
          } border-dashed rounded-xl flex flex-col items-center justify-center space-y-2 text-center transition-all duration-200 cursor-pointer group`}
        >
          {/* Native HTML5 input covering the whole area for 100% reliable click & drag-drop */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
            title="Click to select CV or drop your file here"
          />

          <div className="w-10 h-10 rounded-full bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center transition-transform group-hover:scale-110 pointer-events-none">
            <UploadCloud className="w-5 h-5" />
          </div>

          <div className="pointer-events-none space-y-0.5">
            <p className="text-xs font-semibold text-zinc-200 group-hover:text-emerald-300 transition-colors">
              Click to browse or drop your CV / Resume here
            </p>
            <p className="text-[10px] text-zinc-400">
              PDF, DOCX, TXT, or Image (auto-extracts name, email, phone & country)
            </p>
          </div>

          <div className="pointer-events-none pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-zinc-950 transition-all">
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Select CV Document</span>
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2.5 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-xs text-rose-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Paste Text Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-white font-heading">Paste CV / Resume Text</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              rows={8}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste your CV text or LinkedIn summary here..."
              className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => processText(pastedText)}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-zinc-950 rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Extract with AI</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
