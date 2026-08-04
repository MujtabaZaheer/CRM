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
  X,
  Sparkles
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
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
  { label: "Programme Search", path: "/programme-search", icon: <Search className="w-4 h-4" /> },
  { label: "Communications", path: "/communications", icon: <MessageSquare className="w-4 h-4" /> },
  { label: "Universities & Courses", path: "/universities", icon: <Building2 className="w-4 h-4" /> },
  { label: "Agents & Partners", path: "/agents", icon: <UserCheck className="w-4 h-4" /> },
  { label: "Reports", path: "/reports", icon: <BarChart3 className="w-4 h-4" /> },
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
];

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { appUser } = useAuth();
  const currentRole = appUser?.role;

  const visibleNavItems = navItems.filter((item) => {
    if (!item.rolesAllowed) return true;
    return currentRole && item.rolesAllowed.includes(currentRole);
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-zinc-900 border-r border-zinc-800 text-zinc-300 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Banner */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-zinc-950 font-extrabold text-xl shadow-lg shadow-emerald-500/20">
              E
            </div>
            <div>
              <span className="font-heading font-bold text-lg text-white tracking-tight block leading-none">
                EduCRM
              </span>
              <span className="text-[10px] text-teal-400 font-medium tracking-wide uppercase">
                Enterprise
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/5"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 border border-transparent"
                }`
              }
            >
              <span className="p-1 rounded-md bg-zinc-800/80 border border-zinc-700/50">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/40 text-[11px] text-zinc-500 flex items-center justify-between">
          <span className="flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>EduCRM Engine</span>
          </span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[10px]">
            v1.2.0
          </span>
        </div>
      </aside>
    </>
  );
};
