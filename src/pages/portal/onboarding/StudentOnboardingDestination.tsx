import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import {
  Globe,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { db } from "../../../firebase/config";
import { useAuth } from "../../../contexts/AuthContext";
import { Student } from "../../../types/student";

interface DestinationCountry {
  id: string;
  name: string;
  code: string;
  flag: string;
  currency: string;
  averageTuition: string;
  popularIntakes: string[];
}

const DEFAULT_DESTINATIONS: DestinationCountry[] = [
  { id: "uk", name: "United Kingdom", code: "UK", flag: "🇬🇧", currency: "GBP", averageTuition: "£14,000 - £28,000", popularIntakes: ["September", "January"] },
  { id: "ca", name: "Canada", code: "CA", flag: "🇨🇦", currency: "CAD", averageTuition: "CAD 18,000 - 35,000", popularIntakes: ["September", "January", "May"] },
  { id: "au", name: "Australia", code: "AU", flag: "🇦🇦", currency: "AUD", averageTuition: "AUD 22,000 - 42,000", popularIntakes: ["February", "July"] },
  { id: "us", name: "United States", code: "US", flag: "🇺🇸", currency: "USD", averageTuition: "$20,000 - $45,000", popularIntakes: ["Fall (Aug)", "Spring (Jan)"] },
  { id: "de", name: "Germany", code: "DE", flag: "🇩🇪", currency: "EUR", averageTuition: "€0 - €16,000 (Low/No Tuition)", popularIntakes: ["Winter (Oct)", "Summer (Apr)"] },
  { id: "ie", name: "Ireland", code: "IE", flag: "🇮🇪", currency: "EUR", averageTuition: "€11,000 - €25,000", popularIntakes: ["September", "January"] },
  { id: "nz", name: "New Zealand", code: "NZ", flag: "🇳🇿", currency: "NZD", averageTuition: "NZD 24,000 - 38,000", popularIntakes: ["February", "July"] },
  { id: "ae", name: "United Arab Emirates", code: "AE", flag: "🇦🇪", currency: "AED", averageTuition: "AED 40,000 - 80,000", popularIntakes: ["September", "January"] },
];

const INTAKES = [
  "Fall 2026 (Aug - Oct)",
  "Spring 2027 (Jan - Mar)",
  "Summer 2027 (May - Jul)",
  "Fall 2027 (Aug - Oct)",
];

const STUDY_MODES = [
  "On-Campus (Full-Time)",
  "Hybrid / Blended",
  "Online Learning",
];

export const StudentOnboardingDestination: React.FC = () => {
  const { appUser, firebaseUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available countries (fetched from Firestore universities or defaults)
  const [availableDestinations, setAvailableDestinations] = useState<DestinationCountry[]>(DEFAULT_DESTINATIONS);

  // Preferences State
  const [selectedCountries, setSelectedCountries] = useState<string[]>(["United Kingdom"]);
  const [budgetAnnualUsd, setBudgetAnnualUsd] = useState(25000);
  const [preferredIntake, setPreferredIntake] = useState("Fall 2026 (Aug - Oct)");
  const [preferredStudyMode, setPreferredStudyMode] = useState("On-Campus (Full-Time)");
  const [preferredCity, setPreferredCity] = useState("");
  const [scholarshipPriority, setScholarshipPriority] = useState<"High" | "Medium" | "Not Essential">("Medium");
  const [institutionType, setInstitutionType] = useState<"Any" | "Public" | "Private">("Any");

  // Load current student preferences from Firestore
  useEffect(() => {
    const loadPreferences = async () => {
      const uid = firebaseUser?.uid || appUser?.uid;
      if (!uid) return;

      try {
        // 1. Fetch available countries dynamically from Firestore universities
        try {
          const univSnap = await getDocs(collection(db, "universities"));
          if (!univSnap.empty) {
            const dbCountries = new Set<string>();
            univSnap.docs.forEach((doc) => {
              const data = doc.data();
              if (data.country) dbCountries.add(data.country);
            });

            if (dbCountries.size > 0) {
              const combined = DEFAULT_DESTINATIONS.map((d) => d);
              dbCountries.forEach((c) => {
                if (!combined.some((item) => item.name.toLowerCase() === c.toLowerCase())) {
                  combined.push({
                    id: c.toLowerCase().replace(/\s+/g, "_"),
                    name: c,
                    code: c.slice(0, 2).toUpperCase(),
                    flag: "🌐",
                    currency: "USD",
                    averageTuition: "Varies",
                    popularIntakes: ["September", "January"],
                  });
                }
              });
              setAvailableDestinations(combined);
            }
          }
        } catch (_) {}

        // 2. Load student document
        const snap = await getDoc(doc(db, "students", uid));
        if (snap.exists()) {
          const data = snap.data() as Student & Record<string, any>;
          if (data.preferredDestinations && Array.isArray(data.preferredDestinations) && data.preferredDestinations.length > 0) {
            setSelectedCountries(data.preferredDestinations);
          } else if (data.preferredDestination) {
            setSelectedCountries([data.preferredDestination]);
          }

          if (data.budgetAnnualUsd) setBudgetAnnualUsd(data.budgetAnnualUsd);
          if (data.preferredIntake) setPreferredIntake(data.preferredIntake);
          if (data.preferredStudyMode) setPreferredStudyMode(data.preferredStudyMode);
          if (data.preferredCity) setPreferredCity(data.preferredCity);
          if (data.scholarshipPriority) setScholarshipPriority(data.scholarshipPriority);
          if (data.institutionType) setInstitutionType(data.institutionType);
        }
      } catch (err: any) {
        console.warn("Error loading student preferences:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [appUser, firebaseUser]);

  const toggleCountry = (countryName: string) => {
    setSelectedCountries((prev) => {
      if (prev.includes(countryName)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        return prev.filter((c) => c !== countryName);
      } else {
        return [...prev, countryName];
      }
    });
  };

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
      onboardingStep: 2,
      updatedAt: Date.now(),
    };

    try {
      await setDoc(doc(db, "students", uid), payload, { merge: true });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);

      if (isProceeding) {
        navigate("/student/onboarding/program-matcher");
      }
    } catch (err: any) {
      console.error("Failed to save preferences:", err);
      setError(err.message || "Could not save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

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
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
              Step 2 of 4 • Study Destination & Preferences
            </span>
            <h1 className="text-xl font-bold font-heading text-white">
              Where do you want to study?
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/student/onboarding/profile")}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
            <button
              type="button"
              onClick={() => savePreferences(false)}
              disabled={saving}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : saveSuccess ? "Saved ✓" : "Save"}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 mt-6 space-y-8">
        {/* Banner */}
        <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 text-sm text-zinc-300 flex items-start gap-3">
          <Globe className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-white">
              Choose your preferred destinations. We'll compare universities and programs across countries.
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Select one or multiple destination countries. In the next step, our Program Matcher will evaluate real admissions requirements and fee ranges across your selections.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Destination Countries Grid */}
        <section className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-white font-heading">Target Study Countries (Multi-Select)</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Click to select or deselect countries you wish to explore.</p>
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              {selectedCountries.length} Selected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {availableDestinations.map((country) => {
              const selected = selectedCountries.includes(country.name);
              return (
                <div
                  key={country.id}
                  onClick={() => toggleCountry(country.name)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer select-none space-y-2 relative ${
                    selected
                      ? "bg-emerald-500/10 border-emerald-500/50 shadow-md shadow-emerald-500/5"
                      : "bg-zinc-950/70 border-zinc-800 hover:border-zinc-700 text-zinc-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{country.flag}</span>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        selected
                          ? "bg-emerald-500 border-emerald-500 text-zinc-950"
                          : "border-zinc-700 bg-zinc-900"
                      }`}
                    >
                      {selected && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  <div>
                    <h3 className={`text-sm font-bold ${selected ? "text-white" : "text-zinc-200"}`}>
                      {country.name}
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Est. Tuition: {country.averageTuition}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Budget & Preferences */}
        <section className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-800">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white font-heading">Budget & Admission Preferences</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Annual Tuition Budget */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-300">
                Annual Tuition Budget (USD Equivalent)
              </label>
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-sm font-bold text-emerald-400">
                  <span>${budgetAnnualUsd.toLocaleString()}</span>
                  <span className="text-xs text-zinc-400 font-normal">per academic year</span>
                </div>
                <input
                  type="range"
                  min={5000}
                  max={60000}
                  step={2500}
                  value={budgetAnnualUsd}
                  onChange={(e) => setBudgetAnnualUsd(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500">
                  <span>$5,000</span>
                  <span>$30,000</span>
                  <span>$60,000+</span>
                </div>
              </div>
            </div>

            {/* Preferred Intake */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-300">
                Target Academic Intake
              </label>
              <select
                value={preferredIntake}
                onChange={(e) => setPreferredIntake(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {INTAKES.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>

            {/* Study Mode */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-300">
                Preferred Study Mode
              </label>
              <select
                value={preferredStudyMode}
                onChange={(e) => setPreferredStudyMode(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {STUDY_MODES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Preferred City */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-300">
                Preferred City / Region (Optional)
              </label>
              <input
                type="text"
                value={preferredCity}
                onChange={(e) => setPreferredCity(e.target.value)}
                placeholder="e.g. London, Toronto, Sydney, or Munich"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Scholarship Priority */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-300">
                Scholarship Requirement
              </label>
              <select
                value={scholarshipPriority}
                onChange={(e) => setScholarshipPriority(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="High">Essential (Requires funding / scholarship)</option>
                <option value="Medium">Preferred if available (Partial funding)</option>
                <option value="Not Essential">Self-funded (Not essential)</option>
              </select>
            </div>

            {/* Institution Type */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-300">
                Institution Type Preference
              </label>
              <select
                value={institutionType}
                onChange={(e) => setInstitutionType(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Any">Any Recognized University</option>
                <option value="Public">Public / State Universities</option>
                <option value="Private">Private / Specialist Institutions</option>
              </select>
            </div>
          </div>
        </section>

        {/* Legal & Regulatory Disclaimer */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 text-xs text-zinc-400 space-y-1">
          <p className="font-semibold text-zinc-300 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            Admissions & Immigration Notice
          </p>
          <p>
            EduCRM provides academic guidance, program comparisons, and application readiness evaluations. We do not make immigration or visa guarantees. Final admission decisions and student visa grants are strictly governed by university admissions boards and national immigration authorities.
          </p>
        </div>

        {/* Bottom Navigation Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800">
          <div className="text-xs text-zinc-400">
            Step 2 of 4 • Next: Program Matcher across Selected Countries
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate("/student/onboarding/profile")}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold text-zinc-200 transition-colors cursor-pointer"
            >
              Previous Step
            </button>

            <button
              type="button"
              onClick={() => savePreferences(true)}
              disabled={saving || selectedCountries.length === 0}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Continue to Program Matcher</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentOnboardingDestination;
