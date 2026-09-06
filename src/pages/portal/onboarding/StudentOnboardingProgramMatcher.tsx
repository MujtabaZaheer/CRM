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
  Filter,
  SlidersHorizontal,
  BookmarkPlus,
  BookmarkCheck,
  Calendar,
  Banknote,
  GraduationCap
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

const STUDY_LEVELS = ["Bachelor's", "Master's", "Doctorate", "Foundation"];

// Custom hook for debouncing search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export const StudentOnboardingProgramMatcher: React.FC = () => {
  const { appUser, firebaseUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);

  // Search & Filter State
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  
  // Sliders
  const [maxBudget, setMaxBudget] = useState<number>(50000);
  
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Shortlisted Program IDs (combination of universityId-programmeId)
  const [shortlistedKeys, setShortlistedKeys] = useState<string[]>([]);
  const [savingShortlist, setSavingShortlist] = useState(false);

  useEffect(() => {
    const initData = async () => {
      const uid = firebaseUser?.uid || appUser?.uid;
      if (!uid) return;

      try {
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
            if (lvl.includes("Master")) setSelectedLevels(["Master's"]);
            else if (lvl.includes("Bachelor")) setSelectedLevels(["Bachelor's"]);
          }

          if (studentData.budgetAnnualUsd) {
            setMaxBudget(studentData.budgetAnnualUsd);
          }
          
          if ((studentData as any).preferredDestinations) {
             setSelectedCountries((studentData as any).preferredDestinations);
          }
        }

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

  const matchedPrograms = useMemo<ProgramMatchItem[]>(() => {
    if (universities.length === 0) return [];
    const studentDestinations = (student as any)?.preferredDestinations || (student?.preferredDestination ? [student.preferredDestination] : []);
    const studentLevel = (student as any)?.desiredStudyLevel || "Master's";

    const results: ProgramMatchItem[] = [];
    universities.forEach((univ) => {
      const programmes = univ.programmes || [];
      programmes.forEach((prog) => {
        let score = 50;
        const matchReasons: string[] = [];

        const countryMatch = studentDestinations.some((d: string) => d.toLowerCase() === univ.country.toLowerCase());
        if (countryMatch) {
          score += 20;
          matchReasons.push(`Destination match: ${univ.country}`);
        }

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

        const progTitle = (prog.title || "").toLowerCase();
        const studentMajor = (student?.academicHistory?.[0]?.degreeTitle || "").toLowerCase();

        if (studentMajor && progTitle.includes(studentMajor.split(" ")[0])) {
          score += 15;
          matchReasons.push("Subject background alignment");
        }

        const fee = prog.tuitionFeeAnnual || 25000;
        if (fee <= maxBudget) {
          score += 10;
          matchReasons.push("Within tuition budget range");
        } else if (fee > maxBudget * 1.3) {
          score -= 10;
        }

        const matchScore = Math.min(98, Math.max(40, score));
        const eligibility = assessEligibility(student || undefined, prog);

        results.push({ university: univ, programme: prog, matchScore, eligibility, matchReasons });
      });
    });

    return results.sort((a, b) => b.matchScore - a.matchScore);
  }, [universities, student, maxBudget]);

  const filteredMatches = useMemo(() => {
    return matchedPrograms.filter((item) => {
      const q = debouncedSearch.toLowerCase().trim();
      const matchesQuery = !q || 
        item.programme.title.toLowerCase().includes(q) || 
        item.university.name.toLowerCase().includes(q) || 
        item.university.country.toLowerCase().includes(q);

      const matchesField = selectedFields.length === 0 || selectedFields.some(field => 
        item.programme.title.toLowerCase().includes(field.toLowerCase()) || 
        (item.programme.field || "").toLowerCase().includes(field.toLowerCase())
      );

      const matchesLevel = selectedLevels.length === 0 || selectedLevels.some(level => {
        if (level === "Master's") return item.programme.level.includes("Postgraduate") || item.programme.level.includes("Master");
        if (level === "Bachelor's") return item.programme.level.includes("Undergraduate") || item.programme.level.includes("Bachelor");
        return item.programme.level.toLowerCase().includes(level.toLowerCase());
      });

      const matchesCountry = selectedCountries.length === 0 || selectedCountries.some(c => 
        item.university.country.toLowerCase() === c.toLowerCase()
      );

      const matchesEligible = !onlyEligible || item.eligibility.status === "eligible" || item.eligibility.status === "conditional";
      const matchesBudget = (item.programme.tuitionFeeAnnual || 0) <= maxBudget;

      return matchesQuery && matchesField && matchesLevel && matchesCountry && matchesEligible && matchesBudget;
    });
  }, [matchedPrograms, debouncedSearch, selectedFields, selectedLevels, selectedCountries, onlyEligible, maxBudget]);

  const uniqueCountries = useMemo(() => {
    const s = new Set<string>();
    universities.forEach(u => s.add(u.country));
    return Array.from(s).sort();
  }, [universities]);

  const toggleShortlist = async (key: string) => {
    const next = shortlistedKeys.includes(key) ? shortlistedKeys.filter((k) => k !== key) : [...shortlistedKeys, key];
    setShortlistedKeys(next);
    const uid = firebaseUser?.uid || appUser?.uid;
    if (uid) {
      try { await setDoc(doc(db, "students", uid), { shortlistedPrograms: next, updatedAt: Date.now() }, { merge: true }); } catch (_) {}
    }
  };

  const proceedToStep4 = async () => {
    const uid = firebaseUser?.uid || appUser?.uid;
    if (uid) {
      setSavingShortlist(true);
      try {
        await setDoc(doc(db, "students", uid), { shortlistedPrograms: shortlistedKeys, onboardingStep: 4, updatedAt: Date.now() }, { merge: true });
        navigate("/student/onboarding/review");
      } catch (err) {
        console.error("Save error:", err);
      } finally {
        setSavingShortlist(false);
      }
    }
  };

  const toggleArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    setter(prev => prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-main flex items-center justify-center text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-main relative overflow-hidden text-primary font-sans pb-16">
      <div className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-subtle px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase">Step 3 of 4 • Program Matcher</span>
            <h1 className="text-xl font-bold font-heading text-primary">Discover & Shortlist</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/student/onboarding/destination")} className="px-3 py-1.5 bg-elevated hover:bg-hover text-xs font-semibold text-secondary rounded-lg transition-colors flex items-center gap-1 cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button onClick={proceedToStep4} disabled={shortlistedKeys.length === 0 || savingShortlist} className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-lg shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
              <span>Compare Matches ({shortlistedKeys.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        <div className="p-5 rounded-2xl bg-surface border border-subtle text-sm text-secondary flex items-start gap-3 mb-6 shadow-sm">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-primary">We've calculated your eligibility & match scores in real-time.</p>
            <p className="text-xs text-muted">Use the filters to refine your search. Shortlist at least 1 program to proceed.</p>
          </div>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-4">
           <button onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)} className="w-full flex items-center justify-center gap-2 py-2.5 bg-elevated border border-default rounded-xl font-medium text-sm">
              <Filter className="w-4 h-4" />
              {isMobileFiltersOpen ? "Hide Filters" : "Show Filters"}
           </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters */}
          <aside className={`lg:w-72 shrink-0 space-y-6 ${isMobileFiltersOpen ? 'block' : 'hidden lg:block'}`}>
            {/* Search */}
            <div className="bg-surface rounded-2xl p-5 border border-subtle shadow-sm space-y-4">
               <div className="relative">
                  <Search className="w-4 h-4 text-muted absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search courses..."
                    className="w-full bg-main border border-default rounded-xl pl-9 pr-3.5 py-2 text-sm text-primary focus:outline-none focus:border-emerald-500 transition-colors"
                  />
               </div>
            </div>

            {/* Cascading Filters */}
            <div className="bg-surface rounded-2xl p-5 border border-subtle shadow-sm space-y-6">
               <div className="flex items-center gap-2 mb-2 pb-3 border-b border-subtle">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-semibold text-primary font-heading">Filters</h3>
               </div>

               {/* Country Filter */}
               <div className="space-y-2">
                 <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider">Country</h4>
                 <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                   {uniqueCountries.map(c => (
                     <label key={c} className="flex items-center gap-2 text-sm cursor-pointer group">
                       <input type="checkbox" checked={selectedCountries.includes(c)} onChange={() => toggleArrayItem(setSelectedCountries, c)} className="rounded border-default text-emerald-500 focus:ring-emerald-500/50 bg-main transition-all cursor-pointer" />
                       <span className="text-secondary group-hover:text-primary transition-colors">{c}</span>
                     </label>
                   ))}
                 </div>
               </div>

               {/* Level Filter */}
               <div className="space-y-2">
                 <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider">Study Level</h4>
                 <div className="space-y-1.5">
                   {STUDY_LEVELS.map(lvl => (
                     <label key={lvl} className="flex items-center gap-2 text-sm cursor-pointer group">
                       <input type="checkbox" checked={selectedLevels.includes(lvl)} onChange={() => toggleArrayItem(setSelectedLevels, lvl)} className="rounded border-default text-emerald-500 focus:ring-emerald-500/50 bg-main transition-all cursor-pointer" />
                       <span className="text-secondary group-hover:text-primary transition-colors">{lvl}</span>
                     </label>
                   ))}
                 </div>
               </div>

               {/* Subject Filter */}
               <div className="space-y-2">
                 <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider">Subject Area</h4>
                 <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                   {POPULAR_FIELDS.map(f => (
                     <label key={f} className="flex items-center gap-2 text-sm cursor-pointer group">
                       <input type="checkbox" checked={selectedFields.includes(f)} onChange={() => toggleArrayItem(setSelectedFields, f)} className="rounded border-default text-emerald-500 focus:ring-emerald-500/50 bg-main transition-all cursor-pointer" />
                       <span className="text-secondary group-hover:text-primary transition-colors">{f}</span>
                     </label>
                   ))}
                 </div>
               </div>

               {/* Budget Range */}
               <div className="space-y-3 pt-2 border-t border-subtle">
                 <div className="flex items-center justify-between">
                   <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider">Max Tuition</h4>
                   <span className="text-xs font-bold text-emerald-400">$\{(maxBudget / 1000).toFixed(0)}k</span>
                 </div>
                 <input 
                   type="range" 
                   min="5000" 
                   max="100000" 
                   step="5000"
                   value={maxBudget}
                   onChange={(e) => setMaxBudget(Number(e.target.value))}
                   className="w-full h-1.5 bg-elevated rounded-lg appearance-none cursor-pointer accent-emerald-500"
                 />
               </div>

               {/* Eligibility Toggle */}
               <div className="pt-2 border-t border-subtle">
                 <label className="flex items-start gap-2 text-sm cursor-pointer group">
                    <input type="checkbox" checked={onlyEligible} onChange={(e) => setOnlyEligible(e.target.checked)} className="mt-0.5 rounded border-default text-emerald-500 focus:ring-emerald-500/50 bg-main transition-all cursor-pointer" />
                    <span className="text-secondary group-hover:text-primary transition-colors text-xs leading-relaxed">
                      Only show programs where I meet requirements
                    </span>
                 </label>
               </div>
            </div>
          </aside>

          {/* Results Grid */}
          <div className="flex-1 space-y-4">
             <div className="flex items-center justify-between text-sm text-secondary px-1">
                <span>Showing <strong className="text-primary">{filteredMatches.length}</strong> matching programs</span>
             </div>

             <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredMatches.map(({ university, programme, matchScore, eligibility }) => {
                  const key = `${university.id}-${programme.id}`;
                  const isShortlisted = shortlistedKeys.includes(key);

                  const eligStatus = eligibility.status;
                  const eligColors = 
                    eligStatus === "eligible" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                    eligStatus === "conditional" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                    "bg-rose-500/10 text-rose-400 border-rose-500/20";
                  
                  return (
                    <article key={key} className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 group hover:bg-elevated ${isShortlisted ? 'bg-elevated border-emerald-500/50 shadow-md shadow-emerald-500/5' : 'bg-surface border-subtle hover:border-default'}`}>
                       {/* Top Badges */}
                       <div className="flex justify-between items-start gap-3">
                          <div className={`px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${eligColors}`}>
                            {eligStatus === 'eligible' && <CheckCircle2 className="w-3 h-3" />}
                            {eligStatus === 'conditional' && <AlertTriangle className="w-3 h-3" />}
                            {eligStatus === 'not_eligible' && <XCircle className="w-3 h-3" />}
                            {eligStatus === 'eligible' ? 'High Match' : eligStatus === 'conditional' ? 'Conditional Match' : 'Missing Reqs'}
                          </div>
                          
                          <button onClick={() => toggleShortlist(key)} className={`p-1.5 rounded-xl transition-all cursor-pointer ${isShortlisted ? 'bg-emerald-500 text-zinc-950' : 'bg-main text-muted hover:text-primary border border-default'}`}>
                             {isShortlisted ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
                          </button>
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
                             <span className="text-[10px] text-muted uppercase font-semibold flex items-center gap-1 mb-0.5"><Banknote className="w-3 h-3"/> Tuition / Yr</span>
                             <span className="text-sm font-medium text-primary">$\{(programme.tuitionFeeAnnual || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex flex-col bg-main rounded-lg p-2 border border-subtle">
                             <span className="text-[10px] text-muted uppercase font-semibold flex items-center gap-1 mb-0.5"><Calendar className="w-3 h-3"/> Intakes</span>
                             <span className="text-sm font-medium text-primary line-clamp-1">{programme.intakes?.join(", ") || "Sep, Jan"}</span>
                          </div>
                          <div className="flex flex-col bg-main rounded-lg p-2 border border-subtle">
                             <span className="text-[10px] text-muted uppercase font-semibold flex items-center gap-1 mb-0.5"><GraduationCap className="w-3 h-3"/> Level</span>
                             <span className="text-sm font-medium text-primary line-clamp-1">{programme.level || "Postgraduate"}</span>
                          </div>
                          <div className="flex flex-col bg-main rounded-lg p-2 border border-subtle">
                             <span className="text-[10px] text-muted uppercase font-semibold flex items-center gap-1 mb-0.5"><Sparkles className="w-3 h-3"/> Score</span>
                             <span className="text-sm font-medium text-emerald-400">{matchScore}% Fit</span>
                          </div>
                       </div>
                    </article>
                  )
                })}
             </div>
             
             {filteredMatches.length === 0 && (
               <div className="py-16 flex flex-col items-center justify-center text-center bg-surface border border-subtle rounded-2xl">
                 <div className="w-12 h-12 bg-main rounded-full flex items-center justify-center mb-3">
                   <Search className="w-5 h-5 text-muted" />
                 </div>
                 <h3 className="text-base font-semibold text-primary">No exact matches found</h3>
                 <p className="text-sm text-secondary mt-1 max-w-sm">Try broadening your filters or increasing your maximum tuition budget to see more options.</p>
               </div>
             )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentOnboardingProgramMatcher;
