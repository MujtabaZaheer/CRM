import React, { useState, useMemo } from "react";
import { Building2, Search, Check, DollarSign, Calendar, MapPin } from "lucide-react";
import { ProgramSelectionData, ProgramChoice } from "../../../types/agentApplication";
import { GLOBAL_UNIVERSITIES } from "../../../data/globalUniversities";
import { University, Programme } from "../../../types/university";

interface StepProgramSelectionProps {
  data: ProgramSelectionData;
  onChange: (updated: Partial<ProgramSelectionData>) => void;
  availableUniversities?: University[];
  errors?: Record<string, string>;
}

export const StepProgramSelection: React.FC<StepProgramSelectionProps> = ({
  data,
  onChange,
  availableUniversities = [],
  errors = {},
}) => {
  const allUnis = availableUniversities.length > 0 ? availableUniversities : GLOBAL_UNIVERSITIES;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedIntake, setSelectedIntake] = useState("All");

  const countries = useMemo(() => {
    const set = new Set(allUnis.map((u) => u.country));
    return ["All", ...Array.from(set)];
  }, [allUnis]);

  // Flattened programme list with parent university info
  const allProgrammes = useMemo(() => {
    const list: Array<{ uni: University; prog: Programme }> = [];
    allUnis.forEach((uni) => {
      (uni.programmes || []).forEach((prog) => {
        list.push({ uni, prog });
      });
    });
    return list;
  }, [allUnis]);

  const filteredProgrammes = useMemo(() => {
    return allProgrammes.filter(({ uni, prog }) => {
      const q = searchQuery.toLowerCase();
      const matchQuery =
        !q ||
        prog.title.toLowerCase().includes(q) ||
        uni.name.toLowerCase().includes(q) ||
        (prog.field && prog.field.toLowerCase().includes(q)) ||
        (prog.subjectArea && prog.subjectArea.toLowerCase().includes(q));

      const matchCountry = selectedCountry === "All" || uni.country === selectedCountry;
      const matchLevel =
        selectedLevel === "All" ||
        prog.level.toLowerCase() === selectedLevel.toLowerCase();

      const intakeStr = (prog.intakes || []).join(" ").toLowerCase();
      const matchIntake = selectedIntake === "All" || intakeStr.includes(selectedIntake.toLowerCase());

      return matchQuery && matchCountry && matchLevel && matchIntake;
    });
  }, [allProgrammes, searchQuery, selectedCountry, selectedLevel, selectedIntake]);

  const handleSelectProgram = (uni: University, prog: Programme, priority: "Primary Choice" | "Secondary Choice") => {
    const choice: ProgramChoice = {
      universityId: uni.id,
      universityName: uni.name,
      campusCity: uni.city || uni.country,
      country: uni.country,
      programmeId: prog.id,
      programmeTitle: prog.title,
      level: prog.level || "Postgraduate",
      intake: (prog.intakes && prog.intakes[0]) || "September 2026",
      tuitionFee: prog.tuitionFeeAnnual || 18500,
      applicationFee: prog.applicationFee || 50,
      entryRequirements: prog.entryRequirements || "Minimum 60% in Bachelor degree or equivalent",
      priority,
    };

    if (priority === "Primary Choice") {
      onChange({ primaryChoice: choice });
    } else {
      onChange({ secondaryChoice: choice });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* SECTION 1: SELECTED CHOICES PREVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Primary Choice Card */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            data.primaryChoice?.programmeId
              ? "bg-[var(--bg-card)] border-emerald-500/40 shadow-sm"
              : "bg-[var(--bg-card)] border-dashed border-[var(--border-default)]"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              Primary Target Choice (Mandatory)
            </span>
            {data.primaryChoice?.programmeId && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Selected
              </span>
            )}
          </div>

          {data.primaryChoice?.programmeId ? (
            <div className="space-y-2 mt-2">
              <h4 className="font-bold text-sm text-[var(--text-primary)]">
                {data.primaryChoice.programmeTitle}
              </h4>
              <p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                {data.primaryChoice.universityName} • {data.primaryChoice.country}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-[var(--text-secondary)]">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[var(--text-muted)]" /> Intake: {data.primaryChoice.intake}
                </span>
                <span className="flex items-center gap-1 font-mono font-bold text-[var(--text-primary)]">
                  <DollarSign className="w-3 h-3 text-[var(--text-muted)]" /> Fee: £{data.primaryChoice.tuitionFee?.toLocaleString() || "18,500"}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-[var(--text-muted)] text-xs">
              Select a primary programme from the directory below.
            </div>
          )}
          {errors["primaryChoice.programmeId"] && (
            <p className="text-xs text-rose-400 mt-2">{errors["primaryChoice.programmeId"]}</p>
          )}
        </div>

        {/* Secondary Choice Card */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            data.secondaryChoice?.programmeId
              ? "bg-[var(--bg-card)] border-sky-500/40 shadow-sm"
              : "bg-[var(--bg-card)] border-dashed border-[var(--border-default)]"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 border border-sky-500/30 text-sky-400">
              Secondary Backup Choice (Optional)
            </span>
            {data.secondaryChoice?.programmeId && (
              <button
                type="button"
                onClick={() => onChange({ secondaryChoice: undefined })}
                className="text-xs text-rose-400 hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          {data.secondaryChoice?.programmeId ? (
            <div className="space-y-2 mt-2">
              <h4 className="font-bold text-sm text-[var(--text-primary)]">
                {data.secondaryChoice.programmeTitle}
              </h4>
              <p className="text-xs text-sky-400 font-medium flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                {data.secondaryChoice.universityName} • {data.secondaryChoice.country}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-[var(--text-secondary)]">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[var(--text-muted)]" /> Intake: {data.secondaryChoice.intake}
                </span>
                <span className="flex items-center gap-1 font-mono font-bold text-[var(--text-primary)]">
                  <DollarSign className="w-3 h-3 text-[var(--text-muted)]" /> Fee: £{data.secondaryChoice.tuitionFee?.toLocaleString() || "18,500"}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-[var(--text-muted)] text-xs">
              Optionally pick a backup university or degree pathway.
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: DYNAMIC PROGRAMME FINDER */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl space-y-4 shadow-sm">
        <div>
          <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <Search className="w-4 h-4 text-emerald-400" />
            University & Programme Finder
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Search verified institutional offerings and assign directly to the applicant's admission dossier.
          </p>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search program, university, keyword..."
              className="w-full pl-8 p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="All">All Countries</option>
              {countries.filter((c) => c !== "All").map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="All">All Study Levels</option>
              <option value="Undergraduate">Undergraduate (BSc / BA)</option>
              <option value="Postgraduate">Postgraduate (MSc / MA / MBA)</option>
              <option value="Doctorate">Doctorate / PhD</option>
            </select>
          </div>

          <div>
            <select
              value={selectedIntake}
              onChange={(e) => setSelectedIntake(e.target.value)}
              className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="All">All Intake Windows</option>
              <option value="September">Sep / Oct 2026</option>
              <option value="January">Jan / Feb 2027</option>
              <option value="May">May / Summer 2027</option>
            </select>
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
          {filteredProgrammes.length === 0 ? (
            <div className="p-8 text-center bg-[var(--bg-input)] rounded-xl border border-[var(--border-default)] text-[var(--text-muted)] text-xs">
              No matching degree programmes found. Try adjusting keywords or destination filters.
            </div>
          ) : (
            filteredProgrammes.slice(0, 15).map(({ uni, prog }) => {
              const isPrimary = data.primaryChoice?.programmeId === prog.id;
              const isSecondary = data.secondaryChoice?.programmeId === prog.id;

              return (
                <div
                  key={`${uni.id}-${prog.id}`}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isPrimary
                      ? "bg-emerald-500/10 border-emerald-500/50 shadow-sm"
                      : isSecondary
                      ? "bg-sky-500/10 border-sky-500/50 shadow-sm"
                      : "bg-[var(--bg-input)] border-[var(--border-default)] hover:border-[var(--border-default)]/80"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[var(--text-primary)]">
                        {prog.title}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 font-semibold">
                        {prog.level}
                      </span>
                      {isPrimary && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-zinc-950">
                          Primary Choice
                        </span>
                      )}
                      {isSecondary && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500 text-white">
                          Backup Choice
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                      {uni.name} • <MapPin className="w-3 h-3 text-[var(--text-muted)]" /> {uni.city || uni.country}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[var(--text-muted)]">
                      <span>Intakes: <strong className="text-[var(--text-primary)]">{(prog.intakes && prog.intakes.join(", ")) || "Sep 2026"}</strong></span>
                      <span>Duration: <strong className="text-[var(--text-primary)]">{prog.durationMonths || 12} Months</strong></span>
                      <span>Tuition: <strong className="text-emerald-400">£{prog.tuitionFeeAnnual?.toLocaleString() || "18,500"}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleSelectProgram(uni, prog, "Primary Choice")}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                        isPrimary
                          ? "bg-emerald-500 text-zinc-950"
                          : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                      }`}
                    >
                      {isPrimary ? "Selected Primary" : "Set Primary"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectProgram(uni, prog, "Secondary Choice")}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                        isSecondary
                          ? "bg-sky-500 text-white"
                          : "bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {isSecondary ? "Selected Backup" : "Set Backup"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
