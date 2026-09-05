import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import {
  Search,
  GraduationCap,
  Building2,
  Globe,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Bookmark,
  BookmarkCheck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Loader2,
} from "lucide-react";
import { db } from "../../../firebase/config";
import { useAuth } from "../../../contexts/AuthContext";
import { Student } from "../../../types/student";
import { Programme, University } from "../../../types/university";
import { assessEligibility } from "../../../utils/eligibility";

export interface ProgramMatchItem {
  university: University;
  programme: Programme;
  matchScore: number;
  eligibility: ReturnType<typeof assessEligibility>;
  matchReasons: string[];
}

const POPULAR_FIELDS = [
  "All Subjects",
  "Computer Science",
  "Artificial Intelligence",
  "Data Science",
  "Cyber Security",
  "Business & Management",
  "Finance & Accounting",
  "Engineering",
  "Health & Medicine",
  "Law & Legal Studies",
];

const STUDY_LEVELS = ["All Levels", "Bachelor's", "Master's", "Doctorate", "Foundation"];

export const StudentOnboardingProgramMatcher: React.FC = () => {
  const { appUser, firebaseUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedField, setSelectedField] = useState("All Subjects");
  const [selectedLevel, setSelectedLevel] = useState("All Levels");
  const [selectedCountryFilter, setSelectedCountryFilter] = useState("All");
  const [maxBudget, setMaxBudget] = useState<number>(60000);
  const [onlyEligible, setOnlyEligible] = useState(false);

  // Shortlisted Program IDs (combination of universityId-programmeId)
  const [shortlistedKeys, setShortlistedKeys] = useState<string[]>([]);
  const [savingShortlist, setSavingShortlist] = useState(false);

  // Load student profile & universities from Firestore
  useEffect(() => {
    const initData = async () => {
      const uid = firebaseUser?.uid || appUser?.uid;
      if (!uid) return;

      try {
        // 1. Load student profile
        const studentSnap = await getDoc(doc(db, "students", uid));
        let studentData: Student | null = null;
        if (studentSnap.exists()) {
          studentData = studentSnap.data() as Student;
          setStudent(studentData);

          if ((studentData as any).shortlistedPrograms && Array.isArray((studentData as any).shortlistedPrograms)) {
            setShortlistedKeys((studentData as any).shortlistedPrograms);
          }

          if ((studentData as any).desiredStudyLevel) {
            const lvl = (studentData as any).desiredStudyLevel;
            if (lvl.includes("Master")) setSelectedLevel("Master's");
            else if (lvl.includes("Bachelor")) setSelectedLevel("Bachelor's");
          }

          if (studentData.budgetAnnualUsd) {
            setMaxBudget(studentData.budgetAnnualUsd);
          }
        }

        // 2. Load universities from Firestore
        const univSnap = await getDocs(collection(db, "universities"));
        const univList: University[] = [];
        univSnap.docs.forEach((d) => {
          univList.push({ id: d.id, ...d.data() } as University);
        });
        setUniversities(univList);
      } catch (err) {
        console.warn("Error loading matcher data:", err);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [appUser, firebaseUser]);

  // Compute matches across all universities and programs
  const matchedPrograms = useMemo<ProgramMatchItem[]>(() => {
    if (universities.length === 0) return [];

    const studentDestinations = (student as any)?.preferredDestinations || (student?.preferredDestination ? [student.preferredDestination] : []);
    const studentLevel = (student as any)?.desiredStudyLevel || "Master's";

    const results: ProgramMatchItem[] = [];

    universities.forEach((univ) => {
      const programmes = univ.programmes || [];
      programmes.forEach((prog) => {
        // Calculate Match Score (0 - 100) based on preferences & fit
        let score = 50; // baseline
        const matchReasons: string[] = [];

        // Country match
        const countryMatch = studentDestinations.some(
          (d: string) => d.toLowerCase() === univ.country.toLowerCase()
        );
        if (countryMatch) {
          score += 20;
          matchReasons.push(`Destination match: ${univ.country}`);
        }

        // Level match
        const progLevel = prog.level || "";
        if (
          (studentLevel.includes("Master") && (progLevel.includes("Postgraduate") || progLevel.includes("Master"))) ||
          (studentLevel.includes("Bachelor") && (progLevel.includes("Undergraduate") || progLevel.includes("Bachelor"))) ||
          (studentLevel.includes("Doctor") && progLevel.includes("Doctor")) ||
          (studentLevel.includes("Foundation") && progLevel.includes("Foundation"))
        ) {
          score += 15;
          matchReasons.push(`Study level aligned: ${prog.level}`);
        }

        // Subject / Field match
        const progTitle = (prog.title || "").toLowerCase();
        const progField = (prog.field || "").toLowerCase();
        const studentMajor = (student?.academicHistory?.[0]?.degreeTitle || "").toLowerCase();

        if (
          (studentMajor && progTitle.includes(studentMajor.split(" ")[0])) ||
          (selectedField !== "All Subjects" && (progTitle.includes(selectedField.toLowerCase()) || progField.includes(selectedField.toLowerCase())))
        ) {
          score += 15;
          matchReasons.push("Subject & major background alignment");
        }

        // Budget match
        const fee = prog.tuitionFeeAnnual || 25000;
        if (fee <= maxBudget) {
          score += 10;
          matchReasons.push("Within tuition budget range");
        } else if (fee > maxBudget * 1.3) {
          score -= 10;
        }

        // Bound match score
        const matchScore = Math.min(98, Math.max(40, score));

        // Calculate Eligibility independently using admissions engine
        const eligibility = assessEligibility(student || undefined, prog);

        results.push({
          university: univ,
          programme: prog,
          matchScore,
          eligibility,
          matchReasons,
        });
      });
    });

    return results.sort((a, b) => b.matchScore - a.matchScore);
  }, [universities, student, selectedField, maxBudget]);

  // Filtered matches based on UI controls
  const filteredMatches = useMemo(() => {
    return matchedPrograms.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        item.programme.title.toLowerCase().includes(q) ||
        item.university.name.toLowerCase().includes(q) ||
        item.university.country.toLowerCase().includes(q) ||
        item.university.city.toLowerCase().includes(q);

      const matchesField =
        selectedField === "All Subjects" ||
        item.programme.title.toLowerCase().includes(selectedField.toLowerCase()) ||
        (item.programme.field || "").toLowerCase().includes(selectedField.toLowerCase());

      const matchesLevel =
        selectedLevel === "All Levels" ||
        (selectedLevel === "Master's" && (item.programme.level.includes("Postgraduate") || item.programme.level.includes("Master"))) ||
        (selectedLevel === "Bachelor's" && (item.programme.level.includes("Undergraduate") || item.programme.level.includes("Bachelor"))) ||
        item.programme.level.toLowerCase().includes(selectedLevel.toLowerCase());

      const matchesCountry =
        selectedCountryFilter === "All" ||
        item.university.country.toLowerCase() === selectedCountryFilter.toLowerCase();

      const matchesEligible =
        !onlyEligible || item.eligibility.status === "eligible" || item.eligibility.status === "conditional";

      return matchesQuery && matchesField && matchesLevel && matchesCountry && matchesEligible;
    });
  }, [matchedPrograms, searchQuery, selectedField, selectedLevel, selectedCountryFilter, onlyEligible]);

  // Toggle shortlist
  const toggleShortlist = async (key: string) => {
    const next = shortlistedKeys.includes(key)
      ? shortlistedKeys.filter((k) => k !== key)
      : [...shortlistedKeys, key];

    setShortlistedKeys(next);

    const uid = firebaseUser?.uid || appUser?.uid;
    if (uid) {
      try {
        await setDoc(doc(db, "students", uid), { shortlistedPrograms: next, updatedAt: Date.now() }, { merge: true });
      } catch (_) {}
    }
  };

  // Proceed to Step 4
  const proceedToStep4 = async () => {
    const uid = firebaseUser?.uid || appUser?.uid;
    if (uid) {
      setSavingShortlist(true);
      try {
        await setDoc(
          doc(db, "students", uid),
          {
            shortlistedPrograms: shortlistedKeys,
            onboardingStep: 3,
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      } catch (_) {}
      setSavingShortlist(false);
    }
    navigate("/student/onboarding/match");
  };

  const countriesInResults = useMemo(() => {
    const set = new Set<string>();
    universities.forEach((u) => { if (u.country) set.add(u.country); });
    return Array.from(set).sort();
  }, [universities]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-16">
      {/* Top Guided Progress Header */}
      <div className="sticky top-0 z-30 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
              Step 3 of 4 • Intelligent Program Matcher
            </span>
            <h1 className="text-xl font-bold font-heading text-white">
              Find the right program
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/student/onboarding/destination")}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>

            <button
              type="button"
              onClick={proceedToStep4}
              disabled={shortlistedKeys.length === 0 || savingShortlist}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-lg shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>Compare Matches ({shortlistedKeys.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-6 space-y-6">
        {/* Banner */}
        <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 text-sm text-zinc-300 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-white">
              Tell us what you want to study and we'll compare matching programs across your selected countries.
            </p>
            <p className="text-xs text-zinc-400">
              The engine distinguishes between your <strong>Match Score</strong> (preference & goals alignment) and your <strong>Configured Eligibility</strong> (meeting specific academic & English thresholds). Shortlist your favorite options to compare them in Step 4.
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subject, university, or city..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Field Select */}
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              {POPULAR_FIELDS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>

            {/* Level Select */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              {STUDY_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>

            {/* Country Filter */}
            <select
              value={selectedCountryFilter}
              onChange={(e) => setSelectedCountryFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="All">All Destination Countries</option>
              {countriesInResults.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/80 text-xs">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={onlyEligible}
                  onChange={(e) => setOnlyEligible(e.target.checked)}
                  className="rounded border-zinc-700 text-emerald-500 focus:ring-0"
                />
                Show only eligible or conditional matches
              </label>
            </div>

            <div className="text-zinc-400">
              Showing <span className="font-bold text-white">{filteredMatches.length}</span> matching programs
            </div>
          </div>
        </div>

        {/* Matches Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMatches.map(({ university, programme, matchScore, eligibility, matchReasons }) => {
            const key = `${university.id}-${programme.id}`;
            const isShortlisted = shortlistedKeys.includes(key);

            const eligColor =
              eligibility.status === "eligible"
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                : eligibility.status === "conditional"
                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                : "bg-rose-500/15 text-rose-300 border-rose-500/30";

            const eligIcon =
              eligibility.status === "eligible" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : eligibility.status === "conditional" ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
              );

            const eligLabel =
              eligibility.status === "eligible"
                ? "Meets Academic & English Criteria"
                : eligibility.status === "conditional"
                ? "Conditional Fit / Needs Review"
                : "Requirements Not Met";

            return (
              <article
                key={key}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 relative ${
                  isShortlisted
                    ? "bg-zinc-900/95 border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30"
                    : "bg-zinc-900/70 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                {/* Header: Match Score Badge & Shortlist Button */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold tracking-wide">
                      {matchScore}% Preference Match
                    </span>
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      {programme.level}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleShortlist(key)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                      isShortlisted
                        ? "bg-emerald-500 text-zinc-950 border-emerald-400 font-bold"
                        : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:text-white"
                    }`}
                  >
                    {isShortlisted ? (
                      <>
                        <BookmarkCheck className="w-3.5 h-3.5" />
                        Shortlisted
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-3.5 h-3.5" />
                        Shortlist
                      </>
                    )}
                  </button>
                </div>

                {/* Program & University Details */}
                <div>
                  <h3 className="text-base font-bold text-white leading-snug">
                    {programme.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-zinc-400">
                    <span className="font-semibold text-zinc-200 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                      {university.name}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-zinc-500" />
                      {university.city}, {university.country}
                    </span>
                  </div>
                </div>

                {/* Key Metrics: Fee & Intake */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-xs">
                  <div>
                    <span className="text-[11px] text-zinc-500 block">Annual Tuition</span>
                    <span className="font-semibold text-zinc-200">
                      {programme.currency} {programme.tuitionFeeAnnual?.toLocaleString() || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-500 block">Duration</span>
                    <span className="font-semibold text-zinc-200">
                      {programme.durationMonths ? `${programme.durationMonths} months` : "1 - 2 years"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-500 block">Next Intake</span>
                    <span className="font-semibold text-zinc-200">
                      {programme.intakes?.[0] || "September"}
                    </span>
                  </div>
                </div>

                {/* Independent Eligibility Engine Evaluation */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Admissions Eligibility Assessment</div>
                  <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${eligColor}`}>
                    <div className="flex items-center gap-2">
                      {eligIcon}
                      <span className="font-semibold">{eligLabel}</span>
                    </div>
                    <span className="text-[11px] font-mono opacity-80">
                      Readiness: {eligibility.score}%
                    </span>
                  </div>

                  {/* Checklist items */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-zinc-400">
                    {eligibility.checks.map((chk, i) => (
                      <div key={i} className="flex items-center gap-1.5 truncate">
                        <span className={chk.status === "pass" ? "text-emerald-400" : chk.status === "review" ? "text-amber-400" : "text-rose-400"}>
                          {chk.status === "pass" ? "✓" : chk.status === "review" ? "⚠" : "✗"}
                        </span>
                        <span className="truncate">{chk.label}: {chk.detail.split(".")[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Match Reasons */}
                {matchReasons.length > 0 && (
                  <div className="pt-2 border-t border-zinc-800/60">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Preference Factors</span>
                    <div className="flex flex-wrap gap-1.5">
                      {matchReasons.slice(0, 3).map((r, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {filteredMatches.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 text-zinc-400 space-y-3">
            <GraduationCap className="w-10 h-10 mx-auto text-zinc-600" />
            <h3 className="text-base font-semibold text-zinc-300">No matching programs found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Try adjusting your subject keyword, clearing filters, or increasing your budget range.
            </p>
          </div>
        )}

        {/* Bottom Bar */}
        <div className="sticky bottom-4 z-20 bg-zinc-900/95 backdrop-blur-md border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl">
          <div className="text-xs text-zinc-400">
            <span className="font-bold text-white">{shortlistedKeys.length}</span> programs shortlisted for comparison
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/student/onboarding/destination")}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
            >
              Previous
            </button>

            <button
              type="button"
              onClick={proceedToStep4}
              disabled={shortlistedKeys.length === 0 || savingShortlist}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Compare Selected Programs</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentOnboardingProgramMatcher;
