import React, { useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, Heart, Search, SlidersHorizontal, X } from "lucide-react";
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
  const { universities, students } = useGlobalData();
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [level, setLevel] = useState<StudyLevel | "">("");
  const [maxFee, setMaxFee] = useState("");
  const [studentId, setStudentId] = useState("");
  const [shortlisted, setShortlisted] = useState<string[]>([]);
  const [compare, setCompare] = useState<string[]>([]);

  const results = useMemo<ProgrammeResult[]>(() => universities.flatMap((university) => (university.programmes || []).map((programme) => ({ ...programme, university }))), [universities]);
  const selectedStudent = students.find((student) => student.id === studentId);
  const countries = [...new Set(results.map((item) => item.university.country))].sort();
  const filtered = results.filter((item) => {
    const haystack = `${item.title} ${item.university.name} ${item.university.country} ${item.university.city}`.toLowerCase();
    return (!query || haystack.includes(query.toLowerCase()))
      && (!country || item.university.country === country)
      && (!level || item.level === level)
      && (!maxFee || item.tuitionFeeAnnual <= Number(maxFee));
  });
  const compared = results.filter((item) => compare.includes(`${item.university.id}:${item.id}`));
  const keyFor = (item: ProgrammeResult) => `${item.university.id}:${item.id}`;
  const toggle = (items: string[], key: string, limit = Infinity) => items.includes(key) ? items.filter((item) => item !== key) : items.length >= limit ? items : [...items, key];

  return <div className="space-y-6">
    <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
      <div><h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">Programme Search & Eligibility</h1><p className="mt-1 text-sm text-[var(--text-secondary)]">Search courses, assess applicant fit, shortlist choices, and compare options. Recommendations require counsellor review.</p></div>
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]"><CircleAlert className="w-4 h-4 text-amber-400" /> Eligibility is advisory, not an admissions decision.</div>
    </header>

    <section className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      <label className="relative xl:col-span-2"><Search className="absolute left-3 top-3 w-4 h-4 text-[var(--text-muted)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Programme, university, country, or city" className="w-full p-2.5 pl-9 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-sm" /></label>
      <select value={country} onChange={(event) => setCountry(event.target.value)} className="p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-sm"><option value="">All countries</option>{countries.map((item) => <option key={item}>{item}</option>)}</select>
      <select value={level} onChange={(event) => setLevel(event.target.value as StudyLevel | "")} className="p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-sm"><option value="">All levels</option>{["Foundation", "Undergraduate", "Postgraduate", "Doctorate", "Pre-Master"].map((item) => <option key={item}>{item}</option>)}</select>
      <input type="number" min="0" value={maxFee} onChange={(event) => setMaxFee(event.target.value)} placeholder="Maximum annual fee" className="p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-sm" />
      <select value={studentId} onChange={(event) => setStudentId(event.target.value)} className="md:col-span-2 xl:col-span-5 p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-sm"><option value="">Assess without a student profile</option>{students.map((student) => <option value={student.id} key={student.id}>{student.fullName} - {student.englishProficiency?.testType || "No English score"} {student.englishProficiency?.overallScore || ""}</option>)}</select>
    </section>

    {compared.length > 0 && <section className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card overflow-x-auto"><div className="flex justify-between gap-3 mb-3"><h2 className="font-bold text-sm">Compare programmes ({compared.length}/3)</h2><button onClick={() => setCompare([])} className="text-xs text-emerald-400">Clear comparison</button></div><table className="w-full text-left text-xs"><thead className="text-[var(--text-muted)]"><tr><th className="p-2">Programme</th><th className="p-2">University</th><th className="p-2">Fee</th><th className="p-2">Duration</th><th className="p-2">English</th><th className="p-2">Intakes</th></tr></thead><tbody>{compared.map((item) => <tr key={keyFor(item)} className="border-t border-[var(--border-default)]"><td className="p-2 font-semibold">{item.title}</td><td className="p-2">{item.university.name}</td><td className="p-2">{item.currency} {item.tuitionFeeAnnual.toLocaleString()}</td><td className="p-2">{item.durationMonths} months</td><td className="p-2">IELTS {item.minIeltsScore || "See requirements"}</td><td className="p-2">{item.intakes.join(", ")}</td></tr>)}</tbody></table></section>}

    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><SlidersHorizontal className="w-4 h-4" /> {filtered.length} programme{filtered.length === 1 ? "" : "s"} found</div>
    <section className="grid gap-4 lg:grid-cols-2">{filtered.map((item) => { const key = keyFor(item); const eligibility = eligibilityFor(selectedStudent, item); return <article key={key} className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card space-y-4"><div className="flex justify-between gap-3"><div><p className="text-xs text-emerald-400 font-semibold">{item.university.country} · {item.university.city}</p><h2 className="mt-1 font-bold text-[var(--text-primary)]">{item.title}</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">{item.university.name}</p></div><span className={`h-fit px-2 py-1 text-[10px] sq-badge ${eligibility === "Likely eligible" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-300"}`}>{eligibility}</span></div><dl className="grid grid-cols-2 gap-3 text-xs"><div><dt className="text-[var(--text-muted)]">Annual tuition</dt><dd className="mt-1 font-semibold">{item.currency} {item.tuitionFeeAnnual.toLocaleString()}</dd></div><div><dt className="text-[var(--text-muted)]">Duration / level</dt><dd className="mt-1 font-semibold">{item.durationMonths} months · {item.level}</dd></div><div><dt className="text-[var(--text-muted)]">English requirement</dt><dd className="mt-1">IELTS {item.minIeltsScore || "varies"}</dd></div><div><dt className="text-[var(--text-muted)]">Intakes</dt><dd className="mt-1">{item.intakes.join(", ")}</dd></div></dl><p className="text-xs text-[var(--text-secondary)]">{item.entryRequirements || "Contact the university to confirm current entry requirements."}</p><div className="flex gap-2"><button onClick={() => setShortlisted((items) => toggle(items, key))} className={`px-3 py-2 text-xs sq-btn border ${shortlisted.includes(key) ? "border-rose-500/40 text-rose-300" : "border-emerald-500/40 text-emerald-300"}`}>{shortlisted.includes(key) ? <><X className="inline w-3 h-3 mr-1" />Remove shortlist</> : <><Heart className="inline w-3 h-3 mr-1" />Shortlist</>}</button><button onClick={() => setCompare((items) => toggle(items, key, 3))} disabled={!compare.includes(key) && compare.length >= 3} className="px-3 py-2 text-xs sq-btn border border-[var(--border-default)] disabled:opacity-40">{compare.includes(key) ? "Remove comparison" : "Compare"}</button></div></article>; })}</section>
    {filtered.length === 0 && <div className="p-10 text-center text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border-default)] sq-card">No programmes match these filters. Clear a filter or add academic data in Universities & Courses.</div>}
    {shortlisted.length > 0 && <p className="text-xs text-emerald-400 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {shortlisted.length} programme{shortlisted.length === 1 ? "" : "s"} shortlisted for the current session.</p>}
  </div>;
};
