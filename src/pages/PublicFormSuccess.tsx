import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, UserPlus, ArrowLeft } from "lucide-react";

export const PublicFormSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const refId = searchParams.get("ref");

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl p-8 space-y-6 relative z-10 backdrop-blur-md text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full flex items-center justify-center mx-auto animate-bounce">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white font-heading tracking-tight">
            Application Submitted!
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Your inquiry has been received successfully. Our team will review your submission and contact you shortly.
          </p>
        </div>

        {refId && (
          <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl">
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Reference Number</p>
            <p className="text-emerald-400 font-mono font-bold text-sm mt-0.5">{refId}</p>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <p className="text-xs text-zinc-500">
            Already have your documents ready? Create an account to track your application progress.
          </p>

          <Link
            to="/student-register"
            className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Student Account</span>
          </Link>

          <Link
            to="/login"
            className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-sm rounded-xl transition-all flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-zinc-600 border-t border-zinc-800/80 pt-4">
          Powered by <span className="text-emerald-500 font-semibold">EduCRM</span>
        </p>
      </div>
    </div>
  );
};
