import React, { useState } from "react";
import { Sparkles, X, Loader2, Key, Award, GraduationCap, DollarSign, Globe } from "lucide-react";
import { generateCourseRecommendations, CourseRecommendation, hasGeminiApiKey, setRuntimeGeminiApiKey } from "../../utils/geminiClient";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../firebase/config";

interface CourseRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStudentName?: string;
}

export const CourseRecommendationModal: React.FC<CourseRecommendationModalProps> = ({
  isOpen,
  onClose,
  initialStudentName = "",
}) => {
  const [studentName, setStudentName] = useState(initialStudentName || "Jane Smith");
  const [gpa, setGpa] = useState("3.6 / 4.0 (Bachelor of Science)");
  const [englishScore, setEnglishScore] = useState("IELTS 7.5 (L:7.5, R:8.0, W:7.0, S:7.0)");
  const [preferredCountry, setPreferredCountry] = useState("United Kingdom");
  const [fieldOfStudy, setFieldOfStudy] = useState("Computer Science & Data Analytics");
  const [maxBudget, setMaxBudget] = useState("25000");
  const [apiKeyInput, setApiKeyInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CourseRecommendation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appSavedNotice, setAppSavedNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      setRuntimeGeminiApiKey(apiKeyInput.trim());
      setApiKeyInput("");
      setError(null);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    setAppSavedNotice(null);

    try {
      const recs = await generateCourseRecommendations({
        studentName,
        gpa,
        englishScore,
        preferredCountry,
        fieldOfStudy,
        maxBudgetUSD: maxBudget,
      });
      setResults(recs);
    } catch (err: any) {
      setError(err?.message || "Failed to generate recommendations. Check API Key.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApplication = async (rec: CourseRecommendation) => {
    try {
      await addDoc(collection(db, "applications"), {
        studentName,
        universityName: rec.universityName,
        programmeName: rec.programmeName,
        country: rec.country,
        stage: "Drafting",
        createdAt: Date.now(),
        tuitionFee: rec.estimatedTuition,
        notes: `AI Recommended Match (${rec.matchScore}% match score). Rationale: ${rec.rationale}`,
      });
      setAppSavedNotice(`Application for ${rec.universityName} saved to Firestore!`);
    } catch (err: any) {
      setAppSavedNotice(`Saved application locally (Firestore draft)!`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-emerald-500/5">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-[var(--text-primary)]">AI Course Matcher</h3>
              <p className="text-xs text-[var(--text-secondary)]">Powered by Google Gemini 2.0 Flash (Client-Side)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-main)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* API Key Banner if Missing */}
          {!hasGeminiApiKey() && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 font-semibold text-sm">
                <Key className="w-4 h-4" />
                <span>Google Gemini API Key Required (Free Tier)</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Get a free key at <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="underline text-emerald-400">aistudio.google.com</a> and enter it below or set <code className="text-xs bg-black/30 px-1 py-0.5 rounded text-emerald-400">VITE_GEMINI_API_KEY</code> in .env.
              </p>
              <div className="flex items-center space-x-2">
                <input
                  type="password"
                  placeholder="Paste Gemini API Key (AIzaSy...)"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-500 text-slate-950 rounded-lg hover:bg-emerald-400"
                >
                  Save Key
                </button>
              </div>
            </div>
          )}

          {appSavedNotice && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-medium flex items-center justify-between">
              <span>{appSavedNotice}</span>
              <button onClick={() => setAppSavedNotice(null)} className="text-emerald-400 hover:underline">Dismiss</button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Student Name</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Academic Qualification / GPA</label>
              <input
                type="text"
                value={gpa}
                onChange={(e) => setGpa(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">English Score</label>
              <input
                type="text"
                value={englishScore}
                onChange={(e) => setEnglishScore(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Preferred Country</label>
              <select
                value={preferredCountry}
                onChange={(e) => setPreferredCountry(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              >
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="United States">United States</option>
                <option value="Germany">Germany</option>
                <option value="Ireland">Ireland</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Field of Study</label>
              <input
                type="text"
                value={fieldOfStudy}
                onChange={(e) => setFieldOfStudy(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Max Annual Budget ($ USD)</label>
              <input
                type="number"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="sm:col-span-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing student profile with Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate AI Recommended Courses</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Results List */}
          {results && (
            <div className="space-y-4 pt-4 border-t border-[var(--border-color)]">
              <h4 className="font-heading font-bold text-sm text-[var(--text-primary)] flex items-center space-x-2">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>AI Recommended Matches ({results.length})</span>
              </h4>

              <div className="space-y-3">
                {results.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl hover:border-emerald-500/40 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-bold text-sm text-[var(--text-primary)] flex items-center space-x-2">
                          <GraduationCap className="w-4 h-4 text-emerald-400" />
                          <span>{rec.universityName}</span>
                        </h5>
                        <p className="text-xs font-semibold text-emerald-400 mt-0.5">{rec.programmeName}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          {rec.matchScore}% Match
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{rec.rationale}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center space-x-1">
                          <Globe className="w-3.5 h-3.5 text-sky-400" />
                          <span>{rec.country}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{rec.estimatedTuition}</span>
                        </span>
                      </div>
                      <button
                        onClick={() => handleCreateApplication(rec)}
                        className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 text-xs font-semibold rounded-lg transition-all"
                      >
                        + Draft Application
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
