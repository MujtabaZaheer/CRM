import React from "react";
import { BookOpen, CheckCircle, Award } from "lucide-react";
import { LanguageTestData, EnglishTestType } from "../../../types/agentApplication";

interface StepLanguageTestsProps {
  data: LanguageTestData;
  onChange: (updated: Partial<LanguageTestData>) => void;
  errors?: Record<string, string>;
}

export const StepLanguageTests: React.FC<StepLanguageTestsProps> = ({ data, onChange, errors = {} }) => {
  const requiresSubscores = [
    "IELTS Academic",
    "IELTS Indicator",
    "TOEFL iBT",
    "PTE Academic",
    "Duolingo (DET)",
  ].includes(data.englishProficiencyStatus);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* SECTION 1: ENGLISH PROFICIENCY STATUS */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl space-y-4 shadow-sm">
        <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          English Language Proficiency Assessment
        </h3>
        <p className="text-xs text-[var(--text-secondary)]">
          UK, Australian, and US universities require standardized proof of English proficiency unless granted waiver through Medium of Instruction (MOI).
        </p>

        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">
            English Proficiency Test Type / Waiver *
          </label>
          <select
            value={data.englishProficiencyStatus}
            onChange={(e) => onChange({ englishProficiencyStatus: e.target.value as EnglishTestType })}
            className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="IELTS Academic">IELTS Academic (UK VI / Standard)</option>
            <option value="IELTS Indicator">IELTS Indicator / Online</option>
            <option value="TOEFL iBT">TOEFL iBT (Internet-based)</option>
            <option value="PTE Academic">Pearson PTE Academic</option>
            <option value="Duolingo (DET)">Duolingo English Test (DET)</option>
            <option value="Medium of Instruction (MOI) Certificate">Medium of Instruction (MOI) Waiver</option>
            <option value="Exempt / Not Yet Taken">Exempt / Test Scheduled Soon</option>
          </select>
        </div>

        {requiresSubscores && (
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-4">
            <h4 className="font-semibold text-xs text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              Score Breakdown & TRF Identification
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[11px] text-[var(--text-secondary)] mb-1 font-bold">Overall Score / Band *</label>
                <input
                  type="text"
                  value={data.overallBand || ""}
                  onChange={(e) => onChange({ overallBand: e.target.value })}
                  placeholder="e.g. 7.0 / 105"
                  className={`w-full p-2 bg-[var(--bg-input)] border rounded-xl text-xs text-[var(--text-primary)] font-bold focus:outline-none focus:border-emerald-500 ${
                    errors.overallBand ? "border-rose-500" : "border-[var(--border-default)]"
                  }`}
                />
                {errors.overallBand && <p className="text-[10px] text-rose-400 mt-1">{errors.overallBand}</p>}
              </div>

              <div>
                <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Listening</label>
                <input
                  type="text"
                  value={data.listening || ""}
                  onChange={(e) => onChange({ listening: e.target.value })}
                  placeholder="e.g. 7.5"
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Reading</label>
                <input
                  type="text"
                  value={data.reading || ""}
                  onChange={(e) => onChange({ reading: e.target.value })}
                  placeholder="e.g. 6.5"
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Writing</label>
                <input
                  type="text"
                  value={data.writing || ""}
                  onChange={(e) => onChange({ writing: e.target.value })}
                  placeholder="e.g. 6.5"
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Speaking</label>
                <input
                  type="text"
                  value={data.speaking || ""}
                  onChange={(e) => onChange({ speaking: e.target.value })}
                  placeholder="e.g. 7.0"
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Test Date</label>
                <input
                  type="date"
                  value={data.testDate || ""}
                  onChange={(e) => onChange({ testDate: e.target.value })}
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
                  TRF / Registration Reference Number
                </label>
                <input
                  type="text"
                  value={data.trfReference || ""}
                  onChange={(e) => onChange({ trfReference: e.target.value })}
                  placeholder="e.g. 24PK001234MAHA001A"
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs font-mono uppercase text-[var(--text-primary)]"
                />
              </div>
            </div>
          </div>
        )}

        {data.englishProficiencyStatus === "Medium of Instruction (MOI) Certificate" && (
          <div className="p-3.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-300">
            <strong>MOI Waiver Note:</strong> You must attach the official English Medium of Instruction letter issued on official university letterhead by the Registrar in Step 6.
          </div>
        )}
      </div>

      {/* SECTION 2: STANDARDIZED TESTS (GRE, GMAT, SAT) */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            Other Standardized Tests (GRE / GMAT / SAT)
          </h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.hasStandardizedTest}
              onChange={(e) => onChange({ hasStandardizedTest: e.target.checked })}
              className="w-4 h-4 text-emerald-500 rounded border-[var(--border-default)]"
            />
            <span className="text-xs font-semibold text-[var(--text-primary)]">Student has taken GRE / GMAT / SAT</span>
          </label>
        </div>

        {data.hasStandardizedTest && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl">
            <div>
              <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Standardized Test Type</label>
              <select
                value={data.standardizedTestType || "GRE"}
                onChange={(e) => onChange({ standardizedTestType: e.target.value as any })}
                className="w-full p-2 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
              >
                <option value="GRE">GRE General Test</option>
                <option value="GMAT">GMAT Focus / Traditional</option>
                <option value="SAT">SAT Reasoning</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Total Score</label>
              <input
                type="text"
                value={data.standardizedScore || ""}
                onChange={(e) => onChange({ standardizedScore: e.target.value })}
                placeholder="e.g. 318 (V: 156, Q: 162)"
                className="w-full p-2 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Test Date</label>
              <input
                type="date"
                value={data.standardizedTestDate || ""}
                onChange={(e) => onChange({ standardizedTestDate: e.target.value })}
                className="w-full p-2 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
