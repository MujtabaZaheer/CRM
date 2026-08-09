import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";
import { LogIn, AlertCircle, Sparkles, Lock, Mail } from "lucide-react";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err: any) {
      console.error("Login error:", err);
<<<<<<< HEAD
      if (err?.code === "auth/api-key-not-valid" || err?.message?.includes("api-key-not-valid")) {
        // Fall back to demo login for local testing / demo mode
        let inferredRole: UserRole = "platform_super_admin";
        if (email.toLowerCase().includes("admissions")) inferredRole = "admissions_officer";
        else if (email.toLowerCase().includes("finance")) inferredRole = "finance_officer";
        else if (email.toLowerCase().includes("support")) inferredRole = "support_user";
        else if (email.toLowerCase().includes("audit")) inferredRole = "auditor";
        else if (email.toLowerCase().includes("team")) inferredRole = "team_leader";
        else if (email.toLowerCase().includes("counsellor")) inferredRole = "counsellor";

        handleQuickDemoLogin(inferredRole);
      } else {
        setError(err.message || "Failed to sign in. Please check your credentials.");
      }
=======
      setError(err.message || "Failed to sign in. Please check your credentials.");
>>>>>>> a1ca141 (Implement Visa Officer Student and Support modules)
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  const handleQuickDemoLogin = (role: UserRole) => {
    loginAsDemoRole(role);
    if (role === "team_leader") {
      navigate("/team-leader/dashboard");
    } else if (role === "counsellor") {
      navigate("/counsellor/dashboard");
    } else if (role === "admissions_officer") {
      navigate("/admissions/dashboard");
    } else if (role === "finance_officer") {
      navigate("/finance/dashboard");
    } else if (role === "support_user") {
      navigate("/support/dashboard");
    } else if (role === "auditor" || role === "compliance_officer") {
      navigate("/auditor/dashboard");
    } else if (role === "platform_super_admin") {
      navigate("/super-admin/dashboard");
    } else {
      navigate("/");
    }
  };

=======
>>>>>>> a1ca141 (Implement Visa Officer Student and Support modules)
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 relative z-10 backdrop-blur-md">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center text-zinc-950 font-extrabold text-2xl mx-auto shadow-lg shadow-emerald-500/20">
            E
          </div>
          <h1 className="font-heading text-2xl font-bold text-white tracking-tight">
            Sign in to EduCRM
          </h1>
          <p className="text-zinc-400 text-sm">Enterprise Education Management Platform</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

<<<<<<< HEAD
        {/* Quick Local Demo Login Buttons */}
        <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-3">
          <div className="text-xs font-semibold text-emerald-400 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Local Dev / Quick Demo Login:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickDemoLogin("counsellor")}
              className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg font-bold flex items-center justify-center space-x-1.5 transition-colors"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Counsellor</span>
            </button>
            <button
              onClick={() => handleQuickDemoLogin("team_leader")}
              className="px-3 py-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 rounded-lg font-bold flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Users2 className="w-3.5 h-3.5" />
              <span>Team Leader</span>
            </button>
            <button
              onClick={() => handleQuickDemoLogin("admissions_officer")}
              className="px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg font-bold flex items-center justify-center space-x-1.5 transition-colors"
            >
              <span>Admissions</span>
            </button>
            <button
              onClick={() => handleQuickDemoLogin("finance_officer")}
              className="px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-lg font-bold flex items-center justify-center space-x-1.5 transition-colors"
            >
              <span>Finance</span>
            </button>
            <button
              onClick={() => handleQuickDemoLogin("platform_super_admin")}
              className="px-3 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 rounded-lg font-bold flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Super Admin</span>
            </button>
            <button
              onClick={() => handleQuickDemoLogin("support_user")}
              className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg font-bold flex items-center justify-center space-x-1.5 transition-colors"
            >
              <span>Support User</span>
            </button>
            <button
              onClick={() => handleQuickDemoLogin("auditor")}
              className="px-3 py-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 rounded-lg font-bold flex items-center justify-center space-x-1.5 transition-colors"
            >
              <span>Auditor</span>
            </button>
            <button
              onClick={() => handleQuickDemoLogin("org_admin")}
              className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg font-bold flex items-center justify-center space-x-1.5 transition-colors"
            >
              <span>Org Admin</span>
            </button>
          </div>
        </div>

=======
>>>>>>> a1ca141 (Implement Visa Officer Student and Support modules)
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Email Address
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
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? "Authenticating..." : "Sign In"}</span>
          </button>
        </form>

        <div className="text-center text-xs text-zinc-400 border-t border-zinc-800/80 pt-4 flex items-center justify-between">
          <span>Need an account?</span>
          <Link to="/register" className="font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1">
            <Sparkles className="w-3 h-3" />
            <span>Register Here</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
