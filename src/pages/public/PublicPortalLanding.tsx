import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { PublicNavbar } from "../../components/public/PublicNavbar";
import { useAuth } from "../../contexts/AuthContext";
import { GLOBAL_UNIVERSITIES } from "../../data/globalUniversities";
import { University, Programme } from "../../types/university";
import { getUniversityCampusImage, getUniversityLandmark } from "../../utils/universityImages";
import { getRoleDashboardPath } from "../../types/registrationConfig";
import {
  Search,
  Sparkles,
  GraduationCap,
  Building2,
  BookOpen,
  Award,
  Compass,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Plane,
  FileText,
  SlidersHorizontal,
  Star,
  Users2,
  Zap,
} from "lucide-react";

export const PublicPortalLanding: React.FC = () => {
  const { appUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-scroll handler for anchor hashes and path-based section navigation
  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace("#", "");
      const elem = document.getElementById(targetId);
      if (elem) {
        setTimeout(() => {
          elem.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
        return;
      }
    }

    const path = location.pathname.toLowerCase();
    if (path === "/explore" || path === "/programmes" || path === "/courses") {
      const elem = document.getElementById("programmes");
      if (elem) {
        setTimeout(() => {
          elem.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    } else if (path === "/scholarships") {
      const elem = document.getElementById("scholarships");
      if (elem) {
        setTimeout(() => {
          elem.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    } else if (path === "/ai-counsellor") {
      const elem = document.getElementById("ai-counsellor");
      if (elem) {
        setTimeout(() => {
          elem.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, [location.pathname, location.hash]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [maxBudget, setMaxBudget] = useState<number>(60000);

  // AI Matchmaker State
  const [matchGpa, setMatchGpa] = useState<number>(3.4);
  const [matchIelts, setMatchIelts] = useState<number>(6.5);
  const [matchLevel, setMatchLevel] = useState("Master's");
  const [matchSubject, setMatchSubject] = useState("Computing & AI");
  const [matchCountry, setMatchCountry] = useState("United Kingdom");
  const [isMatching, setIsMatching] = useState(false);

  // Flatten all programmes with their university reference
  const allProgrammes = useMemo(() => {
    const list: { university: University; programme: Programme }[] = [];
    GLOBAL_UNIVERSITIES.forEach((univ) => {
      (univ.programmes || []).forEach((prog) => {
        list.push({ university: univ, programme: prog });
      });
    });
    return list;
  }, []);

  // Filtered programmes for directory
  const filteredProgrammes = useMemo(() => {
    return allProgrammes.filter(({ university, programme }) => {
      // Keyword match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = programme.title.toLowerCase().includes(q);
        const matchesUniv = university.name.toLowerCase().includes(q);
        const matchesSubject = (programme.subjectArea || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesUniv && !matchesSubject) return false;
      }

      // Country match
      if (selectedCountry !== "All") {
        if (university.country.toLowerCase() !== selectedCountry.toLowerCase()) return false;
      }

      // Level match
      if (selectedLevel !== "All") {
        if (!programme.level.toLowerCase().includes(selectedLevel.toLowerCase())) return false;
      }

      // Subject match
      if (selectedSubject !== "All") {
        if (programme.subjectArea !== selectedSubject) return false;
      }

      // Budget match
      if (programme.tuitionFeeAnnual > maxBudget) return false;

      return true;
    });
  }, [allProgrammes, searchQuery, selectedCountry, selectedLevel, selectedSubject, maxBudget]);

  // AI Matchmaker Recommendations
  const matchRecommendations = useMemo(() => {
    return allProgrammes
      .filter(({ university, programme }) => {
        // Destination check
        if (matchCountry !== "All" && university.country.toLowerCase() !== matchCountry.toLowerCase()) {
          return false;
        }
        // Level check
        if (matchLevel === "Master's" && !programme.level.toLowerCase().includes("postgraduate") && !programme.level.toLowerCase().includes("master")) {
          return false;
        }
        if (matchLevel === "Bachelor's" && !programme.level.toLowerCase().includes("undergraduate") && !programme.level.toLowerCase().includes("bachelor")) {
          return false;
        }
        // Subject check
        if (matchSubject !== "All" && programme.subjectArea !== matchSubject) {
          return false;
        }
        return true;
      })
      .map(({ university, programme }) => {
        const reqGpa = programme.requirements?.minGpa || 3.0;
        const reqIelts = programme.minIeltsScore || 6.5;

        let score = 70;
        let tier: "High Match" | "Target Match" | "Reach" = "Target Match";

        if (matchGpa >= reqGpa && matchIelts >= reqIelts) {
          score = 92 + Math.min(6, Math.round((matchGpa - reqGpa) * 10));
          tier = "High Match";
        } else if (matchGpa >= reqGpa - 0.3 && matchIelts >= reqIelts - 0.5) {
          score = 78 + Math.round((matchGpa - (reqGpa - 0.3)) * 15);
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
          scholarshipEligible: matchGpa >= 3.2,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [allProgrammes, matchGpa, matchIelts, matchLevel, matchSubject, matchCountry]);

  const handleSimulateMatch = () => {
    setIsMatching(true);
    setTimeout(() => {
      setIsMatching(false);
    }, 400);
  };

  const money = (val: number, currency: string) => {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "GBP",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="min-h-screen bg-main text-primary font-sans selection:bg-teal-500 selection:text-on-accent relative overflow-x-hidden">
      {/* Background Ambient Lighting and Glow Orbs */}
      <div className="fixed -top-40 -left-40 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed top-1/3 -right-40 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed -bottom-40 left-1/3 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Persistent Navigation Bar */}
      <PublicNavbar />

      {/* Logged in Staff Banner (if staff member visits public home) */}
      {appUser && appUser.role !== "student" && (
        <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border-b border-emerald-500/30 px-4 py-2.5 text-center text-xs text-emerald-300 flex items-center justify-center gap-3 relative z-40">
          <span className="flex items-center gap-1.5 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Currently logged in as {appUser.displayName || appUser.email} ({appUser.role})</span>
          </span>
          <button
            onClick={() => navigate(getRoleDashboardPath(appUser.role))}
            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-on-accent font-bold rounded-lg text-xs shadow transition-all cursor-pointer"
          >
            Return to Internal EduCRM Desk &rarr;
          </button>
        </div>
      )}

      {/* Logged in Student Banner */}
      {appUser && appUser.role === "student" && (
        <div className="bg-gradient-to-r from-teal-950 via-indigo-950 to-slate-900 border-b border-teal-500/30 px-4 py-2.5 text-center text-xs text-teal-300 flex items-center justify-center gap-3 relative z-40">
          <span className="flex items-center gap-1.5 font-bold">
            <GraduationCap className="w-4 h-4 text-teal-400" />
            <span>Welcome back, {appUser.displayName || "Student"}! You are browsing as an applicant.</span>
          </span>
          <Link
            to="/student/dashboard"
            className="px-3 py-1 bg-teal-500 hover:bg-teal-400 text-on-accent font-bold rounded-lg text-xs shadow transition-all"
          >
            Open My Student Dashboard &rarr;
          </Link>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. HERO SECTION                                                          */}
      {/* ========================================================================= */}
      <section className="relative z-10 pt-12 pb-20 sm:pt-16 sm:pb-28 px-4 sm:px-6 lg:px-8 border-b border-default/60">
        <div className="max-w-6xl mx-auto text-center space-y-6">
          {/* Super-pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold backdrop-blur-md shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-spin" />
            <span>Next-Gen AI University Admissions & Study Abroad Platform</span>
          </div>

          {/* Headline */}
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black text-primary tracking-tight leading-[1.12] max-w-4xl mx-auto">
            Find Your Dream University Course Abroad{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-sky-400 to-indigo-400">
              with Intelligent AI
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-secondary text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
            Search 1,200+ accredited UK & global degree programmes. Get tailored AI shortlists,
            instant entry requirement checks, scholarship alerts, and direct admission offers.
          </p>

          {/* Hero Multi-Parameter Search Widget */}
          <div className="pt-4 max-w-4xl mx-auto">
            <div className="bg-surface/90 backdrop-blur-xl border border-default/80 rounded-2xl p-3 sm:p-4 shadow-2xl shadow-black/80 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-left">
                {/* 1. Keyword search */}
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1 ml-1">
                    Course or Keyword
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-placeholder" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. Data Science, MBA..."
                      className="w-full pl-9 pr-3 py-2 bg-input/80 border border-default/80 rounded-xl text-xs text-primary placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                    />
                  </div>
                </div>

                {/* 2. Destination Country */}
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1 ml-1">
                    Destination
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-placeholder pointer-events-none" />
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-input/80 border border-default/80 rounded-xl text-xs text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/50 appearance-none cursor-pointer"
                    >
                      <option value="All">All Destinations</option>
                      <option value="United Kingdom">United Kingdom (UK)</option>
                      <option value="United States">United States (USA)</option>
                      <option value="Australia">Australia</option>
                      <option value="Canada">Canada</option>
                      <option value="Germany">Germany</option>
                      <option value="United Arab Emirates">UAE</option>
                    </select>
                  </div>
                </div>

                {/* 3. Study Level */}
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1 ml-1">
                    Study Level
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 absolute left-3 top-2.5 text-placeholder pointer-events-none" />
                    <select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-input/80 border border-default/80 rounded-xl text-xs text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/50 appearance-none cursor-pointer"
                    >
                      <option value="All">All Levels</option>
                      <option value="Bachelor">Undergraduate / Bachelor's</option>
                      <option value="Postgraduate">Postgraduate / Master's</option>
                      <option value="PhD">PhD / Doctorate</option>
                      <option value="Foundation">Foundation Pathway</option>
                    </select>
                  </div>
                </div>

                {/* 4. Subject Discipline */}
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1 ml-1">
                    Subject Area
                  </label>
                  <div className="relative">
                    <BookOpen className="w-4 h-4 absolute left-3 top-2.5 text-placeholder pointer-events-none" />
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-input/80 border border-default/80 rounded-xl text-xs text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/50 appearance-none cursor-pointer"
                    >
                      <option value="All">All Subject Areas</option>
                      <option value="Computing & AI">Computing & AI</option>
                      <option value="Business & Management">Business & Management</option>
                      <option value="Health Sciences">Health Sciences & Medicine</option>
                      <option value="STEM">Engineering & STEM</option>
                      <option value="Law & Legal Studies">Law & International Studies</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bottom Search Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between pt-2 border-t border-default/80 gap-3">
                <div className="flex items-center gap-2 text-xs text-muted w-full sm:w-auto">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-teal-400" />
                  <span>Max Tuition:</span>
                  <span className="font-bold text-teal-300 font-mono">£{maxBudget.toLocaleString()}</span>
                  <input
                    type="range"
                    min="10000"
                    max="80000"
                    step="5000"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(Number(e.target.value))}
                    className="w-28 sm:w-36 accent-teal-400 cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <a
                    href="#programmes"
                    className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-primary font-bold text-xs rounded-xl shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search ({filteredProgrammes.length} Available)</span>
                  </a>

                  <a
                    href="#ai-counsellor"
                    className="hidden md:flex px-4 py-2.5 bg-elevated hover:bg-elevated text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold items-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    <span>AI Counsellor Match</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof & Metrics Strip */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-5 gap-4 max-w-4xl mx-auto border-t border-default/60 text-center">
            <div className="p-2 space-y-0.5">
              <div className="text-xl sm:text-2xl font-black text-primary font-heading">98.4%</div>
              <div className="text-[11px] text-muted font-medium">Visa Grant Success</div>
            </div>
            <div className="p-2 space-y-0.5">
              <div className="text-xl sm:text-2xl font-black text-teal-400 font-heading">1,200+</div>
              <div className="text-[11px] text-muted font-medium">Accredited Courses</div>
            </div>
            <div className="p-2 space-y-0.5">
              <div className="text-xl sm:text-2xl font-black text-indigo-400 font-heading">120+</div>
              <div className="text-[11px] text-muted font-medium">Partner Universities</div>
            </div>
            <div className="p-2 space-y-0.5">
              <div className="text-xl sm:text-2xl font-black text-amber-400 font-heading">£15M+</div>
              <div className="text-[11px] text-muted font-medium">Scholarships Disbursed</div>
            </div>
            <div className="col-span-2 sm:col-span-1 p-2 space-y-0.5">
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-heading">48 Hours</div>
              <div className="text-[11px] text-muted font-medium">Average Offer Turnaround</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. INTERACTIVE AI COUNSELLOR & ELIGIBILITY MATCHMAKER                     */}
      {/* ========================================================================= */}
      <section id="ai-counsellor" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-default/60 bg-gradient-to-b from-[#0F172A] to-[#0B1120]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-3 mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Interactive AI Eligibility Engine</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">
              Test Your University Admission Chances in 30 Seconds
            </h2>
            <p className="text-muted text-sm max-w-xl mx-auto">
              Tell our AI Counsellor your academic history and English proficiency to get real-time match probabilities and scholarship matches.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Input Controls Card */}
            <div className="lg:col-span-5 bg-surface/90 border border-default rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl shadow-black/50">
              <div className="flex items-center justify-between pb-3 border-b border-default">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                  <Zap className="w-4 h-4" />
                  <span>Student Profile Parameters</span>
                </span>
                <span className="text-[10px] text-muted font-mono">Gemini 3.8 Flash</span>
              </div>

              {/* Study Level */}
              <div>
                <label className="block text-xs font-bold text-secondary mb-1.5">
                  Target Study Degree
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["Master's", "Bachelor's"].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setMatchLevel(lvl)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        matchLevel === lvl
                          ? "bg-teal-500/20 border-teal-500 text-teal-300"
                          : "bg-input/60 border-default text-muted hover:text-primary"
                      }`}
                    >
                      {lvl} Degree
                    </button>
                  ))}
                </div>
              </div>

              {/* Destination Country */}
              <div>
                <label className="block text-xs font-bold text-secondary mb-1.5">
                  Preferred Destination
                </label>
                <select
                  value={matchCountry}
                  onChange={(e) => setMatchCountry(e.target.value)}
                  className="w-full px-3 py-2 bg-input border border-default rounded-xl text-xs text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/50 cursor-pointer"
                >
                  <option value="United Kingdom">United Kingdom (UK)</option>
                  <option value="United States">United States (USA)</option>
                  <option value="Australia">Australia</option>
                  <option value="Canada">Canada</option>
                  <option value="All">Any Destination</option>
                </select>
              </div>

              {/* Subject Discipline */}
              <div>
                <label className="block text-xs font-bold text-secondary mb-1.5">
                  Field of Study
                </label>
                <select
                  value={matchSubject}
                  onChange={(e) => setMatchSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-input border border-default rounded-xl text-xs text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/50 cursor-pointer"
                >
                  <option value="Computing & AI">Computing & Artificial Intelligence</option>
                  <option value="Business & Management">Business & Management / MBA</option>
                  <option value="Health Sciences">Health Sciences & Public Health</option>
                  <option value="STEM">Engineering & STEM</option>
                  <option value="Law & Legal Studies">Law & International Studies</option>
                </select>
              </div>

              {/* GPA Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-secondary">Current CGPA / Grade:</span>
                  <span className="font-bold text-teal-300 font-mono text-sm">{matchGpa.toFixed(2)} / 4.0</span>
                </div>
                <input
                  type="range"
                  min="2.2"
                  max="4.0"
                  step="0.05"
                  value={matchGpa}
                  onChange={(e) => setMatchGpa(Number(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-placeholder">
                  <span>Pass (2.2)</span>
                  <span>Good (3.0)</span>
                  <span>Distinction (3.8+)</span>
                </div>
              </div>

              {/* English Score Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-secondary">IELTS / English Score:</span>
                  <span className="font-bold text-indigo-300 font-mono text-sm">{matchIelts.toFixed(1)} Band</span>
                </div>
                <input
                  type="range"
                  min="5.0"
                  max="9.0"
                  step="0.5"
                  value={matchIelts}
                  onChange={(e) => setMatchIelts(Number(e.target.value))}
                  className="w-full accent-indigo-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-placeholder">
                  <span>5.5 (Pathway)</span>
                  <span>6.5 (Standard Direct)</span>
                  <span>7.5+ (Top Tier)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSimulateMatch}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-primary font-bold text-xs rounded-xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isMatching ? "Calculating Match..." : "Recalculate AI Matches"}</span>
              </button>
            </div>

            {/* AI Results Output Column */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-primary flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    <span>AI Recommended University Shortlist</span>
                  </h3>
                  <p className="text-xs text-muted">
                    Matches tailored to {matchLevel} in {matchSubject} ({matchCountry})
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-teal-500/10 text-teal-300 border border-teal-500/30 rounded-full text-[11px] font-bold">
                  {matchRecommendations.length} Strong Matches
                </span>
              </div>

              {matchRecommendations.length === 0 ? (
                <div className="p-8 bg-surface/60 border border-default rounded-2xl text-center space-y-2">
                  <BookOpen className="w-8 h-8 text-placeholder mx-auto" />
                  <p className="text-sm text-secondary font-semibold">No direct matches for these exact constraints</p>
                  <p className="text-xs text-placeholder">Try adjusting your budget or selecting "Any Destination".</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {matchRecommendations.map(({ university, programme, score, tier, scholarshipEligible }) => (
                    <div
                      key={programme.id}
                      className="bg-surface/85 hover:bg-surface border border-default hover:border-default rounded-2xl p-4 transition-all shadow-md group space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <img
                            src={getUniversityCampusImage(university.name)}
                            alt={university.name}
                            className="w-12 h-12 rounded-xl object-cover border border-default/80 shrink-0"
                            onError={(e) => {
                              e.currentTarget.src = "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=600&q=80";
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold text-muted">
                                {university.name} • {university.city}, {university.country}
                              </span>
                              {university.globalRanking && (
                                <span className="px-1.5 py-0.2 text-[10px] bg-indigo-500/20 text-indigo-300 rounded font-mono">
                                  QS #{university.globalRanking}
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-primary group-hover:text-teal-300 transition-colors">
                              {programme.title}
                            </h4>
                          </div>
                        </div>

                        {/* Match Probability Badge */}
                        <div className="sm:text-right shrink-0">
                          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                            tier === "High Match"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : tier === "Target Match"
                              ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          }`}>
                            <Star className="w-3 h-3 fill-current" />
                            <span>{score}% {tier}</span>
                          </div>
                        </div>
                      </div>

                      {/* Details Strip */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-2 border-t border-default/80 text-muted">
                        <div>
                          <span className="text-placeholder block">Annual Tuition:</span>
                          <span className="font-bold text-primary font-mono">
                            {money(programme.tuitionFeeAnnual, programme.currency)}
                          </span>
                        </div>
                        <div>
                          <span className="text-placeholder block">Min IELTS:</span>
                          <span className="font-bold text-primary font-mono">
                            {programme.minIeltsScore || 6.5}
                          </span>
                        </div>
                        <div>
                          <span className="text-placeholder block">Duration:</span>
                          <span className="font-bold text-primary font-mono">
                            {programme.durationMonths} Months
                          </span>
                        </div>
                        <div>
                          <span className="text-placeholder block">Next Intake:</span>
                          <span className="font-bold text-teal-400 font-mono">
                            {(programme.intakes || ["September"])[0]}
                          </span>
                        </div>
                      </div>

                      {/* Scholarship Callout & Apply Button */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 bg-input/60 p-2.5 rounded-xl border border-default">
                        <div className="text-[11px] flex items-center gap-1.5 text-amber-300">
                          <Award className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {scholarshipEligible
                              ? "Qualified for £3,000 - £5,000 International Merit Bursary"
                              : "Standard university fee installment plan available"}
                          </span>
                        </div>

                        <Link
                          to={`/student-register?programme=${programme.id}`}
                          className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-on-accent font-bold text-xs rounded-lg flex items-center gap-1 transition-all shrink-0 active:scale-95 ml-auto sm:ml-0"
                        >
                          <span>1-Click Apply</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. FEATURED PARTNER UNIVERSITIES SHOWCASE                                */}
      {/* ========================================================================= */}
      <section id="universities" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-default/60">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
                <Building2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Global Higher Education Network</span>
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">
                Top Partner Universities
              </h2>
              <p className="text-muted text-sm mt-1">
                Direct admissions processing and accredited representation across the globe.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted font-medium">Filter Country:</span>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="px-3 py-1.5 bg-surface border border-default rounded-xl text-xs text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/50 cursor-pointer"
              >
                <option value="All">All Countries</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="United States">United States</option>
                <option value="Australia">Australia</option>
                <option value="Canada">Canada</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {GLOBAL_UNIVERSITIES.filter((u) => selectedCountry === "All" || u.country.toLowerCase() === selectedCountry.toLowerCase())
              .slice(0, 6)
              .map((univ) => {
                const landmark = getUniversityLandmark(univ.name);
                const campusImg = getUniversityCampusImage(univ.name);
                const progCount = (univ.programmes || []).length;

                return (
                  <div
                    key={univ.id}
                    className="bg-surface/90 border border-default hover:border-default rounded-2xl overflow-hidden shadow-lg transition-all group flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Header with Badge Overlay */}
                      <div className="relative h-44 overflow-hidden bg-input">
                        <img
                          src={campusImg}
                          alt={univ.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                        {univ.globalRanking && (
                          <div className="absolute top-3 left-3 px-2 py-0.5 bg-indigo-900/80 backdrop-blur-md border border-indigo-500/40 text-indigo-200 text-[11px] font-bold rounded-lg font-mono">
                            QS World #{univ.globalRanking}
                          </div>
                        )}

                        <div className="absolute top-3 right-3 px-2 py-0.5 bg-teal-900/80 backdrop-blur-md border border-teal-500/40 text-teal-200 text-[10px] font-bold rounded-lg">
                          Full Partner
                        </div>

                        <div className="absolute bottom-2.5 left-3 right-3 text-xs text-secondary font-medium truncate">
                          <MapPin className="w-3.5 h-3.5 inline mr-1 text-teal-400" />
                          <span>{landmark || `${univ.city}, ${univ.country}`}</span>
                        </div>
                      </div>

                      {/* Body Content */}
                      <div className="p-4 space-y-2">
                        <h3 className="font-heading text-lg font-bold text-primary group-hover:text-teal-300 transition-colors leading-snug">
                          {univ.name}
                        </h3>
                        <p className="text-xs text-muted line-clamp-2">
                          {univ.description || "Renowned international university offering accredited undergraduate, master's and research qualifications."}
                        </p>

                        <div className="pt-2 grid grid-cols-2 gap-2 text-xs border-t border-default/80">
                          <div>
                            <span className="text-[10px] text-placeholder block">Acceptance Rate:</span>
                            <span className="font-bold text-secondary font-mono">{univ.acceptanceRate || 22}%</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-placeholder block">Degree Courses:</span>
                            <span className="font-bold text-teal-300 font-mono">{progCount} Programmes</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Button */}
                    <div className="p-4 pt-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery(univ.name);
                          const el = document.getElementById("programmes");
                          if (el) el.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="w-full py-2 px-3 bg-elevated hover:bg-elevated text-secondary hover:text-primary font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-default/80"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                        <span>View Programmes & Apply</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. PROGRAMMES DIRECTORY & EXPLORER                                       */}
      {/* ========================================================================= */}
      <section id="programmes" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-default/60 bg-gradient-to-b from-[#0B1120] to-[#0F172A]">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold mb-2">
                <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                <span>Searchable Degree Catalog</span>
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">
                Explore Accredited Programmes
              </h2>
              <p className="text-muted text-sm mt-1">
                Showing {filteredProgrammes.length} matching degrees matching your criteria.
              </p>
            </div>

            {/* Quick reset filters */}
            {(searchQuery || selectedCountry !== "All" || selectedLevel !== "All" || selectedSubject !== "All") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCountry("All");
                  setSelectedLevel("All");
                  setSelectedSubject("All");
                  setMaxBudget(60000);
                }}
                className="text-xs text-teal-400 hover:text-teal-300 underline font-semibold"
              >
                Reset All Filters
              </button>
            )}
          </div>

          {/* Subject Pills Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {["All", "Computing & AI", "Business & Management", "Health Sciences", "STEM", "Law & Legal Studies"].map((subj) => (
              <button
                key={subj}
                type="button"
                onClick={() => setSelectedSubject(subj)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedSubject === subj
                    ? "bg-teal-500 text-on-accent border-teal-400 shadow-md shadow-teal-500/20"
                    : "bg-surface border-default text-secondary hover:border-default hover:text-primary"
                }`}
              >
                {subj}
              </button>
            ))}
          </div>

          {/* Programmes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProgrammes.slice(0, 9).map(({ university, programme }) => (
              <div
                key={programme.id}
                className="bg-surface/90 border border-default hover:border-default rounded-2xl p-4 shadow-md transition-all flex flex-col justify-between group space-y-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 rounded-lg text-[10px] font-bold">
                      {programme.level}
                    </span>
                    <span className="text-[11px] font-bold text-muted font-mono">
                      {university.country}
                    </span>
                  </div>

                  <h3 className="font-heading text-base font-bold text-primary group-hover:text-teal-300 transition-colors leading-snug">
                    {programme.title}
                  </h3>

                  <div className="text-xs text-muted flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span className="truncate">{university.name}</span>
                  </div>

                  {/* Specifications */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-default/80 text-[11px]">
                    <div>
                      <span className="text-placeholder block text-[10px]">Tuition:</span>
                      <span className="font-bold text-primary font-mono">
                        {money(programme.tuitionFeeAnnual, programme.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-placeholder block text-[10px]">IELTS:</span>
                      <span className="font-bold text-teal-300 font-mono">
                        {programme.minIeltsScore || 6.5}
                      </span>
                    </div>
                    <div>
                      <span className="text-placeholder block text-[10px]">Duration:</span>
                      <span className="font-bold text-secondary font-mono">
                        {programme.durationMonths} Mo
                      </span>
                    </div>
                  </div>
                </div>

                {/* Apply CTA */}
                <div className="pt-2 border-t border-default/80 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-muted">
                    Intake: {(programme.intakes || ["September"])[0]}
                  </span>
                  <Link
                    to={`/student-register?programme=${programme.id}`}
                    className="px-3.5 py-1.5 bg-teal-500/15 hover:bg-teal-500 text-teal-300 hover:text-on-accent border border-teal-500/30 font-bold text-xs rounded-xl flex items-center gap-1 transition-all active:scale-95"
                  >
                    <span>Apply Now</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {filteredProgrammes.length > 9 && (
            <div className="text-center pt-4">
              <Link
                to="/student-register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-elevated hover:bg-elevated text-teal-300 border border-default rounded-xl text-xs font-bold transition-colors"
              >
                <span>Register to unlock all {filteredProgrammes.length} programmes & AI auto-fill</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SCHOLARSHIPS RADAR                                                    */}
      {/* ========================================================================= */}
      <section id="scholarships" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-default/60">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>International Student Financial Aid</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">
              Featured Global Scholarships
            </h2>
            <p className="text-muted text-sm max-w-xl mx-auto">
              Over £15M in merit bursaries, STEM grants, and university funding opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                title: "Clarendon Scholarship",
                institution: "University of Oxford",
                amount: "100% Tuition + Living",
                criteria: "Academic excellence (GPA 3.8+)",
                deadline: "January 2026",
                color: "from-amber-500/20 to-orange-500/10 border-amber-500/30",
              },
              {
                title: "Vice-Chancellor's Excellence",
                institution: "UK & Australian Partners",
                amount: "£5,000 - £10,000 Reduction",
                criteria: "Direct undergraduate & master's entry",
                deadline: "Rolling Intake",
                color: "from-teal-500/20 to-emerald-500/10 border-teal-500/30",
              },
              {
                title: "Women in STEM Bursary",
                institution: "Global Engineering & AI Desk",
                amount: "£4,500 Annual Grant",
                criteria: "Female applicants in AI / Tech / Bio",
                deadline: "August 2026",
                color: "from-indigo-500/20 to-purple-500/10 border-indigo-500/30",
              },
              {
                title: "Chevening & Commonwealth Support",
                institution: "Foreign, Commonwealth & Dev Office",
                amount: "Full Government Grant",
                criteria: "Leadership potential & 2 yr experience",
                deadline: "November 2025",
                color: "from-sky-500/20 to-blue-500/10 border-sky-500/30",
              },
            ].map((sch, i) => (
              <div
                key={i}
                className={`bg-gradient-to-b ${sch.color} bg-surface border rounded-2xl p-5 space-y-3 flex flex-col justify-between`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-300 font-mono uppercase tracking-wider">
                      Scholarship
                    </span>
                    <span className="text-[10px] text-muted font-mono">{sch.deadline}</span>
                  </div>
                  <h3 className="font-heading text-base font-bold text-primary">{sch.title}</h3>
                  <p className="text-xs text-secondary font-medium">{sch.institution}</p>
                  <div className="p-2.5 bg-input/70 rounded-xl border border-default text-xs font-extrabold text-teal-300 font-mono">
                    {sch.amount}
                  </div>
                  <p className="text-[11px] text-muted">{sch.criteria}</p>
                </div>

                <Link
                  to="/student-register"
                  className="w-full py-2 px-3 bg-elevated hover:bg-elevated text-primary font-bold text-xs rounded-xl text-center block transition-colors"
                >
                  Check Eligibility
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. ZERO-REDUNDANCY 6-STEP ADMISSION JOURNEY                              */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-default/60 bg-gradient-to-b from-[#0F172A] to-[#0B1120]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>Zero-Redundancy Principle</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">
              The 6-Step End-to-End Admission Journey
            </h2>
            <p className="text-muted text-sm max-w-xl mx-auto">
              Never enter the same information twice. Automated CV parsing, counsellor verification, and direct CAS/I-20 visa clearance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Explore & AI Match",
                desc: "Discover programs tailored to your GPA, English tests, budget, and career goals with instant match probability.",
                icon: Search,
              },
              {
                step: "02",
                title: "1-Click AI CV & Doc Scan",
                desc: "Upload your resume or transcripts once. Google Gemini AI extracts your academic credentials with zero re-typing.",
                icon: FileText,
              },
              {
                step: "03",
                title: "Dedicated Counsellor Review",
                desc: "Licensed education counsellors audit your dossier and verify documents in the Admissions Verification Desk.",
                icon: Users2,
              },
              {
                step: "04",
                title: "Official University Offer",
                desc: "Direct partner dispatch. Receive official conditional & unconditional offer letters through your student portal.",
                icon: Award,
              },
              {
                step: "05",
                title: "Visa Officer & CAS Clearance",
                desc: "Immigration officers verify proof of funds, conduct mock visa interviews, and approve your CAS / I-20 application.",
                icon: Plane,
              },
              {
                step: "06",
                title: "Arrival & Campus Enrolment",
                desc: "Welcome to campus. Accommodation support, student fee tracking, and direct arrival onboarding.",
                icon: CheckCircle2,
              },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={i}
                  className="bg-surface/80 border border-default rounded-2xl p-5 space-y-3 relative group hover:border-teal-500/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-heading text-2xl font-black text-placeholder group-hover:text-teal-400 transition-colors font-mono">
                      {step.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="font-heading text-base font-bold text-primary">{step.title}</h3>
                  <p className="text-xs text-muted leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. DUAL CALLOUT: STUDENTS VS STAFF CRM                                    */}
      {/* ========================================================================= */}
      <section className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-default/60">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Student Portal */}
          <div className="bg-gradient-to-br from-teal-950/60 via-slate-900 to-slate-950 border border-teal-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="font-heading text-2xl font-bold text-primary">For International Students</h3>
              <p className="text-xs text-secondary leading-relaxed">
                Create your student profile in under 3 minutes. Upload your CV for automated extraction, track university offers live, and chat with your dedicated counsellor.
              </p>
              <ul className="space-y-2 text-xs text-secondary pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>100% Free Application Service</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Instant AI CV & Transcript Parser</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Real-Time University Offer Tracker</span>
                </li>
              </ul>
            </div>

            <div className="pt-4">
              <Link
                to="/student-register"
                className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-primary font-bold text-xs rounded-xl shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start Student Registration</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: EduCRM Staff & Partner Portal */}
          <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-heading text-2xl font-bold text-primary">For Staff & EduCRM Desk</h3>
              <p className="text-xs text-secondary leading-relaxed">
                Enterprise cloud workspace for Education Counsellors, Admissions Officers, Visa Officers, Finance, and Platform Super Admins.
              </p>
              <ul className="space-y-2 text-xs text-secondary pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Multi-Tenant Student Lead & Application Funnel</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Admissions Document Verification Hub</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Visa Case Workload & CAS Issuance Workspace</span>
                </li>
              </ul>
            </div>

            <div className="pt-4">
              <Link
                to="/login"
                className="w-full py-3 px-4 bg-elevated hover:bg-elevated text-primary border border-default font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Sign in to EduCRM Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FOOTER                                                                */}
      {/* ========================================================================= */}
      <footer className="relative z-10 py-12 px-4 sm:px-6 lg:px-8 bg-main border-t border-default text-muted text-xs">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-teal-400" />
              <span className="font-heading font-extrabold text-base text-primary">EduBridge.AI</span>
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              Global AI-powered university admissions platform connecting international students with accredited UK, USA, Australia, and European institutions.
            </p>
            <div className="text-[10px] text-placeholder font-mono">
              Branch Hubs: London • Manchester • Delhi • Lahore • Islamabad • Dubai
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-primary font-bold text-xs uppercase tracking-wider">Explore Programmes</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><a href="#programmes" className="hover:text-teal-400">Computing & Artificial Intelligence</a></li>
              <li><a href="#programmes" className="hover:text-teal-400">MBA & Global Business</a></li>
              <li><a href="#programmes" className="hover:text-teal-400">Health Sciences & Public Health</a></li>
              <li><a href="#programmes" className="hover:text-teal-400">Engineering & STEM Degrees</a></li>
              <li><a href="#programmes" className="hover:text-teal-400">LLM International Law</a></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-primary font-bold text-xs uppercase tracking-wider">Admissions & Visa</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><a href="#ai-counsellor" className="hover:text-teal-400">AI Eligibility Matchmaker</a></li>
              <li><a href="#scholarships" className="hover:text-teal-400">Scholarship Search & Deadlines</a></li>
              <li><Link to="/student-register" className="hover:text-teal-400">1-Click AI CV Scanner</Link></li>
              <li><a href="#how-it-works" className="hover:text-teal-400">CAS / I-20 Compliance Guide</a></li>
              <li><Link to="/login" className="hover:text-teal-400">Student Portal Login</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-primary font-bold text-xs uppercase tracking-wider">EduCRM Operations</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link to="/login" className="hover:text-teal-400">Super Admin & Branch Control</Link></li>
              <li><Link to="/login" className="hover:text-teal-400">Education Counsellor Leads</Link></li>
              <li><Link to="/login" className="hover:text-teal-400">Admissions Verification Hub</Link></li>
              <li><Link to="/login" className="hover:text-teal-400">Visa Officer Cases</Link></li>
              <li><Link to="/login" className="hover:text-teal-400">Agent Commission Ledger</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-6 border-t border-default/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-placeholder">
          <div>
            &copy; {new Date().getFullYear()} EduBridge Network & EduCRM. All rights reserved. Cloud-Native Higher Education Architecture.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-teal-400 font-mono">Live Deployment: education-crm-9fee2.web.app</span>
            <Link to="/login" className="hover:text-primary underline">
              Staff Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
