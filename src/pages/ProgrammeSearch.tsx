import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, CircleAlert, Heart, Search, SlidersHorizontal, ArrowRight, Award } from "lucide-react";
import { useGlobalData } from "../contexts/GlobalDataContext";
import { Programme, StudyLevel, University } from "../types/university";
import { Student } from "../types/student";

type ProgrammeResult = Programme & { university: University };
type Eligibility = "Likely eligible" | "Additional review required" | "Potentially eligible";

const eligibilityFor = (student: Student | undefined, programme: Programme): Eligibility => {
  if (!student) return "Additional review required";
  const hasBachelor = student.academicHistory.some((item) => item.qualification === "Bachelor's Degree" || item.qualification === "Master's Degree" || item.qualification === "Doctorate / PhD");
  const score = Number.parseFloat(student.englishProficiency?.overallScore || "");
  if (programme.level === "Postgraduate" && !hasBachelor) return "Potentially eligible";
  if (programme.minIeltsScore && (!Number.isFinite(score) || score < programme.minIeltsScore)) return "Additional review required";
  return "Likely eligible";
};

export const ProgrammeSearch: React.FC = () => {
  const navigate = useNavigate();
  const { universities, students } = useGlobalData();
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [level, setLevel] = useState<StudyLevel | "">("");
  const [maxFee, setMaxFee] = useState("");
  const [studentId, setStudentId] = useState("");
  const [scholarshipOnly, setScholarshipOnly] = useState(false);
  const [shortlisted, setShortlisted] = useState<string[]>([]);
  const [compare, setCompare] = useState<string[]>([]);

  const results = useMemo<ProgrammeResult[]>(() => universities.flatMap((university) => (university.programmes || []).map((programme) => ({ ...programme, university }))), [universities]);
  const selectedStudent = students.find((student) => student.id === studentId);
  const countries = [...new Set(results.map((item) => item.university.country))].sort();

  const filtered = results.filter((item) => {
    const haystack = `${item.title} ${item.university.name} ${item.university.country} ${item.university.city}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query.toLowerCase());
    const matchesCountry = !country || item.university.country === country;
    const matchesLevel = !level || item.level === level;
    const matchesFee = !maxFee || item.tuitionFeeAnnual <= Number(maxFee);
    const matchesScholarship = !scholarshipOnly || (item.tuitionFeeAnnual <= 20000 || item.title.toLowerCase().includes("scholarship"));
    return matchesQuery && matchesCountry && matchesLevel && matchesFee && matchesScholarship;
  });

  const compared = results.filter((item) => compare.includes(`${item.university.id}:${item.id}`));
  const keyFor = (item: ProgrammeResult) => `${item.university.id}:${item.id}`;
  const toggle = (items: string[], key: string, limit = Infinity) => items.includes(key) ? items.filter((item) => item !== key) : items.length >= limit ? items : [...items, key];

  const handleStartApplication = (_item: ProgrammeResult) => {
    navigate(`/applications`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)]">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)] flex items-center space-x-2">
            <Search className="w-7 h-7 text-emerald-400" />
            <span>Programme Search & Eligibility Engine</span>
          </h1>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Explore 1,000+ university programmes, verify student entry criteria, compare tuition & work visas, and launch direct applications.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
          <CircleAlert className="w-4 h-4" />
          <span>Eligibility is advisory based on profile rules.</span>
        </div>
      </header>

      <section className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl grid gap-3 md:grid-cols-2 xl:grid-cols-6 text-xs">
        <label className="relative xl:col-span-2">
          <Search className="absolute left-3 top-3 w-4 h-4 text-[var(--text-muted)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Course title, university, discipline..."
            className="w-full p-2.5 pl-9 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
          />
        </label>
        <select
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          className="p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none"
        >
          <option value="">All Countries</option>
          {countries.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select
          value={level}
          onChange={(event) => setLevel(event.target.value as StudyLevel | "")}
          className="p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none"
        >
          <option value="">All Study Levels</option>
          {["Foundation", "Undergraduate", "Postgraduate", "Doctorate", "Pre-Master"].map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          value={maxFee}
          onChange={(event) => setMaxFee(event.target.value)}
          placeholder="Max Annual Fee ($)"
          className="p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] font-mono focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setScholarshipOnly(!scholarshipOnly)}
          className={`p-2.5 rounded-xl border font-semibold flex items-center justify-center space-x-1.5 transition-all ${
            scholarshipOnly ? "bg-emerald-500 text-slate-950 border-emerald-400 font-bold" : "bg-[var(--bg-main)] text-[var(--text-secondary)] border-[var(--border-color)]"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Scholarships</span>
        </button>

        <div className="md:col-span-2 xl:col-span-6 pt-2 border-t border-[var(--border-color)] flex items-center space-x-3">
          <span className="text-zinc-400 font-semibold">Assess Applicant Fit:</span>
          <select
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            className="flex-1 p-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]"
          >
            <option value="">-- General Search (No specific student profile) --</option>
            {students.map((student) => (
              <option value={student.id} key={student.id}>
                {student.fullName} ({student.nationality || "Global"}) — IELTS: {student.englishProficiency?.overallScore || "N/A"}
              </option>
            ))}
          </select>
        </div>
      </section>

      {compared.length > 0 && (
        <section className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-x-auto shadow-xl">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-heading font-bold text-sm text-[var(--text-primary)] flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
              <span>Side-by-Side Course Comparison ({compared.length}/3)</span>
            </h2>
            <button onClick={() => setCompare([])} className="text-xs text-rose-400 hover:underline">
              Clear Comparison
            </button>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] uppercase">
              <tr>
                <th className="p-2.5">Programme</th>
                <th className="p-2.5">University</th>
                <th className="p-2.5">Annual Fee</th>
                <th className="p-2.5">Duration</th>
                <th className="p-2.5">Min English</th>
                <th className="p-2.5">Intakes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {compared.map((item) => (
                <tr key={keyFor(item)}>
                  <td className="p-2.5 font-bold text-[var(--text-primary)]">{item.title}</td>
                  <td className="p-2.5 text-zinc-300">{item.university.name} ({item.university.country})</td>
                  <td className="p-2.5 font-mono text-emerald-400 font-bold">{item.currency} {item.tuitionFeeAnnual.toLocaleString()}</td>
                  <td className="p-2.5 font-mono">{item.durationMonths} Months</td>
                  <td className="p-2.5 font-mono">IELTS {item.minIeltsScore || "6.0"}</td>
                  <td className="p-2.5">{item.intakes.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
        <span className="flex items-center gap-1.5 font-semibold">
          <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
          <span>{filtered.length} programmes matched</span>
        </span>
        {shortlisted.length > 0 && (
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> {shortlisted.length} shortlisted
          </span>
        )}
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        {filtered.map((item) => {
          const key = keyFor(item);
          const eligibility = eligibilityFor(selectedStudent, item);
          return (
            <article
              key={key}
              className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl space-y-4 shadow-lg hover:border-emerald-500/30 transition-all"
            >
              <div className="flex justify-between items-start gap-3">
                <div>
                  <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                    {item.university.country} • {item.university.city}
                  </span>
                  <h2 className="font-heading font-bold text-base text-[var(--text-primary)] mt-0.5">
                    {item.title}
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
                    {item.university.name}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg ${
                    eligibility === "Likely eligible"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}>
                    {eligibility}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-zinc-800 text-zinc-300 font-mono">
                    15% Partner Comm.
                  </span>
                </div>
              </div>

              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs p-3 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)]">
                <div>
                  <dt className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Tuition / Year</dt>
                  <dd className="font-mono font-bold text-emerald-400 mt-0.5">
                    {item.currency} {item.tuitionFeeAnnual.toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Duration / Level</dt>
                  <dd className="font-semibold text-[var(--text-primary)] mt-0.5">
                    {item.durationMonths}m • {item.level}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Min English</dt>
                  <dd className="font-mono text-zinc-200 mt-0.5">
                    IELTS {item.minIeltsScore || "6.0"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Post-Study Visa</dt>
                  <dd className="font-bold text-cyan-400 mt-0.5">
                    2-3 Years
                  </dd>
                </div>
              </dl>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--border-color)]">
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setShortlisted((items) => toggle(items, key))}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                      shortlisted.includes(key)
                        ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                        : "bg-zinc-800 border-[var(--border-color)] text-zinc-300 hover:text-white"
                    }`}
                  >
                    <Heart className="inline w-3.5 h-3.5 mr-1 text-rose-400" />
                    {shortlisted.includes(key) ? "Shortlisted" : "Shortlist"}
                  </button>

                  <button
                    onClick={() => setCompare((items) => toggle(items, key, 3))}
                    disabled={!compare.includes(key) && compare.length >= 3}
                    className="px-3 py-1.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl border border-[var(--border-color)] disabled:opacity-40"
                  >
                    {compare.includes(key) ? "Comparing" : "Compare"}
                  </button>
                </div>

                <button
                  onClick={() => handleStartApplication(item)}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 flex items-center space-x-1 transition-all"
                >
                  <span>Start Application</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {filtered.length === 0 && (
        <div className="p-12 text-center text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl">
          No programmes match these filters. Clear your filters or explore other study destinations.
        </div>
      )}
    </div>
  );
};

