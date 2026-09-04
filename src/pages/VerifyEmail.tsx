import React, { useEffect, useState } from "react";
import { sendEmailVerification } from "firebase/auth";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const COOLDOWN_SECONDS = 60;

export const VerifyEmail: React.FC = () => {
  const { firebaseUser, logout, refreshFirebaseUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const check = async () => {
    setChecking(true); setError(null); setMessage(null);
    try {
      const user = await refreshFirebaseUser();
      if (user?.emailVerified) {
        setMessage("Your email is verified. You can continue to your student portal.");
        navigate((location.state as { from?: string } | null)?.from || "/student/dashboard", { replace: true });
      } else setError("Your email is not verified yet. Open the link in the verification email, then try again.");
    } catch { setError("We could not check verification status. Please try again."); }
    finally { setChecking(false); }
  };

  const resend = async () => {
    if (!firebaseUser || cooldown) return;
    setError(null); setMessage(null);
    try { await sendEmailVerification(firebaseUser); setCooldown(COOLDOWN_SECONDS); setMessage("A new verification email has been sent. Check your inbox and spam folder."); }
    catch (err: any) { setError(err?.code === "auth/too-many-requests" ? "Too many requests. Please wait and try again later." : "Unable to send the verification email right now."); }
  };

  return <main className="min-h-screen grid place-items-center bg-slate-950 p-5"><section className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-8 text-center text-white shadow-2xl"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-300"><Mail /></div><h1 className="mt-5 text-2xl font-bold">Verify your email</h1><p className="mt-3 text-sm text-slate-300">We sent a verification link to <strong>{firebaseUser?.email || "your email address"}</strong>.</p><p className="mt-2 text-xs text-slate-400">Check your spam or junk folder if you cannot find the email.</p>{message && <p className="mt-5 rounded-xl bg-emerald-500/15 p-3 text-sm text-emerald-200"><CheckCircle2 className="mr-1 inline h-4 w-4" />{message}</p>}{error && <p className="mt-5 rounded-xl bg-rose-500/15 p-3 text-sm text-rose-200">{error}</p>}<button onClick={check} disabled={checking} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-60"><ShieldCheck className="h-4 w-4" />{checking ? "Checking…" : "Check verification"}</button><button onClick={resend} disabled={Boolean(cooldown)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-600 px-4 py-3 text-sm font-semibold disabled:opacity-50"><RefreshCw className="h-4 w-4" />{cooldown ? `Resend available in ${cooldown}s` : "Resend verification email"}</button><button onClick={logout} className="mt-5 text-sm text-slate-300 underline">Sign out</button><p className="mt-4 text-xs text-slate-500"><Link to="/login" className="underline">Back to sign in</Link></p></section></main>;
};
