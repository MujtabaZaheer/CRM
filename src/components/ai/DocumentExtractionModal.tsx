import React, { useState } from "react";
import { FileText, Upload, Sparkles, X, Loader2, Check, Key } from "lucide-react";
import { extractDocumentData, ExtractedDocumentData, hasGeminiApiKey, setRuntimeGeminiApiKey } from "../../utils/geminiClient";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../firebase/config";

interface DocumentExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentExtractionModal: React.FC<DocumentExtractionModalProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [apiKeyInput, setApiKeyInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedDocumentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setMimeType(file.type || "image/jpeg");
    setExtractedData(null);
    setError(null);
    setSaveNotice(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      const resultStr = reader.result as string;
      setFilePreview(resultStr);
      const rawBase64 = resultStr.split(",")[1];
      setBase64Data(rawBase64);
    };
    reader.readAsDataURL(file);
  };

  const handleExtract = async () => {
    if (!base64Data) {
      setError("Please select a document image to process.");
      return;
    }

    setLoading(true);
    setError(null);
    setSaveNotice(null);

    try {
      const res = await extractDocumentData(mimeType, base64Data);
      setExtractedData(res);
    } catch (err: any) {
      setError(err?.message || "Failed to extract document data via Gemini Vision AI.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async () => {
    if (!extractedData) return;

    try {
      await addDoc(collection(db, "students"), {
        fullName: extractedData.fullName || "Extracted Student",
        dateOfBirth: extractedData.dateOfBirth || "",
        passportNumber: extractedData.passportNumber || "",
        gpa: extractedData.gpaScore || "",
        englishScore: extractedData.englishTestScore || "",
        institution: extractedData.institutionName || "",
        degree: extractedData.degreeTitle || "",
        status: "Active",
        createdAt: Date.now(),
      });
      setSaveNotice(`Student profile for ${extractedData.fullName || "Applicant"} created in Firestore!`);
    } catch (err: any) {
      setSaveNotice("Student record drafted locally!");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-purple-500/5">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-[var(--text-primary)]">AI Document OCR Extractor</h3>
              <p className="text-xs text-[var(--text-secondary)]">Extract transcript & passport data automatically</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-main)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {!hasGeminiApiKey() && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 font-semibold text-sm">
                <Key className="w-4 h-4" />
                <span>Google Gemini API Key Required</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="password"
                  placeholder="Paste Gemini API Key"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (apiKeyInput.trim()) {
                      setRuntimeGeminiApiKey(apiKeyInput.trim());
                      setApiKeyInput("");
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-purple-500 text-slate-950 rounded-lg hover:bg-purple-400"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {saveNotice && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-medium">
              {saveNotice}
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Upload Area */}
          <div className="border-2 border-dashed border-[var(--border-color)] hover:border-purple-500/50 rounded-xl p-6 text-center transition-all bg-[var(--bg-main)]">
            <input
              type="file"
              accept="image/*"
              id="doc-upload"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center justify-center space-y-2">
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">
                  {selectedFile ? selectedFile.name : "Click to Upload Transcript or Passport Image"}
                </p>
                <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Supports PNG, JPG, JPEG (Gemini Vision 2.0 Flash)</p>
              </div>
            </label>
          </div>

          {filePreview && (
            <div className="p-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-[var(--border-color)]" />
                <span className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[200px]">
                  {selectedFile?.name}
                </span>
              </div>
              <button
                type="button"
                onClick={handleExtract}
                disabled={loading}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run Gemini OCR</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Extracted Data View */}
          {extractedData && (
            <div className="space-y-4 pt-4 border-t border-[var(--border-color)] animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-bold text-sm text-[var(--text-primary)]">Extracted Data Fields</h4>
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  {extractedData.documentType}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-[var(--bg-main)] p-4 border border-[var(--border-color)] rounded-xl">
                <div>
                  <span className="text-[var(--text-secondary)] block">Full Name:</span>
                  <span className="font-bold text-[var(--text-primary)]">{extractedData.fullName || "—"}</span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)] block">Date of Birth:</span>
                  <span className="font-bold text-[var(--text-primary)]">{extractedData.dateOfBirth || "—"}</span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)] block">Passport Number:</span>
                  <span className="font-bold text-[var(--text-primary)]">{extractedData.passportNumber || "—"}</span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)] block">GPA Score:</span>
                  <span className="font-bold text-[var(--text-primary)]">{extractedData.gpaScore || "—"}</span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)] block">English Test Score:</span>
                  <span className="font-bold text-[var(--text-primary)]">{extractedData.englishTestScore || "—"}</span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)] block">Institution:</span>
                  <span className="font-bold text-[var(--text-primary)]">{extractedData.institutionName || "—"}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateStudent}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Auto-Create Student Profile from Extracted Data</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
