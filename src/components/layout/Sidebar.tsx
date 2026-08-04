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
  X
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
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "Leads", path: "/leads", icon: <Users2 className="w-5 h-5" /> },
  { label: "Students", path: "/students", icon: <GraduationCap className="w-5 h-5" /> },
  { label: "Applications", path: "/applications", icon: <FileText className="w-5 h-5" /> },
  { label: "Documents", path: "/documents", icon: <FolderOpen className="w-5 h-5" /> },
  { label: "Programme Search", path: "/programme-search", icon: <Search className="w-5 h-5" /> },
  { label: "Communications", path: "/communications", icon: <MessageSquare className="w-5 h-5" /> },
  { label: "Universities & Courses", path: "/universities", icon: <Building2 className="w-5 h-5" /> },
  { label: "Agents & Partners", path: "/agents", icon: <UserCheck className="w-5 h-5" /> },
  { label: "Reports", path: "/reports", icon: <BarChart3 className="w-5 h-5" /> },
  { label: "Users", path: "/users", icon: <ShieldCheck className="w-5 h-5" />, adminOnly: true },
];

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { appUser } = useAuth();
  const isAdmin = appUser?.role === "org_admin";

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header / Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
              E
            </div>
            <span className="font-semibold text-lg text-white tracking-tight">EduCRM</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          EduCRM Workspace v1.0
        </div>
      </aside>
    </>
  );
};
