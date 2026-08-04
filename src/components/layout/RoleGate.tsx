import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { ACTIVE_ROLES, ROLE_LABELS } from "../../types/role";
import { ShieldAlert } from "lucide-react";

interface RoleGateProps {
  children: React.ReactNode;
}

export const RoleGate: React.FC<RoleGateProps> = ({ children }) => {
  const { appUser } = useAuth();

  if (!appUser) {
    return null;
  }

  const isRoleActive = ACTIVE_ROLES.includes(appUser.role);

  if (!isRoleActive) {
    const roleTitle = ROLE_LABELS[appUser.role] || appUser.role;

    return (
      <div className="max-w-2xl mx-auto mt-12 p-8 bg-white border border-slate-200 rounded-xl shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">
          Module Not Configured
        </h2>
        <p className="text-slate-600 text-sm leading-relaxed max-w-lg mx-auto">
          Your assigned role is <span className="font-semibold text-slate-900">{roleTitle}</span>. 
          This role isn't configured yet in this early milestone release.
        </p>
        <p className="text-xs text-slate-400 border-t border-slate-100 pt-4">
          Active roles in current build: Organization Admin, Counsellor.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
