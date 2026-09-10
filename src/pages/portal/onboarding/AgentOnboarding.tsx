import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../../firebase/config";
import { useAuth } from "../../../contexts/AuthContext";
import {
  User, Phone, Building2, Globe, CreditCard, CheckCircle2, ArrowRight, ArrowLeft,
  Shield, Loader2, Handshake, Hash
} from "lucide-react";

export const AgentOnboarding: React.FC = () => {
  const { appUser, firebaseUser } = useAuth();
  const navigate = useNavigate();
  const uid = firebaseUser?.uid || appUser?.uid || "";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 — Agency Profile
  const [fullName, setFullName] = useState(appUser?.displayName || "");
  const [phone, setPhone] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [operatingCountries, setOperatingCountries] = useState("");
  const [countryOfResidence, setCountryOfResidence] = useState("");

  // Step 2 — Agreement
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  const handleStep1Submit = () => {
    if (!fullName.trim() || !agencyName.trim()) {
      setError("Full name and agency name are required.");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleFinishOnboarding = async () => {
    if (!agreeTerms) {
      setError("Please agree to the commission agreement terms.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Update user profile
      await setDoc(doc(db, "users", uid), {
        displayName: fullName.trim(),
        phone: phone.trim() || null,
        agencyName: agencyName.trim(),
        onboardingStatus: "completed",
        profileCompleted: true,
        currentStep: 2,
        onboardingCompletedAt: Date.now(),
        updatedAt: Date.now(),
      }, { merge: true });

      // Update agent profile
      await setDoc(doc(db, "agents", uid), {
        id: uid,
        fullName: fullName.trim(),
        email: appUser?.email?.toLowerCase() || "",
        phone: phone.trim() || null,
        agencyName: agencyName.trim(),
        registrationNumber: registrationNumber.trim() || null,
        operatingCountries: operatingCountries.trim() || null,
        countryOfResidence: countryOfResidence.trim() || null,
        bankName: bankName.trim() || null,
        accountHolder: accountHolder.trim() || null,
        referralCode: `REF-${uid.slice(0, 8).toUpperCase()}`,
        commissionTier: "standard",
        totalReferrals: 0,
        totalEarnings: 0,
        status: "active",
        onboardingStatus: "completed",
        profileCompleted: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }, { merge: true });

      navigate("/agent/dashboard", { replace: true });
    } catch (err: any) {
      console.error("Failed to complete agent onboarding:", err);
      setError(err.message || "Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-br from-zinc-950 via-zinc-900/50 to-zinc-950" />
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -left-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="relative z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">
              Agent Onboarding • Step {step} of 2
            </p>
            <h1 className="text-xl font-bold text-white mt-1">
              {step === 1 ? "Set Up Your Agency Profile" : "Commission Agreement & Setup"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-zinc-400">Profile Completion</p>
              <p className="text-lg font-bold text-amber-400">{step === 1 ? "50%" : "100%"}</p>
            </div>
            <div className="w-20 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
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

        {/* Step 1 — Agency Profile */}
        {step === 1 && (
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Handshake className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Agency Profile</h2>
                <p className="text-xs text-zinc-400">Tell us about your recruitment agency</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                  <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Smith"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Agency Name *</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                  <input type="text" required value={agencyName} onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="e.g. Global Education Partners"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 234 567 890"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Agency Registration Number</label>
                <div className="relative">
                  <Hash className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                  <input type="text" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="e.g. BR-2024-12345"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Operating Countries</label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                  <input type="text" value={operatingCountries} onChange={(e) => setOperatingCountries(e.target.value)}
                    placeholder="e.g. Pakistan, India, UAE"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Country of Residence</label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                  <input type="text" value={countryOfResidence} onChange={(e) => setCountryOfResidence(e.target.value)}
                    placeholder="e.g. United Kingdom"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500" />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button type="button" onClick={handleStep1Submit}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2">
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Agreement */}
        {step === 2 && (
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Commission Agreement & Payout Details</h2>
                <p className="text-xs text-zinc-400">Optional payout details — can be updated later</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Bank / Financial Institution</label>
                <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. HSBC, Standard Chartered"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Account Holder Name</label>
                <input type="text" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="e.g. Global Education Partners Ltd"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500" />
              </div>
            </div>

            {/* Agreement */}
            <div className="flex items-start space-x-2 p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
              <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)}
                id="agent-terms" className="mt-1 accent-amber-500" />
              <label htmlFor="agent-terms" className="text-[11px] text-zinc-400 leading-relaxed">
                <Shield className="w-3 h-3 inline-block mr-1 text-amber-400" />
                I agree to the EduCRM Agent Commission Agreement. I understand the referral commission structure, payout terms, and agree to operate within the platform's referral guidelines. I will ensure all student referrals are made with proper consent.
              </label>
            </div>

            <div className="flex justify-between pt-2">
              <button type="button" onClick={() => { setStep(1); setError(null); }}
                className="px-4 py-2.5 text-zinc-400 hover:text-white text-sm font-semibold flex items-center gap-2 transition-colors">
                <ArrowLeft className="w-4 h-4" /><span>Back</span>
              </button>
              <button type="button" onClick={handleFinishOnboarding} disabled={loading || !agreeTerms}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50">
                {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /><span>Completing...</span></>) : (<><CheckCircle2 className="w-4 h-4" /><span>Complete Onboarding & Access Dashboard</span></>)}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
