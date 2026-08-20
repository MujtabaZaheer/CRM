import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";
import { doc, setDoc, addDoc, collection } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import {
  UserPlus, AlertCircle, User, Mail, Lock, Phone, Globe, Flag, Eye, EyeOff, CheckCircle2, ShieldCheck,
} from "lucide-react";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One digit", test: (p: string) => /\d/.test(p) },
  { label: "One special character", test: (p: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p) },
];

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

export const StudentRegister: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    nationality: "",
    countryOfResidence: "",
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

  // Password strength
  const passwordStrength = useMemo(() => {
    const passed = PASSWORD_RULES.filter((r) => r.test(formData.password)).length;
    if (passed === 0) return { level: 0, label: "", color: "" };
    if (passed <= 2) return { level: 1, label: "Weak", color: "bg-rose-500" };
    if (passed <= 3) return { level: 2, label: "Fair", color: "bg-amber-500" };
    if (passed <= 4) return { level: 3, label: "Strong", color: "bg-emerald-500" };
    return { level: 4, label: "Very Strong", color: "bg-emerald-400" };
  }, [formData.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate all password rules
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
      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const uid = userCredential.user.uid;

      // Create user profile
      await setDoc(doc(db, "users", uid), {
        uid,
        email: formData.email.toLowerCase(),
        displayName: formData.fullName,
        role: "student",
        createdAt: Date.now(),
      });

      // Create student profile
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

      // Record consent
      try {
        await addDoc(collection(db, "consent_records"), {
          userId: uid,
          userEmail: formData.email.toLowerCase(),
          consentType: "data_processing",
          version: "v1.0",
          grantedAt: Date.now(),
          ipFingerprint: typeof navigator !== "undefined" ? btoa(navigator.userAgent).slice(0, 32) : "unknown",
        });
      } catch (_) { /* consent logging is best-effort */ }

      // Send email verification
      await sendEmailVerification(userCredential.user);
      await signOut(auth);

      setSuccess(true);
    } catch (err: any) {
      console.error("Student registration error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Please sign in instead.");
      } else {
        setError(err.message || "Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-5 relative z-10 backdrop-blur-md">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center text-zinc-950 font-extrabold text-2xl mx-auto shadow-lg shadow-emerald-500/20">
            E
          </div>
          <h1 className="font-heading text-2xl font-bold text-white tracking-tight">Student Registration</h1>
          <p className="text-zinc-400 text-sm">Create your student account to track applications</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
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

          {/* Email */}
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

          {/* Phone */}
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

          {/* Nationality & Country in a row */}
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

          {/* Password */}
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

          {/* Confirm Password */}
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

          {/* Consent */}
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
            className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? "Creating Account..." : "Create Student Account"}</span>
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
