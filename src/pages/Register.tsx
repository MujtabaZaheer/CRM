import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { UserRole, ROLE_LABELS } from "../types/role";
import { useAuth } from "../contexts/AuthContext";
import { UserPlus, AlertCircle, User, Mail, Lock, ShieldCheck } from "lucide-react";

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("counsellor");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { loginAsDemoRole } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Create Auth Account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 2. Save User Profile in Firestore
      await setDoc(doc(db, "users", uid), {
        uid,
        email,
        displayName: displayName || email.split("@")[0],
        role,
        createdAt: Date.now(),
      });

      if (role === "team_leader") navigate("/team-leader/dashboard");
      else if (role === "counsellor") navigate("/counsellor/dashboard");
      else if (role === "admissions_officer") navigate("/admissions/dashboard");
      else if (role === "finance_officer") navigate("/finance/dashboard");
      else navigate("/");
    } catch (err: any) {
      console.warn("Registration error:", err);
      if (err?.code === "auth/api-key-not-valid" || err?.message?.includes("api-key-not-valid")) {
        // Fallback for demo mode / invalid API key environment
        loginAsDemoRole(role);
        const demoUid = `demo-${role}-${Date.now()}`;
        try {
          await setDoc(doc(db, "users", demoUid), {
            uid: demoUid,
            email,
            displayName: displayName || email.split("@")[0],
            role,
            createdAt: Date.now(),
          });
        } catch (dbErr) {
          console.warn("Firestore record save warning:", dbErr);
        }

        if (role === "team_leader") navigate("/team-leader/dashboard");
        else if (role === "counsellor") navigate("/counsellor/dashboard");
        else if (role === "admissions_officer") navigate("/admissions/dashboard");
        else if (role === "finance_officer") navigate("/finance/dashboard");
        else navigate("/");
      } else {
        setError(err.message || "Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 relative z-10 backdrop-blur-md">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center text-zinc-950 font-extrabold text-2xl mx-auto shadow-lg shadow-emerald-500/20">
            E
          </div>
          <h1 className="font-heading text-2xl font-bold text-white tracking-tight">Create Account</h1>
          <p className="text-zinc-400 text-sm">Register for EduCRM Platform Access</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@organization.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Select Role *
            </label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              >
                {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Active today: Platform Super Admin, Organization Admin, Counsellor.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? "Registering Account..." : "Create Account"}</span>
          </button>
        </form>

        <div className="text-center text-xs text-zinc-400 border-t border-zinc-800/80 pt-4">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-emerald-400 hover:text-emerald-300">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
