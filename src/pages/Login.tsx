import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db, isDemoMode, requiresVerifiedEmail } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { UserRole } from "../types/role";
import { EXACT_DEMO_ROLE_MAP, isKnownDemoEmail } from "../utils/demoAccounts";
import { mapFirebaseAuthError } from "../utils/firebaseAuthErrors";
import { getRoleDashboardPath } from "../types/registrationConfig";
import { LogIn, AlertCircle, Sparkles, Lock, Mail, GraduationCap, Shield, UserPlus, ChevronUp, ChevronDown, X } from "lucide-react";
import { bootstrapAdminAccounts } from "../utils/bootstrapAdmins";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { loginAsDemoRole } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  // Bootstrap admin accounts on first load (idempotent)
  useEffect(() => {
    bootstrapAdminAccounts().catch(() => {});
  }, []);

  const handleQuickDemoLogin = (role: UserRole, options?: { isRegisteredStudent?: boolean }) => {
    if (!isDemoMode) return;
    try {
      sessionStorage.setItem("demo_email_verified", "true");
    } catch (_) {}
    loginAsDemoRole(role, options);
    if (role === "student") {
      if (options?.isRegisteredStudent) {
        navigate("/student/dashboard");
      } else {
        navigate("/student/onboarding/step-1");
      }
      return;
    }
    navigate(getRoleDashboardPath(role));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      if (resetMode) {
        try {
          await sendPasswordResetEmail(auth, email);
          setNotice("If an account exists for this email address, a password-reset link has been sent.");
        } catch (resetErr: any) {
          if (isDemoMode && isKnownDemoEmail(email)) {
            setNotice(`Demo Mode: Password reset email simulated for ${email.trim()}`);
          } else {
            throw resetErr;
          }
        }
        return;
      }

      const lowerEmail = email.toLowerCase().trim();
      const demoRole = isDemoMode ? EXACT_DEMO_ROLE_MAP[lowerEmail] || null : null;
      if (demoRole) {
        handleQuickDemoLogin(demoRole, {
          isRegisteredStudent: demoRole === "student" && lowerEmail !== "student@educrm.demo",
        });
        return;
      }

      // Production and normal local accounts always use Firebase Auth.
      try {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const normalizedEmail = (credential.user.email || email).toLowerCase().trim();

        // Pre-fetch role from Firestore to route non-students directly and skip student-only checks
        let userRole: UserRole | null = null;
        try {
          const userDocSnap = await getDoc(doc(db, "users", credential.user.uid));
          if (userDocSnap.exists()) {
            userRole = userDocSnap.data()?.role;
          } else {
            // Check by email in users
            const usersQ = query(collection(db, "users"), where("email", "==", normalizedEmail));
            const usersSnap = await getDocs(usersQ);
            if (!usersSnap.empty) {
              userRole = usersSnap.docs[0].data()?.role;
            } else {
              // Check invitations
              const invQ = query(collection(db, "invitations"), where("email", "==", normalizedEmail));
              const invSnap = await getDocs(invQ);
              if (!invSnap.empty) {
                userRole = invSnap.docs[0].data()?.role;
              }
            }
          }
        } catch (roleErr) {
          console.warn("Could not pre-fetch role on login:", roleErr);
        }

        // Guaranteed role resolution & bypass for bootstrap admin accounts
        const ADMIN_BYPASS_EMAILS = [
          "live_superadmin@educrm.com",
          "live_orgadmin@educrm.com",
          "superadmin@educrm.com",
          "orgadmin@educrm.com",
          "admin@educrm.com",
        ];
        const isBypassAdmin = ADMIN_BYPASS_EMAILS.includes(normalizedEmail);

        if (isBypassAdmin) {
          const adminRole: UserRole =
            normalizedEmail.includes("superadmin") ? "platform_super_admin" : "org_admin";
          userRole = adminRole;

          try {
            sessionStorage.setItem("demo_email_verified", "true");
            await setDoc(
              doc(db, "users", credential.user.uid),
              {
                uid: credential.user.uid,
                email: normalizedEmail,
                displayName: adminRole === "platform_super_admin" ? "Platform Super Admin" : "Organization Admin",
                role: adminRole,
                office: "Main Office",
                onboardingStatus: "completed",
                profileCompleted: true,
                emailVerified: true,
                updatedAt: Date.now(),
              },
              { merge: true }
            );
          } catch (syncErr) {
            console.warn("Could not sync admin profile on login:", syncErr);
          }

          navigate(getRoleDashboardPath(adminRole), { replace: true });
          return;
        }

        // Only enforce email verification for student role
        const isStudent = userRole === "student";
        if (isStudent && requiresVerifiedEmail && !credential.user.emailVerified) {
          try {
            sessionStorage.setItem("pending_verification_email", normalizedEmail);
          } catch (_) {}
          navigate("/verify-email", {
            replace: true,
            state: { email: normalizedEmail, fromLogin: true },
          });
          return;
        }

        // Non-student roles (e.g. counsellor, admin) skip onboarding and email verification
        if (userRole && userRole !== "student") {
          try {
            sessionStorage.setItem("demo_email_verified", "true");
          } catch (_) {}
          navigate(getRoleDashboardPath(userRole), { replace: true });
          return;
        }

        // Student role routes directly to student dashboard
        if (userRole === "student") {
          try {
            sessionStorage.setItem("demo_email_verified", "true");
          } catch (_) {}
          navigate("/student/dashboard", { replace: true });
          return;
        }

        // Default to "/" and let ProtectedLayout / Dashboard handle role routing
        navigate("/");
        return;
      } catch (firebaseErr: any) {
        throw firebaseErr;
      }
    } catch (err: any) {
      setError(mapFirebaseAuthError(err, resetMode ? "password-reset" : "sign-in"));
    } finally {
      setLoading(false);
    }
  };

  const [loginTab, setLoginTab] = useState<"student" | "staff">("student");

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-teal-500 selection:text-slate-950">
      {/* Background Subtle Gradient Lighting Orbs */}
      <div className="fixed -top-40 -left-40 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed -bottom-40 -right-40 w-[500px] h-[500px] bg-teal-500/15 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[160px] pointer-events-none z-0" />

      <div className="w-full max-w-lg bg-slate-900/85 border border-slate-800/90 rounded-3xl shadow-2xl shadow-black/60 p-6 sm:p-8 space-y-6 relative z-10 backdrop-blur-xl">
        {/* Top bar: Return to Public Front-End */}
        <div className="flex items-center justify-between pb-1">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-400 font-semibold transition-colors group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">&larr;</span>
            <span>Return to Public Portal</span>
          </Link>
          <span className="text-[10px] text-teal-400/90 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full font-mono font-medium">
            EduBridge.AI
          </span>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-400 p-0.5 mx-auto shadow-xl shadow-indigo-500/25">
            <div className="w-full h-full bg-[#0B1120] rounded-[14px] flex items-center justify-center text-teal-300">
              <GraduationCap className="w-7 h-7 text-teal-400" />
            </div>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {loginTab === "student" ? "International Student Portal" : "EduCRM Operations Desk"}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            {loginTab === "student"
              ? "Track university applications, document vault & real-time AI admissions"
              : "Operations access for Counsellors, Visa Officers, Admissions & Admins"}
          </p>
        </div>

        {/* Tab Switcher: Student vs Staff */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/70 border border-slate-800/80 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setLoginTab("student");
              setError(null);
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              loginTab === "student"
                ? "bg-gradient-to-r from-teal-500/20 to-emerald-500/20 text-teal-300 border border-teal-500/40 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <GraduationCap className="w-4 h-4 text-teal-400" />
            <span>Student Portal</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginTab("staff");
              setError(null);
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              loginTab === "staff"
                ? "bg-gradient-to-r from-indigo-500/20 to-blue-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Staff / EduCRM</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs">
            {notice}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={loginTab === "student" ? "student@example.com" : "officer@educrm.com"}
                className="w-full pl-10 pr-3.5 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
              />
            </div>
          </div>

          {!resetMode && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? "Signing in..." : resetMode ? "Send Reset Link" : "Sign In to Account"}</span>
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 border-t border-slate-800/80 pt-4 space-y-3">
          {resetMode ? (
            <button
              type="button"
              onClick={() => {
                setResetMode(false);
                setError(null);
                setNotice(null);
              }}
              className="font-semibold text-teal-400 hover:text-teal-300 cursor-pointer"
            >
              Back to sign in
            </button>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setResetMode(true);
                    setError(null);
                    setNotice(null);
                  }}
                  className="font-semibold text-teal-400 hover:text-teal-300 cursor-pointer"
                >
                  Forgot password?
                </button>
                <Link to="/accept-invitation" className="font-semibold text-slate-500 hover:text-slate-300 text-[11px]">
                  Have an invitation?
                </Link>
              </div>
              <Link
                to="/register"
                className="w-full py-2.5 px-4 bg-slate-800/60 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold text-sm rounded-xl transition-all flex items-center justify-center space-x-2"
              >
                <UserPlus className="w-4 h-4 text-teal-400" />
                <span>Create New Account</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Floating Collapsible Demo Accounts Trigger & Panel at Bottom-Right */}
      {isDemoMode && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
        {demoOpen && (
          <div className="mb-3 w-84 sm:w-96 max-h-[80vh] overflow-y-auto bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl p-4 backdrop-blur-2xl space-y-3.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="text-xs font-semibold text-teal-400 flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span className="font-bold">One-Click Instant Role Demo</span>
              </div>
              <button
                type="button"
                onClick={() => setDemoOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                aria-label="Close demo panel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Group 1: Students */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-3 h-3 text-teal-400" />
                <span>Student Portals</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("student", { isRegisteredStudent: true })}
                  className="px-2.5 py-2 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition-all active:scale-[0.98] cursor-pointer"
                  title="Aarav Patel (Already Registered: Dashboard, Applications & Documents)"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-teal-400" />
                  <span>Student (Reg)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("student", { isRegisteredStudent: false })}
                  className="px-2.5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition-all active:scale-[0.98] cursor-pointer"
                  title="New Student (Test Onboarding Wizard from Step 1)"
                >
                  <span>Student (New)</span>
                </button>
              </div>
            </div>

            {/* Group 2: Admissions & Operations */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-indigo-400" />
                <span>EduCRM Desk & Counsellors</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("counsellor")}
                  className="px-2.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl font-bold flex items-center justify-center space-x-1 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>Counsellor</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("team_leader")}
                  className="px-2.5 py-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 rounded-xl font-bold flex items-center justify-center space-x-1 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>Team Leader</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("admissions_officer")}
                  className="px-2.5 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl font-bold flex items-center justify-center space-x-1 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>Admissions</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("visa_officer")}
                  className="px-2.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl font-bold flex items-center justify-center space-x-1 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>Visa Officer</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("finance_officer")}
                  className="px-2.5 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-xl font-bold flex items-center justify-center space-x-1 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>Finance</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("support_user")}
                  className="px-2.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl font-bold flex items-center justify-center space-x-1 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>Support</span>
                </button>
              </div>
            </div>

            {/* Group 3: Leadership & Compliance */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Leadership & Partners
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("org_admin")}
                  className="px-2 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 rounded-lg font-bold flex items-center justify-center transition-all cursor-pointer"
                >
                  <span>Org Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("platform_super_admin")}
                  className="px-2 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 rounded-lg font-bold flex items-center justify-center transition-all cursor-pointer"
                >
                  <span>Super Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("auditor")}
                  className="px-2 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 rounded-lg font-bold flex items-center justify-center transition-all cursor-pointer"
                >
                  <span>Auditor</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("external_agent")}
                  className="px-2 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg font-bold flex items-center justify-center transition-all cursor-pointer"
                >
                  <span>Agent</span>
                </button>
              </div>
            </div>

            {/* Demo Student Fast Info */}
            <div className="p-2.5 bg-teal-950/40 border border-teal-500/20 rounded-xl space-y-1 text-xs">
              <div className="flex items-center justify-between text-slate-300 font-semibold text-[10px]">
                <span className="flex items-center gap-1.5 text-teal-400">
                  <Sparkles className="w-3 h-3 text-teal-400" />
                  Pre-configured Demo Student: Aarav Patel
                </span>
                <span className="text-[9px] text-teal-400 bg-teal-500/10 px-1.5 py-0.2 rounded-full border border-teal-500/20 font-mono">
                  Active
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Or enter email <code className="text-teal-300 bg-slate-950 px-1 py-0.5 rounded border border-slate-800">student.registered@educrm.demo</code> with any password.
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setDemoOpen(!demoOpen)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-slate-900/95 hover:bg-slate-850 text-slate-200 hover:text-white border border-slate-700/80 rounded-full shadow-2xl shadow-black/60 backdrop-blur-xl transition-all active:scale-95 group hover:border-teal-500/60 text-xs font-semibold cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-400 group-hover:rotate-12 transition-transform" />
          <span>Demo Accounts</span>
          <span className="px-1.5 py-0.2 bg-teal-500/20 text-teal-300 rounded-full text-[10px] font-mono">13</span>
          {demoOpen ? (
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-teal-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-teal-400" />
          )}
        </button>
        </div>
      )}
    </div>
  );
};
