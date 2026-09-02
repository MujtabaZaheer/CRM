import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";
import { doc, setDoc, addDoc, collection } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import {
  UserPlus, AlertCircle, User, Mail, Lock, Phone, Globe, Flag, Eye, EyeOff,
  CheckCircle2, ShieldCheck, GraduationCap, Handshake, Building2, ArrowLeft, Briefcase,
} from "lucide-react";
import { UserRole } from "../types/role";
import { REGISTRATION_CONFIGS, SELF_REGISTERABLE_ROLES } from "../types/registrationConfig";

/* ------------------------------------------------------------------ */
/*  Password strength rules                                           */
/* ------------------------------------------------------------------ */
const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One digit", test: (p: string) => /\d/.test(p) },
  { label: "One special character", test: (p: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p) },
];

/* ------------------------------------------------------------------ */
/*  Nationality list                                                  */
/* ------------------------------------------------------------------ */
const NATIONALITIES = [
  "Afghan", "Albanian", "Algerian", "American", "Argentine", "Australian", "Bangladeshi", "Belgian",
  "Brazilian", "British", "Canadian", "Chinese", "Colombian", "Egyptian", "Emirati", "Ethiopian",
  "Filipino", "French", "German", "Ghanaian", "Greek", "Indian", "Indonesian", "Iranian", "Iraqi",
  "Irish", "Italian", "Japanese", "Jordanian", "Kenyan", "Korean", "Kuwaiti", "Lebanese", "Libyan",
  "Malaysian", "Mexican", "Moroccan", "Nepali", "Nigerian", "Norwegian", "Omani", "Pakistani",
  "Palestinian", "Polish", "Portuguese", "Qatari", "Romanian", "Russian", "Saudi", "Senegalese",
  "Singaporean", "Somali", "South African", "Spanish", "Sri Lankan", "Sudanese", "Swedish", "Swiss",
  "Syrian", "Thai", "Tunisian", "Turkish", "Ugandan", "Ukrainian", "Vietnamese", "Yemeni", "Zimbabwean",
  "Other",
];

/* ------------------------------------------------------------------ */
/*  Role icon helper                                                  */
/* ------------------------------------------------------------------ */
const ROLE_ICONS: Record<string, React.ReactNode> = {
  GraduationCap: <GraduationCap className="w-7 h-7" />,
  Handshake: <Handshake className="w-7 h-7" />,
  Building2: <Building2 className="w-7 h-7" />,
};

const ACCENT_CLASSES: Record<string, { card: string; cardHover: string; border: string; text: string; bg: string; btn: string; btnHover: string; shadow: string }> = {
  emerald: {
    card: "bg-emerald-500/5",
    cardHover: "hover:bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    btn: "bg-emerald-500",
    btnHover: "hover:bg-emerald-400",
    shadow: "shadow-emerald-500/20",
  },
  amber: {
    card: "bg-amber-500/5",
    cardHover: "hover:bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    btn: "bg-amber-500",
    btnHover: "hover:bg-amber-400",
    shadow: "shadow-amber-500/20",
  },
  indigo: {
    card: "bg-indigo-500/5",
    cardHover: "hover:bg-indigo-500/10",
    border: "border-indigo-500/30",
    text: "text-indigo-400",
    bg: "bg-indigo-500/10",
    btn: "bg-indigo-500",
    btnHover: "hover:bg-indigo-400",
    shadow: "shadow-indigo-500/20",
  },
};

/* ================================================================== */
/*  REGISTER COMPONENT                                                */
/* ================================================================== */
export const Register: React.FC = () => {
  /* ---- state ---- */
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    nationality: "",
    countryOfResidence: "",
    agencyName: "",
    universityName: "",
    position: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /* ---- password strength ---- */
  const passwordStrength = useMemo(() => {
    const passed = PASSWORD_RULES.filter((r) => r.test(formData.password)).length;
    if (passed === 0) return { level: 0, label: "", color: "" };
    if (passed <= 2) return { level: 1, label: "Weak", color: "bg-rose-500" };
    if (passed <= 3) return { level: 2, label: "Fair", color: "bg-amber-500" };
    if (passed <= 4) return { level: 3, label: "Strong", color: "bg-emerald-500" };
    return { level: 4, label: "Very Strong", color: "bg-emerald-400" };
  }, [formData.password]);

  /* ---- active config ---- */
  const activeConfig = selectedRole ? REGISTRATION_CONFIGS[selectedRole] : null;
  const accent = activeConfig ? ACCENT_CLASSES[activeConfig.accentColor] : ACCENT_CLASSES.emerald;

  /* ================================================================ */
  /*  SUBMIT HANDLER                                                  */
  /* ================================================================ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedRole || !activeConfig) {
      setError("Please select a role to continue.");
      return;
    }

    // Validate password rules
    const failedRules = PASSWORD_RULES.filter((r) => !r.test(formData.password));
    if (failedRules.length > 0) {
      setError(`Password does not meet requirements: ${failedRules.map((r) => r.label).join(", ")}`);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!consent) {
      setError("You must agree to the data processing consent to register.");
      return;
    }

    setLoading(true);
    try {
      // 1. Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const uid = userCredential.user.uid;

      // 2. Create base user profile in Firestore
      await setDoc(doc(db, "users", uid), {
        uid,
        email: formData.email.toLowerCase(),
        displayName: formData.fullName,
        role: selectedRole,
        createdAt: Date.now(),
        ...(selectedRole === "external_agent" ? { agencyName: formData.agencyName } : {}),
        ...(selectedRole === "university_partner" ? { universityName: formData.universityName } : {}),
      });

      // 3. Create role-specific profile document
      if (selectedRole === "student") {
        await setDoc(doc(db, "students", uid), {
          id: uid,
          fullName: formData.fullName,
          email: formData.email.toLowerCase(),
          phone: formData.phone,
          nationality: formData.nationality,
          countryOfResidence: formData.countryOfResidence,
          academicHistory: [],
          profileCompleteness: 30,
          consentGivenAt: Date.now(),
          consentVersion: "v1.0",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      } else if (selectedRole === "external_agent") {
        await setDoc(doc(db, "agents", uid), {
          id: uid,
          fullName: formData.fullName,
          email: formData.email.toLowerCase(),
          phone: formData.phone,
          agencyName: formData.agencyName,
          countryOfResidence: formData.countryOfResidence,
          referralCode: `REF-${uid.slice(0, 8).toUpperCase()}`,
          commissionTier: "standard",
          totalReferrals: 0,
          totalEarnings: 0,
          status: "active",
          consentGivenAt: Date.now(),
          consentVersion: "v1.0",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      } else if (selectedRole === "university_partner") {
        await setDoc(doc(db, "university_partners", uid), {
          id: uid,
          fullName: formData.fullName,
          email: formData.email.toLowerCase(),
          universityName: formData.universityName,
          position: formData.position,
          countryOfResidence: formData.countryOfResidence,
          totalApplicationsReceived: 0,
          totalOffersIssued: 0,
          status: "active",
          consentGivenAt: Date.now(),
          consentVersion: "v1.0",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      // 4. Record GDPR consent
      try {
        await addDoc(collection(db, "consent_records"), {
          userId: uid,
          userEmail: formData.email.toLowerCase(),
          userRole: selectedRole,
          consentType: "data_processing",
          version: "v1.0",
          grantedAt: Date.now(),
          ipFingerprint: typeof navigator !== "undefined" ? btoa(navigator.userAgent).slice(0, 32) : "unknown",
        });
      } catch (_) { /* consent logging is best-effort */ }

      // 5. Send email verification & sign out
      await sendEmailVerification(userCredential.user);
      await signOut(auth);

      setSuccess(true);
    } catch (err: any) {
      console.error("Registration error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Please sign in instead.");
      } else {
        setError(err.message || "Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ================================================================ */
  /*  SUCCESS SCREEN                                                  */
  /* ================================================================ */
  if (success) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl p-8 space-y-6 relative z-10 backdrop-blur-md text-center">
          <div className="w-16 h-16 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold text-white font-heading">Check Your Email</h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            We've sent a verification link to <span className="text-emerald-400 font-semibold">{formData.email}</span>.
            Please verify your email before signing in.
          </p>
          {activeConfig && (
            <div className={`p-3 rounded-xl border ${accent.border} ${accent.bg} text-xs ${accent.text} font-medium`}>
              Your <span className="font-bold">{activeConfig.label}</span> account has been created. After verifying your email you'll be redirected to your dedicated portal.
            </div>
          )}
          <Link
            to="/login"
            className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2"
          >
            <span>Continue to Sign In</span>
          </Link>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  ROLE SELECTION SCREEN                                           */
  /* ================================================================ */
  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Glows */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-2xl bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 relative z-10 backdrop-blur-md">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center text-zinc-950 font-extrabold text-2xl mx-auto shadow-lg shadow-emerald-500/20">
              E
            </div>
            <h1 className="font-heading text-2xl font-bold text-white tracking-tight">Create Your Account</h1>
            <p className="text-zinc-400 text-sm">Select your role to get started with EduCRM</p>
          </div>

          {/* Role Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {SELF_REGISTERABLE_ROLES.map((roleKey) => {
              const config = REGISTRATION_CONFIGS[roleKey];
              if (!config) return null;
              const ac = ACCENT_CLASSES[config.accentColor];
              return (
                <button
                  key={roleKey}
                  type="button"
                  onClick={() => setSelectedRole(roleKey)}
                  className={`group relative p-5 rounded-2xl border transition-all duration-200 text-left
                    ${ac.card} ${ac.cardHover} border-zinc-800 hover:${ac.border}
                    hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`}
                >
                  <div className={`w-12 h-12 rounded-xl ${ac.bg} ${ac.text} flex items-center justify-center mb-3`}>
                    {ROLE_ICONS[config.iconName]}
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{config.label}</h3>
                  <p className={`text-[11px] font-semibold ${ac.text} mb-2`}>{config.tagline}</p>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">{config.description}</p>
                  {/* Arrow indicator */}
                  <div className={`absolute top-4 right-4 w-6 h-6 rounded-full ${ac.bg} ${ac.text} flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}>
                    <span className="text-xs font-bold">→</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Info note */}
          <p className="text-[11px] text-zinc-500 text-center">
            Staff, counsellor, admissions, finance, and other internal roles are created by your organization administrator.{" "}
            <Link to="/accept-invitation" className="text-emerald-400 hover:text-emerald-300 font-semibold">
              Have an invitation?
            </Link>
          </p>

          {/* Sign in link */}
          <div className="text-center text-xs text-zinc-400 border-t border-zinc-800/80 pt-4">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-emerald-400 hover:text-emerald-300">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  REGISTRATION FORM                                               */
  /* ================================================================ */
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-5 relative z-10 backdrop-blur-md">
        {/* Back button */}
        <button
          type="button"
          onClick={() => { setSelectedRole(null); setError(null); }}
          className="flex items-center space-x-1.5 text-xs text-zinc-400 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Change role</span>
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className={`w-12 h-12 rounded-xl ${accent.bg} ${accent.text} flex items-center justify-center mx-auto shadow-lg ${accent.shadow}`}>
            {activeConfig && ROLE_ICONS[activeConfig.iconName]}
          </div>
          <h1 className="font-heading text-2xl font-bold text-white tracking-tight">
            {activeConfig?.label} Registration
          </h1>
          <p className="text-zinc-400 text-sm">{activeConfig?.tagline}</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ---- SHARED: Full Name ---- */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Full Name *</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
              <input
                type="text" required value={formData.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* ---- SHARED: Email ---- */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
              <input
                type="email" required value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="jane@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* ---- SHARED: Phone (Student + Agent) ---- */}
          {(selectedRole === "student" || selectedRole === "external_agent") && (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Phone Number *</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                <input
                  type="tel" required value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="+1 234 567 890"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* ---- STUDENT: Nationality & Country ---- */}
          {selectedRole === "student" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Nationality *</label>
                <div className="relative">
                  <Flag className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                  <select
                    required value={formData.nationality}
                    onChange={(e) => updateField("nationality", e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 appearance-none"
                  >
                    <option value="">Select...</option>
                    {NATIONALITIES.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Country of Residence *</label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                  <input
                    type="text" required value={formData.countryOfResidence}
                    onChange={(e) => updateField("countryOfResidence", e.target.value)}
                    placeholder="e.g. Pakistan"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ---- AGENT: Agency Name & Country ---- */}
          {selectedRole === "external_agent" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Agency Name *</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                  <input
                    type="text" required value={formData.agencyName}
                    onChange={(e) => updateField("agencyName", e.target.value)}
                    placeholder="e.g. Global Education Partners"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Country *</label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                  <input
                    type="text" required value={formData.countryOfResidence}
                    onChange={(e) => updateField("countryOfResidence", e.target.value)}
                    placeholder="e.g. United Kingdom"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ---- UNIVERSITY: University Name, Position, Country ---- */}
          {selectedRole === "university_partner" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">University Name *</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                    <input
                      type="text" required value={formData.universityName}
                      onChange={(e) => updateField("universityName", e.target.value)}
                      placeholder="e.g. University of Oxford"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Your Position *</label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                    <input
                      type="text" required value={formData.position}
                      onChange={(e) => updateField("position", e.target.value)}
                      placeholder="e.g. Admissions Manager"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Country *</label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                  <input
                    type="text" required value={formData.countryOfResidence}
                    onChange={(e) => updateField("countryOfResidence", e.target.value)}
                    placeholder="e.g. United Kingdom"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* ---- Password ---- */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
              <input
                type={showPassword ? "text" : "password"} required
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength meter */}
            {formData.password.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.level / 4) * 100}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-bold ${
                    passwordStrength.level <= 1 ? "text-rose-400" :
                    passwordStrength.level <= 2 ? "text-amber-400" : "text-emerald-400"
                  }`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {PASSWORD_RULES.map((rule) => (
                    <div key={rule.label} className={`text-[10px] flex items-center space-x-1 ${
                      rule.test(formData.password) ? "text-emerald-400" : "text-zinc-600"
                    }`}>
                      <span>{rule.test(formData.password) ? "✓" : "○"}</span>
                      <span>{rule.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ---- Confirm Password ---- */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Confirm Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
              <input
                type="password" required
                value={formData.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              />
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-[10px] text-rose-400 mt-1">Passwords do not match</p>
            )}
          </div>

          {/* ---- Consent ---- */}
          <div className="flex items-start space-x-2 p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
            <input
              type="checkbox" checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              id="registration-consent"
              className="mt-1 accent-emerald-500"
            />
            <label htmlFor="registration-consent" className="text-[11px] text-zinc-400 leading-relaxed">
              <ShieldCheck className="w-3 h-3 inline-block mr-1 text-emerald-400" />
              I confirm that the information provided is accurate and I consent to my data being processed for educational placement services. I understand my data will be handled in accordance with the Privacy Policy (v1.0).
            </label>
          </div>

          <button
            type="submit" disabled={loading}
            className={`w-full py-2.5 px-4 ${accent.btn} ${accent.btnHover} text-zinc-950 font-bold text-sm rounded-xl shadow-lg ${accent.shadow} transition-all flex items-center justify-center space-x-2 disabled:opacity-50`}
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? "Creating Account..." : `Create ${activeConfig?.label} Account`}</span>
          </button>
        </form>

        <div className="text-center text-xs text-zinc-400 border-t border-zinc-800/80 pt-4">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-emerald-400 hover:text-emerald-300">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
