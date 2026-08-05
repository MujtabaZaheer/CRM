import React, { useState } from "react";
import { useCounsellorData } from "../../hooks/useCounsellorData";
import { Student } from "../../types/student";
import {
  Search,
  Plus,
  BookOpen,
  Award,
  X
} from "lucide-react";

export const CounsellorStudents: React.FC = () => {
  const { students, createApplication, loading } = useCounsellorData();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Application Modal state
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [targetStudent, setTargetStudent] = useState<Student | null>(null);
  const [universityName, setUniversityName] = useState("");
  const [programmeName, setProgrammeName] = useState("");
  const [intake, setIntake] = useState("Fall 2026");

  const filteredStudents = students.filter((s) =>
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nationality.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLaunchAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudent || !universityName || !programmeName) return;

    await createApplication(targetStudent.id, targetStudent.fullName, universityName, programmeName, intake);
    alert(`Application created for ${targetStudent.fullName} at ${universityName}!`);
    setIsAppModalOpen(false);
    setUniversityName("");
    setProgrammeName("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[var(--text-muted)] font-mono">Loading active student profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">My Active Students</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Student academic portfolios, English proficiency credentials, and university application readiness scores.
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-[var(--bg-card)] border border-[var(--border-default)] px-3 py-1.5 sq-card text-xs">
          <span className="text-[var(--text-muted)]">Active Roster:</span>
          <span className="font-mono font-bold text-teal-400">{students.length}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Search students by name, email, nationality..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none focus:border-teal-500/50"
        />
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border-default)] sq-card">
            No active student profiles found. Convert leads to build your student roster.
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-[var(--bg-card)] border border-[var(--border-default)] hover:border-teal-500/30 sq-card p-5 space-y-4 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 sq-avatar bg-gradient-to-tr from-teal-500 to-emerald-400 text-zinc-950 font-bold flex items-center justify-center text-lg shadow-md shadow-teal-500/20">
                      {student.fullName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold font-heading text-[var(--text-primary)]">{student.fullName}</h3>
                      <p className="text-[11px] text-[var(--text-muted)]">{student.email}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 sq-badge bg-teal-500/10 text-teal-400 border border-teal-500/20 font-mono text-[10px]">
                    {student.profileCompleteness}% Complete
                  </span>
                </div>

                {/* Info badges */}
                <div className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-muted)]">Nationality:</span>
                    <span className="font-mono text-[var(--text-primary)]">{student.nationality}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-muted)]">Destination:</span>
                    <span className="font-mono text-emerald-400">{student.preferredDestination || "Global"}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-muted)]">English Test:</span>
                    <span className="font-mono text-sky-400">
                      {student.englishProficiency
                        ? `${student.englishProficiency.testType} (${student.englishProficiency.overallScore})`
                        : "Pending"}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[var(--bg-elevated)] h-1.5 rounded-full overflow-hidden border border-[var(--border-default)]">
                  <div
                    className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full"
                    style={{ width: `${student.profileCompleteness}%` }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-default)] flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedStudent(student)}
                  className="px-3 py-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-default)] sq-btn text-xs flex-1"
                >
                  View Profile
                </button>
                <button
                  onClick={() => {
                    setTargetStudent(student);
                    setIsAppModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold sq-btn text-xs flex-1 inline-flex items-center justify-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New App</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Student Details Drawer / Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-modal w-full max-w-2xl p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 sq-avatar bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                  {selectedStudent.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading text-[var(--text-primary)]">{selectedStudent.fullName}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{selectedStudent.email} | {selectedStudent.phone}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-[var(--bg-elevated)] sq-card border border-[var(--border-default)] space-y-1">
                <span className="text-[var(--text-muted)] block text-[10px]">Nationality</span>
                <span className="font-semibold text-[var(--text-primary)]">{selectedStudent.nationality}</span>
              </div>
              <div className="p-3 bg-[var(--bg-elevated)] sq-card border border-[var(--border-default)] space-y-1">
                <span className="text-[var(--text-muted)] block text-[10px]">Country of Residence</span>
                <span className="font-semibold text-[var(--text-primary)]">{selectedStudent.countryOfResidence}</span>
              </div>
              <div className="p-3 bg-[var(--bg-elevated)] sq-card border border-[var(--border-default)] space-y-1">
                <span className="text-[var(--text-muted)] block text-[10px]">Passport Number</span>
                <span className="font-semibold font-mono text-[var(--text-primary)]">
                  {selectedStudent.passportNumber || "Not recorded"}
                </span>
              </div>
              <div className="p-3 bg-[var(--bg-elevated)] sq-card border border-[var(--border-default)] space-y-1">
                <span className="text-[var(--text-muted)] block text-[10px]">Passport Expiry</span>
                <span className="font-semibold font-mono text-[var(--text-primary)]">
                  {selectedStudent.passportExpiry || "Not recorded"}
                </span>
              </div>
            </div>

            {/* Academic History */}
            <div className="space-y-2 pt-2 border-t border-[var(--border-default)]">
              <h4 className="text-xs font-bold font-heading text-[var(--text-primary)] flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-teal-400" />
                <span>Academic Qualifications</span>
              </h4>

              {(!selectedStudent.academicHistory || selectedStudent.academicHistory.length === 0) ? (
                <p className="text-xs text-[var(--text-muted)] italic">No academic history records appended.</p>
              ) : (
                <div className="space-y-2">
                  {selectedStudent.academicHistory.map((acad, idx) => (
                    <div key={idx} className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card text-xs flex justify-between">
                      <div>
                        <div className="font-bold text-[var(--text-primary)]">{acad.degreeTitle} ({acad.qualification})</div>
                        <div className="text-[var(--text-muted)]">{acad.institution} - {acad.country}</div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-teal-400 font-bold">{acad.gradeGpa}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">Class of {acad.completionYear}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* English Test */}
            <div className="space-y-2 pt-2 border-t border-[var(--border-default)]">
              <h4 className="text-xs font-bold font-heading text-[var(--text-primary)] flex items-center space-x-2">
                <Award className="w-4 h-4 text-sky-400" />
                <span>English Language Proficiency</span>
              </h4>
              {selectedStudent.englishProficiency ? (
                <div className="p-3 bg-sky-500/10 border border-sky-500/20 sq-card text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-sky-400">{selectedStudent.englishProficiency.testType} Score</span>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      Test Date: {selectedStudent.englishProficiency.testDate || "N/A"}
                    </p>
                  </div>
                  <div className="text-lg font-bold font-mono text-sky-400">
                    {selectedStudent.englishProficiency.overallScore}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[var(--text-muted)] italic">English test results pending upload.</p>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[var(--border-default)]">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2 bg-[var(--bg-elevated)] text-[var(--text-secondary)] sq-btn text-xs font-medium"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Launch Application Modal */}
      {isAppModalOpen && targetStudent && (
        <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-modal w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold font-heading text-[var(--text-primary)] border-b border-[var(--border-default)] pb-3">
              Launch Application for {targetStudent.fullName}
            </h3>

            <form onSubmit={handleLaunchAppSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[var(--text-secondary)] mb-1">Target University *</label>
                <input
                  type="text"
                  required
                  value={universityName}
                  onChange={(e) => setUniversityName(e.target.value)}
                  placeholder="e.g. University of Toronto"
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1">Target Programme *</label>
                <input
                  type="text"
                  required
                  value={programmeName}
                  onChange={(e) => setProgrammeName(e.target.value)}
                  placeholder="e.g. MSc Computer Science"
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1">Target Intake *</label>
                <select
                  value={intake}
                  onChange={(e) => setIntake(e.target.value)}
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                >
                  <option value="Fall 2026">Fall 2026</option>
                  <option value="Winter 2027">Winter 2027</option>
                  <option value="Spring 2027">Spring 2027</option>
                  <option value="Fall 2027">Fall 2027</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setIsAppModalOpen(false)}
                  className="px-4 py-2 bg-[var(--bg-elevated)] text-[var(--text-secondary)] sq-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 text-zinc-950 font-bold sq-btn shadow-lg shadow-emerald-500/20"
                >
                  Create Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
