import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { Loader2, ArrowRight, BookOpen, MapPin, Building2, Calendar } from "lucide-react";
import { db } from "../../firebase/config";
import { University } from "../../types/university";
import { DEMO_UNIVERSITIES } from "../../data/demoData";
import { StudentApplicationWizard } from "./StudentApplicationWizard";

export const StudentNewApplication: React.FC = () => {
  const [searchParams] = useSearchParams();
  const params = useParams();
  const navigate = useNavigate();

  const urlProgId = searchParams.get("programmeId") || params.programmeId || params.id;
  const urlUnivId = searchParams.get("universityId");
  const urlAppId = searchParams.get("applicationId") || (params as any)?.applicationId;

  const [loading, setLoading] = useState(true);
  const [universities, setUniversities] = useState<University[]>([]);
  
  // Selector state
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedUnivId, setSelectedUnivId] = useState<string>("");
  const [selectedCampus, setSelectedCampus] = useState<string>("");
  const [selectedProgId, setSelectedProgId] = useState<string>("");
  const [selectedIntake, setSelectedIntake] = useState<string>("");

  useEffect(() => {
    const fetchUnivs = async () => {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 3500)
        );
        const snap = await Promise.race([
          getDocs(collection(db, "universities")),
          timeoutPromise,
        ]);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as University));
        DEMO_UNIVERSITIES.forEach(demo => {
          if (!data.some(u => u.id === demo.id || u.name.toLowerCase() === demo.name.toLowerCase())) {
            data.push(demo);
          }
        });
        setUniversities(data);
        
        // If we came from the matcher with URL params, try to autofill the selector
        if (urlProgId) {
          const u = data.find(univ => (urlUnivId && univ.id === urlUnivId) || univ.programmes?.some(p => p.id === urlProgId));
          if (u) {
            setSelectedCountry(u.country);
            setSelectedUnivId(u.id);
            const p = u.programmes?.find(prog => prog.id === urlProgId);
            if (p) {
              setSelectedProgId(p.id);
              if (p.intakes?.[0]) setSelectedIntake(p.intakes[0]);
            }
          }
        }
      } catch (err) {
        console.warn("Error or timeout fetching universities, falling back to catalog:", err);
        setUniversities(DEMO_UNIVERSITIES);
        if (urlProgId) {
          const u = DEMO_UNIVERSITIES.find(univ => (urlUnivId && univ.id === urlUnivId) || univ.programmes?.some(p => p.id === urlProgId));
          if (u) {
            setSelectedCountry(u.country);
            setSelectedUnivId(u.id);
            const p = u.programmes?.find(prog => prog.id === urlProgId);
            if (p) {
              setSelectedProgId(p.id);
              if (p.intakes?.[0]) setSelectedIntake(p.intakes[0]);
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUnivs();
  }, [urlUnivId, urlProgId]);

  // Derived options based on cascading selections
  const availableCountries = Array.from(new Set(universities.map(u => u.country))).filter(Boolean).sort();
  const availableUniversities = universities.filter(u => u.country === selectedCountry).sort((a, b) => a.name.localeCompare(b.name));
  
  const currentUniv = universities.find(u => u.id === selectedUnivId);
  const availableCampuses = currentUniv ? [currentUniv.campus || currentUniv.city].filter(Boolean) as string[] : [];
  
  const availableProgrammes = currentUniv?.programmes || [];
  const currentProg = availableProgrammes.find(p => p.id === selectedProgId);
  
  const availableIntakes = currentProg?.intakes || [];

  // Reset cascading fields when parent changes
  useEffect(() => {
    setSelectedUnivId("");
  }, [selectedCountry]);

  useEffect(() => {
    setSelectedCampus("");
    setSelectedProgId("");
  }, [selectedUnivId]);

  useEffect(() => {
    setSelectedProgId("");
  }, [selectedCampus]);

  useEffect(() => {
    setSelectedIntake("");
    if (availableIntakes.length > 0 && !selectedIntake) {
      setSelectedIntake(availableIntakes[0]);
    }
  }, [selectedProgId, availableIntakes]);


  const proceedToApplication = () => {
    if (selectedUnivId && selectedProgId) {
      navigate(`/student/new-application?universityId=${selectedUnivId}&programmeId=${selectedProgId}&intake=${encodeURIComponent(selectedIntake)}`);
    }
  };

  // If programmeId or applicationId is in URL, render the Wizard
  if (urlProgId || (urlUnivId && urlProgId) || urlAppId) {
    return <StudentApplicationWizard />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-main flex items-center justify-center text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-7 pb-16 font-sans animate-fade-in">
      {/* Header */}
      <header className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border-default)] p-6 sm:p-8 text-[var(--text-primary)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Admissions Application Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[var(--text-primary)] mt-1">
            Start a New Application
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5 max-w-xl">
            Select your desired destination country, institution, and programme to initiate your direct admissions dossier.
          </p>
        </div>
      </header>

      {/* Cascading Selector Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* 1. Country */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>1. Destination Country *</span>
          </label>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl p-3 text-xs text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none cursor-pointer"
          >
            <option value="">-- Select Destination Country --</option>
            {availableCountries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* 2. University */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>2. Partner University *</span>
          </label>
          <select
            value={selectedUnivId}
            onChange={(e) => setSelectedUnivId(e.target.value)}
            disabled={!selectedCountry}
            className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl p-3 text-xs text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none disabled:opacity-40 cursor-pointer"
          >
            <option value="">-- Select Partner University --</option>
            {availableUniversities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Campus */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>3. University Campus *</span>
          </label>
          <select
            value={selectedCampus}
            onChange={(e) => setSelectedCampus(e.target.value)}
            disabled={!selectedUnivId}
            className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl p-3 text-xs text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none disabled:opacity-40 cursor-pointer"
          >
            <option value="">-- Select Campus --</option>
            {availableCampuses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Program */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>4. Academic Programme *</span>
          </label>
          <select
            value={selectedProgId}
            onChange={(e) => setSelectedProgId(e.target.value)}
            disabled={!selectedCampus && availableCampuses.length > 0}
            className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl p-3 text-xs text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none disabled:opacity-40 cursor-pointer"
          >
            <option value="">-- Select Academic Programme --</option>
            {availableProgrammes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.level})
              </option>
            ))}
          </select>
        </div>

        {/* 5. Intake */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>5. Target Intake *</span>
          </label>
          <select
            value={selectedIntake}
            onChange={(e) => setSelectedIntake(e.target.value)}
            disabled={!selectedProgId || availableIntakes.length === 0}
            className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl p-3 text-xs text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none disabled:opacity-40 cursor-pointer"
          >
            <option value="">-- Select Intake Term --</option>
            {availableIntakes.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-4 border-t border-[var(--border-default)]">
          <button
            type="button"
            onClick={proceedToApplication}
            disabled={!selectedUnivId || !selectedProgId || !selectedIntake}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 cursor-pointer text-sm"
          >
            <span>Proceed to Application Dossier</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentNewApplication;
