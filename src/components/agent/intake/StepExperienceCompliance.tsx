import React from "react";
import { Briefcase, ShieldAlert, Plane, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { ExperienceComplianceData, WorkExperienceEntry } from "../../../types/agentApplication";

interface StepExperienceComplianceProps {
  data: ExperienceComplianceData;
  onChange: (updated: Partial<ExperienceComplianceData>) => void;
  errors?: Record<string, string>;
}

export const StepExperienceCompliance: React.FC<StepExperienceComplianceProps> = ({
  data,
  onChange,
  errors = {},
}) => {
  const addWorkExperience = () => {
    const newEntry: WorkExperienceEntry = {
      id: `work-${Date.now()}`,
      jobTitle: "",
      employerName: "",
      country: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      keyResponsibilities: "",
    };
    onChange({
      workHistory: [...data.workHistory, newEntry],
    });
  };

  const removeWorkExperience = (id: string) => {
    onChange({
      workHistory: data.workHistory.filter((w) => w.id !== id),
    });
  };

  const updateWorkExperience = (id: string, field: keyof WorkExperienceEntry, val: any) => {
    onChange({
      workHistory: data.workHistory.map((w) => (w.id === id ? { ...w, [field]: val } : w)),
    });
  };

  const updateRefusal = (field: string, val: string) => {
    onChange({
      visaRefusalDetails: {
        country: "",
        year: "",
        reason: "",
        ...data.visaRefusalDetails,
        [field]: val,
      },
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* SECTION 1: WORK EXPERIENCE */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-400" />
              Professional Employment & Work Experience
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Highlight relevant post-graduation or internship experience that strengthens the candidate's university profile.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.hasWorkExperience}
                onChange={(e) => {
                  const checked = e.target.checked;
                  onChange({
                    hasWorkExperience: checked,
                    workHistory: checked && data.workHistory.length === 0 ? [{
                      id: `work-${Date.now()}`,
                      jobTitle: "",
                      employerName: "",
                      country: "",
                      startDate: "",
                      endDate: "",
                      isCurrent: false,
                      keyResponsibilities: "",
                    }] : data.workHistory,
                  });
                }}
                className="w-4 h-4 text-emerald-500 rounded border-[var(--border-default)]"
              />
              <span className="text-xs font-semibold text-[var(--text-primary)]">Has Work History</span>
            </label>

            {data.hasWorkExperience && (
              <button
                type="button"
                onClick={addWorkExperience}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Job
              </button>
            )}
          </div>
        </div>

        {data.hasWorkExperience && (
          <div className="space-y-4 pt-2">
            {data.workHistory.map((work, idx) => (
              <div
                key={work.id}
                className="p-4 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl space-y-3 relative"
              >
                <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    Position #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeWorkExperience(work.id)}
                    className="text-[var(--text-muted)] hover:text-rose-400 p-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Job Title *</label>
                    <input
                      type="text"
                      value={work.jobTitle}
                      onChange={(e) => updateWorkExperience(work.id, "jobTitle", e.target.value)}
                      placeholder="e.g. Associate Software Engineer"
                      className="w-full p-2 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Employer / Company *</label>
                    <input
                      type="text"
                      value={work.employerName}
                      onChange={(e) => updateWorkExperience(work.id, "employerName", e.target.value)}
                      placeholder="e.g. Acme Tech Solutions"
                      className="w-full p-2 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Country *</label>
                    <input
                      type="text"
                      value={work.country}
                      onChange={(e) => updateWorkExperience(work.id, "country", e.target.value)}
                      placeholder="e.g. Pakistan, United Kingdom"
                      className="w-full p-2 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Start Date *</label>
                    <input
                      type="month"
                      value={work.startDate}
                      onChange={(e) => updateWorkExperience(work.id, "startDate", e.target.value)}
                      className="w-full p-2 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[var(--text-secondary)] mb-1">End Date</label>
                    <input
                      type="month"
                      disabled={work.isCurrent}
                      value={work.endDate || ""}
                      onChange={(e) => updateWorkExperience(work.id, "endDate", e.target.value)}
                      className="w-full p-2 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] disabled:opacity-50"
                    />
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={work.isCurrent}
                        onChange={(e) => updateWorkExperience(work.id, "isCurrent", e.target.checked)}
                        className="w-4 h-4 text-emerald-500 rounded border-[var(--border-default)]"
                      />
                      <span className="text-xs text-[var(--text-primary)] font-medium">Currently Employed Here</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Key Responsibilities / Duties</label>
                  <textarea
                    rows={2}
                    value={work.keyResponsibilities}
                    onChange={(e) => updateWorkExperience(work.id, "keyResponsibilities", e.target.value)}
                    placeholder="Brief description of responsibilities and technical projects..."
                    className="w-full p-2 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: IMMIGRATION & VISA HISTORY COMPLIANCE */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl space-y-4 shadow-sm">
        <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          Immigration History & Visa Compliance Declarations
        </h3>
        <p className="text-xs text-[var(--text-secondary)]">
          Full transparency is mandatory under UK VI CAS, Australian Genuine Student (GS), and international embassy regulations.
        </p>

        {/* Visa Refusal Checkbox */}
        <div className="p-4 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              Has the applicant ever been refused a visa or entry clearance for ANY country?
            </span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="visaRefusal"
                  checked={data.hasVisaRefusal === true}
                  onChange={() => onChange({ hasVisaRefusal: true })}
                  className="w-4 h-4 text-rose-500"
                />
                <span className="text-xs font-bold text-rose-400">Yes</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="visaRefusal"
                  checked={data.hasVisaRefusal === false}
                  onChange={() => onChange({ hasVisaRefusal: false })}
                  className="w-4 h-4 text-emerald-500"
                />
                <span className="text-xs font-bold text-emerald-400">No</span>
              </label>
            </div>
          </div>

          {data.hasVisaRefusal && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-3 animate-fadeIn">
              <p className="text-[11px] text-rose-300 font-medium">
                Mandatory Refusal Details: An official copy of the refusal letter must be attached in Step 6.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-rose-200 mb-1">Refusing Country *</label>
                  <input
                    type="text"
                    value={data.visaRefusalDetails?.country || ""}
                    onChange={(e) => updateRefusal("country", e.target.value)}
                    placeholder="e.g. United Kingdom, Canada, USA"
                    className="w-full p-2 bg-[var(--bg-card)] border border-rose-500/40 rounded-xl text-xs text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-rose-200 mb-1">Year of Refusal *</label>
                  <input
                    type="text"
                    value={data.visaRefusalDetails?.year || ""}
                    onChange={(e) => updateRefusal("year", e.target.value)}
                    placeholder="e.g. 2024"
                    className="w-full p-2 bg-[var(--bg-card)] border border-rose-500/40 rounded-xl text-xs text-[var(--text-primary)]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-rose-200 mb-1">Official Refusal Reason / Section *</label>
                <textarea
                  rows={2}
                  value={data.visaRefusalDetails?.reason || ""}
                  onChange={(e) => updateRefusal("reason", e.target.value)}
                  placeholder="Detail the ground of refusal (e.g. 28-day funds rule, credibility interview, missing document)..."
                  className="w-full p-2 bg-[var(--bg-card)] border border-rose-500/40 rounded-xl text-xs text-[var(--text-primary)]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Prior Travel in Target Country */}
        <div className="p-4 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5 text-sky-400" />
              Has the student previously studied, lived, or travelled to the target destination country?
            </span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="targetTravel"
                  checked={data.priorStudyOrTravelInTargetCountry === true}
                  onChange={() => onChange({ priorStudyOrTravelInTargetCountry: true })}
                  className="w-4 h-4 text-emerald-500"
                />
                <span className="text-xs font-semibold">Yes</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="targetTravel"
                  checked={data.priorStudyOrTravelInTargetCountry === false}
                  onChange={() => onChange({ priorStudyOrTravelInTargetCountry: false })}
                  className="w-4 h-4 text-zinc-500"
                />
                <span className="text-xs font-semibold">No</span>
              </label>
            </div>
          </div>

          {data.priorStudyOrTravelInTargetCountry && (
            <input
              type="text"
              value={data.priorTravelDetails || ""}
              onChange={(e) => onChange({ priorTravelDetails: e.target.value })}
              placeholder="e.g. Tourist visa in Summer 2023 for 3 weeks; or Foundation Year at London South Bank 2022"
              className="w-full p-2 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
            />
          )}
        </div>

        {/* Mandatory Criminal & Compliance Declaration */}
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.criminalBackgroundDeclaration}
              onChange={(e) => onChange({ criminalBackgroundDeclaration: e.target.checked })}
              className="w-4 h-4 text-emerald-500 rounded border-[var(--border-default)] mt-0.5"
            />
            <div className="text-xs text-[var(--text-primary)] space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Truthfulness & Clean Record Certification *
              </span>
              <p className="text-[11px] text-[var(--text-secondary)]">
                I hereby certify that the applicant has no unspent criminal convictions, has never breached immigration conditions in any jurisdiction, and all information supplied is authentic.
              </p>
            </div>
          </label>
          {errors.criminalBackgroundDeclaration && (
            <p className="text-[11px] text-rose-400 mt-2">{errors.criminalBackgroundDeclaration}</p>
          )}
        </div>
      </div>
    </div>
  );
};
