import React, { useState } from "react";
import { Award, Search, Calendar, ExternalLink, CheckCircle2 } from "lucide-react";

interface ScholarshipItem {
  id: string;
  name: string;
  university: string;
  country: string;
  amount: string;
  deadline: string;
  criteria: string;
  discipline: string;
  type: "Merit" | "Need-Based" | "STEM" | "Government";
}

const SCHOLARSHIPS_DATA: ScholarshipItem[] = [
  {
    id: "sch-1",
    name: "Vice-Chancellor's International Excellence Award",
    university: "University of Manchester",
    country: "United Kingdom",
    amount: "£5,000 / year",
    deadline: "30 June 2026",
    criteria: "Minimum undergraduate CGPA of 3.4 or equivalent; full-time master's offer holder.",
    discipline: "All Disciplines",
    type: "Merit",
  },
  {
    id: "sch-2",
    name: "Global Women in STEM Postgraduate Fellowship",
    university: "University of Oxford",
    country: "United Kingdom",
    amount: "100% Tuition + Living Stipend",
    deadline: "15 May 2026",
    criteria: "Female applicants enrolling in Computer Science, AI, or Engineering.",
    discipline: "Computing & STEM",
    type: "STEM",
  },
  {
    id: "sch-3",
    name: "Clarendon Fund International Scholarship",
    university: "University of Oxford",
    country: "United Kingdom",
    amount: "Full Tuition + £18,622 Annual Grant",
    deadline: "08 January 2026",
    criteria: "Outstanding academic merit (First-Class honours or GPA 3.8+).",
    discipline: "All Disciplines",
    type: "Merit",
  },
  {
    id: "sch-4",
    name: "Sydney International Student Award",
    university: "University of Sydney",
    country: "Australia",
    amount: "20% Tuition Fee Contribution",
    deadline: "15 October 2026",
    criteria: "Automatic assessment based on academic grade upon international admission.",
    discipline: "All Disciplines",
    type: "Merit",
  },
  {
    id: "sch-5",
    name: "Melbourne International Research Scholarship",
    university: "University of Melbourne",
    country: "Australia",
    amount: "Full Fee Offset + $37,000/yr",
    deadline: "31 October 2026",
    criteria: "Applicants with high research potential for MPhil or PhD pathways.",
    discipline: "Postgraduate Research",
    type: "Need-Based",
  },
  {
    id: "sch-6",
    name: "Commonwealth Master's Scholarship Scheme",
    university: "Various UK Universities",
    country: "United Kingdom",
    amount: "Full Tuition + Airfare + Monthly Stipend",
    deadline: "05 December 2026",
    criteria: "Citizens of developing Commonwealth countries with verified financial need.",
    discipline: "Development & Science",
    type: "Government",
  },
];

export const StudentScholarshipsPage: React.FC = () => {
  const [filterCountry, setFilterCountry] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = SCHOLARSHIPS_DATA.filter((item) => {
    if (filterCountry !== "All" && item.country !== filterCountry) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.university.toLowerCase().includes(q) ||
        item.discipline.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-7 pb-16 font-sans animate-fade-in">
      {/* Page Title */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>International Student Financial Aid & Bursaries</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
          Scholarships Radar
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Discover verified university merit bursaries, government grants, and tuition discounts for international applicants.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search scholarship name, university..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-medium">Destination:</span>
          <select
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="py-1.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          >
            <option value="All">All Countries</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Australia">Australia</option>
          </select>
        </div>
      </div>

      {/* Scholarships Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((sch) => (
          <div
            key={sch.id}
            className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  {sch.type}
                </span>
                <span className="text-sm font-black text-teal-300 font-mono">{sch.amount}</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white font-heading">{sch.name}</h3>
                <div className="text-xs text-slate-400 mt-0.5">{sch.university} &middot; {sch.country}</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs">
                <div className="text-slate-400">
                  <strong className="text-slate-300">Eligibility Criteria:</strong> {sch.criteria}
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
                  <span>Field: <strong className="text-white">{sch.discipline}</strong></span>
                  <span className="flex items-center gap-1 text-rose-300">
                    <Calendar className="w-3 h-3" />
                    <span>Deadline: {sch.deadline}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Provider</span>
              </span>
              <a
                href="#apply-scholarship"
                onClick={(e) => {
                  e.preventDefault();
                  alert(`Scholarship interest logged for "${sch.name}". Your counsellor Sarah Jenkins will submit your nomination letter.`);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <span>Request Nomination</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
