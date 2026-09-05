import React, { useEffect, useState, useRef } from "react";
import { signOut } from "firebase/auth";
import { useLocation, useNavigate } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import {
  CheckCircle2,
  Mail,
  RefreshCw,
  ShieldCheck,
  LogOut,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { auth, functions } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";

const COOLDOWN_SECONDS = 60;

export const VerifyEmail: React.FC = () => {
  const { firebaseUser, logout, refreshFirebaseUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const stateEmail = (location.state as any)?.email;
  const initialSent = (location.state as any)?.emailSent;
  const emailError = (location.state as any)?.emailError;

  const [storedEmail, setStoredEmail] = useState<string>(() => {
    return firebaseUser?.email || stateEmail || sessionStorage.getItem("pending_verification_email") || "";
  });

  const [cooldown, setCooldown] = useState(COOLDOWN_SECONDS);
  const [message, setMessage] = useState<string | null>(
    initialSent ? "A verification code was sent to your address. Please check your inbox." : null
  );
  const [error, setError] = useState<string | null>(emailError || null);
  
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      const newCode = [...code];
      for (let i = 0; i < pasted.length; i++) {
        newCode[i] = pasted[i];
      }
      setCode(newCode);
      if (pasted.length < 6) {
        inputRefs.current[pasted.length]?.focus();
      } else {
        inputRefs.current[5]?.focus();
      }
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    setError(null);
    setMessage(null);
    setVerifying(true);

    try {
      if (!auth.currentUser) throw new Error("Authentication session lost. Please sign in again.");
      
      const verifyOTP = httpsCallable(functions, 'verifyOTP');
      await verifyOTP({ code: fullCode });
      
      setMessage("Verification confirmed! Redirecting to student onboarding...");
      await auth.currentUser.reload();
      await refreshFirebaseUser();

      setTimeout(() => {
        navigate("/student/onboarding/profile", { replace: true });
      }, 1000);
    } catch (err: any) {
      console.error("Verification error:", err);
      if (err.code === "invalid-argument") {
        setError("Incorrect verification code.");
      } else if (err.code === "failed-precondition") {
        setError("This verification code has expired. Please request a new one.");
      } else if (err.code === "resource-exhausted") {
        setError("Too many failed attempts. Please request a new code.");
      } else {
        setError(err.message || "Failed to verify code. Please try again.");
      }
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (cooldown > 0) return;
    setError(null);
    setMessage(null);
    setResending(true);

    try {
      if (!auth.currentUser) throw new Error("Authentication session lost. Please sign in again.");

      const sendOTP = httpsCallable(functions, 'sendVerificationOTP');
      await sendOTP();

      setMessage("A new verification code has been sent to your email.");
      setCooldown(COOLDOWN_SECONDS);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      console.error("Resend error:", err);
      if (err.code === "resource-exhausted") {
        setError("Too many requests. Please wait a moment before requesting another code.");
      } else {
        setError(err.message || "Unable to send verification code. Please try again later.");
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

  const displayEmail = storedEmail || firebaseUser?.email || "your registered email";

  return (
    <main className="min-h-screen grid place-items-center bg-zinc-950 p-4 relative overflow-hidden font-sans">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <section className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/95 backdrop-blur-md p-8 text-center text-white shadow-2xl relative z-10 space-y-6">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10">
          <Mail className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-heading text-white tracking-tight">
            Verify your email
          </h1>
          <p className="text-sm text-zinc-300">
            We've sent a 6-digit verification code to:
          </p>
          <div className="inline-block px-3.5 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-emerald-400 font-mono text-sm font-semibold max-w-full truncate">
            {displayEmail}
          </div>
        </div>

        <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-2xl p-4 text-xs text-zinc-400 text-left space-y-1.5">
          <p className="font-semibold text-zinc-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Code expires in 10 minutes.
          </p>
          <p>
            Your email must be verified before you can access the admissions portal.
          </p>
        </div>

        {/* OTP Input Grid */}
        <div className="flex gap-2 justify-center py-2" onPaste={handlePaste}>
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={verifying}
              className="w-12 h-14 bg-zinc-950 border border-zinc-700 rounded-xl text-center text-xl font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors disabled:opacity-50"
            />
          ))}
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
          <button
            onClick={handleVerify}
            disabled={verifying || code.join("").length !== 6}
            className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          >
            {verifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Email"
            )}
          </button>

          <button
            onClick={handleResendCode}
            disabled={Boolean(cooldown) || resending || verifying}
            className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-zinc-200 font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${resending ? "animate-spin text-emerald-400" : ""}`} />
            {cooldown > 0
              ? `Resend available in ${cooldown}s`
              : resending
              ? "Sending code..."
              : "Didn't receive it? Resend code"}
          </button>
        </div>

        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
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
