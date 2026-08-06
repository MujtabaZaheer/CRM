import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users2,
  GraduationCap,
  FileText,
  FolderOpen,
  Search,
  MessageSquare,
  Building2,
  UserCheck,
  BarChart3,
  ShieldCheck,
  ShieldAlert,
  CheckSquare,
  History,
  Bell,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ReceiptText,
  WalletCards,
  RefreshCw,
  CircleDollarSign,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  rolesAllowed?: string[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Leads", path: "/leads", icon: <Users2 className="w-4 h-4" /> },
  { label: "Students", path: "/students", icon: <GraduationCap className="w-4 h-4" /> },
  { label: "Applications", path: "/applications", icon: <FileText className="w-4 h-4" /> },
  { label: "Documents", path: "/documents", icon: <FolderOpen className="w-4 h-4" /> },
  { label: "Tasks & Reminders", path: "/tasks", icon: <CheckSquare className="w-4 h-4" /> },
  { label: "Universities & Courses", path: "/universities", icon: <Building2 className="w-4 h-4" /> },
  { label: "Notifications", path: "/notifications", icon: <Bell className="w-4 h-4" /> },
  { 
    label: "Audit Log", 
    path: "/audit-log", 
    icon: <History className="w-4 h-4" />, 
    rolesAllowed: ["platform_super_admin", "org_admin"] 
  },
  { 
    label: "User Management", 
    path: "/users", 
    icon: <ShieldCheck className="w-4 h-4" />, 
    rolesAllowed: ["platform_super_admin", "org_admin"] 
  },
  { 
    label: "Platform Admin", 
    path: "/super-admin", 
    icon: <ShieldAlert className="w-4 h-4 text-emerald-400" />, 
    rolesAllowed: ["platform_super_admin"] 
  },
  { label: "Programme Search", path: "/programme-search", icon: <Search className="w-4 h-4" /> },
  { label: "Communications", path: "/communications", icon: <MessageSquare className="w-4 h-4" /> },
  { label: "Agents & Partners", path: "/agents", icon: <UserCheck className="w-4 h-4" /> },
  { label: "Reports", path: "/reports", icon: <BarChart3 className="w-4 h-4" /> },
];

const teamLeaderNavItems: NavItem[] = [
  { label: "Dashboard", path: "/team-leader/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Team Members", path: "/team-leader/team-members", icon: <Users2 className="w-4 h-4" /> },
  { label: "Applications", path: "/team-leader/applications", icon: <FileText className="w-4 h-4" /> },
  { label: "Assign Applications", path: "/team-leader/assign-applications", icon: <UserCheck className="w-4 h-4" /> },
  { label: "Tasks & Reminders", path: "/team-leader/tasks", icon: <CheckSquare className="w-4 h-4" /> },
  { label: "Performance", path: "/team-leader/performance", icon: <BarChart3 className="w-4 h-4" /> },
  { label: "Reports", path: "/team-leader/reports", icon: <History className="w-4 h-4" /> },
  { label: "Notifications", path: "/team-leader/notifications", icon: <Bell className="w-4 h-4" /> },
];

const counsellorNavItems: NavItem[] = [
  { label: "Dashboard", path: "/counsellor/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "My Leads", path: "/counsellor/leads", icon: <Users2 className="w-4 h-4" /> },
  { label: "My Students", path: "/counsellor/students", icon: <GraduationCap className="w-4 h-4" /> },
  { label: "My Applications", path: "/counsellor/applications", icon: <FileText className="w-4 h-4" /> },
  { label: "Document Vault", path: "/counsellor/documents", icon: <FolderOpen className="w-4 h-4" /> },
  { label: "Tasks & Follow-ups", path: "/counsellor/tasks", icon: <CheckSquare className="w-4 h-4" /> },
  { label: "Programme Matcher", path: "/counsellor/programme-matcher", icon: <Search className="w-4 h-4" /> },
];

const financeNavItems: NavItem[] = [
  { label: "Finance Dashboard", path: "/finance/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Invoices", path: "/finance/invoices", icon: <FileText className="w-4 h-4" /> },
  { label: "Payments & Receipts", path: "/finance/payments", icon: <WalletCards className="w-4 h-4" /> },
  { label: "Refunds", path: "/finance/refunds", icon: <RefreshCw className="w-4 h-4" /> },
  { label: "Commissions", path: "/finance/commissions", icon: <CircleDollarSign className="w-4 h-4" /> },
  { label: "Financial Reports", path: "/finance/reports", icon: <ReceiptText className="w-4 h-4" /> },
  { label: "Notifications", path: "/finance/notifications", icon: <Bell className="w-4 h-4" /> },
];

const admissionsNavItems: NavItem[] = [
  { label: "Admissions Dashboard", path: "/admissions/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Application Queue", path: "/admissions/applications", icon: <FileText className="w-4 h-4" /> },
  { label: "Document Verification", path: "/admissions/verification", icon: <FolderOpen className="w-4 h-4" /> },
  { label: "Offer & CAS Tracking", path: "/admissions/offers", icon: <ShieldCheck className="w-4 h-4" /> },
  { label: "Admissions Tasks", path: "/admissions/tasks", icon: <CheckSquare className="w-4 h-4" /> },
  { label: "Admissions Analytics", path: "/admissions/reports", icon: <BarChart3 className="w-4 h-4" /> },
  { label: "Notifications", path: "/admissions/notifications", icon: <Bell className="w-4 h-4" /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen, collapsed, setCollapsed }) => {
  const { appUser } = useAuth();
  const currentRole = appUser?.role;

  const visibleNavItems =
    currentRole === "team_leader"
      ? teamLeaderNavItems
      : currentRole === "counsellor"
      ? counsellorNavItems
      : currentRole === "finance_officer"
      ? financeNavItems
      : currentRole === "admissions_officer"
      ? admissionsNavItems
      : navItems.filter((item) => {
          if (!item.rolesAllowed) return true;
          return currentRole && item.rolesAllowed.includes(currentRole);
        });

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[var(--backdrop)] backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[var(--bg-card)] border-r border-[var(--border-default)] text-[var(--text-primary)] flex flex-col transition-all duration-200 ease-in-out lg:static lg:translate-x-0 ${
          collapsed ? "lg:w-20 w-64" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Brand Banner */}
        <div className={`h-16 flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-card-alt)] ${collapsed ? "px-3" : "px-5"}`}>
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-9 h-9 sq-avatar bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-zinc-950 font-extrabold text-xl shadow-lg shadow-emerald-500/20 flex-shrink-0">
              E
            </div>
            {!collapsed && (
              <div className="truncate">
                <span className="font-heading font-bold text-lg text-[var(--text-primary)] tracking-tight block leading-none truncate">
                  EduCRM
                </span>
                <span className="text-[10px] text-teal-400 font-medium tracking-wide uppercase">
                  Enterprise
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              className="hidden lg:flex text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1.5 sq-btn hover:bg-[var(--bg-hover)] border border-[var(--border-default)]"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 sq-btn hover:bg-[var(--bg-hover)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center ${collapsed ? "justify-center px-2" : "space-x-3 px-3"} py-2.5 sq-btn text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/5"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] border border-transparent"
                }`
              }
            >
              <span className="p-1 sq-icon bg-[var(--bg-elevated)] border border-[var(--border-default)] flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className={`p-4 border-t border-[var(--border-default)] bg-[var(--bg-card-alt)] text-[11px] text-[var(--text-muted)] flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          <span className="flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            {!collapsed && <span>EduCRM Engine</span>}
          </span>
          {!collapsed && (
            <span className="px-1.5 py-0.5 sq-pill bg-[var(--bg-elevated)] text-[var(--text-secondary)] font-mono text-[10px]">
              v1.2.0
            </span>
          )}
        </div>
      </aside>
    </>
  );
};
