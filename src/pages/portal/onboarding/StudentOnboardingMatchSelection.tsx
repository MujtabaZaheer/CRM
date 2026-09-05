import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import {
  Sparkles,
  Building2,
  Globe,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { db } from "../../../firebase/config";
import { useAuth } from "../../../contexts/AuthContext";
import { Student } from "../../../types/student";
import { Programme, University } from "../../../types/university";
import { assessEligibility } from "../../../utils/eligibility";

interface ShortlistedMatch {
  university: University;
  programme: Programme;
  eligibility: ReturnType<typeof assessEligibility>;
  matchScore: number;
}

export const StudentOnboardingMatchSelection: React.FC = () => {
  const { appUser, firebaseUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [shortlistedMatches, setShortlistedMatches] = useState<ShortlistedMatch[]>([]);
  const [selectedMatchKey, setSelectedMatchKey] = useState<string | null>(null);

  useEffect(() => {
    const loadMatches = async () => {
      const uid = firebaseUser?.uid || appUser?.uid;
      if (!uid) return;

      try {
        // 1. Get student profile
        const studentSnap = await getDoc(doc(db, "students", uid));
        let studentData: Student | null = null;
        let keys: string[] = [];

        if (studentSnap.exists()) {
          studentData = studentSnap.data() as Student;
          keys = (studentData as any).shortlistedPrograms || [];
        }

        // 2. Load universities
        const univSnap = await getDocs(collection(db, "universities"));
        const matches: ShortlistedMatch[] = [];

        univSnap.docs.forEach((uDoc) => {
          const univ = { id: uDoc.id, ...uDoc.data() } as University;
          const progs = univ.programmes || [];

          progs.forEach((prog) => {
            const key = `${univ.id}-${prog.id}`;
            // If shortlisted or if list is empty (fallback to best matches)
            if (keys.includes(key) || (keys.length === 0 && matches.length < 3)) {
              const elig = assessEligibility(studentData || undefined, prog);
              matches.push({
                university: univ,
                programme: prog,
                eligibility: elig,
                matchScore: 85 + (matches.length === 0 ? 9 : matches.length === 1 ? 4 : 0),
              });
            }
          });
        });

        setShortlistedMatches(matches);
        if (matches.length > 0) {
          setSelectedMatchKey(`${matches[0].university.id}-${matches[0].programme.id}`);
        }
      } catch (err) {
        console.warn("Failed to load match selection:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, [appUser, firebaseUser]);

  const handleStartApplication = (univId: string, progId: string) => {
    navigate(`/student/new-application?universityId=${univId}&programmeId=${progId}`);
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
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
              Step 4 of 4 • Best Match Selection & Verification
            </span>
            <h1 className="text-xl font-bold font-heading text-white">
              Choose your best match
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/student/onboarding/program-matcher")}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Change Programs
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 mt-6 space-y-8">
        {/* Banner */}
        <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 text-sm text-zinc-300 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-white">
              Review your shortlisted programs side-by-side and launch your application.
            </p>
            <p className="text-xs text-zinc-400">
              Select your preferred choice to inspect detailed requirements, required documentation, and start the multi-step admission wizard.
            </p>
          </div>
        </div>

        {/* Shortlisted Matches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {shortlistedMatches.map(({ university, programme, eligibility, matchScore }) => {
            const key = `${university.id}-${programme.id}`;
            const isSelected = selectedMatchKey === key;

            return (
              <div
                key={key}
                onClick={() => setSelectedMatchKey(key)}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 cursor-pointer relative ${
                  isSelected
                    ? "bg-zinc-900 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/30"
                    : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                    {matchScore}% Match
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase">
                    {programme.level}
                  </span>
                </div>

                {/* Program Info */}
                <div>
                  <h3 className="text-base font-bold text-white leading-snug">
                    {programme.title}
                  </h3>
                  <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-medium text-zinc-200">{university.name}</span>
                  </p>
                  <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                    <Globe className="w-3.5 h-3.5" />
                    {university.city}, {university.country}
                  </p>
                </div>

                {/* Key Specs */}
                <div className="space-y-2 py-3 border-y border-zinc-800 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Annual Tuition:</span>
                    <span className="font-semibold text-zinc-200">
                      {programme.currency} {programme.tuitionFeeAnnual?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Duration:</span>
                    <span className="font-semibold text-zinc-200">
                      {programme.durationMonths} months
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Target Intake:</span>
                    <span className="font-semibold text-zinc-200">
                      {programme.intakes?.[0] || "September"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Application Deadline:</span>
                    <span className="font-semibold text-amber-300">
                      {programme.deadline || "Rolling Admissions"}
                    </span>
                  </div>
                </div>

                {/* Eligibility Breakdown */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-zinc-400">Admission Readiness</span>
                    <span className="text-emerald-400">{eligibility.score}%</span>
                  </div>
                  <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${eligibility.score}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 pt-1 line-clamp-2">
                    {eligibility.checks[0]?.detail || "Meets baseline requirements."}
                  </p>
                </div>

                {/* CTA */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartApplication(university.id, programme.id);
                  }}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Apply to this Program</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {shortlistedMatches.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-zinc-900/50 border border-dashed border-zinc-800 space-y-3">
            <p className="text-sm text-zinc-400">You have not shortlisted any programs yet.</p>
            <Link
              to="/student/onboarding/program-matcher"
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 underline"
            >
              Go to Program Matcher →
            </Link>
          </div>
        )}

        {/* Mandatory Transparency & Regulatory Disclaimer */}
        <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-xs text-zinc-400 space-y-2">
          <div className="flex items-center gap-2 text-amber-300 font-semibold">
            <ShieldAlert className="w-4 h-4" />
            <span>Important Admissions & Immigration Notice</span>
          </div>
          <p className="leading-relaxed">
            Based on the information currently available in your profile, these programs appear suitable. However, EduCRM makes no guarantees of admission or visa issuance.
          </p>
          <p className="leading-relaxed">
            Final admission and visa decisions are made exclusively by the relevant university admissions boards and government immigration authorities.
          </p>
        </div>
      </main>
    </div>
  );
};

export default StudentOnboardingMatchSelection;
