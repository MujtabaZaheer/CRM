import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import {
  Globe,
  Search,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  ShieldAlert,
  Banknote,
  Clock,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Filter,
  Heart,
  Stethoscope,
  Fingerprint,
  TrendingUp,
  X,
} from "lucide-react";
import { db } from "../../../firebase/config";
import { useAuth } from "../../../contexts/AuthContext";
import { Student } from "../../../types/student";
import type { DestinationCountry, WorldRegion } from "../../../types/country";
import { DEFAULT_DESTINATIONS } from "../../../types/country";
import { getImmigrationData } from "../../../utils/immigrationData";
import { getRoleDashboardPath } from "../../../types/registrationConfig";

/* ------------------------------------------------------------------ */
/*  Region and quick filter definitions                               */
/* ------------------------------------------------------------------ */
const REGION_TABS: WorldRegion[] = [
  "All",
  "Popular Hubs",
  "Europe",
  "North America",
  "Asia-Pacific",
  "Middle East",
  "Latin America",
  "Africa",
];

type QuickFilter = "popular" | "longPswv" | "affordable" | "noTuition";

const QUICK_FILTERS: { key: QuickFilter; label: string; icon: React.ReactNode }[] = [
  { key: "popular", label: "Popular Hubs", icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { key: "longPswv", label: "Long PSWV (2+ yrs)", icon: <Clock className="w-3.5 h-3.5" /> },
  { key: "affordable", label: "Affordable ($)", icon: <Banknote className="w-3.5 h-3.5" /> },
  { key: "noTuition", label: "No Tuition", icon: <GraduationCap className="w-3.5 h-3.5" /> },
];

const POPULAR_IDS = new Set(["uk", "ca", "us", "au", "de", "fr", "ie", "sg", "ae"]);

const INTAKE_OPTIONS = [
  "Fall 2026 (Aug – Oct)",
  "Spring 2027 (Jan – Mar)",
  "Summer 2027 (May – Jul)",
  "Fall 2027 (Aug – Oct)",
];

const STUDY_MODES = ["On-Campus (Full-Time)", "On-Campus (Part-Time)", "Hybrid", "Online"];

/* ================================================================== */
/*  COMPONENT                                                          */
/* ================================================================== */
export const StudentOnboardingStage2: React.FC = () => {
  const { appUser, firebaseUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<WorldRegion>("All");
  const [activeFilters, setActiveFilters] = useState<QuickFilter[]>([]);
  const [availableDestinations, setAvailableDestinations] = useState<DestinationCountry[]>(DEFAULT_DESTINATIONS);

  // Preferences
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [inspectedCountry, setInspectedCountry] = useState<string | null>(null);
  const [budgetAnnualUsd, setBudgetAnnualUsd] = useState(25000);
  const [preferredIntake, setPreferredIntake] = useState(INTAKE_OPTIONS[0]);
  const [preferredStudyMode, setPreferredStudyMode] = useState(STUDY_MODES[0]);
  const [preferredCity, setPreferredCity] = useState("");
  const [scholarshipPriority, setScholarshipPriority] = useState<"High" | "Medium" | "Not Essential">("Medium");
  const [institutionType, setInstitutionType] = useState<"Any" | "Public" | "Private">("Any");

  // Redirect non-students away from student onboarding immediately
  useEffect(() => {
    if (appUser && appUser.role !== "student") {
      navigate(getRoleDashboardPath(appUser.role), { replace: true });
    }
  }, [appUser, navigate]);

  /* ---- Load student data + university countries ---- */
  useEffect(() => {
    const loadData = async () => {
      const uid = firebaseUser?.uid || appUser?.uid;
      if (!uid) return;

      try {
        // Load university countries to supplement destinations
        let combined = [...DEFAULT_DESTINATIONS];
        try {
          const univSnap = await getDocs(collection(db, "universities"));
          if (!univSnap.empty) {
            const dbCountries = new Set<string>();
            univSnap.docs.forEach((d) => {
              const data = d.data();
              if (data.country) dbCountries.add(data.country);
            });
            dbCountries.forEach((c) => {
              if (!combined.some((item) => item.name.toLowerCase() === c.toLowerCase())) {
                combined.push({
                  id: c.toLowerCase().replace(/\s+/g, "_"),
                  name: c,
                  code: c.slice(0, 2).toUpperCase(),
                  flag: "🌐",
                  currency: "USD",
                  region: "Europe",
                  tuitionAffordabilityTier: "$$",
                  pswvLengthYears: 0,
                  popularIntakes: ["September", "January"],
                  partnerCount: 0,
                  averageTuition: "Varies",
                });
              }
            });
          }
        } catch (_) { /* universities collection may not exist yet */ }

        // Fetch rest of the world from RestCountries API to ensure complete world coverage
        try {
          const res = await fetch("https://restcountries.com/v3.1/all?fields=name,cca2,flag,region,currencies");
          const worldData = await res.json();
          if (Array.isArray(worldData)) {
            worldData.forEach((wc) => {
              const cName = wc.name?.common;
              if (cName && !combined.some((item) => item.name.toLowerCase() === cName.toLowerCase())) {
                let mappedRegion: any = "Europe";
                if (wc.region === "Americas") mappedRegion = "Latin America";
                else if (wc.region === "Asia") mappedRegion = "Asia-Pacific";
                else if (wc.region === "Africa") mappedRegion = "Africa";
                else if (wc.region === "Oceania") mappedRegion = "Asia-Pacific";

                let curr = "USD";
                if (wc.currencies) {
                  curr = Object.keys(wc.currencies)[0] || "USD";
                }

                combined.push({
                  id: cName.toLowerCase().replace(/\s+/g, "_"),
                  name: cName,
                  code: wc.cca2 || cName.slice(0, 2).toUpperCase(),
                  flag: wc.flag || "🌐",
                  currency: curr,
                  region: mappedRegion,
                  tuitionAffordabilityTier: "$",
                  pswvLengthYears: 0,
                  popularIntakes: ["September"],
                  partnerCount: 0,
                  averageTuition: "Varies",
                });
              }
            });
          }
        } catch (err) {
          console.warn("Failed to fetch world countries", err);
        }

        setAvailableDestinations(combined);

        // Load student preferences
        const snap = await getDoc(doc(db, "students", uid));
        if (snap.exists()) {
          const data = snap.data() as Student & Record<string, any>;
          setStudent(data as Student);
          if (data.preferredDestinations?.length) {
            setSelectedCountries(data.preferredDestinations);
          } else if (data.preferredDestination) {
            setSelectedCountries([data.preferredDestination]);
          } else {
            setSelectedCountries(["United Kingdom"]);
          }
          if (data.budgetAnnualUsd) setBudgetAnnualUsd(data.budgetAnnualUsd);
          if (data.preferredIntake) setPreferredIntake(data.preferredIntake);
          if (data.preferredStudyMode) setPreferredStudyMode(data.preferredStudyMode);
          if (data.preferredCity) setPreferredCity(data.preferredCity);
          if (data.scholarshipPriority) setScholarshipPriority(data.scholarshipPriority);
          if (data.institutionType) setInstitutionType(data.institutionType);
        } else {
          setSelectedCountries(["United Kingdom"]);
        }
      } catch (err: any) {
        console.warn("Error loading student preferences:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [appUser, firebaseUser]);

  /* ---- Toggle country selection ---- */
  const toggleCountry = (name: string) => {
    setSelectedCountries((prev) => {
      if (prev.includes(name)) {
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== name);
      }
      return [...prev, name];
    });
  };

  /* ---- Toggle quick filter ---- */
  const toggleFilter = (f: QuickFilter) => {
    setActiveFilters((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    );
  };

  /* ---- Filtered destinations ---- */
  const filteredDestinations = useMemo(() => {
    let list = availableDestinations;

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((d) => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q));
    }

    // Region filter
    if (selectedRegion === "Popular Hubs") {
      list = list.filter((d) => d.isPopular || POPULAR_IDS.has(d.id));
    } else if (selectedRegion !== "All") {
      list = list.filter((d) => d.region === selectedRegion);
    }

    // Quick filters
    if (activeFilters.includes("popular")) {
      list = list.filter((d) => d.isPopular || POPULAR_IDS.has(d.id));
    }
    if (activeFilters.includes("longPswv")) {
      list = list.filter((d) => d.pswvLengthYears >= 2);
    }
    if (activeFilters.includes("affordable")) {
      list = list.filter((d) => d.tuitionAffordabilityTier === "$");
    }
    if (activeFilters.includes("noTuition")) {
      list = list.filter((d) => d.averageTuition.includes("€0") || d.averageTuition.toLowerCase().includes("no tuition"));
    }

    return list;
  }, [availableDestinations, searchQuery, selectedRegion, activeFilters]);

  /* ---- Active advisory for inspected or first selected country ---- */
  const activeCountryName = inspectedCountry || selectedCountries[0] || filteredDestinations[0]?.name;
  const activeAdvisory = useMemo(() => {
    if (!activeCountryName) return null;
    return getImmigrationData(activeCountryName);
  }, [activeCountryName]);

  /* ---- Save preferences ---- */
  const savePreferences = async (isProceeding = false) => {
    const uid = firebaseUser?.uid || appUser?.uid;
    if (!uid) return;
    if (selectedCountries.length === 0) {
      setError("Please select at least one preferred study destination.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      preferredDestinations: selectedCountries,
      preferredDestination: selectedCountries[0] || "United Kingdom",
      budgetAnnualUsd,
      preferredIntake,
      preferredStudyMode,
      preferredCity: preferredCity.trim(),
      scholarshipPriority,
      institutionType,
      currentStep: 3,
      updatedAt: Date.now(),
    };

    try {
      await setDoc(doc(db, "students", uid), payload, { merge: true });
      await setDoc(doc(db, "users", uid), { 
        currentStep: 3,
        updatedAt: Date.now() 
      }, { merge: true });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      if (isProceeding) navigate("/student/onboarding/step-3");
    } catch (err: any) {
      console.error("Failed to save:", err);
      setError(err.message || "Could not save preferences.");
    } finally {
      setSaving(false);
    }
  };

  /* ---- Loading state ---- */
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
      {/* Role-Specific Atmospheric Background Layer */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center transition-all duration-700 opacity-15 dark:opacity-20"
        style={{ backgroundImage: `url('/images/student_campus_hero.jpg')` }}
      />
      {/* Ambient Vignette Overlay for crisp text contrast */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-white/80 via-white/60 to-white/85 dark:from-slate-950/85 dark:via-slate-950/70 dark:to-slate-950/90" />
      {/* ---- Sticky Header ---- */}
      <div className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-subtle px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
              Step 2 of 4 • Global Country Discovery
            </span>
            <h1 className="text-xl font-bold font-heading text-primary">
              Where do you want to study?
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/student/onboarding/step-1")}
              className="px-3 py-1.5 bg-elevated hover:bg-hover text-xs font-semibold text-secondary rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              type="button"
              onClick={() => savePreferences(false)}
              disabled={saving}
              className="px-3 py-1.5 bg-elevated hover:bg-hover text-xs font-semibold text-primary rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : saveSuccess ? "Saved ✓" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => savePreferences(true)}
              disabled={selectedCountries.length === 0 || saving}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-lg shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>Continue to Programs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        {/* ---- Error ---- */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ---- Search & Quick Filters ---- */}
        <div className="bg-surface border border-subtle rounded-2xl p-5 mb-6 space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search countries..."
                className="w-full bg-main border border-default rounded-xl pl-10 pr-3.5 py-2 text-sm text-primary placeholder-text-placeholder focus:outline-none focus:border-emerald-500 transition-colors sq-input"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {QUICK_FILTERS.map((f) => {
                const isActive = activeFilters.includes(f.key);
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => toggleFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer sq-pill ${
                      isActive
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-elevated text-secondary border border-subtle hover:border-default hover:text-primary"
                    }`}
                  >
                    {f.icon}
                    {f.label}
                    {isActive && <X className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Region Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-subtle/50 pt-3">
            {REGION_TABS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRegion(r)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedRegion === r
                    ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                    : "bg-elevated text-secondary hover:text-primary hover:bg-hover"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Destinations Chips Bar */}
        {selectedCountries.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-wrap items-center gap-2 animate-fade-in">
            <span className="text-xs font-bold text-emerald-400 mr-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Selected Destinations ({selectedCountries.length}):
            </span>
            {selectedCountries.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface border border-emerald-500/30 text-xs font-bold text-primary shadow-sm"
              >
                <span>{availableDestinations.find((d) => d.name === c)?.flag || "🌐"}</span>
                <span>{c}</span>
                <button
                  type="button"
                  onClick={() => toggleCountry(c)}
                  className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-rose-500/20 text-muted hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={() => setSelectedCountries([])}
              className="text-xs text-muted hover:text-rose-400 ml-auto font-semibold underline cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}

        {/* ---- Main Grid ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ---- Left: Country Grid ---- */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-surface border border-subtle rounded-2xl p-6 sq-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-primary font-heading flex items-center gap-2">
                    <Globe className="w-5 h-5 text-emerald-400" /> Destination Hub
                  </h2>
                  <p className="text-xs text-muted mt-1">
                    Select one or more countries to explore immigration requirements.
                    <span className="ml-2 text-emerald-400 font-medium">
                      {selectedCountries.length} selected
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredDestinations.map((country) => {
                  const selected = selectedCountries.includes(country.name);
                  const isInspected = activeCountryName === country.name;
                  const advisory = getImmigrationData(country.name);
                  const pCount = advisory?.partnerCount || country.partnerCount || 0;
                  return (
                    <div
                      key={country.id}
                      onClick={() => {
                        toggleCountry(country.name);
                        setInspectedCountry(country.name);
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer select-none space-y-3 relative group hover-lift ${
                        selected
                          ? "bg-emerald-500/10 border-emerald-500/50 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/20"
                          : isInspected
                          ? "bg-elevated border-default ring-1 ring-default"
                          : "bg-main border-subtle hover:border-default hover:bg-elevated"
                      }`}
                    >
                      {/* Top row: flag + name + check */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl filter drop-shadow-sm">{country.flag}</span>
                          <div>
                            <h3 className={`text-sm font-bold ${selected ? "text-emerald-400" : "text-primary"}`}>
                              {country.name}
                            </h3>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted">
                              {country.code}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                            selected
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-default bg-surface"
                          }`}
                        >
                          {selected && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>

                      {/* Badges row */}
                      <div className="flex flex-wrap gap-1.5">
                        {/* Affordability */}
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-elevated text-secondary border border-subtle sq-pill">
                          <Banknote className="w-3 h-3" />
                          {country.tuitionAffordabilityTier}
                        </span>
                        {/* PSWV */}
                        {country.pswvLengthYears > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-elevated text-secondary border border-subtle sq-pill">
                            <Clock className="w-3 h-3" />
                            {country.pswvLengthYears}yr PSWV
                          </span>
                        )}
                        {/* Intakes */}
                        {country.popularIntakes.slice(0, 2).map((intake) => (
                          <span
                            key={intake}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-elevated text-muted border border-subtle sq-pill"
                          >
                            {intake}
                          </span>
                        ))}
                      </div>

                      {/* Bottom row */}
                      <div className="pt-3 border-t border-subtle/50 flex items-center justify-between text-xs">
                        <span className="text-secondary flex items-center gap-1.5">
                          <Banknote className="w-3.5 h-3.5" /> {country.currency}
                        </span>
                        <span className="text-secondary flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5" /> {pCount} Partners
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredDestinations.length === 0 && (
                <div className="py-12 text-center text-muted text-sm">
                  <Globe className="w-8 h-8 mx-auto mb-3 opacity-40" />
                  <p>No countries match your search or filters.</p>
                </div>
              )}
            </div>
          </div>

          {/* ---- Right: Destination Advisory Panel ---- */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              {!activeAdvisory ? (
                <div className="bg-surface border border-subtle rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[400px] sq-card">
                  <Globe className="w-12 h-12 text-muted mb-4 opacity-50" />
                  <h3 className="text-base font-semibold text-primary">Select a Destination</h3>
                  <p className="text-sm text-secondary mt-2">
                    Choose a country from the grid to view detailed immigration rules, financial
                    requirements, and visa intelligence.
                  </p>
                </div>
              ) : (
                <div className="bg-surface border border-emerald-500/30 rounded-2xl overflow-hidden shadow-lg shadow-emerald-500/5 sq-card animate-fade-in">
                  {/* Header */}
                  <div className="bg-emerald-500/10 p-5 border-b border-emerald-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShieldAlert className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h3 className="text-sm font-bold text-primary font-heading">
                          Destination Advisory
                        </h3>
                        <p className="text-xs text-emerald-400/80 font-medium">
                          Immigration Intelligence for {activeAdvisory.country}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-5">
                    {/* Visa Type */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 sq-pill">
                        {activeAdvisory.visaType}
                      </span>
                    </div>

                    {/* Financial Proof */}
                    <div className="space-y-2">
                      <h4 className="text-[11px] uppercase tracking-wider font-bold text-secondary flex items-center gap-1.5">
                        <Banknote className="w-3.5 h-3.5" /> Financial Proof Required
                      </h4>
                      <div className="bg-main rounded-xl p-3 border border-subtle">
                        <span className="text-base font-bold text-primary">
                          {activeAdvisory.financialProof.amount}
                        </span>
                        <p className="text-xs text-muted mt-1 leading-relaxed">
                          {activeAdvisory.financialProof.description}
                        </p>
                      </div>
                    </div>

                    {/* PSWV */}
                    <div className="space-y-2">
                      <h4 className="text-[11px] uppercase tracking-wider font-bold text-secondary flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Post-Study Work Visa (PSWV)
                      </h4>
                      <div className="bg-main rounded-xl p-3 border border-subtle">
                        <span className="text-sm font-bold text-primary">
                          {activeAdvisory.pswvRights.duration}
                        </span>
                        <p className="text-xs text-muted mt-1 leading-relaxed">
                          {activeAdvisory.pswvRights.description}
                        </p>
                      </div>
                    </div>

                    {/* Language & Intakes */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="text-[11px] uppercase tracking-wider font-bold text-secondary flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" /> Language
                        </h4>
                        <ul className="text-xs text-primary space-y-1">
                          {activeAdvisory.languageAcceptance.map((lang, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-emerald-400">•</span> {lang}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-[11px] uppercase tracking-wider font-bold text-secondary flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5" /> Major Intakes
                        </h4>
                        <ul className="text-xs text-primary space-y-1">
                          {activeAdvisory.intakeMilestones.map((intake, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-emerald-400">•</span> {intake}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Quick indicators */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className={`p-2.5 rounded-lg border text-center ${activeAdvisory.biometricRequired ? "bg-amber-500/10 border-amber-500/20" : "bg-main border-subtle"}`}>
                        <Fingerprint className={`w-4 h-4 mx-auto mb-1 ${activeAdvisory.biometricRequired ? "text-amber-400" : "text-muted"}`} />
                        <p className="text-[10px] font-bold text-secondary">Biometric</p>
                        <p className={`text-[10px] font-bold ${activeAdvisory.biometricRequired ? "text-amber-400" : "text-emerald-400"}`}>
                          {activeAdvisory.biometricRequired ? "Required" : "Not Required"}
                        </p>
                      </div>
                      <div className={`p-2.5 rounded-lg border text-center ${activeAdvisory.healthInsuranceRequired ? "bg-amber-500/10 border-amber-500/20" : "bg-main border-subtle"}`}>
                        <Stethoscope className={`w-4 h-4 mx-auto mb-1 ${activeAdvisory.healthInsuranceRequired ? "text-amber-400" : "text-muted"}`} />
                        <p className="text-[10px] font-bold text-secondary">Health Ins.</p>
                        <p className={`text-[10px] font-bold ${activeAdvisory.healthInsuranceRequired ? "text-amber-400" : "text-emerald-400"}`}>
                          {activeAdvisory.healthInsuranceRequired ? "Required" : "Not Required"}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg border bg-main border-subtle text-center">
                        <Banknote className="w-4 h-4 mx-auto mb-1 text-muted" />
                        <p className="text-[10px] font-bold text-secondary">Monthly Living</p>
                        <p className="text-[10px] font-bold text-primary">{activeAdvisory.estimatedMonthlyLiving || "N/A"}</p>
                      </div>
                    </div>

                    {/* Study Gap Warning */}
                    {activeAdvisory.studyGapLimitYears > 0 && (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>Study gaps exceeding {activeAdvisory.studyGapLimitYears} years may require additional justification for visa applications.</span>
                      </div>
                    )}

                    {/* Compliance Warnings */}
                    <div className="pt-4 border-t border-subtle/50 space-y-3">
                      <h4 className="text-[11px] uppercase tracking-wider font-bold text-rose-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" /> Compliance Warnings
                      </h4>
                      <ul className="space-y-2">
                        {activeAdvisory.complianceWarnings.map((warning, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-rose-300/80 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg leading-relaxed"
                          >
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ---- Study Preferences Panel ---- */}
        <div className="mt-8 bg-surface border border-subtle rounded-2xl p-6 sq-card animate-fade-in">
          <h2 className="text-lg font-bold text-primary font-heading flex items-center gap-2 mb-6">
            <Filter className="w-5 h-5 text-emerald-400" /> Study Preferences
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Budget slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">
                  Annual Budget (USD)
                </label>
                <span className="text-xs font-bold text-emerald-400">
                  ${(budgetAnnualUsd / 1000).toFixed(0)}k
                </span>
              </div>
              <input
                type="range"
                min="5000"
                max="100000"
                step="5000"
                value={budgetAnnualUsd}
                onChange={(e) => setBudgetAnnualUsd(Number(e.target.value))}
                className="w-full h-1.5 bg-elevated rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-muted">
                <span>$5k</span>
                <span>$100k</span>
              </div>
            </div>

            {/* Preferred Intake */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider">
                Preferred Intake
              </label>
              <select
                value={preferredIntake}
                onChange={(e) => setPreferredIntake(e.target.value)}
                className="w-full bg-input border border-default rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-emerald-500 sq-input"
              >
                {INTAKE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Study Mode */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider">
                Study Mode
              </label>
              <select
                value={preferredStudyMode}
                onChange={(e) => setPreferredStudyMode(e.target.value)}
                className="w-full bg-input border border-default rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-emerald-500 sq-input"
              >
                {STUDY_MODES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Scholarship Priority */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider">
                Scholarship Priority
              </label>
              <div className="flex gap-2">
                {(["High", "Medium", "Not Essential"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setScholarshipPriority(opt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer sq-pill ${
                      scholarshipPriority === opt
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-elevated text-secondary border border-subtle hover:border-default"
                    }`}
                  >
                    {opt === "High" && <Heart className="w-3 h-3 inline mr-1" />}
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Institution Type */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider">
                Institution Type
              </label>
              <div className="flex gap-2">
                {(["Any", "Public", "Private"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setInstitutionType(opt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer sq-pill ${
                      institutionType === opt
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-elevated text-secondary border border-subtle hover:border-default"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred City */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider">
                Preferred City (Optional)
              </label>
              <input
                type="text"
                value={preferredCity}
                onChange={(e) => setPreferredCity(e.target.value)}
                placeholder="e.g. London, Toronto"
                className="w-full bg-input border border-default rounded-xl px-3 py-2 text-sm text-primary placeholder-text-placeholder focus:outline-none focus:border-emerald-500 sq-input"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentOnboardingStage2;
