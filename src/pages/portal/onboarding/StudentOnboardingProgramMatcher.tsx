import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Loader2,
  SlidersHorizontal,
  BookmarkPlus,
  BookmarkCheck,
  Calendar,
  Banknote,
  GraduationCap,
  Building2,
  MapPin,
  Star,
  Shield,
  X,
  Eye,
  BookOpen,
  Award,
  Filter,
  Info,
} from "lucide-react";
import { db } from "../../../firebase/config";
import { useAuth } from "../../../contexts/AuthContext";
import { Student } from "../../../types/student";
import { Programme, University } from "../../../types/university";
import { assessEligibility, EligibilityResult } from "../../../utils/eligibility";

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
  const [maxBudget, setMaxBudget] = useState<number>(50000);
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // University focus
  const [focusedUnivId, setFocusedUnivId] = useState<string | null>(null);

  // Shortlist
  const [shortlistedKeys, setShortlistedKeys] = useState<string[]>([]);
  const [savingShortlist, setSavingShortlist] = useState(false);

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
        const univSnap = await getDocs(collection(db, "universities"));
        setUniversities(univSnap.docs.map((d) => ({ id: d.id, ...d.data() } as University)));
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

  /* ---- Filtered results ---- */
  const filteredMatches = useMemo(() => {
    return matchedPrograms.filter((item) => {
      const q = debouncedSearch.toLowerCase().trim();
      const matchesQuery = !q ||
        item.programme.title.toLowerCase().includes(q) ||
        item.university.name.toLowerCase().includes(q) ||
        item.university.country.toLowerCase().includes(q);

      const matchesField = selectedFields.length === 0 || selectedFields.some((f) =>
        item.programme.title.toLowerCase().includes(f.toLowerCase()) ||
        (item.programme.field || "").toLowerCase().includes(f.toLowerCase()) ||
        (item.programme.subjectArea || "").toLowerCase().includes(f.toLowerCase()),
      );

      const matchesLevel = selectedLevels.length === 0 || selectedLevels.some((level) => {
        const pl = item.programme.level;
        if (level === "Master's") return pl.includes("Postgraduate") || pl.includes("Master");
        if (level === "Bachelor's") return pl.includes("Undergraduate") || pl.includes("Bachelor");
        if (level === "MBA") return item.programme.title.toLowerCase().includes("mba");
        if (level === "PhD") return pl.includes("Doctorate");
        if (level === "Pre-Master's") return pl.includes("Pre-Master");
        return pl.toLowerCase().includes(level.toLowerCase());
      });

      const matchesCountry = selectedCountries.length === 0 || selectedCountries.some((c) =>
        item.university.country.toLowerCase() === c.toLowerCase(),
      );

      const matchesEligible = !onlyEligible ||
        item.eligibility.status === "eligible" ||
        item.eligibility.status === "competitive" ||
        item.eligibility.status === "conditional";

      const matchesBudget = (item.programme.tuitionFeeAnnual || 0) <= maxBudget;
      const matchesUniv = !focusedUnivId || item.university.id === focusedUnivId;

      return matchesQuery && matchesField && matchesLevel && matchesCountry && matchesEligible && matchesBudget && matchesUniv;
    });
  }, [matchedPrograms, debouncedSearch, selectedFields, selectedLevels, selectedCountries, onlyEligible, maxBudget, focusedUnivId]);

  /* ---- University directory (filtered by destinations) ---- */
  const directoryUniversities = useMemo(() => {
    if (selectedCountries.length === 0) return universities;
    return universities.filter((u) => selectedCountries.some((c) => c.toLowerCase() === u.country.toLowerCase()));
  }, [universities, selectedCountries]);

  const uniqueCountries = useMemo(() => {
    const s = new Set<string>();
    universities.forEach((u) => s.add(u.country));
    return Array.from(s).sort();
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
              Step 3 of 4 • University Explorer & Program Matcher
            </span>
            <h1 className="text-xl font-bold font-heading text-primary">Discover & Shortlist</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/student/onboarding/destination")}
              className="px-3 py-1.5 bg-elevated hover:bg-hover text-xs font-semibold text-secondary rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              onClick={proceedToStep4}
              disabled={shortlistedKeys.length === 0 || savingShortlist}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-lg shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>Compare Matches ({shortlistedKeys.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        {/* ---- Tip Banner ---- */}
        <div className="p-5 rounded-2xl bg-surface border border-subtle text-sm text-secondary flex items-start gap-3 mb-6 shadow-sm animate-fade-in">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-primary">Eligibility & match scores calculated in real-time.</p>
            <p className="text-xs text-muted">Use filters to refine. Shortlist at least 1 program to proceed.</p>
          </div>
        </div>

        {/* ---- University Directory (Horizontal Scroll) ---- */}
        {directoryUniversities.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              Partner Universities
              {focusedUnivId && (
                <button
                  onClick={() => setFocusedUnivId(null)}
                  className="ml-2 text-xs text-emerald-400 hover:text-emerald-300 font-normal flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" /> Show all
                </button>
              )}
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-thin">
              {directoryUniversities.map((univ) => {
                const isFocused = focusedUnivId === univ.id;
                return (
                  <button
                    key={univ.id}
                    onClick={() => setFocusedUnivId(isFocused ? null : univ.id)}
                    className={`shrink-0 w-52 p-4 rounded-xl border transition-all text-left cursor-pointer group hover-lift ${
                      isFocused
                        ? "bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/20"
                        : "bg-surface border-subtle hover:border-default"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-elevated flex items-center justify-center mb-2">
                      {univ.logoUrl ? (
                        <img src={univ.logoUrl} alt={univ.name} className="w-8 h-8 rounded object-contain" />
                      ) : (
                        <Building2 className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>
                    <h3 className={`text-xs font-bold line-clamp-2 leading-tight ${isFocused ? "text-emerald-400" : "text-primary group-hover:text-emerald-400"} transition-colors`}>
                      {univ.name}
                    </h3>
                    <p className="text-[10px] text-muted mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {univ.city}, {univ.country}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {univ.globalRanking && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-elevated text-secondary border border-subtle">
                          #{univ.globalRanking} Global
                        </span>
                      )}
                      {univ.nationalRanking && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-elevated text-secondary border border-subtle">
                          #{univ.nationalRanking} National
                        </span>
                      )}
                      {univ.accreditationStatus && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Shield className="w-2.5 h-2.5 inline mr-0.5" />
                          {univ.accreditationStatus}
                        </span>
                      )}
                      {univ.acceptanceRate != null && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-elevated text-secondary border border-subtle">
                          {univ.acceptanceRate}% Acceptance
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ---- Mobile Filter Toggle ---- */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-elevated border border-default rounded-xl font-medium text-sm cursor-pointer"
          >
            <Filter className="w-4 h-4" />
            {isMobileFiltersOpen ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

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
                  placeholder="Search courses..."
                  className="w-full bg-main border border-default rounded-xl pl-9 pr-3.5 py-2 text-sm text-primary focus:outline-none focus:border-emerald-500 transition-colors sq-input"
                />
              </div>
            </div>

            {/* Cascading Filters */}
            <div className="bg-surface rounded-2xl p-5 border border-subtle shadow-sm space-y-6 sq-card">
              <div className="flex items-center gap-2 mb-2 pb-3 border-b border-subtle">
                <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-primary font-heading">Filters</h3>
              </div>

              {/* Country */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider">Country</h4>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {uniqueCountries.map((c) => (
                    <label key={c} className="flex items-center gap-2 text-sm cursor-pointer group">
                      <input type="checkbox" checked={selectedCountries.includes(c)} onChange={() => toggleArrayItem(setSelectedCountries, c)} className="rounded border-default text-emerald-500 focus:ring-emerald-500/50 bg-main cursor-pointer" />
                      <span className="text-secondary group-hover:text-primary transition-colors">{c}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Level */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider">Study Level</h4>
                <div className="space-y-1.5">
                  {STUDY_LEVELS.map((lvl) => (
                    <label key={lvl} className="flex items-center gap-2 text-sm cursor-pointer group">
                      <input type="checkbox" checked={selectedLevels.includes(lvl)} onChange={() => toggleArrayItem(setSelectedLevels, lvl)} className="rounded border-default text-emerald-500 focus:ring-emerald-500/50 bg-main cursor-pointer" />
                      <span className="text-secondary group-hover:text-primary transition-colors">{lvl}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider">Subject Area</h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {SUBJECT_AREAS.map((f) => (
                    <label key={f} className="flex items-center gap-2 text-sm cursor-pointer group">
                      <input type="checkbox" checked={selectedFields.includes(f)} onChange={() => toggleArrayItem(setSelectedFields, f)} className="rounded border-default text-emerald-500 focus:ring-emerald-500/50 bg-main cursor-pointer" />
                      <span className="text-secondary group-hover:text-primary transition-colors">{f}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div className="space-y-3 pt-2 border-t border-subtle">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider">Max Tuition</h4>
                  <span className="text-xs font-bold text-emerald-400">${(maxBudget / 1000).toFixed(0)}k</span>
                </div>
                <input
                  type="range" min="5000" max="100000" step="5000" value={maxBudget}
                  onChange={(e) => setMaxBudget(Number(e.target.value))}
                  className="w-full h-1.5 bg-elevated rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Eligibility toggle */}
              <div className="pt-2 border-t border-subtle">
                <label className="flex items-start gap-2 text-sm cursor-pointer group">
                  <input type="checkbox" checked={onlyEligible} onChange={(e) => setOnlyEligible(e.target.checked)} className="mt-0.5 rounded border-default text-emerald-500 focus:ring-emerald-500/50 bg-main cursor-pointer" />
                  <span className="text-secondary group-hover:text-primary transition-colors text-xs leading-relaxed">
                    Only show programs where I meet requirements
                  </span>
                </label>
              </div>
            </div>
          </aside>

          {/* ---- Results Grid ---- */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between text-sm text-secondary px-1">
              <span>Showing <strong className="text-primary">{filteredMatches.length}</strong> matching programs</span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredMatches.map(({ university, programme, matchScore, eligibility, matchReasons }) => {
                const key = `${university.id}-${programme.id}`;
                const isShortlisted = shortlistedKeys.includes(key);
                const badge = ELIG_BADGE[eligibility.status] || ELIG_BADGE.not_checked;

                return (
                  <article
                    key={key}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 group hover-lift sq-card ${
                      isShortlisted
                        ? "bg-elevated border-emerald-500/50 shadow-md shadow-emerald-500/5"
                        : "bg-surface border-subtle hover:border-default"
                    }`}
                  >
                    {/* Top Badges */}
                    <div className="flex justify-between items-start gap-3">
                      <div className={`px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${badge.bg} ${badge.text} ${badge.border}`}>
                        {badge.icon}
                        {eligibility.label}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setDrawerItem({ university, programme, matchScore, eligibility, matchReasons })}
                          className="p-1.5 rounded-xl bg-main text-muted hover:text-primary border border-default transition-all cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleShortlist(key)}
                          className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                            isShortlisted ? "bg-emerald-500 text-white" : "bg-main text-muted hover:text-primary border border-default"
                          }`}
                        >
                          {isShortlisted ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div>
                      <h3 className="text-base font-bold text-primary font-heading line-clamp-2 leading-tight group-hover:text-emerald-400 transition-colors">
                        {programme.title}
                      </h3>
                      <p className="text-sm text-secondary mt-1 flex items-center gap-1.5">
                        <span className="font-medium text-primary">{university.name}</span> • {university.country}
                      </p>
                    </div>

                    {/* Quick Info Pills */}
                    <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-subtle/50">
                      <div className="flex flex-col bg-main rounded-lg p-2 border border-subtle">
                        <span className="text-[10px] text-muted uppercase font-semibold flex items-center gap-1 mb-0.5">
                          <Banknote className="w-3 h-3" /> Tuition / Yr
                        </span>
                        <span className="text-sm font-medium text-primary">
                          ${(programme.tuitionFeeAnnual || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-col bg-main rounded-lg p-2 border border-subtle">
                        <span className="text-[10px] text-muted uppercase font-semibold flex items-center gap-1 mb-0.5">
                          <Calendar className="w-3 h-3" /> Intakes
                        </span>
                        <span className="text-sm font-medium text-primary line-clamp-1">
                          {programme.intakes?.join(", ") || "Sep, Jan"}
                        </span>
                      </div>
                      <div className="flex flex-col bg-main rounded-lg p-2 border border-subtle">
                        <span className="text-[10px] text-muted uppercase font-semibold flex items-center gap-1 mb-0.5">
                          <GraduationCap className="w-3 h-3" /> Level
                        </span>
                        <span className="text-sm font-medium text-primary line-clamp-1">
                          {programme.level || "Postgraduate"}
                        </span>
                      </div>
                      <div className="flex flex-col bg-main rounded-lg p-2 border border-subtle">
                        <span className="text-[10px] text-muted uppercase font-semibold flex items-center gap-1 mb-0.5">
                          <Sparkles className="w-3 h-3" /> Score
                        </span>
                        <span className="text-sm font-medium text-emerald-400">{matchScore}% Fit</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {filteredMatches.length === 0 && (
              <div className="py-16 flex flex-col items-center justify-center text-center bg-surface border border-subtle rounded-2xl sq-card">
                <div className="w-12 h-12 bg-main rounded-full flex items-center justify-center mb-3">
                  <Search className="w-5 h-5 text-muted" />
                </div>
                <h3 className="text-base font-semibold text-primary">No exact matches found</h3>
                <p className="text-sm text-secondary mt-1 max-w-sm">
                  Try broadening your filters or increasing your maximum tuition budget.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ================================================================ */}
      {/*  PROGRAM DETAIL DRAWER                                           */}
      {/* ================================================================ */}
      {drawerItem && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-backdrop z-50"
            onClick={() => setDrawerItem(null)}
          />
          {/* Drawer panel */}
          <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-surface border-l border-subtle z-50 overflow-y-auto shadow-2xl animate-slide-in-right">
            {/* Header */}
            <div className="sticky top-0 bg-surface/95 backdrop-blur-sm border-b border-subtle p-5 flex items-start justify-between z-10">
              <div className="flex-1 mr-4">
                <h2 className="text-lg font-bold text-primary font-heading leading-tight">
                  {drawerItem.programme.title}
                </h2>
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
              {/* Eligibility badge */}
              {(() => {
                const badge = ELIG_BADGE[drawerItem.eligibility.status] || ELIG_BADGE.not_checked;
                return (
                  <div className={`p-3 rounded-xl border ${badge.bg} ${badge.border} flex items-center gap-2`}>
                    <span className={`${badge.text}`}>{badge.icon}</span>
                    <span className={`text-sm font-bold ${badge.text}`}>{drawerItem.eligibility.label}</span>
                    <span className={`ml-auto text-sm font-bold ${badge.text}`}>{drawerItem.eligibility.score}%</span>
                  </div>
                );
              })()}

              {/* Academic Requirements */}
              <section className="space-y-3">
                <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" /> Academic Requirements
                </h3>
                <div className="bg-main rounded-xl p-4 border border-subtle space-y-2 text-sm">
                  {drawerItem.programme.requirements?.minGpa && (
                    <div className="flex justify-between">
                      <span className="text-muted">Minimum GPA / Grade</span>
                      <span className="font-semibold text-primary">{drawerItem.programme.requirements.minGpa}</span>
                    </div>
                  )}
                  {drawerItem.programme.entryRequirements && (
                    <p className="text-xs text-muted leading-relaxed">{drawerItem.programme.entryRequirements}</p>
                  )}
                  {drawerItem.programme.requirements?.acceptedQualifications?.length ? (
                    <div>
                      <span className="text-[10px] text-muted uppercase font-semibold">Accepted Qualifications</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {drawerItem.programme.requirements.acceptedQualifications.map((q) => (
                          <span key={q} className="text-[10px] px-2 py-0.5 rounded-md bg-elevated text-secondary border border-subtle sq-pill">{q}</span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {!drawerItem.programme.requirements?.minGpa && !drawerItem.programme.entryRequirements && (
                    <p className="text-xs text-muted italic">No specific academic requirements configured.</p>
                  )}
                </div>
              </section>

              {/* Language Requirements */}
              <section className="space-y-3">
                <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Language Requirements
                </h3>
                <div className="bg-main rounded-xl p-4 border border-subtle space-y-2 text-sm">
                  {(drawerItem.programme.requirements?.minIelts || drawerItem.programme.minIeltsScore) ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted">IELTS Overall</span>
                        <span className="font-semibold text-primary">{drawerItem.programme.requirements?.minIelts || drawerItem.programme.minIeltsScore}</span>
                      </div>
                      {drawerItem.programme.requirements?.minIeltsListening && (
                        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-subtle">
                          {[
                            { label: "L", val: drawerItem.programme.requirements.minIeltsListening },
                            { label: "R", val: drawerItem.programme.requirements.minIeltsReading },
                            { label: "W", val: drawerItem.programme.requirements.minIeltsWriting },
                            { label: "S", val: drawerItem.programme.requirements.minIeltsSpeaking },
                          ].map((b) => b.val ? (
                            <div key={b.label} className="text-center">
                              <span className="text-[10px] text-muted font-semibold uppercase">{b.label}</span>
                              <p className="text-sm font-bold text-primary">{b.val}</p>
                            </div>
                          ) : null)}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted italic">No language score requirements configured.</p>
                  )}
                </div>
              </section>

              {/* Financial Summary */}
              <section className="space-y-3">
                <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5" /> Financial Summary
                </h3>
                <div className="bg-main rounded-xl p-4 border border-subtle space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Tuition / Year</span>
                    <span className="font-semibold text-primary">
                      {drawerItem.programme.currency} {(drawerItem.programme.tuitionFeeAnnual || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Duration</span>
                    <span className="font-semibold text-primary">{drawerItem.programme.durationMonths} months</span>
                  </div>
                  {drawerItem.programme.estimatedLivingCostAnnual && (
                    <div className="flex justify-between">
                      <span className="text-muted">Est. Living Cost / Year</span>
                      <span className="font-semibold text-primary">
                        {drawerItem.programme.currency} {drawerItem.programme.estimatedLivingCostAnnual.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {drawerItem.programme.depositRequired && (
                    <div className="flex justify-between">
                      <span className="text-muted">Deposit Required</span>
                      <span className="font-semibold text-amber-400">
                        {drawerItem.programme.currency} {drawerItem.programme.depositRequired.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {drawerItem.programme.applicationFee && (
                    <div className="flex justify-between">
                      <span className="text-muted">Application Fee</span>
                      <span className="font-semibold text-primary">
                        {drawerItem.programme.currency} {drawerItem.programme.applicationFee.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </section>

              {/* Scholarships */}
              {drawerItem.programme.scholarships && drawerItem.programme.scholarships.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" /> Scholarships
                  </h3>
                  <div className="space-y-2">
                    {drawerItem.programme.scholarships.map((s, i) => (
                      <div key={i} className="bg-main rounded-xl p-3 border border-subtle">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-primary">{s.name}</span>
                          <span className="text-xs font-bold text-emerald-400">{s.amount}</span>
                        </div>
                        {s.criteria && <p className="text-xs text-muted mt-1">{s.criteria}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Key Dates */}
              <section className="space-y-3">
                <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Key Dates
                </h3>
                <div className="bg-main rounded-xl p-4 border border-subtle space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Application Deadline</span>
                    <span className="font-semibold text-amber-400">{drawerItem.programme.deadline || "Rolling Admissions"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Intakes</span>
                    <span className="font-semibold text-primary">{drawerItem.programme.intakes?.join(", ") || "September"}</span>
                  </div>
                </div>
              </section>

              {/* Eligibility Checks */}
              {drawerItem.eligibility.checks.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Eligibility Checks
                  </h3>
                  <div className="space-y-2">
                    {drawerItem.eligibility.checks.map((check, i) => (
                      <div key={i} className={`p-3 rounded-lg border text-xs ${
                        check.status === "pass" ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" :
                        check.status === "fail" ? "bg-rose-500/5 border-rose-500/20 text-rose-400" :
                        "bg-amber-500/5 border-amber-500/20 text-amber-400"
                      }`}>
                        <span className="font-bold">{check.label}</span>
                        <p className="text-primary/70 mt-0.5">{check.detail}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="sticky bottom-0 bg-surface/95 backdrop-blur-sm border-t border-subtle p-5 flex items-center gap-3">
              <button
                onClick={() => {
                  const key = `${drawerItem.university.id}-${drawerItem.programme.id}`;
                  toggleShortlist(key);
                }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  shortlistedKeys.includes(`${drawerItem.university.id}-${drawerItem.programme.id}`)
                    ? "bg-elevated text-emerald-400 border border-emerald-500/30"
                    : "bg-elevated text-primary border border-default hover:border-emerald-500/30"
                }`}
              >
                {shortlistedKeys.includes(`${drawerItem.university.id}-${drawerItem.programme.id}`) ? (
                  <><BookmarkCheck className="w-4 h-4" /> Shortlisted</>
                ) : (
                  <><BookmarkPlus className="w-4 h-4" /> Shortlist</>
                )}
              </button>
              <button
                onClick={() => {
                  const key = `${drawerItem.university.id}-${drawerItem.programme.id}`;
                  if (!shortlistedKeys.includes(key)) toggleShortlist(key);
                  setDrawerItem(null);
                  proceedToStep4();
                }}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Apply Now <ArrowRight className="w-4 h-4" />
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
