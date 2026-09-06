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
  Shield,
  X,
  Eye,
  Info,
  Globe,
  Send,
  Layers,
  LayoutGrid,
} from "lucide-react";
import { db } from "../../../firebase/config";
import { useAuth } from "../../../contexts/AuthContext";
import { Student } from "../../../types/student";
import { Programme, University } from "../../../types/university";
// import { Application } from "../../../types/application";
import { assessEligibility, EligibilityResult } from "../../../utils/eligibility";
import { DEMO_UNIVERSITIES } from "../../../data/demoData";
// import { getDocumentChecklist } from "../../../utils/immigrationData";

/* ------------------------------------------------------------------ */
/*  Local types                                                        */
/* ------------------------------------------------------------------ */
interface ProgramMatchItem {
  university: University;
  programme: Programme;
  matchScore: number;
  eligibility: EligibilityResult;
  matchReasons: string[];
}

type ViewMode = "universities" | "programs";

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
    bg: "bg-elevated",
    text: "text-muted",
    border: "border-subtle",
    icon: <Info className="w-3 h-3" />,
  },
};

/* ================================================================== */
/*  COMPONENT                                                          */
/* ================================================================== */
export const StudentOnboardingProgramMatcher: React.FC = () => {
  const { appUser, firebaseUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);

  // Search & Filters
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [activeCountryTab, setActiveCountryTab] = useState<string>("All");
  const [maxBudget, setMaxBudget] = useState<number>(60000);
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("universities");

  // Shortlist & Applied tracking
  const [shortlistedKeys, setShortlistedKeys] = useState<string[]>([]);
  const [appliedMap, setAppliedMap] = useState<Record<string, string>>({}); // `${univId}-${progId}` => appNumber
  const [applyingKey] = useState<string | null>(null);
  const [savingShortlist, setSavingShortlist] = useState(false);
  const [appliedNotice] = useState<string | null>(null);

  // Detail drawer
  const [drawerItem, setDrawerItem] = useState<ProgramMatchItem | null>(null);

  /* ---- Load data ---- */
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
          if (sd.budgetAnnualUsd) setMaxBudget(sd.budgetAnnualUsd);
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
          fetched = DEMO_UNIVERSITIES;
        } else {
          DEMO_UNIVERSITIES.forEach((demo) => {
            if (!fetched.some((u) => u.name.toLowerCase() === demo.name.toLowerCase())) {
              fetched.push(demo);
            }
          });
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

        const countryMatch = dests.some((d) => d.toLowerCase() === univ.country.toLowerCase());
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
        if (fee <= maxBudget) { score += 10; reasons.push("Within tuition budget"); }
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
      if (activeCountryTab !== "All") {
        if (university.country.toLowerCase() !== activeCountryTab.toLowerCase()) return false;
      } else if (selectedCountries.length > 0) {
        if (!selectedCountries.some((c) => c.toLowerCase() === university.country.toLowerCase())) {
          return false;
        }
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

      // Tuition budget
      const fee = programme.tuitionFeeAnnual || 0;
      if (fee > maxBudget) return false;

      // Eligibility only
      if (onlyEligible && eligibility.status === "not_eligible") return false;

      return true;
    });
  }, [matchedPrograms, debouncedSearch, selectedLevels, selectedFields, maxBudget, onlyEligible, activeCountryTab, selectedCountries]);

  /* ---- Grouped by University ---- */
  const universitiesWithMatches = useMemo(() => {
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

  /* ---- Distinct countries available ---- */
  const availableCountries = useMemo(() => {
    const set = new Set<string>();
    universities.forEach((u) => { if (u.country) set.add(u.country); });
    return Array.from(set);
  }, [universities]);

  /* ---- Shortlist toggle ---- */
  const toggleShortlist = async (key: string) => {
    const next = shortlistedKeys.includes(key) ? shortlistedKeys.filter((k) => k !== key) : [...shortlistedKeys, key];
    setShortlistedKeys(next);
    const uid = firebaseUser?.uid || appUser?.uid;
    if (uid) {
      try { await setDoc(doc(db, "students", uid), { shortlistedPrograms: next, updatedAt: Date.now() }, { merge: true }); } catch (_) {}
    }
  };

  /* ---- Apply to Program (Navigate to Wizard) ---- */
  const handleApplyToProgram = async (univ: University, prog: Programme) => {
    const intake = prog.intakes?.[0] || "";
    navigate(`/student/new-application?universityId=${univ.id}&programmeId=${prog.id}&intake=${encodeURIComponent(intake)}`);
  };

  /* ---- Proceed to Step 4 ---- */
  const proceedToStep4 = async () => {
    const uid = firebaseUser?.uid || appUser?.uid;
    if (uid) {
      setSavingShortlist(true);
      try {
        await setDoc(doc(db, "students", uid), { shortlistedPrograms: shortlistedKeys, onboardingStep: 4, updatedAt: Date.now() }, { merge: true });
        navigate("/student/onboarding/review");
      } catch (err) { console.error("Save error:", err); }
      finally { setSavingShortlist(false); }
    }
  };

  const toggleArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    setter((prev) => (prev.includes(val) ? prev.filter((i) => i !== val) : [...prev, val]));
  };

  /* ---- Loading ---- */
  if (loading) {
    return (
      <div className="min-h-screen bg-main flex items-center justify-center text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  const appliedCount = Object.keys(appliedMap).length;

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className="min-h-screen bg-main relative overflow-hidden text-primary font-sans pb-16">
      {/* ---- Sticky Header ---- */}
      <div className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-subtle px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
              onClick={() => navigate("/student/onboarding/destination")}
              className="px-3 py-1.5 bg-elevated hover:bg-hover text-xs font-semibold text-secondary rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-elevated rounded-lg p-0.5 border border-subtle">
              <button
                onClick={() => setViewMode("universities")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "universities"
                    ? "bg-surface text-emerald-400 shadow-sm"
                    : "text-muted hover:text-primary"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Universities</span>
              </button>
              <button
                onClick={() => setViewMode("programs")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "programs"
                    ? "bg-surface text-emerald-400 shadow-sm"
                    : "text-muted hover:text-primary"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Programs</span>
              </button>
            </div>

            <button
              onClick={proceedToStep4}
              disabled={savingShortlist}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-lg shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>View Applications ({appliedCount > 0 ? appliedCount : shortlistedKeys.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-6 space-y-6">
        {/* Applied Alert Notification Toast */}
        {appliedNotice && (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-between gap-3 animate-fade-in shadow-lg shadow-emerald-500/10">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <span className="font-semibold">{appliedNotice}</span>
            </div>
            <button
              onClick={() => navigate("/student/onboarding/review")}
              className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-400 cursor-pointer"
            >
              Track in Step 4 →
            </button>
          </div>
        )}

        {/* ---- Top Country Tabs (Cascading from Step 2) ---- */}
        <div className="bg-surface border border-subtle rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sq-card animate-fade-in">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold text-muted flex items-center gap-1.5 whitespace-nowrap mr-2">
              <Globe className="w-4 h-4 text-emerald-400" /> Filter Country:
            </span>
            <button
              onClick={() => setActiveCountryTab("All")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeCountryTab === "All"
                  ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                  : "bg-elevated text-secondary hover:text-primary hover:bg-hover"
              }`}
            >
              All Destinations ({selectedCountries.length > 0 ? selectedCountries.join(", ") : "Worldwide"})
            </button>

            {selectedCountries.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCountryTab(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeCountryTab === c
                    ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                    : "bg-elevated text-secondary hover:text-primary hover:bg-hover"
                }`}
              >
                {c}
              </button>
            ))}

            {/* Other countries available in catalog */}
            {availableCountries.filter((c) => !selectedCountries.includes(c)).slice(0, 5).map((c) => (
              <button
                key={c}
                onClick={() => setActiveCountryTab(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  activeCountryTab === c
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "bg-elevated/50 text-muted hover:text-secondary hover:bg-elevated"
                }`}
              >
                + {c}
              </button>
            ))}
          </div>

          {appliedCount > 0 && (
            <div className="shrink-0 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
              <Send className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400">
                {appliedCount} Draft {appliedCount === 1 ? "Application" : "Applications"} Created
              </span>
            </div>
          )}
        </div>

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            className="w-full py-2 bg-elevated border border-subtle rounded-xl text-xs font-semibold text-secondary hover:text-primary flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            {isMobileFiltersOpen ? "Hide Program Filters" : "Show Program Filters"}
          </button>
        </div>

        {/* ---- Main Layout: Filters + Content ---- */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ---- Sidebar Filters ---- */}
          <aside className={`lg:w-72 shrink-0 space-y-6 ${isMobileFiltersOpen ? "block" : "hidden lg:block"}`}>
            {/* Search */}
            <div className="bg-surface rounded-2xl p-5 border border-subtle shadow-sm space-y-4 sq-card">
              <div className="relative">
                <Search className="w-4 h-4 text-muted absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search universities, courses..."
                  className="w-full bg-main border border-default rounded-xl pl-9 pr-3.5 py-2 text-sm text-primary focus:outline-none focus:border-emerald-500 transition-colors sq-input"
                />
              </div>
            </div>

            {/* Granular Filters */}
            <div className="bg-surface rounded-2xl p-5 border border-subtle shadow-sm space-y-6 sq-card">
              <div className="flex items-center gap-2 mb-2 pb-3 border-b border-subtle">
                <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-primary font-heading">Program Filters</h2>
              </div>

              {/* Study Level */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Level / Award</span>
                <div className="flex flex-wrap gap-1.5">
                  {STUDY_LEVELS.map((level) => {
                    const active = selectedLevels.includes(level);
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => toggleArrayItem(setSelectedLevels, level)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer sq-pill ${
                          active
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-semibold"
                            : "bg-main border-subtle text-secondary hover:border-default hover:text-primary"
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
                <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Subject Area</span>
                <div className="flex flex-wrap gap-1.5">
                  {SUBJECT_AREAS.map((subj) => {
                    const active = selectedFields.includes(subj);
                    return (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => toggleArrayItem(setSelectedFields, subj)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer sq-pill ${
                          active
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-semibold"
                            : "bg-main border-subtle text-secondary hover:border-default hover:text-primary"
                        }`}
                      >
                        {subj}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Annual Tuition Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-secondary uppercase tracking-wider">Max Tuition / Yr</span>
                  <span className="font-bold text-emerald-400">${maxBudget.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={5000}
                  max={80000}
                  step={2500}
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Eligibility Only Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-subtle">
                <span className="text-xs font-semibold text-secondary">Eligible Matches Only</span>
                <button
                  type="button"
                  onClick={() => setOnlyEligible(!onlyEligible)}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                    onlyEligible ? "bg-emerald-500" : "bg-elevated"
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                      onlyEligible ? "left-4" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          </aside>

          {/* ---- Right Content Area ---- */}
          <div className="flex-1 space-y-6">
            {/* View Mode 1: University Explorer View */}
            {viewMode === "universities" ? (
              <div className="space-y-6">
                {universitiesWithMatches.map(({ university, programs }) => (
                  <div
                    key={university.id}
                    className="bg-surface border border-subtle rounded-2xl p-6 sq-card shadow-sm space-y-5"
                  >
                    {/* University Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-subtle">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-elevated border border-subtle flex items-center justify-center shrink-0">
                          {university.logoUrl ? (
                            <img src={university.logoUrl} alt={university.name} className="w-10 h-10 object-contain" />
                          ) : (
                            <Building2 className="w-7 h-7 text-emerald-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg font-bold text-primary font-heading">{university.name}</h2>
                            {university.accreditationStatus && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <Shield className="w-2.5 h-2.5 inline mr-1" /> {university.accreditationStatus}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted flex items-center gap-1.5 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{university.city}, {university.country}</span>
                            {university.globalRanking && (
                              <span className="ml-2 font-semibold text-secondary">
                                • #{university.globalRanking} Worldwide
                              </span>
                            )}
                            {university.acceptanceRate && (
                              <span className="ml-1 text-muted">
                                ({university.acceptanceRate}% acceptance rate)
                              </span>
                            )}
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
                    <div className="space-y-3">
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
                                    <><CheckCircle2 className="w-3.5 h-3.5" /> Track Draft</>
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

                {universitiesWithMatches.length === 0 && (
                  <div className="py-16 text-center bg-surface border border-subtle rounded-2xl p-8 sq-card">
                    <Building2 className="w-10 h-10 text-muted mx-auto mb-3 opacity-40" />
                    <h3 className="text-base font-bold text-primary">No universities match the selected criteria</h3>
                    <p className="text-xs text-muted mt-1">Try switching to &quot;All Destinations&quot; or broadening your filters.</p>
                  </div>
                )}
              </div>
            ) : (
              /* View Mode 2: Program Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredMatches.map(({ university, programme, matchScore, eligibility }) => {
                  const key = `${university.id}-${programme.id}`;
                  const isShortlisted = shortlistedKeys.includes(key);
                  const appNumber = appliedMap[key];
                  const eligBadge = ELIG_BADGE[eligibility.status] || ELIG_BADGE.not_checked;

                  return (
                    <article
                      key={key}
                      className="bg-surface rounded-2xl p-5 border border-subtle hover:border-default transition-all flex flex-col justify-between space-y-4 group hover-lift relative sq-card"
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

                      <div>
                        <h3 className="text-base font-bold text-primary font-heading line-clamp-2 leading-tight group-hover:text-emerald-400 transition-colors">
                          {programme.title}
                        </h3>
                        <p className="text-xs text-muted flex items-center gap-1.5 mt-1">
                          <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-medium text-secondary">{university.name}</span>
                        </p>
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
                          disabled={applyingKey === key}
                          onClick={() => handleApplyToProgram(university, programme)}
                          className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                            appNumber
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                              : "bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20"
                          }`}
                        >
                          {applyingKey === key ? (
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
        </div>
      </main>

      {/* ================================================================ */
      /*  PROGRAM DETAIL DRAWER                                           */
      /* ================================================================ */}
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

export default StudentOnboardingProgramMatcher;
