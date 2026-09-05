import React, { useEffect, useState } from "react";
import {
  applyActionCode,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  Mail,
  RefreshCw,
  ShieldCheck,
  LogOut,
  Edit3,
  AlertCircle,
  Loader2,
  Lock,
} from "lucide-react";
import { auth, db, getEmailActionSettings } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";

const COOLDOWN_SECONDS = 60;

export const VerifyEmail: React.FC = () => {
  const { firebaseUser, logout, refreshFirebaseUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Retrieve email from: active session -> navigation state -> session storage
  const stateEmail = (location.state as { email?: string; emailSent?: boolean } | null)?.email;
  const initialSent = (location.state as { email?: string; emailSent?: boolean } | null)?.emailSent;
  const emailError = (location.state as any)?.emailError;
  const [storedEmail, setStoredEmail] = useState<string>(() => {
    return (
      firebaseUser?.email ||
      stateEmail ||
      sessionStorage.getItem("pending_verification_email") ||
      ""
    );
  });

  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<string | null>(
    initialSent ? "A verification email was sent to your address. Please check your inbox." : null
  );
  const [error, setError] = useState<string | null>(emailError || null);
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);

  // Quick inline sign-in states if user arrived signed-out
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  // Sync email when user loads
  useEffect(() => {
    if (firebaseUser?.email) {
      setStoredEmail(firebaseUser.email);
      try {
        sessionStorage.setItem("pending_verification_email", firebaseUser.email);
      } catch (_) {}
    }
  }, [firebaseUser]);

  // Handle countdown timer
  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setInterval(() => {
      setCooldown((val) => Math.max(0, val - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  // Handle incoming Firebase Auth Action Code from verification link in email
  useEffect(() => {
    const oobCode = searchParams.get("oobCode");
    const mode = searchParams.get("mode");

    if (oobCode && (mode === "verifyEmail" || !mode)) {
      const handleActionCode = async () => {
        setChecking(true);
        setError(null);
        try {
          await applyActionCode(auth, oobCode);
          setMessage("Email verified successfully! Updating your session...");

          if (auth.currentUser) {
            await auth.currentUser.reload();
            await refreshFirebaseUser();
            try {
              await updateDoc(doc(db, "students", auth.currentUser.uid), {
                emailVerified: true,
                updatedAt: Date.now(),
              });
            } catch (_) {}
            setTimeout(() => {
              navigate("/student/onboarding/profile", { replace: true });
            }, 1000);
          } else {
            setMessage("Your email has been verified! Please sign in to proceed to your student portal.");
          }
        } catch (err: any) {
          console.error("Action code error:", err);
          if (err.code === "auth/invalid-action-code") {
            setError("This verification link has expired or has already been used. Please request a new verification email.");
          } else {
            setError(err.message || "Failed to verify email using this link.");
          }
        } finally {
          setChecking(false);
        }
      };

      handleActionCode();
    }
  }, [searchParams]);

  // Check verification handler
  const handleCheckVerification = async () => {
    setError(null);
    setMessage(null);
    setChecking(true);

    try {
      let currentUser = auth.currentUser;

      // If user is currently signed out, check if they can sign in with password
      if (!currentUser && storedEmail && password) {
        setSigningIn(true);
        const cred = await signInWithEmailAndPassword(auth, storedEmail, password);
        currentUser = cred.user;
        setSigningIn(false);
        setNeedsPassword(false);
      }

      if (!currentUser) {
        // Prompt for password if not authenticated
        setNeedsPassword(true);
        setError("Please enter your password below to confirm your verification status.");
        setChecking(false);
        return;
      }

      // 1. Reload user to get fresh auth state from Firebase
      await currentUser.reload();
      const freshUser = await refreshFirebaseUser();

      // 2. Check fresh emailVerified
      if (freshUser?.emailVerified || auth.currentUser?.emailVerified) {
        setMessage("Verification confirmed! Redirecting to student onboarding...");
        try {
          await updateDoc(doc(db, "students", currentUser.uid), {
            emailVerified: true,
            updatedAt: Date.now(),
          });
        } catch (_) {}

        // 3. Redirect to student onboarding Step 1
        setTimeout(() => {
          navigate("/student/onboarding/profile", { replace: true });
        }, 800);
      } else {
        setError("Your email is not verified yet. Please click the verification link in your inbox, then click Check Verification.");
      }
    } catch (err: any) {
      console.error("Check verification error:", err);
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Incorrect password. Please try again.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many verification attempts. Please wait a moment and try again.");
      } else {
        setError(err.message || "We could not check verification status. Please try again.");
      }
    } finally {
      setChecking(false);
      setSigningIn(false);
    }
  };

  // Resend verification email handler
  const handleResendEmail = async () => {
    if (cooldown > 0) return;
    setError(null);
    setMessage(null);
    setResending(true);

    try {
      let currentUser = auth.currentUser;

      // If signed out, attempt sign in if password is provided
      if (!currentUser && storedEmail && password) {
        setSigningIn(true);
        const cred = await signInWithEmailAndPassword(auth, storedEmail, password);
        currentUser = cred.user;
        setSigningIn(false);
        setNeedsPassword(false);
      }

      if (!currentUser) {
        setNeedsPassword(true);
        setError("Please enter your password below to authenticate and resend the verification email.");
        setResending(false);
        return;
      }

      const lastSent = sessionStorage.getItem("last_verification_sent");
      if (lastSent && Date.now() - parseInt(lastSent) < 60000) {
        throw { code: "auth/too-many-requests", message: "Email already sent recently." };
      }
      
      // Real Firebase verification email request with action settings
      await sendEmailVerification(currentUser, getEmailActionSettings());
      sessionStorage.setItem("last_verification_sent", Date.now().toString());

      // Only display success message after Firebase call succeeds
      setMessage("Verification email sent successfully. Please check your inbox and spam folder.");
      setCooldown(COOLDOWN_SECONDS);
    } catch (err: any) {
      console.error("Resend verification error:", err);
      if (err.code === "auth/too-many-requests") {
        setError("Too many requests. Please wait a moment before requesting another verification email.");
      } else if (err.code === "auth/network-request-failed") {
        setError("Network error. Please check your internet connection.");
      } else if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Incorrect password. Please enter your valid password to resend.");
      } else if (err.code === "auth/unauthorized-continue-uri") {
        setError("Configuration error: The domain is not authorized in Firebase Console.");
      } else {
        setError(err.message || "Unable to send verification email right now. Please try again later.");
      }
    } finally {
      setResending(false);
      setSigningIn(false);
    }
  };

  // Sign out handler
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

  // Change email handler
  const handleChangeEmail = async () => {
    try {
      sessionStorage.removeItem("pending_verification_email");
      await signOut(auth);
      logout();
    } catch (_) {}
    navigate("/register", { replace: true });
  };

  const displayEmail = storedEmail || firebaseUser?.email || "your registered email";

  return (
    <main className="min-h-screen grid place-items-center bg-zinc-950 p-4 relative overflow-hidden font-sans">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <section className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/95 backdrop-blur-md p-8 text-center text-white shadow-2xl relative z-10 space-y-6">
        {/* Icon */}
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10">
          <Mail className="w-8 h-8" />
        </div>

        {/* Heading & Subtitle */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-heading text-white tracking-tight">
            Verify your email
          </h1>
          <p className="text-sm text-zinc-300">
            We sent a verification link to:
          </p>
          <div className="inline-block px-3.5 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-emerald-400 font-mono text-sm font-semibold max-w-full truncate">
            {displayEmail}
          </div>
        </div>

        {/* Informational Guidance */}
        <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-2xl p-4 text-xs text-zinc-400 text-left space-y-1.5">
          <p className="font-semibold text-zinc-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Admissions Security Requirement
          </p>
          <p>
            Your email must be verified before you can access the admissions portal, university matcher, and application wizard.
          </p>
          <p className="text-amber-300/90 pt-1">
            Check your spam or junk folder if you don't see the email in your inbox within a couple of minutes.
          </p>
        </div>

        {/* Messages */}
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

        {/* Inline Password Entry if user is signed out and needs session */}
        {needsPassword && !auth.currentUser && (
          <div className="space-y-3 p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 text-left animate-fade-in">
            <label className="block text-xs font-semibold text-zinc-300">
              Account Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password to verify"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* Check Verification Button */}
          <button
            onClick={handleCheckVerification}
            disabled={checking || signingIn}
            className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          >
            {checking || signingIn ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking verification...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Check Verification
              </>
            )}
          </button>

          {/* Resend Verification Email Button */}
          <button
            onClick={handleResendEmail}
            disabled={Boolean(cooldown) || resending || checking}
            className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-zinc-200 font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${resending ? "animate-spin text-emerald-400" : ""}`} />
            {cooldown > 0
              ? `Resend available in ${cooldown}s`
              : resending
              ? "Sending verification email..."
              : "Resend Verification Email"}
          </button>
        </div>

        {/* Secondary Links: Change Email, Sign Out */}
        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <button
            onClick={handleChangeEmail}
            className="hover:text-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer underline"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Change Email
          </button>

          <button
            onClick={handleSignOut}
            className="hover:text-rose-400 transition-colors flex items-center gap-1.5 cursor-pointer underline"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>

        <p className="text-[11px] text-zinc-500">
          Already verified?{" "}
          <Link to="/login" className="text-emerald-400 hover:underline">
            Go to Login
          </Link>
        </p>
      </section>
    </main>
  );
};

export default VerifyEmail;
