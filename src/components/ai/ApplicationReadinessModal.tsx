import React, { useState } from "react";
import { Sparkles, X, Loader2, Award } from "lucide-react";
import { auditApplicationReadiness, ApplicationReadinessReport } from "../../utils/geminiClient";

interface ApplicationReadinessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApplicationReadinessModal: React.FC<ApplicationReadinessModalProps> = ({ isOpen, onClose }) => {
  const [studentName, setStudentName] = useState("Jane Smith");
  const [programmeName, setProgrammeName] = useState("MSc Data Science & Artificial Intelligence");
  const [gpa] = useState("3.6 / 4.0");
  const [englishScore] = useState("IELTS 7.5");

  const [hasPassport, setHasPassport] = useState(true);
  const [hasTranscript, setHasTranscript] = useState(true);
  const [hasEnglishTest, setHasEnglishTest] = useState(true);
  const [hasSOP, setHasSOP] = useState(false);
  const [hasFinancialProof, setHasFinancialProof] = useState(true);

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ApplicationReadinessReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await auditApplicationReadiness({
        studentName,
        programmeName,
        hasPassport,
        hasTranscript,
        hasEnglishTest,
        hasSOP,
        hasFinancialProof,
        gpa,
        englishScore,
      });
      setReport(res);
    } catch (err: any) {
      setError(err.message || "Failed to audit application readiness.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in text-xs">
        <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between bg-sky-500/10">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-sky-400" />
            <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
              AI Application Readiness & Document Auditor
            </h3>
          </div>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <form onSubmit={handleAudit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">Student Name</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded text-xs text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">Target Programme</label>
                <input
                  type="text"
                  value={programmeName}
                  onChange={(e) => setProgrammeName(e.target.value)}
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded text-xs text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div className="p-3 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg space-y-2">
              <span className="font-bold text-[var(--text-primary)]">Uploaded Compliance Checklists</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" checked={hasPassport} onChange={(e) => setHasPassport(e.target.checked)} />
                  <span>Passport Copy</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" checked={hasTranscript} onChange={(e) => setHasTranscript(e.target.checked)} />
                  <span>Academic Transcript</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" checked={hasEnglishTest} onChange={(e) => setHasEnglishTest(e.target.checked)} />
                  <span>IELTS/TOEFL</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" checked={hasSOP} onChange={(e) => setHasSOP(e.target.checked)} />
                  <span>Statement of Purpose</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" checked={hasFinancialProof} onChange={(e) => setHasFinancialProof(e.target.checked)} />
                  <span>Financial Proof</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{loading ? "Auditing Application..." : "Run AI Audit"}</span>
              </button>
            </div>
          </form>

          {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">{error}</div>}

          {report && (
            <div className="bg-[var(--bg-input)] border border-[var(--border-default)] p-4 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl font-bold font-mono text-emerald-400">{report.readinessScore}%</div>
                  <div>
                    <div className="font-bold text-[var(--text-primary)]">Readiness Score</div>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-sky-500/10 text-sky-400 border border-sky-500/30">
                      {report.status}
                    </span>
                  </div>
                </div>
              </div>

              {report.missingRequirements.length > 0 && (
                <div className="space-y-1">
                  <div className="font-bold text-rose-400">Missing Requirements</div>
                  <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-0.5">
                    {report.missingRequirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {report.recommendations.length > 0 && (
                <div className="space-y-1">
                  <div className="font-bold text-sky-400">Action Plan to Submit</div>
                  <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-0.5">
                    {report.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
