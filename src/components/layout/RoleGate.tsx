import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { ROLE_LABELS } from "../../types/role";
import { ShieldAlert, Sparkles } from "lucide-react";

interface RoleGateProps {
  children: React.ReactNode;
}

export const RoleGate: React.FC<RoleGateProps> = ({ children }) => {
  const { appUser } = useAuth();
  const currentRole = appUser?.role;

  // Platform Super Admin, Organization Admin, and Counsellor have active functionality
  if (currentRole === "platform_super_admin" || currentRole === "org_admin" || currentRole === "counsellor") {
    return <>{children}</>;
  }

  const roleLabel = currentRole ? ROLE_LABELS[currentRole] : "Your Role";

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-bold text-white tracking-tight">
            Module Not Configured
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Logged in as <strong className="text-emerald-400 font-semibold">{roleLabel}</strong>. Dedicated workflows for this role are scheduled in upcoming phase releases.
          </p>
        </div>

        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-400 flex items-center justify-center space-x-2">
          <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Try switching to Platform Super Admin, Org Admin, or Counsellor role</span>
        </div>
      </div>
    </div>
  );
};
