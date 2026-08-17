import React, { useState } from "react";
import { createPortal } from "react-dom";
import { ShieldCheck, AlertTriangle, X, Loader2, CheckCircle2, Key } from "lucide-react";
import { calculateVisaProbability, VisaRiskAnalysis, hasGeminiApiKey, setRuntimeGeminiApiKey } from "../../utils/geminiClient";

interface VisaProbabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStudentName?: string;
}

export const VisaProbabilityModal: React.FC<VisaProbabilityModalProps> = ({
  isOpen,
  onClose,
  initialStudentName = "",
}) => {
  const [studentName, setStudentName] = useState(initialStudentName || "Michael Chen");
  const [country, setCountry] = useState("Canada");
  const [financialProofUSD, setFinancialProofUSD] = useState("35000");
  const [studyGapYears, setStudyGapYears] = useState("1");
  const [previousRejections, setPreviousRejections] = useState("None");
  const [interviewReadiness, setInterviewReadiness] = useState("High - Strong SOP and verified bank statement");
  const [apiKeyInput, setApiKeyInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<VisaRiskAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      setRuntimeGeminiApiKey(apiKeyInput.trim());
      setApiKeyInput("");
      setError(null);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const res = await calculateVisaProbability({
        studentName,
        country,
        financialProofUSD,
        studyGapYears,
        previousRejections,
        interviewReadiness,
      });
      setAnalysis(res);
    } catch (err: any) {
      setError(err?.message || "Failed to calculate visa probability.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-sky-500/5">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-[var(--text-primary)]">AI Visa Success Calculator</h3>
              <p className="text-xs text-[var(--text-secondary)]">Automated risk assessment powered by Gemini 2.0 Flash</p>
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
                  className="flex-1 px-3 py-1.5 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="px-3 py-1.5 text-xs font-semibold bg-sky-500 text-slate-950 rounded-lg hover:bg-sky-400"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleAnalyze} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Applicant Name</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Destination Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-sky-500"
              >
                <option value="Canada">Canada</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Australia">Australia</option>
                <option value="United States">United States</option>
                <option value="Germany">Germany</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Bank Proof ($ USD Balance)</label>
              <input
                type="number"
                value={financialProofUSD}
                onChange={(e) => setFinancialProofUSD(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Study Gap (Years)</label>
              <input
                type="number"
                value={studyGapYears}
                onChange={(e) => setStudyGapYears(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Previous Rejections</label>
              <input
                type="text"
                value={previousRejections}
                onChange={(e) => setPreviousRejections(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Readiness / SOP Notes</label>
              <input
                type="text"
                value={interviewReadiness}
                onChange={(e) => setInterviewReadiness(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="sm:col-span-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Calculating Visa Risk Score...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Evaluate Visa Success Probability</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {analysis && (
            <div className="space-y-4 pt-4 border-t border-[var(--border-color)] animate-fade-in">
              <div className="p-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[var(--text-secondary)]">Approval Probability</p>
                  <p className="text-3xl font-extrabold font-heading text-sky-400 mt-1">
                    {analysis.probabilityScore}%
                  </p>
                </div>
                <div>
                  <span
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${
                      analysis.riskLevel === "Low"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : analysis.riskLevel === "Medium"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}
                  >
                    {analysis.riskLevel} Risk Level
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-xs font-bold text-[var(--text-primary)] flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Identified Risk Factors</span>
                </h5>
                <ul className="space-y-1 pl-5 list-disc text-xs text-[var(--text-secondary)]">
                  {analysis.riskFactors.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h5 className="text-xs font-bold text-[var(--text-primary)] flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Actionable Recommendations</span>
                </h5>
                <ul className="space-y-1 pl-5 list-disc text-xs text-[var(--text-secondary)]">
                  {analysis.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
