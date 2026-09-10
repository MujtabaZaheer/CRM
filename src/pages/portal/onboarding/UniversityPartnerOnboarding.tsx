import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../../firebase/config";
import { useAuth } from "../../../contexts/AuthContext";
import {
  User, Building2, Briefcase, BookOpen, CheckCircle2, ArrowRight, ArrowLeft,
  Shield, Loader2, GraduationCap, Calendar
} from "lucide-react";

export const UniversityPartnerOnboarding: React.FC = () => {
  const { appUser, firebaseUser } = useAuth();
  const navigate = useNavigate();
  const uid = firebaseUser?.uid || appUser?.uid || "";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 — Institution Profile
  const [fullName, setFullName] = useState(appUser?.displayName || "");
  const [universityName, setUniversityName] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [accreditation, setAccreditation] = useState("");
  const [country, setCountry] = useState("");

  // Step 2 — Partnership Setup
  const [programs, setPrograms] = useState("");
  const [intakePeriods, setIntakePeriods] = useState("");
  const [agreePartnership, setAgreePartnership] = useState(false);

  const handleStep1Submit = () => {
    if (!fullName.trim() || !universityName.trim()) {
      setError("Full name and university name are required.");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleFinishOnboarding = async () => {
    if (!agreePartnership) {
      setError("Please agree to the partnership terms.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Update user profile
      await setDoc(doc(db, "users", uid), {
        displayName: fullName.trim(),
        universityName: universityName.trim(),
        onboardingStatus: "completed",
        profileCompleted: true,
        currentStep: 2,
        onboardingCompletedAt: Date.now(),
        updatedAt: Date.now(),
      }, { merge: true });

      // Update university partner profile
      await setDoc(doc(db, "university_partners", uid), {
        id: uid,
        fullName: fullName.trim(),
        email: appUser?.email?.toLowerCase() || "",
        universityName: universityName.trim(),
        department: department.trim() || null,
        position: position.trim() || null,
        accreditation: accreditation.trim() || null,
        countryOfResidence: country.trim() || null,
        programs: programs.trim() || null,
        intakePeriods: intakePeriods.trim() || null,
        totalApplicationsReceived: 0,
        totalOffersIssued: 0,
        status: "active",
        onboardingStatus: "completed",
        profileCompleted: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }, { merge: true });

      navigate("/university/dashboard", { replace: true });
    } catch (err: any) {
      console.error("Failed to complete university partner onboarding:", err);
      setError(err.message || "Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-br from-zinc-950 via-zinc-900/50 to-zinc-950" />
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="relative z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-indigo-400 text-xs font-bold uppercase tracking-wider">
              University Partner Onboarding • Step {step} of 2
            </p>
            <h1 className="text-xl font-bold text-white mt-1">
              {step === 1 ? "Set Up Your Institution Profile" : "Partnership Setup & Confirmation"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-zinc-400">Profile Completion</p>
              <p className="text-lg font-bold text-indigo-400">{step === 1 ? "50%" : "100%"}</p>
            </div>
            <div className="w-20 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: step === 1 ? "50%" : "100%" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
            <span>⚠</span> {error}
          </div>
        )}

        {/* Step 1 — Institution Profile */}
        {step === 1 && (
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Institution Profile</h2>
                <p className="text-xs text-zinc-400">Tell us about your university and your role</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Your Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                  <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. James Wilson"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">University Name *</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                  <input type="text" required value={universityName} onChange={(e) => setUniversityName(e.target.value)}
                    placeholder="e.g. University of Oxford"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Department</label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                  <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. International Admissions"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Your Position</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                  <input type="text" value={position} onChange={(e) => setPosition(e.target.value)}
                    placeholder="e.g. Admissions Director"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Accreditation</label>
                <input type="text" value={accreditation} onChange={(e) => setAccreditation(e.target.value)}
                  placeholder="e.g. QAA, AMBA, EQUIS"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Country</label>
                <input type="text" value={country} onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. United Kingdom"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500" />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button type="button" onClick={handleStep1Submit}
                className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2">
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Partnership Setup */}
        {step === 2 && (
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Partnership Setup</h2>
                <p className="text-xs text-zinc-400">Describe the programs and intakes you manage</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Programs Offered</label>
              <textarea value={programs} onChange={(e) => setPrograms(e.target.value)} rows={3}
                placeholder="e.g. MSc Computer Science, MBA, BEng Mechanical Engineering..."
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Intake Periods</label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                <input type="text" value={intakePeriods} onChange={(e) => setIntakePeriods(e.target.value)}
                  placeholder="e.g. September 2026, January 2027"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500" />
              </div>
            </div>

            {/* Partnership Agreement */}
            <div className="flex items-start space-x-2 p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
              <input type="checkbox" checked={agreePartnership} onChange={(e) => setAgreePartnership(e.target.checked)}
                id="partner-terms" className="mt-1 accent-indigo-500" />
              <label htmlFor="partner-terms" className="text-[11px] text-zinc-400 leading-relaxed">
                <Shield className="w-3 h-3 inline-block mr-1 text-indigo-400" />
                I confirm that I am an authorized representative of {universityName || "my institution"} and agree to the EduCRM University Partnership Terms. I will process applications in a timely manner and provide accurate admission decisions. Student data will be handled in accordance with GDPR.
              </label>
            </div>

            <div className="flex justify-between pt-2">
              <button type="button" onClick={() => { setStep(1); setError(null); }}
                className="px-4 py-2.5 text-zinc-400 hover:text-white text-sm font-semibold flex items-center gap-2 transition-colors">
                <ArrowLeft className="w-4 h-4" /><span>Back</span>
              </button>
              <button type="button" onClick={handleFinishOnboarding} disabled={loading || !agreePartnership}
                className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-50">
                {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /><span>Completing...</span></>) : (<><CheckCircle2 className="w-4 h-4" /><span>Complete Onboarding & Access Dashboard</span></>)}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
