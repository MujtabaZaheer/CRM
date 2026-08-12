import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { UserRole } from "../../types/role";
import {
  LayoutDashboard,
  Users2,
  GraduationCap,
  FileText,
  FolderOpen,
  CheckSquare,
  Building2,
  Bell,
  Search,
  MessageSquare,
  UserCheck,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  X,
  History,
  ShieldCheck,
  ShieldAlert,
  WalletCards,
  RefreshCw,
  CircleDollarSign,
  ReceiptText,
  Plane
} from "lucide-react";

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  rolesAllowed?: UserRole[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Leads", path: "/leads", icon: <Users2 className="w-4 h-4" /> },
  { label: "Students", path: "/students", icon: <GraduationCap className="w-4 h-4" /> },
  { label: "Applications", path: "/applications", icon: <FileText className="w-4 h-4" /> },
  { label: "Admissions Desk", path: "/admissions/dashboard", icon: <ShieldCheck className="w-4 h-4" /> },
  { label: "Finance Module", path: "/finance/dashboard", icon: <CircleDollarSign className="w-4 h-4" /> },
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
  { label: "Applications Pool", path: "/team-leader/applications", icon: <FileText className="w-4 h-4" /> },
  { label: "Assign Workloads", path: "/team-leader/assign-applications", icon: <UserCheck className="w-4 h-4" /> },
  { label: "Team Tasks", path: "/team-leader/tasks", icon: <CheckSquare className="w-4 h-4" /> },
  { label: "Performance KPI", path: "/team-leader/performance", icon: <BarChart3 className="w-4 h-4" /> },
  { label: "Reports", path: "/team-leader/reports", icon: <ReceiptText className="w-4 h-4" /> },
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

const supportNavItems: NavItem[] = [
  { label: "Support Dashboard", path: "/support/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Support Tickets", path: "/support/tickets", icon: <FileText className="w-4 h-4" /> },
  { label: "New Ticket", path: "/support/create-ticket", icon: <CheckSquare className="w-4 h-4" /> },
  { label: "Knowledge Base", path: "/support/knowledge-base", icon: <FolderOpen className="w-4 h-4" /> },
  { label: "Support Reports", path: "/support/reports", icon: <BarChart3 className="w-4 h-4" /> },
  { label: "Notifications", path: "/support/notifications", icon: <Bell className="w-4 h-4" /> },
];

const auditorNavItems: NavItem[] = [
  { label: "Auditor Portal", path: "/auditor/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Audit Trail", path: "/auditor/audit-trail", icon: <History className="w-4 h-4" /> },
  { label: "Compliance Inspect", path: "/auditor/compliance-inspect", icon: <ShieldCheck className="w-4 h-4" /> },
  { label: "System Security Logs", path: "/auditor/system-logs", icon: <FileText className="w-4 h-4" /> },
  { label: "Compliance Reports", path: "/auditor/reports", icon: <BarChart3 className="w-4 h-4" /> },
  { label: "Notifications", path: "/auditor/notifications", icon: <Bell className="w-4 h-4" /> },
];

const superAdminNavItems: NavItem[] = [
  { label: "Super Admin Portal", path: "/super-admin/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Tenants & Orgs", path: "/super-admin/tenants", icon: <ShieldCheck className="w-4 h-4" /> },
  { label: "User Accounts", path: "/super-admin/users", icon: <Users2 className="w-4 h-4" /> },
  { label: "System Health", path: "/super-admin/system-health", icon: <BarChart3 className="w-4 h-4" /> },
  { label: "Global Settings", path: "/super-admin/global-settings", icon: <FolderOpen className="w-4 h-4" /> },
  { label: "Root Audit Trail", path: "/super-admin/audit-logs", icon: <History className="w-4 h-4" /> },
  { label: "Notifications", path: "/super-admin/notifications", icon: <Bell className="w-4 h-4" /> },
];

const visaNavItems: NavItem[] = [
  { label: "Visa Dashboard", path: "/visa-officer/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Visa Applications", path: "/visa-officer/cases", icon: <Plane className="w-4 h-4" /> },
  { label: "Documents", path: "/visa-officer/documents", icon: <FolderOpen className="w-4 h-4" /> },
  { label: "Tasks", path: "/visa-officer/tasks", icon: <CheckSquare className="w-4 h-4" /> },
  { label: "Notifications", path: "/visa-officer/notifications", icon: <Bell className="w-4 h-4" /> },
];

const studentNavItems: NavItem[] = [
  { label: "My Dashboard", path: "/student/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "My Profile", path: "/student/profile", icon: <UserCheck className="w-4 h-4" /> },
  { label: "My Applications", path: "/student/applications", icon: <FileText className="w-4 h-4" /> },
  { label: "My Documents", path: "/student/documents", icon: <FolderOpen className="w-4 h-4" /> },
  { label: "My Tasks", path: "/student/tasks", icon: <CheckSquare className="w-4 h-4" /> },
  { label: "Support Requests", path: "/student/requests", icon: <MessageSquare className="w-4 h-4" /> },
];

const agentNavItems: NavItem[] = [
  { label: "Agent Dashboard", path: "/agent/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Referred Students", path: "/agent/referrals", icon: <Users2 className="w-4 h-4" /> },
  { label: "Refer New Student", path: "/agent/refer-lead", icon: <CheckSquare className="w-4 h-4" /> },
  { label: "Commission Ledger", path: "/agent/commissions", icon: <CircleDollarSign className="w-4 h-4" /> },
  { label: "Notifications", path: "/agent/notifications", icon: <Bell className="w-4 h-4" /> },
];

const universityNavItems: NavItem[] = [
  { label: "University Portal", path: "/university/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Received Applications", path: "/university/applications", icon: <FileText className="w-4 h-4" /> },
  { label: "CAS / COE Release", path: "/university/cas-issuance", icon: <ShieldCheck className="w-4 h-4" /> },
  { label: "Notifications", path: "/university/notifications", icon: <Bell className="w-4 h-4" /> },
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
      : currentRole === "support_user"
      ? supportNavItems
      : currentRole === "auditor" || currentRole === "compliance_officer"
      ? auditorNavItems
      : currentRole === "platform_super_admin"
      ? superAdminNavItems
      : currentRole === "visa_officer"
      ? visaNavItems
      : currentRole === "student"
      ? studentNavItems
      : currentRole === "external_agent"
      ? agentNavItems
      : currentRole === "university_partner"
      ? universityNavItems
      : navItems.filter((item) => {
          if (!item.rolesAllowed) return true;
          return currentRole && item.rolesAllowed.includes(currentRole);
        });

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-[var(--backdrop)] backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen glass-sidebar transition-all duration-300 flex flex-col justify-between
          ${collapsed ? "w-16" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Top Header & Logo */}
        <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-teal-400 sq-badge flex items-center justify-center text-zinc-950 font-heading font-extrabold text-lg flex-shrink-0 shadow-md shadow-emerald-500/20">
              E
            </div>
            {!collapsed && (
              <div className="truncate">
                <h1 className="font-heading font-bold text-sm text-[var(--text-primary)] leading-none tracking-tight">
                  EduCRM
                </h1>
                <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest block mt-0.5">
                  Enterprise
                </span>
              </div>
            )}
          </div>

          {/* Close Mobile / Collapse Desktop */}
          <div className="flex items-center">
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] sq-btn transition-colors"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 py-4 overflow-y-auto overflow-x-hidden px-2 space-y-1">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `
                flex items-center space-x-3 px-3 py-2.5 sq-btn text-xs font-medium transition-all group relative
                ${isActive 
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold backdrop-blur-md shadow-sm" 
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-transparent"
                }
              `}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}

              {/* Tooltip for Collapsed State */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-900/90 text-white text-xs sq-card opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-zinc-800 backdrop-blur-md">
                  {item.label}
                </div>
              )}
            </NavLink>
          ))}
        </div>

        {/* Footer Info */}
        <div className="p-3 border-t border-[var(--border-default)] bg-transparent">
          {!collapsed ? (
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>System v2.4</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          ) : (
            <div className="flex justify-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
