import React from "react";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { UserRole } from "../../types/role";

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const RoleGate = ({ children, allowedRoles }: RoleGateProps): React.ReactElement => {
  const { appUser } = useAuth();
  const currentRole = appUser?.role;

  const isSuperAdmin = currentRole === "platform_super_admin";
  const isOrgAdmin = currentRole === "org_admin";
  const isAllowed = isSuperAdmin || isOrgAdmin || (currentRole && allowedRoles.includes(currentRole));

  if (!isAllowed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
        <div className="w-12 h-12 sq-avatar bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold font-heading text-[var(--text-primary)]">Access Restricted</h3>
        <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm">
          Your role (<span className="text-rose-400 font-mono">{currentRole || "unknown"}</span>) does not have permission to view this module.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
