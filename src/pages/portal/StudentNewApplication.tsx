import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { Loader2, ArrowRight, BookOpen, MapPin, Building2, Calendar } from "lucide-react";
import { db } from "../../firebase/config";
import { University } from "../../types/university";
import { StudentApplicationWizard } from "./StudentApplicationWizard";

export const StudentNewApplication: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlUnivId = searchParams.get("universityId");
  const urlProgId = searchParams.get("programmeId");

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
        const snap = await getDocs(collection(db, "universities"));
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as University));
        setUniversities(data);
        
        // If we came from the matcher with URL params, try to autofill the selector
        if (urlUnivId && urlProgId) {
          const u = data.find(univ => univ.id === urlUnivId);
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
        console.error("Error fetching universities", err);
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

  // If both are in URL, we just render the Wizard
  if (urlUnivId && urlProgId) {
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
    <div className="min-h-screen bg-main text-primary p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Start a New Application</h1>
          <p className="text-secondary mt-2">Select your desired university and program to begin the application process.</p>
        </div>

        <div className="bg-surface border border-default rounded-xl p-6 space-y-6">
          {/* 1. Country */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" /> Country
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full bg-input border border-default rounded-lg p-3 text-primary focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">-- Select Country --</option>
              {availableCountries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* 2. University */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-500" /> University
            </label>
            <select
              value={selectedUnivId}
              onChange={(e) => setSelectedUnivId(e.target.value)}
              disabled={!selectedCountry}
              className="w-full bg-input border border-default rounded-lg p-3 text-primary focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
            >
              <option value="">-- Select University --</option>
              {availableUniversities.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* 3. Campus */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" /> Campus
            </label>
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              disabled={!selectedUnivId}
              className="w-full bg-input border border-default rounded-lg p-3 text-primary focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
            >
              <option value="">-- Select Campus --</option>
              {availableCampuses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* 4. Program */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-500" /> Program
            </label>
            <select
              value={selectedProgId}
              onChange={(e) => setSelectedProgId(e.target.value)}
              disabled={!selectedCampus && availableCampuses.length > 0}
              className="w-full bg-input border border-default rounded-lg p-3 text-primary focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
            >
              <option value="">-- Select Program --</option>
              {availableProgrammes.map(p => (
                <option key={p.id} value={p.id}>{p.title} ({p.level})</option>
              ))}
            </select>
          </div>

          {/* 5. Intake */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" /> Intake
            </label>
            <select
              value={selectedIntake}
              onChange={(e) => setSelectedIntake(e.target.value)}
              disabled={!selectedProgId || availableIntakes.length === 0}
              className="w-full bg-input border border-default rounded-lg p-3 text-primary focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
            >
              <option value="">-- Select Intake --</option>
              {availableIntakes.map(i => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-subtle">
            <button
              onClick={proceedToApplication}
              disabled={!selectedUnivId || !selectedProgId || !selectedIntake}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Start Application <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentNewApplication;
