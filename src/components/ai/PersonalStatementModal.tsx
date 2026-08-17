import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles, X, Loader2, Copy, FileEdit } from "lucide-react";
import { generatePersonalStatement, PersonalStatementDraft } from "../../utils/geminiClient";

interface PersonalStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PersonalStatementModal: React.FC<PersonalStatementModalProps> = ({ isOpen, onClose }) => {
  const [studentName, setStudentName] = useState("Jane Smith");
  const [targetUniversity, setTargetUniversity] = useState("University of Manchester");
  const [targetProgramme, setTargetProgramme] = useState("MSc Data Science & AI");
  const [academicBackground, setAcademicBackground] = useState("BSc Computer Science, 3.7 GPA");
  const [workExperience, setWorkExperience] = useState("1.5 years Software Engineer Intern");
  const [careerGoals, setCareerGoals] = useState("Lead AI Research Scientist in healthcare technologies");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PersonalStatementDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await generatePersonalStatement({
        studentName,
        targetUniversity,
        targetProgramme,
        academicBackground,
        workExperience,
        careerGoals,
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Failed to generate Personal Statement.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.statementContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl w-full max-w-2xl max-h-[85vh] my-auto flex flex-col shadow-2xl overflow-hidden text-xs">
        <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between bg-emerald-500/10">
          <div className="flex items-center space-x-2">
            <FileEdit className="w-5 h-5 text-emerald-400" />
            <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
              AI Personal Statement & SOP Generator (Gemini 2.0)
            </h3>
          </div>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">Target University</label>
              <input
                type="text"
                value={targetUniversity}
                onChange={(e) => setTargetUniversity(e.target.value)}
                className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded text-xs text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">Target Programme</label>
              <input
                type="text"
                value={targetProgramme}
                onChange={(e) => setTargetProgramme(e.target.value)}
                className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded text-xs text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">Academic Qualification</label>
              <input
                type="text"
                value={academicBackground}
                onChange={(e) => setAcademicBackground(e.target.value)}
                className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded text-xs text-[var(--text-primary)]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">Work / Research Experience</label>
              <input
                type="text"
                value={workExperience}
                onChange={(e) => setWorkExperience(e.target.value)}
                className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded text-xs text-[var(--text-primary)]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">Career Ambitions</label>
              <input
                type="text"
                value={careerGoals}
                onChange={(e) => setCareerGoals(e.target.value)}
                className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded text-xs text-[var(--text-primary)]"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{loading ? "Drafting SOP..." : "Draft SOP with AI"}</span>
              </button>
            </div>
          </form>

          {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">{error}</div>}

          {result && (
            <div className="bg-[var(--bg-input)] border border-[var(--border-default)] p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
                <span className="font-bold text-emerald-400">{result.title}</span>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center space-x-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-semibold"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copied ? "Copied!" : "Copy Text"}</span>
                </button>
              </div>

              <div className="whitespace-pre-wrap text-[var(--text-primary)] leading-relaxed font-sans text-xs bg-[var(--bg-card)] p-3 rounded border border-[var(--border-default)] max-h-60 overflow-y-auto">
                {result.statementContent}
              </div>

              <div className="text-[10px] text-[var(--text-secondary)] italic">
                AI-Generated Draft • Human review and personalization required before university submission.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
