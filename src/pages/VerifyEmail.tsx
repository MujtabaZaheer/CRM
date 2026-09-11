import React, { useEffect, useState } from "react";
import { signOut, sendEmailVerification } from "firebase/auth";
import { useLocation, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import {
  CheckCircle2,
  Mail,
  RefreshCw,
  ShieldCheck,
  LogOut,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { auth, db, isDemoMode, getEmailActionSettings } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { UserRole, ROLE_LABELS } from "../types/role";
import { getRoleDashboardPath } from "../types/registrationConfig";

const COOLDOWN_SECONDS = 60;

export const VerifyEmail: React.FC = () => {
  const { firebaseUser, appUser, logout, refreshFirebaseUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const stateEmail = (location.state as any)?.email;
  const initialSent = (location.state as any)?.emailSent;
  const emailError = (location.state as any)?.emailError;

  const [pendingEmail, setPendingEmail] = useState<string>("");
  const [cooldown, setCooldown] = useState<number>(initialSent ? COOLDOWN_SECONDS : 0);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(
    initialSent ? "A verification code was sent to your address. Please check your inbox." : null
  );
  const [error, setError] = useState<string | null>(emailError || null);

  // Sync state or session storage email
  useEffect(() => {
    if (stateEmail) {
      setPendingEmail(stateEmail);
      try {
        sessionStorage.setItem("pending_verification_email", stateEmail);
      } catch (_) {}
      return;
    }
    const sessionEmail = sessionStorage.getItem("pending_verification_email");
    if (sessionEmail) {
      setPendingEmail(sessionEmail);
    } else if (firebaseUser?.email) {
      setPendingEmail(firebaseUser.email);
    }
  }, [stateEmail, firebaseUser]);

  // Handle countdown timer
  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setInterval(() => {
      setCooldown((val) => Math.max(0, val - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const resolveDestination = async (): Promise<{ path: string; label: string; isStudent: boolean }> => {
    let role: UserRole = "student";
    let isCompleted = false;
    const targetEmail = (auth.currentUser?.email || stateEmail || pendingEmail || "").toLowerCase().trim();

    if (appUser?.role) {
      role = appUser.role;
      isCompleted = appUser.onboardingStatus === "completed" || appUser.profileCompleted === true;
    } else if (auth.currentUser) {
      try {
        const uSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (uSnap.exists()) {
          const uData = uSnap.data();
          role = uData.role || "student";
          isCompleted = uData.onboardingStatus === "completed" || uData.profileCompleted === true;
        } else if (targetEmail) {
          const uq = query(collection(db, "users"), where("email", "==", targetEmail));
          const uqSnap = await getDocs(uq);
          if (!uqSnap.empty) {
            const uData = uqSnap.docs[0].data();
            role = uData.role || "student";
            isCompleted = uData.onboardingStatus === "completed" || uData.profileCompleted === true;
          } else {
            const invSnap = await getDocs(query(collection(db, "invitations"), where("email", "==", targetEmail)));
            if (!invSnap.empty) {
              role = invSnap.docs[0].data().role || "student";
            }
          }
        }
      } catch (err) {
        console.warn("Could not determine role for redirect:", err);
      }
    }

    const isStudent = role === "student";
    if (!isStudent) {
      return {
        path: getRoleDashboardPath(role),
        label: ROLE_LABELS[role] || "Dashboard",
        isStudent: false,
      };
    }

    return {
      path: isCompleted ? "/student/dashboard" : "/student/onboarding/step-1",
      label: isCompleted ? "Dashboard" : "Student Onboarding",
      isStudent: true,
    };
  };

  const handleVerify = async (forceDemo = false) => {
    setError(null);
    setMessage(null);
    setVerifying(true);

    try {
      if (forceDemo || isDemoMode) {
        sessionStorage.setItem("demo_email_verified", "true");
        await refreshFirebaseUser();
        const dest = await resolveDestination();
        setMessage(`Demo Verification Confirmed! Redirecting to ${dest.label}...`);

        setTimeout(() => {
          navigate(dest.path, { replace: true });
        }, 800);
        return;
      }

      if (!auth.currentUser) throw new Error("Authentication session lost. Please sign in again.");
      
      await auth.currentUser.reload();
      
      if (auth.currentUser.emailVerified) {
        sessionStorage.setItem("demo_email_verified", "true");
        await refreshFirebaseUser();
        const dest = await resolveDestination();
        setMessage(`Verification confirmed! Redirecting to ${dest.label}...`);

        setTimeout(() => {
          navigate(dest.path, { replace: true });
        }, 800);
      } else {
        setError("Your email is not verified yet. Please click the link in the email we sent you, or use Demo Instant Verify.");
      }
    } catch (err: any) {
      console.error("Verification check error:", err);
      // Fallback for demo environments
      if (isDemoMode) {
        sessionStorage.setItem("demo_email_verified", "true");
        const dest = await resolveDestination();
        setMessage(`Demo verification active! Redirecting to ${dest.label}...`);
        setTimeout(() => {
          navigate(dest.path, { replace: true });
        }, 800);
      } else {
        setError("Failed to verify status. Please try again.");
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleDemoInstantVerify = () => {
    handleVerify(true);
  };

  const handleResendCode = async () => {
    if (cooldown > 0) return;
    setError(null);
    setMessage(null);
    setResending(true);

    try {
      if (!auth.currentUser) throw new Error("Authentication session lost. Please sign in again.");

      await sendEmailVerification(auth.currentUser, getEmailActionSettings());

      setMessage("A new verification link has been sent to your email.");
      setCooldown(COOLDOWN_SECONDS);
    } catch (err: any) {
      console.error("Resend error:", err);
      const code = err.code || "";
      
      if (code.includes("too-many-requests")) {
        setError("For your security, sending is temporarily limited. Please wait before trying again.");
      } else {
        setError("We couldn't send your verification email right now. Please try again.");
      }
    } finally {
      setResending(false);
    }
  };

  const handleSignOut = async () => {
    try {
      sessionStorage.removeItem("pending_verification_email");
      await signOut(auth);
      logout();
    } catch (err) {
      console.warn("Sign out error:", err);
    }
    navigate("/login", { replace: true });
  };

  const displayEmail = pendingEmail || stateEmail || firebaseUser?.email || "your registered email";

  return (
    <main className="min-h-screen grid place-items-center bg-main p-4 relative overflow-hidden font-sans">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <section className="w-full max-w-md rounded-3xl border border-subtle bg-surface/95 backdrop-blur-md p-8 text-center text-primary shadow-2xl relative z-10 space-y-6">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 shadow-lg shadow-emerald-500/10">
          <Mail className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-heading text-primary tracking-tight">
            Verify your email
          </h1>
          <p className="text-sm text-secondary">
            We've sent a verification link to:
          </p>
          <div className="inline-block px-3.5 py-1.5 rounded-full bg-elevated border border-subtle text-emerald-500 font-mono text-sm font-semibold max-w-full truncate">
            {displayEmail}
          </div>
        </div>

        <div className="bg-elevated/60 border border-subtle rounded-2xl p-4 text-xs text-muted text-left space-y-1.5">
          <p className="font-semibold text-primary flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Click the link in the email to verify.
          </p>
          <p>
            Your email must be verified before you can access the admissions portal.
          </p>
        </div>



        {message && (
          <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-3.5 text-xs sm:text-sm text-emerald-300 flex items-start gap-2 text-left">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-rose-500/15 border border-rose-500/30 p-3.5 text-xs sm:text-sm text-rose-300 flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3 pt-2">
          {/* Demo Instant Verification Option */}
          <button
            type="button"
            onClick={handleDemoInstantVerify}
            disabled={verifying}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4 text-zinc-950" />
            <span>Instant Verify & Continue (Demo Mode)</span>
          </button>

          <button
            onClick={() => handleVerify(false)}
            disabled={verifying}
            className="w-full py-2.5 px-4 bg-elevated hover:bg-hover border border-default text-primary font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          >
            {verifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking verification status...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                I have clicked the email link
              </>
            )}
          </button>

          <button
            onClick={handleResendCode}
            disabled={Boolean(cooldown) || resending || verifying}
            className="w-full py-2.5 px-4 bg-elevated/50 hover:bg-hover border border-subtle text-secondary font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin text-emerald-400" : ""}`} />
            {cooldown > 0
              ? `Resend link in ${cooldown}s`
              : resending
              ? "Sending email..."
              : "Resend verification link"}
          </button>
        </div>

        <div className="pt-4 border-t border-subtle flex items-center justify-between text-xs text-muted">
          <button
            onClick={handleSignOut}
            className="hover:text-rose-400 transition-colors flex items-center gap-1.5 cursor-pointer underline mx-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out & Start Over
          </button>
        </div>
      </section>
    </main>
  );
};
