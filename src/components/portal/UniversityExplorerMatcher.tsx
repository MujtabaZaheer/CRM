import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, doc, getDoc, getDocs, setDoc, query, where } from "firebase/firestore";
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  SlidersHorizontal,
  BookmarkPlus,
  BookmarkCheck,
  Banknote,
  GraduationCap,
  Building2,
  MapPin,
  Star,
  X,
  Eye,
  Info,
  Globe,
  Send,
  Layers,
  LayoutGrid,
} from "lucide-react";
import { db } from "../../firebase/config";
import { useAuth } from "../../contexts/AuthContext";
import { Student } from "../../types/student";
import { Programme, University } from "../../types/university";
import { assessEligibility, EligibilityResult } from "../../utils/eligibility";
import { DEMO_UNIVERSITIES } from "../../data/demoData";
import { getUniversityCampusImage, getUniversityLandmark } from "../../utils/universityImages";

/* ------------------------------------------------------------------ */
/*  Local types                                                        */
/* ------------------------------------------------------------------ */
export interface ProgramMatchItem {
  university: University;
  programme: Programme;
  matchScore: number;
  eligibility: EligibilityResult;
  matchReasons: string[];
}

export type ViewMode = "universities" | "programs";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const STUDY_LEVELS = ["Foundation", "Bachelor's", "Pre-Master's", "Master's", "MBA", "PhD"];
const SUBJECT_AREAS = [
  "STEM",
  "Business & Management",
  "Health Sciences",
  "Humanities",
  "Computing & AI",
  "Law & Legal Studies",
];

export const normalizeCountry = (c: string): string => {
  const s = (c || "").toLowerCase().trim();
  if (s === "uk" || s === "great britain" || s === "england") return "united kingdom";
  if (s === "usa" || s === "us" || s === "america") return "united states";
  if (s === "uae" || s === "emirates" || s === "dubai") return "united arab emirates";
  if (s === "nz") return "new zealand";
  return s;
};

/* ------------------------------------------------------------------ */
/*  Debounce hook                                                      */
/* ------------------------------------------------------------------ */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

/* ------------------------------------------------------------------ */
/*  Eligibility badge config                                           */
/* ------------------------------------------------------------------ */
const ELIG_BADGE: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  eligible: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  competitive: {
    bg: "bg-sky-500/10",
    text: "text-sky-400",
    border: "border-sky-500/20",
    icon: <Star className="w-3 h-3" />,
  },
  conditional: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
    icon: <AlertTriangle className="w-3 h-3" />,
  },
  not_eligible: {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/20",
    icon: <XCircle className="w-3 h-3" />,
  },
  not_checked: {
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-500/20",
    icon: <Info className="w-3 h-3" />,
  },
};

interface UniversityExplorerMatcherProps {
  initialViewMode?: ViewMode;
  isOnboarding?: boolean;
  onProceed?: () => void;
}

export const UniversityExplorerMatcher: React.FC<UniversityExplorerMatcherProps> = ({
  initialViewMode = "universities",
  isOnboarding = false,
  onProceed,
}) => {
  const { appUser, firebaseUser } = useAuth();
  const navigate = useNavigate();

  /* ---- State ---- */
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [appliedMap, setAppliedMap] = useState<Record<string, string>>({}); // key -> appNumber

  // View toggle
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 250);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [maxBudget, setMaxBudget] = useState<number>(100000);
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [activeCountryTab, setActiveCountryTab] = useState<string>("All");

  // Shortlisting
  const [shortlistedKeys, setShortlistedKeys] = useState<string[]>([]);

  // Drawer modal
  const [drawerItem, setDrawerItem] = useState<ProgramMatchItem | null>(null);

  // Applying state
  const [applyingKey, setApplyingKey] = useState<string | null>(null);

  /* ---- Initial data load ---- */
  useEffect(() => {
    const initData = async () => {
      const uid = firebaseUser?.uid || appUser?.uid;
      if (!uid) return;

      try {
        const studentSnap = await getDoc(doc(db, "students", uid));
        if (studentSnap.exists()) {
          const sd = studentSnap.data() as Student;
          setStudent(sd);
          if (sd.shortlistedPrograms?.length) setShortlistedKeys(sd.shortlistedPrograms);
          if (sd.desiredStudyLevel) {
            if (sd.desiredStudyLevel.includes("Master")) setSelectedLevels(["Master's"]);
            else if (sd.desiredStudyLevel.includes("Bachelor")) setSelectedLevels(["Bachelor's"]);
          }
          // Default to 100,000 (all budgets / explore all) so students see universities from all destinations
          setMaxBudget(100000);
          if (sd.preferredDestinations?.length) {
            setSelectedCountries(sd.preferredDestinations);
          } else if (sd.preferredDestination) {
            setSelectedCountries([sd.preferredDestination]);
          }
        }

        // Fetch universities from DB + merge with DEMO_UNIVERSITIES to guarantee global coverage
        const univSnap = await getDocs(collection(db, "universities"));
        let fetched = univSnap.docs.map((d) => ({ id: d.id, ...d.data() } as University));
        if (fetched.length === 0) {
          fetched = [...DEMO_UNIVERSITIES];
        } else {
          const combined = [...fetched];
          DEMO_UNIVERSITIES.forEach((demo) => {
            const existingIdx = combined.findIndex(
              (u) => u.name.toLowerCase() === demo.name.toLowerCase() || (u.id && u.id === demo.id)
            );
            if (existingIdx === -1) {
              combined.push(demo);
            } else {
              const existingProgIds = new Set((combined[existingIdx].programmes || []).map((p) => p.id));
              const missingProgs = (demo.programmes || []).filter((p) => !existingProgIds.has(p.id));
              if (missingProgs.length > 0) {
                combined[existingIdx] = {
                  ...combined[existingIdx],
                  programmes: [...(combined[existingIdx].programmes || []), ...missingProgs],
                };
              }
            }
          });
          fetched = combined;
        }
        setUniversities(fetched);

        // Fetch existing applications for this student
        try {
          const appsQuery = query(collection(db, "applications"), where("studentId", "==", uid));
          const appsSnap = await getDocs(appsQuery);
          const appRecord: Record<string, string> = {};
          appsSnap.docs.forEach((d) => {
            const data = d.data();
            if (data.universityId && data.programmeId) {
              appRecord[`${data.universityId}-${data.programmeId}`] = data.applicationNumber || d.id;
            }
          });
          setAppliedMap(appRecord);
        } catch (_) {}
      } catch (err) {
        console.warn("Error loading matcher data:", err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [appUser, firebaseUser]);

  /* ---- Matching engine ---- */
  const matchedPrograms = useMemo<ProgramMatchItem[]>(() => {
    if (universities.length === 0) return [];
    const dests = student?.preferredDestinations || (student?.preferredDestination ? [student.preferredDestination] : []);
    const desiredLevel = student?.desiredStudyLevel || "Master's";
    const results: ProgramMatchItem[] = [];

    universities.forEach((univ) => {
      (univ.programmes || []).forEach((prog) => {
        let score = 50;
        const reasons: string[] = [];

        const countryMatch = dests.some((d) => normalizeCountry(d) === normalizeCountry(univ.country || ""));
        if (countryMatch) { score += 20; reasons.push(`Destination match: ${univ.country}`); }

        const pl = prog.level || "";
        if (
          (desiredLevel.includes("Master") && (pl.includes("Postgraduate") || pl.includes("Master"))) ||
          (desiredLevel.includes("Bachelor") && (pl.includes("Undergraduate") || pl.includes("Bachelor"))) ||
          (desiredLevel.includes("Doctor") && pl.includes("Doctor")) ||
          (desiredLevel.includes("Foundation") && pl.includes("Foundation"))
        ) { score += 15; reasons.push(`Study level aligned: ${prog.level}`); }

        const studentMajor = (student?.academicHistory?.[0]?.degreeTitle || "").toLowerCase();
        if (studentMajor && (prog.title || "").toLowerCase().includes(studentMajor.split(" ")[0])) {
          score += 15; reasons.push("Subject background alignment");
        }

        const fee = prog.tuitionFeeAnnual || 25000;
        if (maxBudget >= 100000 || fee <= maxBudget) { score += 10; reasons.push("Within tuition budget"); }
        else if (fee > maxBudget * 1.3) score -= 10;

        results.push({
          university: univ,
          programme: prog,
          matchScore: Math.min(98, Math.max(40, score)),
          eligibility: assessEligibility(student || undefined, prog),
          matchReasons: reasons,
        });
      });
    });
    return results.sort((a, b) => b.matchScore - a.matchScore);
  }, [universities, student, maxBudget]);

  /* ---- Filtered programs ---- */
  const filteredMatches = useMemo(() => {
    return matchedPrograms.filter(({ university, programme, eligibility }) => {
      // Country tab filter
      const univCountry = normalizeCountry(university.country || "");
      if (activeCountryTab !== "All") {
        if (univCountry !== normalizeCountry(activeCountryTab)) return false;
      }

      // Search query
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim();
        const matchesTitle = programme.title.toLowerCase().includes(q);
        const matchesUniv = university.name.toLowerCase().includes(q);
        const matchesCountry = university.country.toLowerCase().includes(q);
        const matchesField = (programme.field || "").toLowerCase().includes(q);
        const matchesSubject = (programme.subjectArea || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesUniv && !matchesCountry && !matchesField && !matchesSubject) return false;
      }

      // Level
      if (selectedLevels.length > 0) {
        const matchesLevel = selectedLevels.some((l) => {
          const pl = (programme.level || "").toLowerCase();
          const target = l.toLowerCase();
          if (target.includes("master") && (pl.includes("master") || pl.includes("postgrad"))) return true;
          if (target.includes("bachelor") && (pl.includes("bachelor") || pl.includes("undergrad"))) return true;
          if (target.includes("phd") && (pl.includes("phd") || pl.includes("doctor"))) return true;
          if (target.includes("foundation") && pl.includes("foundation")) return true;
          return pl.includes(target);
        });
        if (!matchesLevel) return false;
      }

      // Field / Subject
      if (selectedFields.length > 0) {
        const matchesField = selectedFields.some((f) => {
          const progField = (programme.subjectArea || programme.field || "").toLowerCase();
          return progField.includes(f.toLowerCase());
        });
        if (!matchesField) return false;
      }

      // Tuition budget (only filter when below 100k)
      if (maxBudget < 100000) {
        const fee = programme.tuitionFeeAnnual || 0;
        if (fee > maxBudget) return false;
      }

      // Eligibility only
      if (onlyEligible && eligibility.status === "not_eligible") return false;

      return true;
    });
  }, [
    matchedPrograms,
    activeCountryTab,
    selectedCountries,
    debouncedSearch,
    selectedLevels,
    selectedFields,
    maxBudget,
    onlyEligible,
  ]);

  /* ---- Grouped by University ---- */
  const groupedByUniversity = useMemo(() => {
    const map = new Map<string, { university: University; programs: ProgramMatchItem[] }>();
    filteredMatches.forEach((item) => {
      const uId = item.university.id;
      if (!map.has(uId)) {
        map.set(uId, { university: item.university, programs: [] });
      }
      map.get(uId)!.programs.push(item);
    });
    return Array.from(map.values());
  }, [filteredMatches]);

  // Country pills list
  const allDestinationsList = useMemo(() => {
    const set = new Set<string>();
    universities.forEach((u) => { if (u.country) set.add(u.country); });
    return Array.from(set).sort();
  }, [universities]);

  /* ---- Shortlist Toggle ---- */
  const toggleShortlist = async (progKey: string) => {
    const next = shortlistedKeys.includes(progKey)
      ? shortlistedKeys.filter((k) => k !== progKey)
      : [...shortlistedKeys, progKey];
    setShortlistedKeys(next);

    const uid = firebaseUser?.uid || appUser?.uid;
    if (uid) {
      try {
        await setDoc(doc(db, "students", uid), { shortlistedPrograms: next, updatedAt: Date.now() }, { merge: true });
      } catch (_) {}
    }
  };

  /* ---- Apply to Program (Navigate to Wizard) ---- */
  const handleApplyToProgram = async (univ: University, prog: Programme) => {
    const key = `${univ.id}-${prog.id}`;
    setApplyingKey(key);
    navigate(`/student/new-application?universityId=${univ.id}&programmeId=${prog.id}`);
  };

  const toggleArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    setter((prev) => (prev.includes(val) ? prev.filter((i) => i !== val) : [...prev, val]));
  };

  /* ---- Loading ---- */
  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  const appliedCount = Object.keys(appliedMap).length;

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-16">
      {/* Header Banner (Conditional based on onboarding vs portal) */}
      {isOnboarding ? (
        <div className="rounded-2xl bg-surface border border-subtle p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
              Step 3 of 4 • University Explorer & Multi-Program Matcher
            </span>
            <h1 className="text-xl font-bold font-heading text-primary">
              Explore Universities & Apply
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/student/onboarding/step-2")}
              className="px-3 py-1.5 bg-elevated hover:bg-hover text-xs font-semibold text-secondary rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              onClick={onProceed}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              Continue to Review ({shortlistedKeys.length} Shortlisted, {appliedCount} Applied)
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
              Global University & Program Explorer
            </p>
            <h1 className="text-2xl font-bold font-heading text-primary mt-1">
              Find Universities & Programs
            </h1>
            <p className="text-xs text-secondary mt-0.5">
              Explore university criteria, calculate live admission eligibility, and start direct applications.
            </p>
          </div>

          {/* View Mode Toggle Button */}
          <div className="flex items-center gap-2 self-start md:self-auto bg-surface p-1 rounded-xl border border-subtle">
            <button
              type="button"
              onClick={() => setViewMode("universities")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === "universities"
                  ? "bg-emerald-500 text-zinc-950 shadow"
                  : "text-muted hover:text-primary"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Universities View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("programs")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === "programs"
                  ? "bg-emerald-500 text-zinc-950 shadow"
                  : "text-muted hover:text-primary"
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Programs View
            </button>
          </div>
        </header>
      )}

      {/* ---- Country Horizontal Pill Bar (From User Screenshot) ---- */}
      <div className="bg-surface rounded-2xl p-3 border border-subtle shadow-sm flex items-center gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 text-xs font-bold text-muted uppercase tracking-wider pl-2 pr-1 shrink-0">
          <Globe className="w-4 h-4 text-emerald-400" /> Filter Country:
        </div>
        <button
          type="button"
          onClick={() => setActiveCountryTab("All")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
            activeCountryTab === "All"
              ? "bg-emerald-500 text-zinc-950 shadow"
              : "bg-elevated text-secondary hover:text-primary hover:bg-hover border border-subtle"
          }`}
        >
          All Destinations ({allDestinationsList.length} Countries)
        </button>
        {allDestinationsList.map((country) => (
          <button
            key={country}
            type="button"
            onClick={() => setActiveCountryTab(country)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeCountryTab === country
                ? "bg-emerald-500 text-zinc-950 shadow"
                : "bg-elevated text-secondary hover:text-primary hover:bg-hover border border-subtle"
            }`}
          >
            {country}
          </button>
        ))}
      </div>

      {/* ---- Main 2-Column Layout ---- */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT SIDEBAR: FILTERS */}
        <aside className="lg:col-span-3 space-y-4">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search universities, courses..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface border border-subtle rounded-xl text-xs text-primary placeholder-muted focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="bg-surface rounded-2xl p-5 border border-subtle space-y-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-subtle">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" /> Program Filters
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedLevels([]);
                  setSelectedFields([]);
                  setMaxBudget(60000);
                  setOnlyEligible(false);
                  setSearchQuery("");
                }}
                className="text-[11px] text-muted hover:text-emerald-400 transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>

            {/* Level / Award */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted block">
                Level / Award
              </label>
              <div className="flex flex-wrap gap-1.5">
                {STUDY_LEVELS.map((level) => {
                  const active = selectedLevels.includes(level);
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => toggleArrayItem(setSelectedLevels, level)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        active
                          ? "bg-emerald-500 text-zinc-950 font-bold"
                          : "bg-elevated text-secondary hover:text-primary border border-subtle"
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subject Area */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted block">
                Subject Area
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SUBJECT_AREAS.map((subj) => {
                  const active = selectedFields.includes(subj);
                  return (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => toggleArrayItem(setSelectedFields, subj)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        active
                          ? "bg-emerald-500 text-zinc-950 font-bold"
                          : "bg-elevated text-secondary hover:text-primary border border-subtle"
                      }`}
                    >
                      {subj}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Max Tuition */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-muted">
                  Max Tuition / Yr
                </label>
                <span className="text-xs font-bold text-emerald-400">
                  {maxBudget >= 100000 ? "Any Tuition ($100k+)" : `$${maxBudget.toLocaleString()}`}
                </span>
              </div>
              <input
                type="range"
                min="5000"
                max="100000"
                step="5000"
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Eligible Matches Only */}
            <div className="pt-2 border-t border-subtle flex items-center justify-between">
              <span className="text-xs font-bold text-secondary">Eligible Matches Only</span>
              <button
                type="button"
                onClick={() => setOnlyEligible(!onlyEligible)}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                  onlyEligible ? "bg-emerald-500" : "bg-elevated border border-subtle"
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                    onlyEligible ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </aside>

        {/* RIGHT AREA: RESULTS */}
        <div className="lg:col-span-9 space-y-4">
          {filteredMatches.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-surface border border-subtle space-y-3">
              <GraduationCap className="w-12 h-12 text-muted mx-auto" />
              <h3 className="text-base font-bold text-primary">No Matching Programs Found</h3>
              <p className="text-xs text-secondary max-w-md mx-auto">
                Try widening your search terms, adjusting your tuition budget, or clearing some of the filters.
              </p>
            </div>
          ) : viewMode === "universities" ? (
            /* ---- UNIVERSITIES GROUPED VIEW (Matching Screenshot) ---- */
            <div className="space-y-6">
              {groupedByUniversity.map(({ university, programs }) => (
                <div
                  key={university.id}
                  className="p-6 rounded-2xl bg-surface border border-subtle shadow-sm hover:border-default transition-all space-y-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-subtle flex items-center justify-center shrink-0 shadow-md group">
                        <img
                          src={getUniversityCampusImage(university)}
                          alt={`${university.name} campus`}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = "/images/campus_uk.jpg";
                          }}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-lg font-bold text-primary font-heading">
                            {university.name}
                          </h2>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {university.country}
                          </span>
                        </div>
                        <p className="text-xs text-secondary flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{university.city}, {university.country}</span>
                          <span className="text-muted">•</span>
                          <span className="text-muted text-[11px] font-normal truncate max-w-xs sm:max-w-md">
                            {getUniversityLandmark(university.id || university.name)}
                          </span>
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-secondary bg-elevated px-3 py-1.5 rounded-xl border border-subtle shrink-0">
                      {programs.length} {programs.length === 1 ? "Program Available" : "Programs Available"}
                    </span>
                  </div>

                  {university.description && (
                    <p className="text-xs text-secondary leading-relaxed">{university.description}</p>
                  )}

                  {/* Offering Programs Table / Cards */}
                  <div className="space-y-3 pt-2 border-t border-subtle">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-emerald-400" /> Offering Programs & Admission Criteria:
                    </h3>

                    <div className="grid grid-cols-1 gap-3">
                      {programs.map(({ programme, matchScore, eligibility }) => {
                        const key = `${university.id}-${programme.id}`;
                        const isShortlisted = shortlistedKeys.includes(key);
                        const appNumber = appliedMap[key];
                        const isApplying = applyingKey === key;
                        const eligBadge = ELIG_BADGE[eligibility.status] || ELIG_BADGE.not_checked;

                        return (
                          <div
                            key={key}
                            className="p-4 rounded-xl bg-main border border-subtle hover:border-default transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-primary hover:text-emerald-400 transition-colors">
                                  {programme.title}
                                </h4>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${eligBadge.bg} ${eligBadge.text} ${eligBadge.border}`}>
                                  {eligBadge.icon} {eligibility.label}
                                </span>
                                {appNumber && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                                    ✓ Draft: {appNumber}
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                                <span><span className="text-secondary font-medium">Level:</span> {programme.level}</span>
                                <span>•</span>
                                <span><span className="text-secondary font-medium">Duration:</span> {programme.durationMonths} mos</span>
                                <span>•</span>
                                <span><span className="text-secondary font-medium">Tuition:</span> {programme.currency} {programme.tuitionFeeAnnual?.toLocaleString()}/yr</span>
                                <span>•</span>
                                <span><span className="text-secondary font-medium">Min IELTS:</span> {programme.minIeltsScore || 6.5}</span>
                                <span>•</span>
                                <span><span className="text-secondary font-medium">Intakes:</span> {programme.intakes?.join(", ") || "September"}</span>
                              </div>

                              {programme.entryRequirements && (
                                <p className="text-[11px] text-muted italic line-clamp-1">
                                  Entry: {programme.entryRequirements}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setDrawerItem({ university, programme, matchScore, eligibility, matchReasons: [] })}
                                className="px-3 py-1.5 bg-elevated hover:bg-hover text-xs font-semibold text-secondary rounded-lg border border-subtle transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" /> Details
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleShortlist(key)}
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                  isShortlisted
                                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                                    : "bg-elevated border-subtle text-muted hover:text-primary"
                                }`}
                                title={isShortlisted ? "Shortlisted" : "Shortlist program"}
                              >
                                {isShortlisted ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
                              </button>
                              <button
                                type="button"
                                disabled={isApplying}
                                onClick={() => handleApplyToProgram(university, programme)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
                                  appNumber
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                                    : "bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20"
                                }`}
                              >
                                {isApplying ? (
                                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Drafting...</>
                                ) : appNumber ? (
                                  <><CheckCircle2 className="w-3.5 h-3.5" /> View Draft</>
                                ) : (
                                  <><Send className="w-3.5 h-3.5" /> Apply Now</>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ---- INDIVIDUAL PROGRAM CARDS VIEW ---- */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMatches.map(({ university, programme, matchScore, eligibility }) => {
                const key = `${university.id}-${programme.id}`;
                const isShortlisted = shortlistedKeys.includes(key);
                const appNumber = appliedMap[key];
                const isApplying = applyingKey === key;
                const eligBadge = ELIG_BADGE[eligibility.status] || ELIG_BADGE.not_checked;

                return (
                  <article
                    key={key}
                    className="bg-surface rounded-2xl p-5 border border-subtle hover:border-default transition-all flex flex-col justify-between space-y-4 group shadow-sm relative"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${eligBadge.bg} ${eligBadge.text} ${eligBadge.border}`}>
                          {eligBadge.icon} {eligibility.label}
                        </span>
                        <span className="text-[10px] font-semibold text-muted bg-elevated px-2 py-0.5 rounded border border-subtle">
                          {university.country}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setDrawerItem({ university, programme, matchScore, eligibility, matchReasons: [] })}
                          className="p-1.5 rounded-lg bg-main text-muted hover:text-primary border border-default cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleShortlist(key)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isShortlisted ? "bg-emerald-500 text-white" : "bg-main text-muted hover:text-primary border border-default"
                          }`}
                        >
                          {isShortlisted ? <BookmarkCheck className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-subtle shrink-0 shadow-sm mt-0.5">
                        <img
                          src={getUniversityCampusImage(university)}
                          alt={`${university.name} campus`}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = "/images/campus_uk.jpg";
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-primary font-heading line-clamp-2 leading-tight group-hover:text-emerald-400 transition-colors">
                          {programme.title}
                        </h3>
                        <p className="text-xs text-secondary flex items-center gap-1.5 mt-1 truncate">
                          <span className="font-semibold truncate">{university.name}</span>
                          <span className="text-muted">•</span>
                          <span className="text-muted text-[11px] truncate">{university.city}</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-subtle/50 text-xs">
                      <div className="bg-main rounded-lg p-2 border border-subtle">
                        <span className="text-[10px] text-muted uppercase font-semibold block">Tuition / Yr</span>
                        <span className="font-bold text-primary">{programme.currency} {programme.tuitionFeeAnnual?.toLocaleString()}</span>
                      </div>
                      <div className="bg-main rounded-lg p-2 border border-subtle">
                        <span className="text-[10px] text-muted uppercase font-semibold block">Intakes</span>
                        <span className="font-bold text-primary line-clamp-1">{programme.intakes?.join(", ") || "September"}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isApplying}
                        onClick={() => handleApplyToProgram(university, programme)}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                          appNumber
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                            : "bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20"
                        }`}
                      >
                        {isApplying ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating Application...</>
                        ) : appNumber ? (
                          <><CheckCircle2 className="w-3.5 h-3.5" /> Drafted ({appNumber})</>
                        ) : (
                          <><Send className="w-3.5 h-3.5" /> Apply Now</>
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ================================================================ */}
      {/*  PROGRAM DETAIL DRAWER                                           */}
      {/* ================================================================ */}
      {drawerItem && (
        <>
          <div className="fixed inset-0 bg-backdrop z-50" onClick={() => setDrawerItem(null)} />
          <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-surface border-l border-subtle z-50 overflow-y-auto shadow-2xl animate-slide-in-right">
            <div className="sticky top-0 bg-surface/95 backdrop-blur-sm border-b border-subtle p-5 flex items-start justify-between z-10">
              <div className="flex-1 mr-4">
                <h2 className="text-lg font-bold text-primary font-heading leading-tight">{drawerItem.programme.title}</h2>
                <p className="text-sm text-secondary mt-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  {drawerItem.university.name} — {drawerItem.university.city}, {drawerItem.university.country}
                </p>
              </div>
              <button
                onClick={() => setDrawerItem(null)}
                className="p-2 rounded-lg bg-elevated hover:bg-hover text-secondary hover:text-primary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Real Campus Photography Banner */}
            <div className="relative h-44 w-full overflow-hidden border-b border-subtle">
              <img
                src={getUniversityCampusImage(drawerItem.university)}
                alt={`${drawerItem.university.name} campus`}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = "/images/campus_uk.jpg";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/50 to-transparent" />
              <div className="absolute bottom-3 left-5 right-5 flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider backdrop-blur-sm">
                    {drawerItem.university.country}
                  </span>
                  <p className="text-xs font-semibold text-white drop-shadow flex items-center gap-1 mt-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{getUniversityLandmark(drawerItem.university.id || drawerItem.university.name)}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-6">
              {(() => {
                const badge = ELIG_BADGE[drawerItem.eligibility.status] || ELIG_BADGE.not_checked;
                return (
                  <div className={`p-3 rounded-xl border ${badge.bg} ${badge.border} flex items-center gap-2`}>
                    <span className={`${badge.text}`}>{badge.icon}</span>
                    <span className={`text-sm font-bold ${badge.text}`}>{drawerItem.eligibility.label}</span>
                    <span className={`ml-auto text-sm font-bold ${badge.text}`}>{drawerItem.eligibility.score}% Readiness</span>
                  </div>
                );
              })()}

              <section className="space-y-3">
                <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" /> Academic & Language Criteria
                </h3>
                <div className="bg-main rounded-xl p-4 border border-subtle space-y-2 text-sm">
                  {drawerItem.programme.requirements?.minGpa && (
                    <div className="flex justify-between">
                      <span className="text-muted">Minimum GPA</span>
                      <span className="font-semibold text-primary">{drawerItem.programme.requirements.minGpa}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted">Minimum IELTS Band</span>
                    <span className="font-semibold text-emerald-400">{drawerItem.programme.minIeltsScore || 6.5} overall</span>
                  </div>
                  {drawerItem.programme.entryRequirements && (
                    <p className="text-xs text-muted leading-relaxed pt-1">{drawerItem.programme.entryRequirements}</p>
                  )}
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5" /> Costs & Deposit
                </h3>
                <div className="bg-main rounded-xl p-4 border border-subtle space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Annual Tuition</span>
                    <span className="font-bold text-primary">{drawerItem.programme.currency} {drawerItem.programme.tuitionFeeAnnual?.toLocaleString()}</span>
                  </div>
                  {drawerItem.programme.estimatedLivingCostAnnual && (
                    <div className="flex justify-between">
                      <span className="text-muted">Estimated Living Cost / Year</span>
                      <span className="font-semibold text-secondary">{drawerItem.programme.currency} {drawerItem.programme.estimatedLivingCostAnnual.toLocaleString()}</span>
                    </div>
                  )}
                  {drawerItem.programme.depositRequired && (
                    <div className="flex justify-between">
                      <span className="text-muted">Mandatory Deposit</span>
                      <span className="font-semibold text-amber-400">{drawerItem.programme.currency} {drawerItem.programme.depositRequired.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </section>

              {drawerItem.eligibility.checks.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Profile Eligibility Cross-Examination
                  </h3>
                  <div className="space-y-2">
                    {drawerItem.eligibility.checks.map((check, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border text-xs ${
                          check.status === "pass" ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" :
                          check.status === "fail" ? "bg-rose-500/5 border-rose-500/20 text-rose-400" :
                          "bg-amber-500/5 border-amber-500/20 text-amber-400"
                        }`}
                      >
                        <span className="font-bold">{check.label}</span>
                        <p className="text-primary/70 mt-0.5">{check.detail}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Drawer Footer with Apply Button */}
            <div className="sticky bottom-0 bg-surface/95 backdrop-blur-sm border-t border-subtle p-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const key = `${drawerItem.university.id}-${drawerItem.programme.id}`;
                  toggleShortlist(key);
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-default bg-elevated hover:bg-hover text-primary transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                {shortlistedKeys.includes(`${drawerItem.university.id}-${drawerItem.programme.id}`) ? (
                  <><BookmarkCheck className="w-4 h-4 text-emerald-400" /> Shortlisted</>
                ) : (
                  <><BookmarkPlus className="w-4 h-4" /> Shortlist</>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleApplyToProgram(drawerItem.university, drawerItem.programme);
                  setDrawerItem(null);
                }}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {appliedMap[`${drawerItem.university.id}-${drawerItem.programme.id}`] ? "View Draft" : "Apply to Program"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Drawer slide-in animation */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default UniversityExplorerMatcher;
