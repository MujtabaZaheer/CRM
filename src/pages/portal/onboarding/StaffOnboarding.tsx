import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../../firebase/config";
import { useAuth } from "../../../contexts/AuthContext";
import { ROLE_LABELS } from "../../../types/role";
import { getRoleDashboardPath } from "../../../types/registrationConfig";
import {
  User, Phone, Briefcase, BookOpen, CheckCircle2, ArrowRight, ArrowLeft,
  Shield, Loader2
} from "lucide-react";

export const StaffOnboarding: React.FC = () => {
  const { appUser, firebaseUser } = useAuth();
  const navigate = useNavigate();
  const uid = firebaseUser?.uid || appUser?.uid || "";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 — Professional Profile
  const [fullName, setFullName] = useState(appUser?.displayName || "");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [bio, setBio] = useState("");

  // Step 2 — Confirmation
  const [agreeConduct, setAgreeConduct] = useState(false);
  const [notifPreference, setNotifPreference] = useState<"all" | "important" | "none">("all");

  const roleLabel = appUser?.role ? ROLE_LABELS[appUser.role] : "Staff";
  const dashboardPath = appUser?.role ? getRoleDashboardPath(appUser.role) : "/";

  const handleStep1Submit = () => {
    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleFinishOnboarding = async () => {
    if (!agreeConduct) {
      setError("Please agree to the staff code of conduct.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Update user profile in Firestore
      await setDoc(doc(db, "users", uid), {
        displayName: fullName.trim(),
        phone: phone.trim() || null,
        department: department.trim() || null,
        yearsExperience: yearsExperience ? parseInt(yearsExperience) : null,
        bio: bio.trim() || null,
        notificationPreference: notifPreference,
        onboardingStatus: "completed",
        profileCompleted: true,
        currentStep: 2,
        onboardingCompletedAt: Date.now(),
        updatedAt: Date.now(),
      }, { merge: true });

      navigate(dashboardPath, { replace: true });
    } catch (err: any) {
      console.error("Failed to complete staff onboarding:", err);
      setError(err.message || "Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-br from-zinc-950 via-zinc-900/50 to-zinc-950" />
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="relative z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider">
              Staff Onboarding • Step {step} of 2
            </p>
            <h1 className="text-xl font-bold text-white mt-1">
              {step === 1 ? "Set Up Your Professional Profile" : "Confirm & Get Started"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-zinc-400">Profile Completion</p>
              <p className="text-lg font-bold text-emerald-400">{step === 1 ? "50%" : "100%"}</p>
            </div>
            <div className="w-20 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
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

        {/* Step 1 — Professional Profile */}
        {step === 1 && (
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Professional Profile</h2>
                <p className="text-xs text-zinc-400">
                  Your role: <span className="text-emerald-400 font-semibold">{roleLabel}</span>
                  {appUser?.office && <> • Office: <span className="text-emerald-400 font-semibold">{appUser.office}</span></>}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 234 567 890"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Department / Specialization</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Student Recruitment"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Years of Experience</label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Professional Bio (Optional)</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Brief description of your background and expertise..."
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 resize-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleStep1Submit}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Confirmation & Preferences */}
        {step === 2 && (
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Confirm & Get Started</h2>
                <p className="text-xs text-zinc-400">Review your profile and agree to the staff code of conduct</p>
              </div>
            </div>

            {/* Profile Summary */}
            <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Your Profile Summary</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500">Name:</span>
                  <span className="text-zinc-200 ml-2 font-semibold">{fullName}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Role:</span>
                  <span className="text-emerald-400 ml-2 font-semibold">{roleLabel}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Email:</span>
                  <span className="text-zinc-200 ml-2 font-semibold">{appUser?.email}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Office:</span>
                  <span className="text-zinc-200 ml-2 font-semibold">{appUser?.office || "Main Office"}</span>
                </div>
                {phone && (
                  <div>
                    <span className="text-zinc-500">Phone:</span>
                    <span className="text-zinc-200 ml-2 font-semibold">{phone}</span>
                  </div>
                )}
                {department && (
                  <div>
                    <span className="text-zinc-500">Department:</span>
                    <span className="text-zinc-200 ml-2 font-semibold">{department}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notification Preferences */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Notification Preferences</label>
              <div className="flex gap-3">
                {(["all", "important", "none"] as const).map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => setNotifPreference(pref)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      notifPreference === pref
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    {pref === "all" ? "All Notifications" : pref === "important" ? "Important Only" : "None"}
                  </button>
                ))}
              </div>
            </div>

            {/* Code of Conduct */}
            <div className="flex items-start space-x-2 p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
              <input
                type="checkbox"
                checked={agreeConduct}
                onChange={(e) => setAgreeConduct(e.target.checked)}
                id="staff-conduct"
                className="mt-1 accent-emerald-500"
              />
              <label htmlFor="staff-conduct" className="text-[11px] text-zinc-400 leading-relaxed">
                <Shield className="w-3 h-3 inline-block mr-1 text-emerald-400" />
                I agree to the EduCRM Staff Code of Conduct. I will maintain professionalism, protect student data in accordance with GDPR, and use the platform responsibly. I understand my role responsibilities and will follow organizational protocols.
              </label>
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => { setStep(1); setError(null); }}
                className="px-4 py-2.5 text-zinc-400 hover:text-white text-sm font-semibold flex items-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleFinishOnboarding}
                disabled={loading || !agreeConduct}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Completing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Onboarding & Access Dashboard</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
