import React from "react";
import { GraduationCap, Plus, Trash2, AlertTriangle, Award } from "lucide-react";
import { AcademicBackgroundData, AcademicHistoryEntry, AcademicGapEntry } from "../../../types/agentApplication";

interface StepAcademicHistoryProps {
  data: AcademicBackgroundData;
  onChange: (updated: Partial<AcademicBackgroundData>) => void;
  errors?: Record<string, string>;
}

export const StepAcademicHistory: React.FC<StepAcademicHistoryProps> = ({ data, onChange, errors = {} }) => {
  const addQualification = () => {
    const newEntry: AcademicHistoryEntry = {
      id: `qual-${Date.now()}`,
      level: "Bachelor's",
      institutionName: "",
      country: "",
      degreeEarned: "",
      fieldOfStudy: "",
      startDate: "",
      completionDate: "",
      gradingScale: "GPA 4.0 Scale",
      obtainedScore: "",
    };
    onChange({
      qualifications: [...data.qualifications, newEntry],
    });
  };

  const removeQualification = (id: string) => {
    if (data.qualifications.length <= 1) {
      alert("At least one academic qualification is required.");
      return;
    }
    onChange({
      qualifications: data.qualifications.filter((q) => q.id !== id),
    });
  };

  const updateQualification = (id: string, field: keyof AcademicHistoryEntry, val: any) => {
    onChange({
      qualifications: data.qualifications.map((q) => (q.id === id ? { ...q, [field]: val } : q)),
    });
  };

  const addGapEntry = () => {
    const newGap: AcademicGapEntry = {
      startDate: "",
      endDate: "",
      explanation: "",
      activityType: "Employment",
      employerOrDetails: "",
    };
    onChange({
      gapDetails: [...(data.gapDetails || []), newGap],
    });
  };

  const removeGapEntry = (idx: number) => {
    const list = [...(data.gapDetails || [])];
    list.splice(idx, 1);
    onChange({ gapDetails: list });
  };

  const updateGapEntry = (idx: number, field: keyof AcademicGapEntry, val: any) => {
    const list = [...(data.gapDetails || [])];
    list[idx] = { ...list[idx], [field]: val };
    onChange({ gapDetails: list });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* SECTION 1: QUALIFICATIONS LIST */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              Academic History & Degree Qualifications
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              List all secondary and higher education qualifications in chronological order.
            </p>
          </div>
          <button
            type="button"
            onClick={addQualification}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl text-xs transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Qualification</span>
          </button>
        </div>

        {errors.qualifications && <p className="text-xs text-rose-400">{errors.qualifications}</p>}

        <div className="space-y-4">
          {data.qualifications.map((qual, index) => (
            <div
              key={qual.id}
              className="p-4 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl space-y-3 relative group"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
                <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  Qualification #{index + 1}
                </span>
                {data.qualifications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQualification(qual.id)}
                    className="text-[var(--text-muted)] hover:text-rose-400 p-1 transition-colors cursor-pointer"
                    title="Remove Qualification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Education Level *</label>
                  <select
                    value={qual.level}
                    onChange={(e) => updateQualification(qual.id, "level", e.target.value)}
                    className="w-full p-2 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="High School / O-Levels">High School / O-Levels</option>
                    <option value="A-Levels / Intermediate">A-Levels / Intermediate / 12th</option>
                    <option value="Bachelor's">Bachelor's Degree (3 or 4 Years)</option>
                    <option value="Master's">Master's Degree / Postgrad</option>
                    <option value="Other">Other Diploma / Certification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Institution Name *</label>
                  <input
                    type="text"
                    value={qual.institutionName}
                    onChange={(e) => updateQualification(qual.id, "institutionName", e.target.value)}
                    placeholder="e.g. University of the Punjab"
                    className="w-full p-2 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Country of Study *</label>
                  <input
                    type="text"
                    value={qual.country}
                    onChange={(e) => updateQualification(qual.id, "country", e.target.value)}
                    placeholder="e.g. Pakistan, India, Nigeria"
                    className="w-full p-2 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Degree / Award Title *</label>
                  <input
                    type="text"
                    value={qual.degreeEarned}
                    onChange={(e) => updateQualification(qual.id, "degreeEarned", e.target.value)}
                    placeholder="e.g. Bachelor of Science in Software Engineering"
                    className="w-full p-2 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Major / Field of Study *</label>
                  <input
                    type="text"
                    value={qual.fieldOfStudy}
                    onChange={(e) => updateQualification(qual.id, "fieldOfStudy", e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full p-2 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Start Date (MM/YYYY) *</label>
                  <input
                    type="month"
                    value={qual.startDate}
                    onChange={(e) => updateQualification(qual.id, "startDate", e.target.value)}
                    className="w-full p-2 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Graduation Date (MM/YYYY) *</label>
                  <input
                    type="month"
                    value={qual.completionDate}
                    onChange={(e) => updateQualification(qual.id, "completionDate", e.target.value)}
                    className="w-full p-2 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Grading Scale *</label>
                  <select
                    value={qual.gradingScale}
                    onChange={(e) => updateQualification(qual.id, "gradingScale", e.target.value)}
                    className="w-full p-2 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                  >
                    <option value="GPA 4.0 Scale">GPA (4.0 Scale)</option>
                    <option value="GPA 5.0 Scale">GPA (5.0 Scale)</option>
                    <option value="Percentage %">Percentage (0 - 100%)</option>
                    <option value="Division / Class">Class (First Class / 2:1 / 2:2)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Obtained Grade / Score *</label>
                  <input
                    type="text"
                    value={qual.obtainedScore}
                    onChange={(e) => updateQualification(qual.id, "obtainedScore", e.target.value)}
                    placeholder="e.g. 3.75 / 4.00 or 84%"
                    className="w-full p-2 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: STUDY GAPS & CONTINUITY */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Academic Gap Audit (&gt; 6 Months)
          </h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.hasAcademicGap}
              onChange={(e) => onChange({ hasAcademicGap: e.target.checked })}
              className="w-4 h-4 text-emerald-500 rounded border-[var(--border-default)]"
            />
            <span className="text-xs font-semibold text-[var(--text-primary)]">Student has study gap &gt; 6 months</span>
          </label>
        </div>

        <p className="text-xs text-[var(--text-secondary)]">
          UK VI, Australian Home Affairs, and Canadian IRCC require strict justification for any period of un-enrolled study exceeding 6 months.
        </p>

        {data.hasAcademicGap && (
          <div className="space-y-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">
                General Gap Explanation & Summary Statement *
              </label>
              <textarea
                rows={3}
                value={data.gapExplanation || ""}
                onChange={(e) => onChange({ gapExplanation: e.target.value })}
                placeholder="Explain the activities undertaken during gap periods (e.g. full-time industry employment, professional certifications, family responsibilities)..."
                className={`w-full p-2.5 bg-[var(--bg-input)] border rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-amber-500 ${
                  errors.gapExplanation ? "border-rose-500" : "border-[var(--border-default)]"
                }`}
              />
              {errors.gapExplanation && <p className="text-[11px] text-rose-400 mt-1">{errors.gapExplanation}</p>}
            </div>

            {/* Structured Gap List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-primary)]">Structured Gap Breakdown (Optional)</span>
                <button
                  type="button"
                  onClick={addGapEntry}
                  className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Gap Period
                </button>
              </div>

              {(data.gapDetails || []).map((gap, gIdx) => (
                <div key={gIdx} className="p-3 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[var(--text-secondary)]">Period #{gIdx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeGapEntry(gIdx)}
                      className="text-rose-400 hover:text-rose-300 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-[var(--text-muted)]">Start Date</label>
                      <input
                        type="month"
                        value={gap.startDate}
                        onChange={(e) => updateGapEntry(gIdx, "startDate", e.target.value)}
                        className="w-full p-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[var(--text-muted)]">End Date</label>
                      <input
                        type="month"
                        value={gap.endDate}
                        onChange={(e) => updateGapEntry(gIdx, "endDate", e.target.value)}
                        className="w-full p-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[var(--text-muted)]">Activity Type</label>
                      <select
                        value={gap.activityType}
                        onChange={(e) => updateGapEntry(gIdx, "activityType", e.target.value)}
                        className="w-full p-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs"
                      >
                        <option value="Employment">Employment</option>
                        <option value="Family Care">Family Care</option>
                        <option value="Test Preparation">Test Preparation</option>
                        <option value="Travel">Travel</option>
                        <option value="Medical">Medical Recovery</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-[var(--text-muted)]">Employer / Organization Details</label>
                    <input
                      type="text"
                      value={gap.employerOrDetails || ""}
                      onChange={(e) => updateGapEntry(gIdx, "employerOrDetails", e.target.value)}
                      placeholder="e.g. Systems Limited (Software Engineer Intern)"
                      className="w-full p-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
