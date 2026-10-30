import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  GraduationCap,
  Award,
  ArrowRight,
  Info,
} from "lucide-react";
import { GLOBAL_UNIVERSITIES } from "../../data/globalUniversities";
import { getUniversityCampusImage } from "../../utils/universityImages";
import { usePortalData } from "../../hooks/usePortalData";

export const StudentAiMatchPage: React.FC = () => {
  const { ownStudent } = usePortalData();

  const profileGpa = Number.parseFloat((ownStudent as any)?.academicHistory?.[0]?.gradeGpa || "");
  const profileIelts = Number.parseFloat((ownStudent as any)?.englishProficiency?.overallScore || "");
  const [gpa, setGpa] = useState<number | null>(Number.isFinite(profileGpa) ? profileGpa : null);
  const [ielts, setIelts] = useState<number | null>(Number.isFinite(profileIelts) ? profileIelts : null);
  const [destination, setDestination] = useState<string>("United Kingdom");
  const [level, setLevel] = useState<string>("Master's");
  const [subject, setSubject] = useState<string>("All");
  const [maxBudget, setMaxBudget] = useState<number>(45000);

  useEffect(() => {
    if (gpa === null && Number.isFinite(profileGpa)) setGpa(profileGpa);
    if (ielts === null && Number.isFinite(profileIelts)) setIelts(profileIelts);
  }, [gpa, ielts, profileGpa, profileIelts]);

  // Flatten all degree programmes
  const allProgrammes = useMemo(() => {
    const list: any[] = [];
    GLOBAL_UNIVERSITIES.forEach((univ) => {
      (univ.programmes || []).forEach((prog) => {
        list.push({ university: univ, programme: prog });
      });
    });
    return list;
  }, []);

  // Compute matched degree recommendations
  const matchedResults = useMemo(() => {
    if (gpa === null || ielts === null) return [];

    return allProgrammes
      .filter(({ university, programme }) => {
        if (destination !== "All" && university.country.toLowerCase() !== destination.toLowerCase()) {
          return false;
        }
        if (level === "Master's" && !programme.level.toLowerCase().includes("postgraduate") && !programme.level.toLowerCase().includes("master")) {
          return false;
        }
        if (level === "Bachelor's" && !programme.level.toLowerCase().includes("undergraduate") && !programme.level.toLowerCase().includes("bachelor")) {
          return false;
        }
        if (subject !== "All" && programme.subjectArea !== subject) {
          return false;
        }
        if (programme.tuitionFeeAnnual > maxBudget) {
          return false;
        }
        return true;
      })
      .map(({ university, programme }) => {
        const reqGpa = programme.requirements?.minGpa || 3.0;
        const reqIelts = programme.minIeltsScore || 6.5;

        let score = 70;
        let tier: "High Match" | "Target Match" | "Reach" = "Target Match";

        if (gpa >= reqGpa && ielts >= reqIelts) {
          score = 92 + Math.min(7, Math.round((gpa - reqGpa) * 10));
          tier = "High Match";
        } else if (gpa >= reqGpa - 0.3 && ielts >= reqIelts - 0.5) {
          score = 78 + Math.round((gpa - (reqGpa - 0.3)) * 15);
          tier = "Target Match";
        } else {
          score = 62;
          tier = "Reach";
        }

        return {
          university,
          programme,
          score: Math.min(99, score),
          tier,
          scholarshipEligible: gpa >= 3.3,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [allProgrammes, gpa, ielts, destination, level, subject, maxBudget]);

  return (
    <div className="max-w-7xl mx-auto space-y-7 pb-16 font-sans animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>Intelligent Study Match Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
          AI University & Programme Matcher
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Tailored admissions eligibility matching against official requirements from 120+ accredited global universities.
        </p>
      </div>

      {/* Control Panel: Sliders & Criteria */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* CGPA Slider */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your CGPA / Grade</span>
              <span className="text-sm font-black text-teal-400 font-mono">{gpa === null ? "Not provided" : `${gpa.toFixed(1)} / 4.0`}</span>
            </div>
            <input
              type="range"
              min="2.0"
              max="4.0"
              step="0.1"
              value={gpa ?? ""}
              onChange={(e) => setGpa(parseFloat(e.target.value))}
              className="w-full accent-teal-400 cursor-pointer"
            />
          </div>

          {/* IELTS Slider */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">IELTS Overall Band</span>
              <span className="text-sm font-black text-teal-400 font-mono">{ielts === null ? "Not provided" : ielts.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="5.0"
              max="9.0"
              step="0.5"
              value={ielts ?? ""}
              onChange={(e) => setIelts(parseFloat(e.target.value))}
              className="w-full accent-teal-400 cursor-pointer"
            />
          </div>

          {/* Destination Selector */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Target Country</span>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full py-1.5 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            >
              <option value="All">All Destinations</option>
              <option value="United Kingdom">United Kingdom (UK)</option>
              <option value="United States">United States (USA)</option>
              <option value="Australia">Australia</option>
              <option value="Canada">Canada</option>
              <option value="Germany">Germany</option>
            </select>
          </div>

          {/* Degree Level Selector */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Degree Level</span>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full py-1.5 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            >
              <option value="Master's">Postgraduate / Master's</option>
              <option value="Bachelor's">Undergraduate / Bachelor's</option>
              <option value="All">All Degree Levels</option>
            </select>
          </div>

          {/* Subject Area Selector */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Discipline</span>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full py-1.5 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            >
              <option value="All">All Disciplines</option>
              <option value="Computer Science">Computer Science & AI</option>
              <option value="Data Science">Data Science & Analytics</option>
              <option value="Business">Business & Management</option>
              <option value="Engineering">Engineering</option>
            </select>
          </div>

          {/* Max Budget Slider */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Max Annual Tuition</span>
              <span className="text-sm font-black text-teal-400 font-mono">£{maxBudget.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="15000"
              max="70000"
              step="5000"
              value={maxBudget}
              onChange={(e) => setMaxBudget(parseInt(e.target.value))}
              className="w-full accent-teal-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Algorithm Explanation Banner */}
        <div className="p-3 bg-teal-500/10 border border-teal-500/25 rounded-2xl flex items-center gap-2.5 text-xs text-teal-300">
          <Info className="w-4 h-4 flex-shrink-0 text-teal-400" />
          <span>
            <strong>Deterministic Criteria Model:</strong> Match scores represent an objective evaluation comparing your academic GPA and IELTS score directly against the published faculty prerequisites of each degree programme.
          </span>
        </div>
      </div>

      {/* Results Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white font-heading">
            Matched Degree Programmes ({matchedResults.length} Available)
          </h2>
          <span className="text-xs text-slate-400">Sorted by highest admission probability</span>
        </div>

        {matchedResults.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <GraduationCap className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-white">No Direct Matches Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try increasing your maximum tuition slider or broadening your destination filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {matchedResults.map((item, idx) => {
              const { university, programme, score, tier, scholarshipEligible } = item;
              const isHigh = tier === "High Match";

              return (
                <div
                  key={idx}
                  className="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between overflow-hidden shadow-lg group"
                >
                  <div>
                    {/* Campus Image Header */}
                    <div className="h-36 relative overflow-hidden">
                      <img
                        src={getUniversityCampusImage(university.id)}
                        alt={university.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-extrabold border shadow-md backdrop-blur-md ${
                            isHigh
                              ? "bg-teal-500/20 text-teal-300 border-teal-500/40"
                              : "bg-sky-500/20 text-sky-300 border-sky-500/40"
                          }`}
                        >
                          {score}% {tier}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 text-white">
                        <div className="text-xs font-semibold text-teal-300">{university.country}</div>
                        <div className="text-sm font-bold truncate">{university.name}</div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 space-y-3">
                      <h3 className="text-sm font-bold text-white leading-tight font-heading">
                        {programme.title}
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                        <div>
                          <span className="block text-[10px] uppercase text-slate-500 font-bold">Annual Tuition</span>
                          <span className="text-white font-bold font-mono">£{programme.tuitionFeeAnnual?.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-slate-500 font-bold">Min IELTS</span>
                          <span className="text-white font-bold font-mono">{programme.minIeltsScore} Band</span>
                        </div>
                      </div>

                      {scholarshipEligible && (
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 font-semibold flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          <span>Eligible for £3,000 International Merit Bursary</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="p-5 pt-0">
                    <Link
                      to={`/student/new-application?universityId=${university.id}&programmeId=${programme.id}`}
                      className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <span>1-Click Apply with AI</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
