import React, { useState, useEffect } from "react";
import { Building2, ChevronDown, Check } from "lucide-react";
import { AVAILABLE_BRANCHES } from "../../utils/branchAccess";
import { useAuth } from "../../contexts/AuthContext";

export const BranchSwitcher: React.FC = () => {
  const { appUser } = useAuth();
  const [activeBranchId, setActiveBranchId] = useState<string>(() => {
    return localStorage.getItem("EDUC_CRM_ACTIVE_BRANCH") || "ALL";
  });
  const [isOpen, setIsOpen] = useState(false);

  // Only Admins / Super Admins / Auditors can switch cross-branch
  const canSwitchBranches =
    appUser?.role === "platform_super_admin" ||
    appUser?.role === "org_admin" ||
    appUser?.role === "auditor" ||
    appUser?.role === "office_manager";

  useEffect(() => {
    localStorage.setItem("EDUC_CRM_ACTIVE_BRANCH", activeBranchId);
  }, [activeBranchId]);

  const activeBranch = AVAILABLE_BRANCHES.find((b) => b.id === activeBranchId);

  if (!canSwitchBranches && appUser?.branchId) {
    const userBranch = AVAILABLE_BRANCHES.find((b) => b.id === appUser.branchId);
    return (
      <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300">
        <Building2 className="w-3.5 h-3.5 text-emerald-400" />
        <span className="font-semibold">{userBranch?.name || "Assigned Branch"}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 bg-[var(--bg-main)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] transition-all font-semibold"
      >
        <Building2 className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">
          {activeBranchId === "ALL" ? "All Office Branches" : activeBranch?.name || "Select Branch"}
        </span>
        <span className="sm:hidden font-mono">
          {activeBranchId === "ALL" ? "ALL" : activeBranch?.code || "BR"}
        </span>
        <ChevronDown className="w-3 h-3 text-zinc-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-56 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-2xl z-50 overflow-hidden text-xs animate-in fade-in slide-in-from-top-1">
          <div className="p-2 border-b border-[var(--border-color)] text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
            Switch Active Office Branch
          </div>

          <button
            onClick={() => {
              setActiveBranchId("ALL");
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left hover:bg-[var(--bg-hover)] flex items-center justify-between transition-colors text-[var(--text-primary)]"
          >
            <div className="flex items-center space-x-2">
              <Building2 className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-semibold">All Global Branches</span>
            </div>
            {activeBranchId === "ALL" && <Check className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          {AVAILABLE_BRANCHES.map((b) => (
            <button
              key={b.id}
              onClick={() => {
                setActiveBranchId(b.id);
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left hover:bg-[var(--bg-hover)] flex items-center justify-between transition-colors text-[var(--text-primary)]"
            >
              <div>
                <span className="font-medium block">{b.name}</span>
                <span className="text-[10px] text-[var(--text-muted)] block">{b.city}, {b.country}</span>
              </div>
              {activeBranchId === b.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
